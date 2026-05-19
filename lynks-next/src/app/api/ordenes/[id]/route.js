import { getApiUser } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/responses';

/**
 * GET /api/ordenes/[id]
 * Devuelve UNA orden con sus items.
 * Si el usuario no es el dueño, retorna 404 (la RLS no la deja ver,
 * pero damos 404 para no exponer su existencia).
 */
export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const { user, supabase, error } = await getApiUser();
    if (error) return error;

    const { data: order, error: qErr } = await supabase
      .from('orders')
      .select(
        'id, total, subtotal, shipping_cost, shipping_method, status, created_at, shipping_nombre, shipping_apellido, shipping_email, shipping_telefono, shipping_direccion, shipping_ciudad, shipping_provincia, shipping_codigo_postal, order_items(id, product_id, nombre, precio, talle, cantidad, imagen)'
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (qErr) return errorResponse(qErr.message, 500);
    if (!order) return errorResponse('Orden no encontrada', 404, 'NOT_FOUND');

    return successResponse(order);
  } catch (err) {
    console.error('[GET /api/ordenes/[id]]', err);
    return errorResponse('Error al obtener la orden', 500);
  }
}
