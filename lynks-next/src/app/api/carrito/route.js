import { getApiUser } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/responses';

const TALLES_VALIDOS = ['S', 'M', 'L'];

/**
 * GET /api/carrito
 * Devuelve el carrito persistido del usuario logueado.
 */
export async function GET() {
  try {
    const { user, supabase, error } = await getApiUser();
    if (error) return error;

    const { data, error: qErr } = await supabase
      .from('cart_items')
      .select('product_id, nombre, precio, imagen, talle, cantidad, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (qErr) return errorResponse(qErr.message, 500);

    return successResponse(data || []);
  } catch (err) {
    console.error('[GET /api/carrito]', err);
    return errorResponse('Error al obtener el carrito', 500);
  }
}

/**
 * POST /api/carrito
 * Body: { product_id, talle, cantidad? }
 * Agrega `cantidad` unidades del producto+talle al carrito del usuario.
 * - Valida que el producto exista, esté activo y tenga stock suficiente.
 * - Hace upsert manual: si ya hay una línea con (product_id, talle),
 *   suma la cantidad; si no, inserta una nueva.
 * - Los campos nombre/precio/imagen los toma del producto en DB (nunca
 *   del cliente, para evitar tampering).
 */
export async function POST(request) {
  try {
    const { user, supabase, error } = await getApiUser();
    if (error) return error;

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Body inválido', 400);
    }

    const { product_id, talle } = body;
    const cantidad = Number.isInteger(body.cantidad) ? body.cantidad : 1;

    if (!product_id || typeof product_id !== 'string') {
      return errorResponse('product_id requerido', 400, 'BAD_REQUEST');
    }
    if (!TALLES_VALIDOS.includes(talle)) {
      return errorResponse('Talle inválido', 400, 'BAD_REQUEST');
    }
    if (!Number.isInteger(cantidad) || cantidad <= 0 || cantidad > 100) {
      return errorResponse('Cantidad inválida (1-100)', 400, 'BAD_REQUEST');
    }

    // Validar producto
    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .select('id, nombre, precio, imagen, activo, stock')
      .eq('id', product_id)
      .maybeSingle();
    if (prodErr) return errorResponse(prodErr.message, 500);
    if (!prod || !prod.activo) {
      return errorResponse('Producto no disponible', 404, 'NOT_FOUND');
    }

    // ¿Ya existe la línea?
    const { data: existing, error: exErr } = await supabase
      .from('cart_items')
      .select('cantidad')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .eq('talle', talle)
      .maybeSingle();
    if (exErr) return errorResponse(exErr.message, 500);

    const cantidadFinal = (existing?.cantidad || 0) + cantidad;
    if (prod.stock < cantidadFinal) {
      return errorResponse(
        `Stock insuficiente (quedan ${prod.stock})`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    if (existing) {
      const { error: upErr } = await supabase
        .from('cart_items')
        .update({ cantidad: cantidadFinal })
        .eq('user_id', user.id)
        .eq('product_id', product_id)
        .eq('talle', talle);
      if (upErr) return errorResponse(upErr.message, 500);
    } else {
      const { error: insErr } = await supabase.from('cart_items').insert({
        user_id: user.id,
        product_id: prod.id,
        nombre: prod.nombre,
        precio: prod.precio,
        imagen: prod.imagen,
        talle,
        cantidad: cantidadFinal,
      });
      if (insErr) return errorResponse(insErr.message, 500);
    }

    return successResponse({ product_id, talle, cantidad: cantidadFinal }, 201);
  } catch (err) {
    console.error('[POST /api/carrito]', err);
    return errorResponse('Error al agregar al carrito', 500);
  }
}

/**
 * DELETE /api/carrito
 * Sin query params → vacía todo el carrito del usuario.
 * Con ?product_id=...&talle=... → decrementa esa línea en 1; si llega a 0, la borra.
 */
export async function DELETE(request) {
  try {
    const { user, supabase, error } = await getApiUser();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get('product_id');
    const talle = searchParams.get('talle');

    // Caso 1: vaciar todo
    if (!product_id && !talle) {
      const { error: dErr } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
      if (dErr) return errorResponse(dErr.message, 500);
      return successResponse({ cleared: true });
    }

    if (!product_id || !talle) {
      return errorResponse('Falta product_id o talle', 400, 'BAD_REQUEST');
    }

    // Caso 2: decrementar / eliminar línea
    const { data: existing, error: exErr } = await supabase
      .from('cart_items')
      .select('cantidad')
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .eq('talle', talle)
      .maybeSingle();
    if (exErr) return errorResponse(exErr.message, 500);
    if (!existing) {
      return errorResponse('Línea no encontrada', 404, 'NOT_FOUND');
    }

    if (existing.cantidad <= 1) {
      const { error: dErr } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', product_id)
        .eq('talle', talle);
      if (dErr) return errorResponse(dErr.message, 500);
      return successResponse({ removed: true });
    }

    const { error: upErr } = await supabase
      .from('cart_items')
      .update({ cantidad: existing.cantidad - 1 })
      .eq('user_id', user.id)
      .eq('product_id', product_id)
      .eq('talle', talle);
    if (upErr) return errorResponse(upErr.message, 500);

    return successResponse({ product_id, talle, cantidad: existing.cantidad - 1 });
  } catch (err) {
    console.error('[DELETE /api/carrito]', err);
    return errorResponse('Error al modificar el carrito', 500);
  }
}
