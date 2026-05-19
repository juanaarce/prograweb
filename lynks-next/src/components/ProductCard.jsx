'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

/**
 * ProductCard
 * - Muestra la imagen, nombre y precio.
 * - El click en la imagen lleva a /product/[id].
 * - El botón AGREGAR AL CARRITO abre el modal de talles (Quick Add).
 * - Si el producto no tiene stock, mostramos un overlay "SIN STOCK"
 *   sobre la imagen y deshabilitamos el botón de quick-add.
 */
export default function ProductCard({ product }) {
  const { abrirModalTalle } = useCart();

  if (!product) return null;

  const sinStock = Number(product.stock ?? 0) <= 0;

  const handleQuickAdd = () => {
    if (sinStock) return;
    abrirModalTalle(product);
  };

  return (
    <div className={`product-card ${product.categoria}`}>
      <Link href={`/product/${product.id}`}>
        <div
          className="product-image"
          style={{ position: 'relative' }}
        >
          <img
            src={product.imagen}
            alt={product.nombre}
            style={sinStock ? { opacity: 0.55 } : undefined}
          />
          {sinStock && (
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0,0,0,0.78)',
                color: 'var(--blanco)',
                padding: '8px 18px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                fontFamily: 'var(--fuente-sans)',
                pointerEvents: 'none',
              }}
            >
              Sin stock
            </span>
          )}
        </div>
      </Link>
      <div className="product-info">
        <p className="product-name">{product.nombre}</p>
        <p className="product-price">{product.precio}</p>
        <button
          className="quick-add"
          data-id={product.id}
          onClick={handleQuickAdd}
          disabled={sinStock}
          style={
            sinStock
              ? {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  pointerEvents: 'none',
                }
              : undefined
          }
        >
          {sinStock ? 'SIN STOCK' : 'AGREGAR AL CARRITO'}
        </button>
      </div>
    </div>
  );
}
