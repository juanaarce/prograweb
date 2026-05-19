import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ProductForm from '../../ProductForm';

export const dynamic = 'force-dynamic';

/**
 * Edición de un producto existente.
 * Trae la fila cruda de Supabase y se la pasa al ProductForm en modo edit.
 * No usamos getProductById de @/lib/products porque ese helper filtra por
 * activo=true; acá queremos poder editar inactivos también.
 */
export default async function EditProductPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select('id, nombre, precio, descripcion, imagen, categoria, stock, activo')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return (
      <p style={{ color: '#b91c1c' }}>
        Error cargando producto: {error.message}
      </p>
    );
  }

  if (!product) notFound();

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
        Editar producto
      </h2>
      <ProductForm initialProduct={product} />
    </div>
  );
}
