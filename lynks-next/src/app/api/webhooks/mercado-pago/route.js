// Webhook de Mercado Pago.
//
// MP llama a esta URL automáticamente cuando cambia el estado de un pago
// (la URL se setea en `notification_url` al crear la preferencia, ver
// /api/pagos/crear-preferencia/route.js). El cuerpo de la notificación
// solo trae el ID del pago; nosotros usamos el SDK para pedirle a MP el
// detalle completo y, según el `status`, actualizamos la orden en Supabase.
//
// IMPORTANTE: este endpoint NO tiene sesión de usuario (lo invoca MP, no
// el browser). Por eso usamos el cliente de Supabase con SERVICE ROLE KEY,
// que bypasea las RLS. Nunca exponer ese cliente a código que corra en el
// browser.
//
// Mapeo de estados:
//   MP `approved`                                  → orden `paid`
//   MP `pending` / `in_process` / `authorized`     → orden `pending`
//   MP `rejected` / `cancelled` / `refunded` /
//      `charged_back`                              → orden `cancelled`

import { mpClient, Payment } from '@/lib/mercadopago';
import { createServiceClient } from '@/lib/supabase/service';

// Forzamos runtime Node (no Edge) porque el SDK de Mercado Pago usa APIs
// de Node que no están disponibles en el runtime Edge de Vercel.
export const runtime = 'nodejs';

// MP a veces hace un GET de prueba al configurar el webhook desde el panel.
// Respondemos 200 para que la verificación pase.
export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(request) {
  try {
    // ---- 1. Extraer el payment ID de la notificación ----
    // MP soporta dos formatos:
    //   a) v2 (recomendado): body JSON { type: 'payment', data: { id } }
    //   b) IPN legacy: query params ?topic=payment&id=PAYMENT_ID
    let paymentId = null;

    // Intentamos parsear el body como JSON. Si MP manda otra cosa
    // (form-urlencoded en el IPN viejo), el JSON falla y seguimos.
    let body = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

    if (body?.type === 'payment' && body?.data?.id) {
      paymentId = String(body.data.id);
    } else {
      const url = new URL(request.url);
      const topic = url.searchParams.get('topic') || url.searchParams.get('type');
      const idParam = url.searchParams.get('id') || url.searchParams.get('data.id');
      if (topic === 'payment' && idParam) {
        paymentId = String(idParam);
      }
    }

    // Notificaciones de otro tipo (merchant_order, etc.) las ignoramos pero
    // respondemos 200 para que MP no las reintente eternamente.
    if (!paymentId) {
      return Response.json({ received: true, ignored: true });
    }

    // ---- 2. Consultar el pago en MP ----
    const payment = new Payment(mpClient);
    const mpPayment = await payment.get({ id: paymentId });

    const externalReference = mpPayment?.external_reference;
    const mpStatus = mpPayment?.status;

    if (!externalReference) {
      console.warn('[webhook MP] pago sin external_reference', { paymentId });
      return Response.json({ received: true, warning: 'no external_reference' });
    }

    // ---- 3. Mapear status de MP → status interno ----
    let newStatus = null;
    let pagadoEn = null;

    switch (mpStatus) {
      case 'approved':
        newStatus = 'paid';
        pagadoEn = new Date().toISOString();
        break;
      case 'pending':
      case 'in_process':
      case 'authorized':
        newStatus = 'pending';
        break;
      case 'rejected':
      case 'cancelled':
      case 'refunded':
      case 'charged_back':
        newStatus = 'cancelled';
        break;
      default:
        console.warn('[webhook MP] status desconocido:', mpStatus);
        return Response.json({ received: true, warning: 'unknown status' });
    }

    // ---- 4. Actualizar la orden en Supabase ----
    const supabase = createServiceClient();

    const updateData = {
      status: newStatus,
      referencia_pago: String(paymentId),
    };
    if (pagadoEn) updateData.pagado_en = pagadoEn;

    const { error: upErr } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', externalReference);

    if (upErr) {
      console.error('[webhook MP] error actualizando orden:', upErr.message);
      return Response.json(
        { error: upErr.message },
        { status: 500 }
      );
    }

    console.log(
      `[webhook MP] orden ${externalReference} → ${newStatus} (pago ${paymentId})`
    );

    return Response.json({
      received: true,
      orderId: externalReference,
      status: newStatus,
    });
  } catch (err) {
    console.error('[webhook MP] error general:', err);
    // Devolvemos 200 igual para que MP no reintente miles de veces.
    // Los errores quedan en los logs de Vercel para debug.
    return Response.json(
      { received: true, error: err?.message || 'webhook error' },
      { status: 200 }
    );
  }
}
