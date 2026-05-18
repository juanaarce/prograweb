import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import OrderStatusSelect from '../OrderStatusSelect';

export const dynamic = 'force-dynamic';

const SHIPPING_LABEL = {
  standard: 'Standard',
  express: 'Express',
  pickup: 'Retiro en local',
};

const STATUS_LABEL = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const formatARS = (n) =>
  `$${Number(n || 0).toLocaleString('es-AR')}`;

const cardStyle = {
  backgroundColor: 'var(--blanco)',
  border: '1px solid var(--gris-claro)',
  padding: '28px',
  fontFamily: 'var(--fuente-sans)',
};

const labelStyle = {
  fontSize: '0.6rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--gris-medio)',
  margin: '0 0 4px 0',
};

/**
 * Detalle de una orden para admin.
 * - Trae la orden + sus items.
 * - Muestra datos de envío, items y totales.
 * - Permite cambiar el estado vía OrderStatusSelect (client component).
 */
export default async function AdminOrderDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from('orders')
    .select(
      'id, created_at, status, subtotal, shipping_cost, total, shipping_method, shipping_nombre, shipping_apellido, shipping_email, shipping_telefono, shipping_direccion, shipping_ciudad, shipping_provincia, shipping_codigo_postal, order_items(id, product_id, nombre, precio, talle, cantidad, imagen)'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return (
      <p style={{ color: '#b91c1c' }}>
        Error cargando la orden: {error.message}
      </p>
    );
  }

  if (!order) notFound();

  const shortId = order.id.slice(0, 8).toUpperCase();
  const fecha = new Date(order.created_at).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const cliente =
    [order.shipping_nombre, order.shipping_apellido]
      .filter(Boolean)
      .join(' ') || '—';
  const cantidadItems = (order.order_items || []).reduce(
    (acc, it) => acc + (Number(it.cantidad) || 0),
    0
  );

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <Link href="/admin/orders" className="admin-link muted">
            ← Volver a órdenes
          </Link>
          <h2
            style={{
              marginTop: '8px',
              fontSize: '1.1rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
              fontWeight: 600,
            }}
          >
            Pedido #{shortId}
          </h2>
          <p
            style={{
              fontSize: '0.7rem',
              color: 'var(--gris-medio)',
              marginTop: '4px',
              margin: 0,
            }}
          >
            {fecha} · {cantidadItems} {cantidadItems === 1 ? 'item' : 'items'} ·{' '}
            <span style={{ textTransform: 'uppercase' }}>
              {STATUS_LABEL[order.status] || order.status}
            </span>
          </p>
        </div>

        <div style={{ minWidth: '180px' }}>
          <OrderStatusSelect orderId={order.id} status={order.status} />
        </div>
      </div>

      <section style={cardStyle}>
        <h3
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontWeight: 600,
            margin: '0 0 16px 0',
          }}
        >
          Datos de envío
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px 32px',
            fontSize: '0.8rem',
          }}
        >
          <div>
            <p style={labelStyle}>Cliente</p>
            <p style={{ margin: 0 }}>{cliente}</p>
          </div>
          <div>
            <p style={labelStyle}>Email</p>
            <p style={{ margin: 0 }}>{order.shipping_email || '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>Teléfono</p>
            <p style={{ margin: 0 }}>{order.shipping_telefono || '—'}</p>
          </div>
          <div>
            <p style={labelStyle}>Método</p>
            <p style={{ margin: 0 }}>
              {SHIPPING_LABEL[order.shipping_method] || order.shipping_method}
            </p>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={labelStyle}>Dirección</p>
            <p style={{ margin: 0 }}>
              {order.shipping_direccion || '—'}
              {order.shipping_ciudad ? `, ${order.shipping_ciudad}` : ''}
              {order.shipping_provincia ? `, ${order.shipping_provincia}` : ''}
              {order.shipping_codigo_postal
                ? ` (CP ${order.shipping_codigo_postal})`
                : ''}
            </p>
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h3
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontWeight: 600,
            margin: '0 0 16px 0',
          }}
        >
          Items
        </h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {(order.order_items || []).map((it) => (
            <li
              key={it.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '14px 0',
                borderBottom: '1px solid var(--gris-claro)',
              }}
            >
              {it.imagen && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.imagen}
                  alt={it.nombre}
                  style={{
                    width: '64px',
                    height: '80px',
                    objectFit: 'cover',
                    backgroundColor: '#f5f5f5',
                    flexShrink: 0,
                    display: 'block',
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {it.nombre}
                </p>
                <p
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--gris-medio)',
                    marginTop: '4px',
                    margin: 0,
                  }}
                >
                  <span style={{ fontFamily: 'monospace' }}>
                    {it.product_id}
                  </span>{' '}
                  · Talle {it.talle} · x{it.cantidad}
                </p>
              </div>
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <p
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {formatARS(Number(it.precio) * it.cantidad)}
                </p>
                <p
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--gris-medio)',
                    margin: 0,
                  }}
                >
                  {formatARS(it.precio)} c/u
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div
          style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--gris-claro)',
            fontSize: '0.8rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span>Subtotal</span>
            <span>{formatARS(order.subtotal)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span>
              Envío (
              {SHIPPING_LABEL[order.shipping_method] || order.shipping_method})
            </span>
            <span>
              {Number(order.shipping_cost) === 0
                ? 'GRATIS'
                : formatARS(order.shipping_cost)}
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
              fontSize: '0.9rem',
              paddingTop: '6px',
            }}
          >
            <span>Total</span>
            <span>{formatARS(order.total)}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
