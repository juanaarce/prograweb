import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const STATUS_LABEL = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const STATUS_COLOR = {
  pending: '#a16207',
  paid: '#1d4ed8',
  shipped: '#7e22ce',
  delivered: '#15803d',
  cancelled: '#b91c1c',
};

const formatARS = (n) =>
  `$${Number(n || 0).toLocaleString('es-AR')}`;

/**
 * Lista de órdenes para admin.
 * - Lee todas las órdenes (RLS deja al admin ver todas).
 * - Incluye un join chiquito a order_items para contar cuántos items tiene cada una.
 * - Cada fila linkea al detalle /admin/orders/[id].
 */
export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from('orders')
    .select(
      'id, created_at, total, status, shipping_nombre, shipping_apellido, shipping_email, order_items(id, cantidad)'
    )
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <p style={{ color: '#b91c1c' }}>
        Error cargando órdenes: {error.message}
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <h2
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          fontWeight: 600,
          margin: 0,
        }}
      >
        Órdenes ({orders?.length ?? 0})
      </h2>

      <div
        style={{
          border: '1px solid var(--gris-claro)',
          backgroundColor: 'var(--blanco)',
          overflowX: 'auto',
        }}
      >
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Items</th>
              <th>Total</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {(orders || []).map((o) => {
              const shortId = o.id.slice(0, 8).toUpperCase();
              const fecha = new Date(o.created_at).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const cliente = [o.shipping_nombre, o.shipping_apellido]
                .filter(Boolean)
                .join(' ');
              const cantidadItems = (o.order_items || []).reduce(
                (acc, it) => acc + (Number(it.cantidad) || 0),
                0
              );

              return (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                    #{shortId}
                  </td>
                  <td style={{ color: 'var(--gris-oscuro)' }}>{fecha}</td>
                  <td>
                    <div>{cliente || '—'}</div>
                    <div
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--gris-medio)',
                      }}
                    >
                      {o.shipping_email || ''}
                    </div>
                  </td>
                  <td>{cantidadItems}</td>
                  <td style={{ fontWeight: 600 }}>{formatARS(o.total)}</td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.6rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: STATUS_COLOR[o.status] || 'var(--gris-medio)',
                      }}
                    >
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/admin/orders/${o.id}`} className="admin-link">
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              );
            })}

            {(!orders || orders.length === 0) && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--gris-medio)',
                  }}
                >
                  Todavía no hay pedidos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
