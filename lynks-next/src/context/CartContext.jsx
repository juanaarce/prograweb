'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'lynks_cart_v1';

export function CartProvider({ children }) {
  // Estado principal del carrito
  const [carrito, setCarrito] = useState([]);

  // Estado UI: carrito abierto / cerrado
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Estado del modal de talles (Quick Add desde el catálogo)
  const [sizeModalProductId, setSizeModalProductId] = useState(null);

  // Flag de montaje para evitar errores de hidratación.
  // Mientras no se haya montado en cliente, no leemos ni escribimos localStorage.
  const [isMounted, setIsMounted] = useState(false);

  // 1) useEffect de MONTAJE: recupera el carrito desde localStorage.
  //    Se ejecuta UNA sola vez en el cliente, después del primer render.
  useEffect(() => {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) setCarrito(parsed);
      }
    } catch (err) {
      console.warn('No se pudo leer el carrito desde localStorage:', err);
    }
    setIsMounted(true);
  }, []);

  // 2) useEffect de PERSISTENCIA: cada vez que cambia el carrito, lo guardamos.
  //    Sólo después del montaje, para no pisar el storage con un array vacío
  //    durante el primer render del servidor / hidratación.
  useEffect(() => {
    if (!isMounted) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    } catch (err) {
      console.warn('No se pudo guardar el carrito en localStorage:', err);
    }
  }, [carrito, isMounted]);

  // --- Acciones del carrito ---
  const agregarAlCarrito = (producto, talle) => {
    if (!producto || !talle) return;
    setCarrito((prev) => [...prev, { ...producto, talle }]);
    setIsCartOpen(true);
  };

  const eliminarDelCarrito = (index) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  };

  const vaciarCarrito = () => setCarrito([]);

  const abrirCarrito = () => setIsCartOpen(true);
  const cerrarCarrito = () => setIsCartOpen(false);

  const abrirModalTalle = (productoId) => setSizeModalProductId(productoId);
  const cerrarModalTalle = () => setSizeModalProductId(null);

  // Total numérico (en pesos) calculado a partir del string "$xx.xxx".
  const total = carrito.reduce((acc, item) => {
    const num = parseInt(String(item.precio).replace(/\D/g, ''), 10);
    return acc + (Number.isFinite(num) ? num : 0);
  }, 0);

  const value = {
    carrito,
    total,
    isCartOpen,
    sizeModalProductId,
    isMounted,
    agregarAlCarrito,
    eliminarDelCarrito,
    vaciarCarrito,
    abrirCarrito,
    cerrarCarrito,
    abrirModalTalle,
    cerrarModalTalle,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de <CartProvider>');
  }
  return ctx;
}
