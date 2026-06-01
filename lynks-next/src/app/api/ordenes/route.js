import { getApiUser } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/responses';

// Costos de envío fijos en el server. No se aceptan del cliente.
const SHIPPING_COSTS = {
  standard: 5000,
  express: 10000,
  pickup: 0,
};

/**
 * GET /api/ordenes
 * Devuelve las órdenes del usuario logueado (con sus items).
 * Las RLS ya filtran por user_id, pero igual lo encadenamos por claridad.
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
 * Proceso completo server-side:
 *  1. Autenticar al usuario.
 *  2. Validar datos de envío.
 *  3. Leer el carrito del DB (NO confiar en el cliente).
 *  4. Validar que cada producto siga activo y tenga stock suficiente.
 *  5. Calcular subtotal/total con los precios actuales de DB.
 *  6. Insertar la orden.
 *  7. Insertar order_items con datos de la DB (no del cliente).
 *  8. Decrementar stock vía RPC SECURITY DEFINER.
 *  9. Vaciar el carrito.
 * 10. Retornar 201 con el id de la orden.
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

    const { shipping, shippingMethod } = body || {};

    // 1) Validar shippingMethod
    if (!SHIPPING_COSTS.hasOwnProperty(shippingMethod)) {
      return errorResponse('Método de envío inválido', 400, 'BAD_REQUEST');
    }

    // 2) Validar shipping data (campos obligatorios excepto teléfono)
    const required = [
      'nombre',
      'apellido',
      'email',
      'direccion',
      'ciudad',
      'provincia',
      'codigoPostal',
    ];
    if (!shipping || typeof shipping !== 'object') {
      return errorResponse('Falta shipping', 400, 'BAD_REQUEST');
    }
    for (const f of required) {
      if (!shipping[f] || !String(shipping[f]).trim()) {
        return errorResponse(`Falta ${f}`, 400, 'BAD_REQUEST');
      }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(shipping.email).trim())) {
      return errorResponse('Email inválido', 400, 'BAD_REQUEST');
    }

    // 3) Leer carrito desde DB. No usamos el embed automático de PostgREST
    //    (`products!inner(...)`) porque `cart_items.product_id` no tiene
    //    una foreign key declarada hacia `products.id` — así que hacemos
    //    el "join" a mano: traemos los items y después buscamos los productos.
    const { data: cartRows, error: cartErr } = await supabase
      .from('cart_items')
      .select('product_id, talle, cantidad')
      .eq('user_id', user.id);
    if (cartErr) return errorResponse(cartErr.message, 500);
    if (!cartRows || cartRows.length === 0) {
      return errorResponse('Carrito vacío', 400, 'EMPTY_CART');
    }

    const productIds = [...new Set(cartRows.map((r) => r.product_id))];
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, nombre, precio, imagen, activo, stock')
      .in('id', productIds);
    if (prodErr) return errorResponse(prodErr.message, 500);

    const productMap = new Map((products || []).map((p) => [p.id, p]));

    // Adjuntamos los datos del producto a cada línea del carrito.
    const enrichedCart = cartRows.map((it) => ({
      ...it,
      products: productMap.get(it.product_id) || null,
    }));

    // 4) Validar disponibilidad y stock
    for (const it of enrichedCart) {
      const p = it.products;
      if (!p) {
        return errorResponse(
          `Producto inexistente: ${it.product_id}`,
          400,
          'UNAVAILABLE'
        );
      }
      if (!p.activo) {
        return errorResponse(
          `Producto no disponible: ${p.nombre || it.product_id}`,
          400,
          'UNAVAILABLE'
        );
      }
      if (p.stock < it.cantidad) {
        return errorResponse(
          `Stock insuficiente para ${p.nombre} (quedan ${p.stock})`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
    }

    // 5) Calcular totales SERVER-SIDE (precios de la DB, no del cliente)
    const subtotal = enrichedCart.reduce(
      (acc, it) => acc + Number(it.products.precio) * Number(it.cantidad),
      0
    );
    const shippingCost = SHIPPING_COSTS[shippingMethod];
    const total = subtotal + shippingCost;

    // 6) Insertar la orden
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        subtotal,
        shipping_cost: shippingCost,
        total,
        shipping_method: shippingMethod,
        shipping_nombre: String(shipping.nombre).trim(),
        shipping_apellido: String(shipping.apellido).trim(),
        shipping_email: String(shipping.email).trim(),
        shipping_telefono: String(shipping.telefono || '').trim(),
        shipping_direccion: String(shipping.direccion).trim(),
        shipping_ciudad: String(shipping.ciudad).trim(),
        shipping_provincia: String(shipping.provincia).trim(),
        shipping_codigo_postal: String(shipping.codigoPostal).trim(),
      })
      .select('id')
      .single();

    if (orderErr || !order) {
      console.error('Error insertando orden:', orderErr);
      return errorResponse('No se pudo crear la orden', 500);
    }

    // 7) Insertar order_items con datos de la DB
    const itemsPayload = enrichedCart.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      nombre: it.products.nombre,
      precio: it.products.precio,
      talle: it.talle,
      cantidad: it.cantidad,
      imagen: it.products.imagen,
    }));

    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsPayload);
    if (itemsErr) {
      // Rollback manual de la orden
      await supabase.from('orders').delete().eq('id', order.id);
      console.error('Error insertando order_items:', itemsErr);
      return errorResponse('No se pudieron guardar los items', 500);
    }

    // 8) Decrementar stock por item (RPC SECURITY DEFINER)
    for (const it of enrichedCart) {
      const { error: stockErr } = await supabase.rpc(
        'decrement_product_stock',
        { p_product_id: it.product_id, p_qty: it.cantidad }
      );
      if (stockErr) {
        // Si falla acá, la orden ya existe — logueamos y seguimos.
        // En producción esto debería ser una transacción.
        console.error(
          `Stock decrement failed for ${it.product_id}:`,
          stockErr.message
        );
      }
    }

    // 9) Vaciar carrito del usuario
    await supabase.from('cart_items').delete().eq('user_id', user.id);

    return successResponse({ orderId: order.id, total }, 201);
  } catch (err) {
    console.error('[POST /api/ordenes]', err);
    return errorResponse('Error al crear la orden', 500);
  }
}
