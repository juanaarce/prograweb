import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ProductRowActions from './ProductRowActions';

export const dynamic = 'force-dynamic';

const formatARS = (n) =>
  `$${Number(n || 0).toLocaleString('es-AR')}`;

/**
 * Lista de productos para admin.
 * - Server component: lee TODOS los productos (incluyendo inactivos) de Supabase.
 *   Las RLS permiten al admin ver inactivos.
 * - Cada fila trae link a /admin/products/[id]/edit y un botón cliente
 *   para alternar activo/inactivo (ProductRowActions).
 */
export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from('products')
    .select('id, nombre, precio, categoria, imagen, stock, activo, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return (
      <p style={{ color: '#b91c1c' }}>
        Error cargando productos: {error.message}
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <h2
          style={{
            fontSize: '0.75rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Productos ({products?.length ?? 0})
        </h2>
        <Link href="/admin/products/new" className="admin-btn">
          + Nuevo producto
        </Link>
      </div>

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
              <th></th>
              <th>Slug</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(products || []).map((p) => (
              <tr key={p.id}>
                <td>
                  {p.imagen ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imagen}
                      alt={p.nombre}
                      style={{
                        width: '48px',
                        height: '56px',
                        objectFit: 'cover',
                        backgroundColor: '#f5f5f5',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '48px',
                        height: '56px',
                        backgroundColor: '#f5f5f5',
                      }}
                    />
                  )}
                </td>
                <td
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                    color: 'var(--gris-oscuro)',
                  }}
                >
                  {p.id}
                </td>
                <td>{p.nombre}</td>
                <td
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                    fontSize: '0.7rem',
                  }}
                >
                  {p.categoria}
                </td>
                <td style={{ fontWeight: 600 }}>{formatARS(p.precio)}</td>
                <td>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        p.stock === 0
                          ? '#b91c1c'
                          : p.stock <= 3
                          ? '#a16207'
                          : 'var(--negro)',
                    }}
                  >
                    {p.stock ?? 0}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '0.6rem',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      color: p.activo ? '#15803d' : 'var(--gris-medio)',
                    }}
                  >
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '20px',
                    }}
                  >
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="admin-link"
                    >
                      Editar
                    </Link>
                    <ProductRowActions id={p.id} activo={p.activo} />
                  </div>
                </td>
              </tr>
            ))}

            {(!products || products.length === 0) && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--gris-medio)',
                  }}
                >
                  No hay productos cargados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
