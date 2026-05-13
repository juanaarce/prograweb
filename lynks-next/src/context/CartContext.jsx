'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useAuth } from '@/context/AuthContext';

const CartContext = createContext(null);

const STORAGE_KEY = 'lynks_cart_v1';

// "$45.000" → 45000 (en pesos sin centavos).
const parsePrecio = (s) => {
  const num = parseInt(String(s).replace(/\D/g, ''), 10);
  return Number.isFinite(num) ? num : 0;
};

// 45000 → "$45.000"
const formatPrecio = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

// Mezcla dos carritos sumando cantidades por (id + talle).
function mergeCarts(a, b) {
  const map = new Map();
  for (const item of [...a, ...b]) {
    if (!item || !item.id || !item.talle) continue;
    const key = `${item.id}__${item.talle}`;
    const cant = Number(item.cantidad) > 0 ? Number(item.cantidad) : 1;
    const existing = map.get(key);
    if (existing) {
      existing.cantidad += cant;
    } else {
      map.set(key, {
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        imagen: item.imagen,
        talle: item.talle,
        cantidad: cant,
      });
    }
  }
  return Array.from(map.values());
}

// Convierte una fila de la tabla cart_items al shape interno del carrito.
const rowToItem = (r) => ({
  id: r.product_id,
  nombre: r.nombre,
  precio: formatPrecio(r.precio),
  imagen: r.imagen,
  talle: r.talle,
  cantidad: r.cantidad,
});

// Convierte un item del carrito a una fila para insertar en cart_items.
const itemToRow = (it, userId) => ({
  user_id: userId,
  product_id: String(it.id),
  nombre: it.nombre,
  precio: parsePrecio(it.precio),
  imagen: it.imagen,
  talle: it.talle,
  cantidad: it.cantidad,
});

export function CartProvider({ children }) {
  const { user, loading: authLoading, supabase } = useAuth();

  // Estado del carrito (siempre array de { id, nombre, precio, imagen, talle, cantidad })
  const [carrito, setCarrito] = useState([]);

  // UI
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sizeModalProductId, setSizeModalProductId] = useState(null);

  // Flags de ciclo de vida
  const [isMounted, setIsMounted] = useState(false);
  // cartReady = ya terminamos la rehidratación inicial; sólo entonces
  // empezamos a persistir hacia afuera.
  const [cartReady, setCartReady] = useState(false);

  // ---------------------------------------------------------------
  // 1) Mount: leemos carrito de localStorage inmediatamente para que
  //    los usuarios anónimos tengan UX instantánea.
  // ---------------------------------------------------------------
  useEffect(() => {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Migración: items viejos sin `cantidad` (duplicados) → agrupar.
          const normalized = parsed.map((it) => ({
            ...it,
            cantidad: Number(it.cantidad) > 0 ? Number(it.cantidad) : 1,
          }));
          setCarrito(mergeCarts(normalized, []));
        }
      }
    } catch (err) {
      console.warn('No se pudo leer el carrito desde localStorage:', err);
    }
    setIsMounted(true);
  }, []);

  // ---------------------------------------------------------------
  // 2) Cuando cambia el user (login/logout), rehidratamos:
  //    - login: traemos el carrito de la DB y, si hay items en
  //      localStorage, los mergeamos hacia la DB.
  //    - logout: dejamos sólo lo que haya en localStorage.
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!isMounted || authLoading) return;

    let cancelled = false;
    setCartReady(false);

    const rehydrate = async () => {
      if (user) {
        // Carrito de la DB
        const { data: rows, error } = await supabase
          .from('cart_items')
          .select(
            'product_id, nombre, precio, talle, imagen, cantidad, created_at'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error('Error cargando carrito de la DB:', error);
        }

        const dbCart = (rows || []).map(rowToItem);

        // Items en localStorage (pre-login)
        let localCart = [];
        try {
          const data = window.localStorage.getItem(STORAGE_KEY);
          if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              localCart = parsed.map((it) => ({
                ...it,
                cantidad:
                  Number(it.cantidad) > 0 ? Number(it.cantidad) : 1,
              }));
            }
          }
        } catch {
          /* no-op */
        }

        const merged = mergeCarts(dbCart, localCart);

        // Si había items locales, subimos el merged a la DB y limpiamos local.
        if (localCart.length > 0) {
          try {
            await supabase
              .from('cart_items')
              .delete()
              .eq('user_id', user.id);
            if (merged.length > 0) {
              await supabase
                .from('cart_items')
                .insert(merged.map((it) => itemToRow(it, user.id)));
            }
            window.localStorage.removeItem(STORAGE_KEY);
          } catch (err) {
            console.error('Error mergeando carrito al loguear:', err);
          }
        }

        if (cancelled) return;
        setCarrito(merged);
        setCartReady(true);
      } else {
        // Logout / anónimo: usamos lo que haya en localStorage.
        let localCart = [];
        try {
          const data = window.localStorage.getItem(STORAGE_KEY);
          if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              localCart = parsed.map((it) => ({
                ...it,
                cantidad:
                  Number(it.cantidad) > 0 ? Number(it.cantidad) : 1,
              }));
            }
          }
        } catch {
          /* no-op */
        }
        if (cancelled) return;
        setCarrito(mergeCarts(localCart, []));
        setCartReady(true);
      }
    };

    rehydrate();
    return () => {
      cancelled = true;
    };
  }, [user, isMounted, authLoading, supabase]);

  // ---------------------------------------------------------------
  // 3) Persistencia en cada cambio del carrito (solo después de cartReady).
  //    - Si hay user: DELETE + INSERT del carrito en la DB (debounced 300ms).
  //    - Si no: localStorage.
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!isMounted || !cartReady) return;

    if (user) {
      let cancelled = false;
      const timer = setTimeout(async () => {
        if (cancelled) return;
        try {
          const { error: delErr } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);
          if (delErr) {
            console.error('Error vaciando carrito en DB:', delErr);
            return;
          }
          if (carrito.length > 0) {
            const { error: insErr } = await supabase
              .from('cart_items')
              .insert(carrito.map((it) => itemToRow(it, user.id)));
            if (insErr) {
              console.error('Error escribiendo carrito en DB:', insErr);
            }
          }
        } catch (err) {
          console.error('Error sincronizando carrito:', err);
        }
      }, 300);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    } else {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
      } catch (err) {
        console.warn('No se pudo guardar el carrito en localStorage:', err);
      }
    }
  }, [carrito, isMounted, cartReady, user, supabase]);

  // --- Acciones del carrito (sólo tocan el estado en memoria; la persistencia
  //     la maneja el useEffect de arriba). ---

  const agregarAlCarrito = (producto, talle) => {
    if (!producto || !talle) return;
    setCarrito((prev) => {
      const idx = prev.findIndex(
        (it) =>
          String(it.id) === String(producto.id) && it.talle === talle
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 };
        return next;
      }
      return [
        ...prev,
        {
          id: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          imagen: producto.imagen,
          talle,
          cantidad: 1,
        },
      ];
    });
    setIsCartOpen(true);
  };

  // "Eliminar" = restar 1 unidad. Si llega a 0, lo saca del carrito.
  const eliminarDelCarrito = (id, talle) => {
    setCarrito((prev) => {
      const idx = prev.findIndex(
        (it) => String(it.id) === String(id) && it.talle === talle
      );
      if (idx < 0) return prev;
      const item = prev[idx];
      if (item.cantidad <= 1) {
        return prev.filter((_, i) => i !== idx);
      }
      const next = [...prev];
      next[idx] = { ...next[idx], cantidad: next[idx].cantidad - 1 };
      return next;
    });
  };

  const vaciarCarrito = () => setCarrito([]);

  const abrirCarrito = () => setIsCartOpen(true);
  const cerrarCarrito = () => setIsCartOpen(false);

  const abrirModalTalle = (productoId) =>
    setSizeModalProductId(productoId);
  const cerrarModalTalle = () => setSizeModalProductId(null);

  // Total numérico (precio * cantidad por cada línea).
  const total = useMemo(
    () =>
      carrito.reduce(
        (acc, it) => acc + parsePrecio(it.precio) * (it.cantidad || 1),
        0
      ),
    [carrito]
  );

  // Total de unidades (para el badge del navbar).
  const totalItems = useMemo(
    () => carrito.reduce((acc, it) => acc + (it.cantidad || 1), 0),
    [carrito]
  );

  const value = {
    carrito,
    total,
    totalItems,
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

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de <CartProvider>');
  }
  return ctx;
}
