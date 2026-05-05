'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

/**
 * ProductCard
 * - Muestra la imagen, nombre y precio.
 * - El click en la imagen lleva a /product/[id].
 * - El botón AGREGAR AL CARRITO abre el modal de talles (Quick Add).
 */
export default function ProductCard({ product }) {
  const { abrirModalTalle } = useCart();

  if (!product) return null;

  const handleQuickAdd = () => {
    abrirModalTalle(product.id);
  };

  return (
    <div className={`product-card ${product.categoria}`}>
      <Link href={`/product/${product.id}`}>
        <div className="product-image">
          <img src={product.imagen} alt={product.nombre} />
        </div>
      </Link>
      <div className="product-info">
        <p className="product-name">{product.nombre}</p>
        <p className="product-price">{product.precio}</p>
        <button
          className="quick-add"
          data-id={product.id}
          onClick={handleQuickAdd}
        >
          AGREGAR AL CARRITO
        </button>
      </div>
    </div>
  );
}
