'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

/**
 * CartDrawer
 * Panel lateral del carrito + overlay.
 * Cada línea tiene `cantidad`. El botón "✕" resta una unidad
 * (y si llega a 0 saca el item del carrito).
 */
export default function CartDrawer() {
  const router = useRouter();
  const {
    carrito,
    total,
    totalItems,
    isCartOpen,
    isMounted,
    cerrarCarrito,
    eliminarDelCarrito,
  } = useCart();

  const irAlCheckout = () => {
    if (!isMounted || totalItems === 0) return;
    cerrarCarrito();
    router.push('/checkout');
  };

  // Antes del montaje mostramos vacío para evitar errores de hidratación.
  const items = isMounted ? carrito : [];

  const totalFormateado = isMounted
    ? `$${total.toLocaleString('es-AR')}`
    : '$0';

  return (
    <>
      <div
        id="cart-overlay"
        className={`cart-overlay ${isCartOpen ? 'show' : ''}`}
        onClick={cerrarCarrito}
      />

      <aside
        id="cart-drawer"
        className={`cart-drawer ${isCartOpen ? 'open' : ''}`}
        aria-hidden={!isCartOpen}
      >
        <div className="cart-header">
          <h3>TU CARRITO</h3>
          <button
            id="close-cart"
            className="close-cart-btn"
            onClick={cerrarCarrito}
            aria-label="Cerrar carrito"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div id="cart-items" className="cart-items-container">
          {items.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                marginTop: '50px',
                fontSize: '12px',
                color: '#999',
              }}
            >
              TU CARRITO ESTÁ VACÍO
            </p>
          ) : (
            items.map((item) => (
              <div
                className="cart-item"
                key={`${item.id}-${item.talle}`}
              >
                <img src={item.imagen} alt={item.nombre} />
                <div className="item-info">
                  <p className="item-name">{item.nombre}</p>
                  <p className="item-meta">TALLE: {item.talle}</p>
                  <p className="item-meta">
                    {item.precio}
                    {item.cantidad > 1 ? ` × ${item.cantidad}` : ''}
                  </p>
                </div>
                <button
                  className="remove-item"
                  onClick={() =>
                    eliminarDelCarrito(item.id, item.talle)
                  }
                  aria-label={
                    item.cantidad > 1
                      ? 'Quitar una unidad'
                      : 'Eliminar producto'
                  }
                  title={
                    item.cantidad > 1
                      ? 'Quitar una unidad'
                      : 'Eliminar producto'
                  }
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          <div className="total-container">
            <span>TOTAL:</span>
            <span id="cart-total-amount">{totalFormateado}</span>
          </div>
          <button
            className="checkout-btn"
            onClick={irAlCheckout}
            disabled={!isMounted || totalItems === 0}
          >
            FINALIZAR COMPRA
          </button>
        </div>
      </aside>
    </>
  );
}
