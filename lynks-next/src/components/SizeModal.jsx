'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';

const TALLES = ['S', 'M', 'L'];

/**
 * SizeModal
 * Modal de selección de talle (Quick Add desde el catálogo).
 * Se abre cuando sizeModalProduct del CartContext tiene un producto.
 *
 * Ya NO resuelve el producto por id — recibe el objeto entero desde el
 * CartContext (que lo guardó cuando se abrió el modal desde la ProductCard).
 * Esto permite que el catálogo viva en Supabase y la lookup sea server-only.
 */
export default function SizeModal() {
  const {
    sizeModalProduct,
    cerrarModalTalle,
    agregarAlCarrito,
  } = useCart();

  const [talleSeleccionado, setTalleSeleccionado] = useState(null);

  const isOpen = Boolean(sizeModalProduct);
  const producto = sizeModalProduct;

  const handleClose = () => {
    setTalleSeleccionado(null);
    cerrarModalTalle();
  };

  const handleConfirm = () => {
    if (!talleSeleccionado) {
      alert('POR FAVOR SELECCIONA UN TALLE');
      return;
    }
    if (!producto) return;

    agregarAlCarrito(producto, talleSeleccionado);
    setTalleSeleccionado(null);
    cerrarModalTalle();
  };

  return (
    <div
      id="size-modal"
      className={`size-modal ${isOpen ? 'show' : ''}`}
      onClick={(e) => {
        // Cerrar al clickear fuera del contenido
        if (e.target.id === 'size-modal') handleClose();
      }}
    >
      <div className="size-modal-content">
        <h4>SELECCIONAR TALLE</h4>
        <div className="modal-size-options">
          {TALLES.map((t) => (
            <button
              key={t}
              type="button"
              className={`modal-size-btn ${talleSeleccionado === t ? 'active' : ''}`}
              onClick={() => setTalleSeleccionado(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          id="confirm-quick-add"
          type="button"
          className="confirm-btn"
          onClick={handleConfirm}
        >
          AGREGAR
        </button>
        <button
          id="close-size-modal"
          type="button"
          className="close-modal-text"
          onClick={handleClose}
        >
          CANCELAR
        </button>
      </div>
    </div>
  );
}
