import { getApiUser } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/responses';

// Métodos de envío válidos. Los costos los conoce SOLO la DB (la RPC
// crear_orden_completa los calcula del lado server). Acá los listamos
// nada más para validación rápida de input.
const SHIPPING_METHODS = new Set(['standard', 'express', 'pickup']);

/**
 * GET /api/ordenes
 * Devuelve las órdenes del usuario logueado (con sus items).
 */
export async function GET() {
  try {
    const { user, supabase, error } = await getApiUser();
    if (error) return error;

    const { data, error: qErr } = await supabase
      .from('orders')
      .select(
        'id, total, subtotal, shipping_cost, shipping_method, status, created_at, order_items(id, product_id, nombre, precio, talle, cantidad, imagen)'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (qErr) return errorResponse(qErr.message, 500);

    return successResponse(data || []);
  } catch (err) {
    console.error('[GET /api/ordenes]', err);
    return errorResponse('Error al obtener órdenes', 500);
  }
}

/**
 * POST /api/ordenes
 * Body: { shipping: {...}, shippingMethod: 'standard'|'express'|'pickup' }
 *
 * Toda la lógica transaccional vive en la stored procedure
 * `crear_orden_completa` (PL/pgSQL):
 *  - Valida auth y datos de envío.
 *  - Lee carrito + productos en una sola transacción.
 *  - Valida stock y disponibilidad.
 *  - Calcula subtotal/total server-side (precios reales de DB).
 *  - Inserta orders + order_items, decrementa stock y vacía cart_items.
 *  - Si CUALQUIER paso falla, hace ROLLBACK automático y devuelve el error.
 *
 * Ventaja vs. la versión anterior: el rollback es atómico. Antes, si fallaba
 * el decremento de stock después de insertar la orden, el stock quedaba mal.
 * Ahora PostgreSQL garantiza atomicidad ACID.
 */
export async function POST(request) {
  try {
    const { supabase, error } = await getApiUser();
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Body inválido', 400, 'BAD_REQUEST');
    }

    const { shipping, shippingMethod } = body || {};

    // Validación rápida de input antes de mandar a la DB.
    if (!SHIPPING_METHODS.has(shippingMethod)) {
      return errorResponse('Método de envío inválido', 400, 'BAD_REQUEST');
    }
    if (!shipping || typeof shipping !== 'object') {
      return errorResponse('Falta shipping', 400, 'BAD_REQUEST');
    }
    const required = [
      'nombre',
      'apellido',
      'email',
      'direccion',
      'ciudad',
      'provincia',
      'codigoPostal',
    ];
    for (const f of required) {
      if (!shipping[f] || !String(shipping[f]).trim()) {
        return errorResponse(`Falta ${f}`, 400, 'BAD_REQUEST');
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(shipping.email).trim())) {
      return errorResponse('Email inválido', 400, 'BAD_REQUEST');
    }

    // Llamar a la RPC transaccional. La RPC ya valida auth (auth.uid())
    // y no le pasamos user_id ni total — todo server-side.
    const shippingPayload = {
      nombre: String(shipping.nombre).trim(),
      apellido: String(shipping.apellido).trim(),
      email: String(shipping.email).trim(),
      telefono: String(shipping.telefono || '').trim(),
      direccion: String(shipping.direccion).trim(),
      ciudad: String(shipping.ciudad).trim(),
      provincia: String(shipping.provincia).trim(),
      codigoPostal: String(shipping.codigoPostal).trim(),
    };

    const { data, error: rpcErr } = await supabase.rpc(
      'crear_orden_completa',
      {
        p_shipping: shippingPayload,
        p_shipping_method: shippingMethod,
      }
    );

    if (rpcErr) {
      console.error('Error llamando crear_orden_completa:', rpcErr);
      return errorResponse(
        rpcErr.message || 'No se pudo crear la orden',
        500
      );
    }

    // La RPC devuelve un TABLE de 1 fila: (orden_id, total, success, error_msg)
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || row.success === false) {
      return errorResponse(
        row?.error_msg || 'No se pudo crear la orden',
        400,
        'ORDER_FAILED'
      );
    }

    return successResponse(
      { orderId: row.orden_id, total: row.total },
      201
    );
  } catch (err) {
    console.error('[POST /api/ordenes]', err);
    return errorResponse('Error al crear la orden', 500);
  }
}
