import { getApiUser } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/responses';
import { mpClient, Preference } from '@/lib/mercadopago';

/**
 * POST /api/pagos/crear-preferencia
 * Body: { orderId }
 *
 * Crea una preferencia de pago real en Mercado Pago Sandbox y devuelve
 * el `init_point` (URL del checkout). El cliente debe hacer
 * window.location.href = init_point para enviar al usuario a pagar.
 *
 * Validaciones:
 *  - Usuario autenticado.
 *  - Orden existe y pertenece al usuario.
 *  - Orden en estado 'pending' / 'pendiente' (no ya pagada).
 *  - Tiene items.
 *
 * Requiere las env vars:
 *  - MERCADOPAGO_ACCESS_TOKEN  (server)
 *  - NEXT_PUBLIC_APP_URL       (para construir las back_urls)
 */
export async function POST(request) {
  try {
    const { user, supabase, error } = await getApiUser();
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Body inválido', 400, 'BAD_REQUEST');
    }

    const { orderId } = body || {};
    if (!orderId || typeof orderId !== 'string') {
      return errorResponse('orderId requerido', 400, 'BAD_REQUEST');
    }

    const { data: order, error: qErr } = await supabase
      .from('orders')
      .select(
        'id, total, status, shipping_email, order_items(id, nombre, cantidad, precio, imagen)'
      )
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (qErr) return errorResponse(qErr.message, 500);
    if (!order) {
      return errorResponse('Orden no encontrada', 404, 'NOT_FOUND');
    }

    if (!['pending', 'pendiente'].includes(order.status)) {
      return errorResponse(
        `La orden no está pendiente (estado: ${order.status})`,
        400,
        'INVALID_STATE'
      );
    }

    if (!order.order_items || order.order_items.length === 0) {
      return errorResponse('La orden no tiene items', 400, 'EMPTY_ORDER');
    }

    // Base URL para las back_urls. En prod (Vercel) usamos NEXT_PUBLIC_APP_URL
    // o nos basamos en el host del request. Sacamos la barra final por si quedó.
    const rawBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      new URL(request.url).origin;
    const baseUrl = rawBaseUrl.replace(/\/$/, '');

    // Mercado Pago REQUIERE que las back_urls sean HTTPS públicas.
    // Si estamos en localhost (http), no las mandamos — el usuario verá
    // un botón genérico "Volver al sitio" en la página de MP.
    const isPublicHttps = baseUrl.startsWith('https://');

    // Estructura de la preferencia para el SDK v2.
    const preferenceBody = {
      items: order.order_items.map((it, idx) => ({
        id: String(it.id ?? idx),
        title: it.nombre,
        description: `Talle / Cantidad: ${it.cantidad}`,
        picture_url: it.imagen || undefined,
        quantity: Number(it.cantidad),
        unit_price: Number(it.precio),
        currency_id: 'ARS',
      })),
      payer: {
        email: order.shipping_email,
      },
      external_reference: String(order.id),
      statement_descriptor: 'LYNKS',
    };

    if (isPublicHttps) {
      preferenceBody.back_urls = {
        success: `${baseUrl}/pago-completado`,
        failure: `${baseUrl}/pago-fallido`,
        pending: `${baseUrl}/pago-pendiente`,
      };
      preferenceBody.auto_return = 'approved';
      preferenceBody.notification_url = `${baseUrl}/api/webhooks/mercado-pago`;
    }

    const preference = new Preference(mpClient);
    const mpResponse = await preference.create({ body: preferenceBody });

    if (!mpResponse?.init_point) {
      console.error('MP no devolvió init_point:', mpResponse);
      return errorResponse(
        'Mercado Pago no devolvió un link de pago válido',
        500,
        'MP_NO_INIT_POINT'
      );
    }

    // Guardamos la referencia para que el webhook (Semana 14) pueda
    // matchear orden ↔ pago de Mercado Pago.
    await supabase
      .from('orders')
      .update({
        metodo_pago: 'mercado_pago',
        referencia_pago: mpResponse.id || null,
      })
      .eq('id', order.id);

    return successResponse({
      preferenceId: mpResponse.id,
      initPoint: mpResponse.init_point,
      sandboxInitPoint: mpResponse.sandbox_init_point,
    });
  } catch (err) {
    console.error('[POST /api/pagos/crear-preferencia]', err);
    return errorResponse(
      err?.message || 'Error preparando la preferencia',
      500
    );
  }
}
