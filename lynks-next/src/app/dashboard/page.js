'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/**
 * Dashboard del usuario.
 * - Muestra datos del usuario logueado.
 * - Lista los pedidos guardados en Supabase con sus items.
 * - Redirige a /login si no hay sesión.
 */

const formatARS = (n) =>
  `$${Number(n || 0).toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const SHIPPING_LABEL = {
  standard: 'Standard',
  express: 'Express',
  pickup: 'Retiro en local',
};

const STATUS_LABEL = {
  pending: 'Pendiente',
  paid: 'Pagado',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut, supabase } = useAuth();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Redirección si no hay sesión.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Cargar los pedidos del usuario.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError('');
      const { data, error } = await supabase
        .from('orders')
        .select(
          'id, total, subtotal, shipping_cost, shipping_method, status, created_at, order_items(id, nombre, precio, talle, cantidad, imagen)'
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error('Error cargando pedidos:', error);
        setOrdersError(
          'No pudimos cargar tus pedidos. Recargá la página en un momento.'
        );
        setOrders([]);
      } else {
        setOrders(data || []);
      }
      setOrdersLoading(false);
    };

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  // Loading state (rehidratando sesión).
  if (authLoading || !user) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-[var(--crema)]">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[var(--gris-medio)]">
          Cargando…
        </p>
      </main>
    );
  }

  const { nombre, apellido } = user.user_metadata || {};
  const saludo = nombre
    ? `Hola, ${nombre}${apellido ? ' ' + apellido : ''}`
    : 'Bienvenida';

  return (
    <main className="min-h-[70vh] bg-[var(--crema)] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[var(--gris-medio)] mb-2">
            Mi cuenta
          </p>
          <h1 className="text-2xl sm:text-3xl tracking-[0.3em] font-semibold uppercase">
            {saludo}
          </h1>
        </div>

        {/* Datos del usuario */}
        <section className="bg-[var(--blanco)] border border-[var(--gris-claro)] p-6 sm:p-10 space-y-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--gris-medio)] mb-1">
              Email
            </p>
            <p className="text-sm tracking-wide">{user.email}</p>
          </div>

          {(nombre || apellido) && (
            <div>
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--gris-medio)] mb-1">
                Nombre
              </p>
              <p className="text-sm tracking-wide">
                {[nombre, apellido].filter(Boolean).join(' ')}
              </p>
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--gris-medio)] mb-1">
              Miembro desde
            </p>
            <p className="text-sm tracking-wide">
              {new Date(user.created_at).toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </section>

        {/* Pedidos */}
        <section className="mt-8 bg-[var(--blanco)] border border-[var(--gris-claro)] p-6 sm:p-10">
          <h2 className="text-xs font-semibold tracking-[0.25em] uppercase mb-6">
            Mis pedidos
          </h2>

          {ordersLoading ? (
            <p className="text-sm tracking-wide text-[var(--gris-oscuro)]">
              Cargando tus pedidos…
            </p>
          ) : ordersError ? (
            <p className="text-sm tracking-wide text-red-600">{ordersError}</p>
          ) : orders.length === 0 ? (
            <div>
              <p className="text-sm tracking-wide text-[var(--gris-oscuro)] mb-4">
                Todavía no tenés pedidos.
              </p>
              <Link
                href="/shop"
                className="inline-block border border-black px-6 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white transition"
              >
                Ir a comprar
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--gris-claro)]">
              {orders.map((o) => {
                const isOpen = expandedId === o.id;
                const shortId = o.id.slice(0, 8).toUpperCase();
                const fecha = new Date(o.created_at).toLocaleDateString(
                  'es-AR',
                  {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }
                );
                const cantidadTotal = (o.order_items || []).reduce(
                  (acc, it) => acc + it.cantidad,
                  0
                );

                return (
                  <li key={o.id} className="py-5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : o.id)}
                      className="w-full flex flex-wrap items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase">
                          #{shortId}
                        </p>
                        <p className="text-[11px] text-[var(--gris-medio)] tracking-wide mt-1">
                          {fecha} ·{' '}
                          {cantidadTotal}{' '}
                          {cantidadTotal === 1 ? 'item' : 'items'} ·{' '}
                          <span className="uppercase">
                            {STATUS_LABEL[o.status] || o.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm font-bold tracking-wide">
                          {formatARS(o.total)}
                        </p>
                        <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--gris-medio)]">
                          {isOpen ? 'Ocultar' : 'Ver detalle'}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-4 border-t border-[var(--gris-claro)] pt-4 space-y-4">
                        {/* Items */}
                        <ul className="space-y-3">
                          {(o.order_items || []).map((it) => (
                            <li
                              key={it.id}
                              className="flex gap-3 items-center"
                            >
                              {it.imagen && (
                                <img
                                  src={it.imagen}
                                  alt={it.nombre}
                                  className="w-14 h-16 object-cover bg-gray-100 flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold tracking-wide truncate">
                                  {it.nombre}
                                </p>
                                <p className="text-[11px] text-[var(--gris-medio)] tracking-wide">
                                  Talle {it.talle} · x{it.cantidad}
                                </p>
                              </div>
                              <p className="text-[12px] font-semibold whitespace-nowrap">
                                {formatARS(Number(it.precio) * it.cantidad)}
                              </p>
                            </li>
                          ))}
                        </ul>

                        {/* Totales y envío */}
                        <div className="text-[11px] tracking-wide text-[var(--gris-oscuro)] space-y-1 pt-3 border-t border-[var(--gris-claro)]">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatARS(o.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>
                              Envío (
                              {SHIPPING_LABEL[o.shipping_method] ||
                                o.shipping_method}
                              )
                            </span>
                            <span>
                              {Number(o.shipping_cost) === 0
                                ? 'GRATIS'
                                : formatARS(o.shipping_cost)}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-black pt-1">
                            <span>Total</span>
                            <span>{formatARS(o.total)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Acciones */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/shop"
            className="inline-block bg-black text-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase text-center hover:bg-[var(--amarillo)] hover:text-black transition"
          >
            Seguir comprando
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-block border border-black px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase text-center hover:bg-black hover:text-white transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
