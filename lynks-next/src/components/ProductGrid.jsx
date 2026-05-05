import ProductCard from './ProductCard';

/**
 * ProductGrid
 * Renderiza la grilla de productos.
 * Recibe un array de productos (objetos del catálogo).
 */
export default function ProductGrid({ products = [], title = 'SHOP THE CAPSULE' }) {
  return (
    <section className="product-grid">
      <h2 className="grid-title">{title}</h2>
      <div className="products-container">
        {products.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
            No hay productos en esta categoría.
          </p>
        ) : (
          products.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </section>
  );
}
