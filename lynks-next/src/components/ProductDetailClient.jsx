'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

const TALLES = ['S', 'M', 'L'];

/**
 * ProductDetailClient
 * Página de detalle (PDP) — equivalente al product-detail.html original.
 * Necesita ser cliente porque maneja estado de talle seleccionado y el carrito.
 */
export default function ProductDetailClient({ product }) {
  const { agregarAlCarrito } = useCart();
  const [talleSeleccionado, setTalleSeleccionado] = useState(null);

  if (!product) return null;

  const handleAddToCart = () => {
    if (!talleSeleccionado) {
      alert('POR FAVOR SELECCIONA UN TALLE');
      return;
    }
    agregarAlCarrito(product, talleSeleccionado);
  };

  return (
    <main className="product-page">
      <div className="product-container">
        <div className="product-gallery">
          <img
            src={product.imagen}
            alt={product.nombre}
            id="main-product-img"
          />
        </div>

        <div className="product-details">
          <nav className="breadcrumb">
            <Link href="/shop/novedades">Shop</Link> /{' '}
            <span>{product.nombre}</span>
          </nav>

          <h1 className="product-title">{product.nombre}</h1>
          <p className="product-price">{product.precio}</p>

          <div className="product-description-container">
            <p className="product-description">{product.descripcion}</p>
          </div>

          <div className="size-selector">
            <p className="selector-label">SELECCIONAR TALLE</p>
            <div className="size-options">
              {TALLES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`size-btn ${talleSeleccionado === t ? 'active' : ''}`}
                  onClick={() => setTalleSeleccionado(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="add-to-cart-big"
            onClick={handleAddToCart}
          >
            AGREGAR AL CARRITO
          </button>

          <div className="product-extra-info">
            <p>✓ Envío gratis en compras superiores a $100.000</p>
            <p>✓ 3 cuotas sin interés</p>
          </div>
        </div>
      </div>
    </main>
  );
}
