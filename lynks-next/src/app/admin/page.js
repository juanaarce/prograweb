import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

/**
 * Landing del panel admin.
 * Muestra dos accesos directos (Productos / Órdenes) más un par de
 * métricas rápidas para confirmar que la conexión con la DB anda bien.
 *
 * La protección de la ruta vive en /admin/layout.js, acá ya asumimos
 * que el usuario es admin.
 */
export default async function AdminHomePage() {
  const supabase = await createClient();

  const [{ count: productsCount }, { count: ordersCount }] = await Promise.all([
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
  ]);

  return (
    <div style={{ display: 'grid', gap: '32px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        <Link href="/admin/products" className="admin-card">
          <p
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--gris-medio)',
              margin: '0 0 8px 0',
            }}
          >
            Catálogo
          </p>
          <h2
            style={{
              fontSize: '1.1rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: '0 0 16px 0',
              fontFamily: 'var(--fuente-sans)',
              fontWeight: 600,
            }}
          >
            Productos
          </h2>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--gris-oscuro)',
              margin: 0,
            }}
          >
            Crear, editar o dar de baja productos del catálogo.
          </p>
          <p
            style={{
              marginTop: '24px',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            {productsCount ?? 0} activos →
          </p>
        </Link>

        <Link href="/admin/orders" className="admin-card">
          <p
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--gris-medio)',
              margin: '0 0 8px 0',
            }}
          >
            Ventas
          </p>
          <h2
            style={{
              fontSize: '1.1rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              margin: '0 0 16px 0',
              fontFamily: 'var(--fuente-sans)',
              fontWeight: 600,
            }}
          >
            Órdenes
          </h2>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--gris-oscuro)',
              margin: 0,
            }}
          >
            Ver los pedidos de los clientes y cambiar su estado.
          </p>
          <p
            style={{
              marginTop: '24px',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            {ordersCount ?? 0} en total →
          </p>
        </Link>
      </div>
    </div>
  );
}
