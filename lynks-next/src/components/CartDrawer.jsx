'use client';

import { useCart } from '@/context/CartContext';

/**
 * CartDrawer
 * Panel lateral del carrito + overlay.
 * Lee todo el estado desde el CartContext.
 * Se desliza con la clase .open (definida en globals.css).
 */
export default function CartDrawer() {
  const {
    carrito,
    total,
    isCartOpen,
    isMounted,
    cerrarCarrito,
    eliminarDelCarrito,
  } = useCart();

  // Antes del montaje en el cliente, mostramos el carrito como vacío
  // para que el HTML del servidor coincida con la primera pintura del cliente
  // (evitamos errores de hidratación si en localStorage había productos).
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
            items.map((item, index) => (
              <div className="cart-item" key={`${item.id}-${item.talle}-${index}`}>
                <img src={item.imagen} alt={item.nombre} />
                <div className="item-info">
                  <p className="item-name">{item.nombre}</p>
                  <p className="item-meta">TALLE: {item.talle}</p>
                  <p className="item-meta">{item.precio}</p>
                </div>
                <button
                  className="remove-item"
                  onClick={() => eliminarDelCarrito(index)}
                  aria-label="Eliminar producto"
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
          <button className="checkout-btn">FINALIZAR COMPRA</button>
        </div>
      </aside>
    </>
  );
}
