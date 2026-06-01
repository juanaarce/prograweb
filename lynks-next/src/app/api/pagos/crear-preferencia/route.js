import { getApiUser } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/responses';

/**
 * POST /api/pagos/crear-preferencia
 * Body: { orderId }
 *
 * Endpoint preparatorio para la integración real con Mercado Pago
 * (Semana 13). Por ahora no llama al SDK de MP; sólo valida y arma
 * la estructura del "preference" que se enviaría.
 *
 * Validaciones:
 *  - Usuario autenticado.
 *  - La orden existe y pertenece al usuario.
 *  - La orden está en estado 'pending' / 'pendiente' (no ya pagada).
 *  - La orden tiene items.
 *
 * Respuesta:
 *  - `preferencia`: objeto con la estructura para Mercado Pago.
 *  - `paymentLink: null` (se completará cuando integremos el SDK).
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

    // Traer la orden (la RLS ya garantiza que sea del user, pero
    // encadenamos por claridad). Incluimos items.
    const { data: order, error: qErr } = await supabase
      .from('orders')
      .select(
        'id, total, status, shipping_email, order_items(id, nombre, cantidad, precio)'
      )
      .eq('id', orderId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (qErr) return errorResponse(qErr.message, 500);
    if (!order) {
      return errorResponse('Orden no encontrada', 404, 'NOT_FOUND');
    }

    // Aceptamos tanto el estado legacy 'pending' (en inglés, status text)
    // como el nuevo 'pendiente' (ENUM estado_orden de Clase 12).
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

    // Estructura compatible con la API de Preferences de Mercado Pago.
    // Cuando integremos el SDK (Semana 13) le pasamos este objeto a
    // `mercadopago.preferences.create({...})`.
    const preferencia = {
      items: order.order_items.map((it) => ({
        title: it.nombre,
        quantity: Number(it.cantidad),
        unit_price: Number(it.precio),
        currency_id: 'ARS',
      })),
      payer: {
        email: order.shipping_email,
      },
      external_reference: String(order.id),
      // En Semana 13 conectamos el webhook real.
      notification_url: '/api/pagos/webhook',
      back_urls: {
        success: '/checkout/success',
        pending: '/checkout/success',
        failure: '/checkout',
      },
    };

    return successResponse({
      preferencia,
      paymentLink: null, // a completar en Semana 13 con MP SDK
    });
  } catch (err) {
    console.error('[POST /api/pagos/crear-preferencia]', err);
    return errorResponse('Error preparando la preferencia', 500);
  }
}
