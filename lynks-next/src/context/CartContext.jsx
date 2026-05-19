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

// Convierte una fila de la API (shape de cart_items) al shape interno.
const rowToItem = (r) => ({
  id: r.product_id,
  nombre: r.nombre,
  precio: formatPrecio(r.precio),
  imagen: r.imagen,
  talle: r.talle,
  cantidad: r.cantidad,
});

/**
 * CartProvider
 *
 * Source of truth:
 *  - Anon user: localStorage (clave `lynks_cart_v1`).
 *  - Authenticated user: el backend (`/api/carrito`). El estado en memoria
 *    es una caché para la UI; se sincroniza con cada acción.
 *
 * Por qué API routes en vez de tocar Supabase directo: el servidor valida
 * que el producto exista, esté activo y tenga stock suficiente antes de
 * permitir agregar al carrito.
 */
export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [carrito, setCarrito] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sizeModalProduct, setSizeModalProduct] = useState(null);

  const [isMounted, setIsMounted] = useState(false);
  const [cartReady, setCartReady] = useState(false);

  // 1) Mount: leemos carrito de localStorage para UX inmediata.
  useEffect(() => {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
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

  // 2) Cuando cambia el user (login/logout), rehidratamos vía API.
  useEffect(() => {
    if (!isMounted || authLoading) return;

    let cancelled = false;
    setCartReady(false);

    const rehydrate = async () => {
      if (user) {
        // Leer carrito local (pre-login) para mergear
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

        // POST cada item local a la API. La API hace upsert sumando
        // cantidades y valida stock. Errores se loguean y siguen.
        for (const it of localCart) {
          try {
            await fetch('/api/carrito', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: it.id,
                talle: it.talle,
                cantidad: it.cantidad,
              }),
            });
          } catch (e) {
            console.warn('Error mergeando item al login:', e);
          }
        }

        if (localCart.length > 0) {
          try {
            window.localStorage.removeItem(STORAGE_KEY);
          } catch {
            /* no-op */
          }
        }

        // GET final del carrito de la DB
        try {
          const res = await fetch('/api/carrito');
          const payload = await res.json().catch(() => ({}));
          if (cancelled) return;
          if (res.ok && payload?.success) {
            setCarrito((payload.data || []).map(rowToItem));
          }
        } catch (e) {
          console.error('Error cargando carrito desde API:', e);
        }
        if (cancelled) return;
        setCartReady(true);
      } else {
        // Logout / anon: usamos lo que haya en localStorage.
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
  }, [user, isMounted, authLoading]);

  // 3) Persistencia local: SOLO para anon users. Si hay user logueado,
  //    el backend es source of truth y no tocamos localStorage.
  useEffect(() => {
    if (!isMounted || !cartReady) return;
    if (user) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    } catch (err) {
      console.warn('No se pudo guardar el carrito en localStorage:', err);
    }
  }, [carrito, isMounted, cartReady, user]);

  // ---- Acciones ----

  const agregarAlCarrito = async (producto, talle) => {
    if (!producto || !talle) return;

    if (user) {
      try {
        const res = await fetch('/api/carrito', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: producto.id,
            talle,
            cantidad: 1,
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload?.success) {
          alert(payload?.error || 'No se pudo agregar al carrito.');
          return;
        }
        const finalCantidad = payload.data.cantidad;
        setCarrito((prev) => {
          const idx = prev.findIndex(
            (it) =>
              String(it.id) === String(producto.id) && it.talle === talle
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], cantidad: finalCantidad };
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
              cantidad: finalCantidad,
            },
          ];
        });
        setIsCartOpen(true);
      } catch (err) {
        console.error('Error agregando al carrito:', err);
        alert('No se pudo agregar al carrito.');
      }
      return;
    }

    // Anon: actualización local + localStorage (efecto se encarga)
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
  const eliminarDelCarrito = async (id, talle) => {
    if (user) {
      try {
        const qs = new URLSearchParams({ product_id: String(id), talle });
        const res = await fetch(`/api/carrito?${qs.toString()}`, {
          method: 'DELETE',
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok || !payload?.success) {
          console.warn('Error eliminando:', payload?.error);
          return;
        }
        setCarrito((prev) => {
          if (payload.data.removed) {
            return prev.filter(
              (it) =>
                !(String(it.id) === String(id) && it.talle === talle)
            );
          }
          const idx = prev.findIndex(
            (it) => String(it.id) === String(id) && it.talle === talle
          );
          if (idx < 0) return prev;
          const next = [...prev];
          next[idx] = { ...next[idx], cantidad: payload.data.cantidad };
          return next;
        });
      } catch (err) {
        console.error('Error eliminando del carrito:', err);
      }
      return;
    }

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

  const vaciarCarrito = async () => {
    if (user) {
      try {
        await fetch('/api/carrito', { method: 'DELETE' });
      } catch (err) {
        console.error('Error vaciando carrito:', err);
      }
    }
    setCarrito([]);
  };

  const abrirCarrito = () => setIsCartOpen(true);
  const cerrarCarrito = () => setIsCartOpen(false);

  const abrirModalTalle = (producto) => setSizeModalProduct(producto);
  const cerrarModalTalle = () => setSizeModalProduct(null);

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
    sizeModalProduct,
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
