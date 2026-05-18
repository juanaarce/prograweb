import ProductForm from '../ProductForm';

/**
 * Página para crear un producto nuevo.
 * Renderiza el formulario en modo "create" (sin initialProduct).
 */
export default function NewProductPage() {
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
        Nuevo producto
      </h2>
      <ProductForm />
    </div>
  );
}
