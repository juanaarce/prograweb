import { getApiUser } from '@/lib/api/auth';
import { successResponse, errorResponse } from '@/lib/api/responses';

// Costos de envío fijos en el server (mismos que /api/ordenes).
const SHIPPING_COSTS = {
  standard: 5000,
  express: 10000,
  pickup: 0,
};

const PAYMENT_METHODS = new Set([
  'efectivo',
  'transferencia',
  'mercado_pago',
  'tarjeta',
  'otro',
]);

const TALLES_VALIDOS = new Set(['S', 'M', 'L']);

/**
 * POST /api/admin/orders
 * Body: {
 *   shipping: { nombre, apellido, email, telefono, direccion, ciudad, provincia, codigoPostal },
 *   shippingMethod: 'standard' | 'express' | 'pickup',
 *   items: [{ product_id, talle, cantidad }],
 *   metodoPago: 'efectivo' | 'transferencia' | ...,
 *   marcarComoPagada: boolean,
 *   decrementarStock: boolean
 * }
 *
 * Crea una orden manualmente (ej. venta por Instagram, en local, etc).
 * Sólo accesible para usuarios admin. La orden queda asociada al user_id
 * del admin que la crea y marcada con venta_manual=true.
 *
 * El servidor:
 *  - Valida que el usuario sea admin (is_admin OR rol='admin').
 *  - Lee los precios actuales de products (no acepta del cliente).
 *  - Calcula subtotal + envío + total.
 *  - Inserta la orden y los items.
 *  - Opcionalmente decrementa stock (default: sí).
 *  - Si marcarComoPagada=true, status='paid' y pagado_en=now().
 */
export async function POST(request) {
  try {
    const { user, supabase, error } = await getApiUser();
    if (error) return error;

    // Verificar admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, rol')
      .eq('id', user.id)
      .maybeSingle();
    const esAdmin = profile?.is_admin === true || profile?.rol === 'admin';
    if (!esAdmin) {
      return errorResponse('Sólo admins pueden crear órdenes manuales', 403, 'FORBIDDEN');
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Body inválido', 400, 'BAD_REQUEST');
    }

    const {
      shipping,
      shippingMethod,
      items,
      metodoPago,
      marcarComoPagada,
      decrementarStock,
    } = body || {};

    // Validar shipping method
    if (!SHIPPING_COSTS.hasOwnProperty(shippingMethod)) {
      return errorResponse('Método de envío inválido', 400, 'BAD_REQUEST');
    }

    // Validar shipping data
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

    // Validar items
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('La orden no tiene items', 400, 'BAD_REQUEST');
    }
    for (const it of items) {
      if (!it.product_id || !TALLES_VALIDOS.has(it.talle)) {
        return errorResponse('Item con datos inválidos', 400, 'BAD_REQUEST');
      }
      if (
        !Number.isInteger(it.cantidad) ||
        it.cantidad <= 0 ||
        it.cantidad > 100
      ) {
        return errorResponse(
          'Cantidad de item inválida (1-100)',
          400,
          'BAD_REQUEST'
        );
      }
    }

    // Validar método de pago
    if (metodoPago && !PAYMENT_METHODS.has(metodoPago)) {
      return errorResponse('Método de pago inválido', 400, 'BAD_REQUEST');
    }

    // Traer los productos para validar y calcular precios server-side
    const productIds = [...new Set(items.map((it) => it.product_id))];
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('id, nombre, precio, imagen, activo, stock')
      .in('id', productIds);
    if (prodErr) return errorResponse(prodErr.message, 500);

    const productMap = new Map((products || []).map((p) => [p.id, p]));
    const enriched = items.map((it) => ({
      ...it,
      product: productMap.get(it.product_id) || null,
    }));

    for (const it of enriched) {
      if (!it.product) {
        return errorResponse(
          `Producto inexistente: ${it.product_id}`,
          400,
          'UNAVAILABLE'
        );
      }
      if (decrementarStock !== false && it.product.stock < it.cantidad) {
        return errorResponse(
          `Stock insuficiente para ${it.product.nombre} (quedan ${it.product.stock})`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
    }

    // Calcular totales server-side
    const subtotal = enriched.reduce(
      (acc, it) => acc + Number(it.product.precio) * Number(it.cantidad),
      0
    );
    const shippingCost = SHIPPING_COSTS[shippingMethod];
    const total = subtotal + shippingCost;

    // Insertar la orden
    const pagada = marcarComoPagada === true;
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id: user.id, // queda atada al admin que la creó
        venta_manual: true,
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
        status: pagada ? 'paid' : 'pending',
        metodo_pago: metodoPago || null,
        pagado_en: pagada ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (orderErr || !order) {
      console.error('Error creando orden manual:', orderErr);
      return errorResponse('No se pudo crear la orden', 500);
    }

    // Insertar order_items con datos de la DB
    const itemsPayload = enriched.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      nombre: it.product.nombre,
      precio: it.product.precio,
      talle: it.talle,
      cantidad: it.cantidad,
      imagen: it.product.imagen,
    }));
    const { error: itemsErr } = await supabase
      .from('order_items')
      .insert(itemsPayload);
    if (itemsErr) {
      // Rollback manual de la orden
      await supabase.from('orders').delete().eq('id', order.id);
      console.error('Error insertando order_items (manual):', itemsErr);
      return errorResponse('No se pudieron guardar los items', 500);
    }

    // Decrementar stock (opcional, default true)
    if (decrementarStock !== false) {
      for (const it of enriched) {
        const { error: stockErr } = await supabase.rpc(
          'decrement_product_stock',
          { p_product_id: it.product_id, p_qty: it.cantidad }
        );
        if (stockErr) {
          console.error(
            `Stock decrement failed for ${it.product_id}:`,
            stockErr.message
          );
        }
      }
    }

    return successResponse({ orderId: order.id, total }, 201);
  } catch (err) {
    console.error('[POST /api/admin/orders]', err);
    return errorResponse('Error al crear la orden manual', 500);
  }
}
