'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

/**
 * /checkout/pago/[id]
 *
 * Página de procesamiento de pago (Clase 12 - slide 13).
 * Implementa:
 *  - Carga de orden: useEffect → GET /api/ordenes/[id]
 *  - Validación: el endpoint ya verifica que pertenezca al user
 *  - Procesamiento: botón → POST /api/pagos/crear-preferencia
 *  - Estados: loading / ready / processing / error / preparado
 *  - Navegación: link a "Mis pedidos" (/dashboard)
 *
 * Por ahora muestra la estructura preparada (preferencia) en pantalla.
 * En Semana 13 reemplazamos esto por redirección real al checkout de
 * Mercado Pago (window.location = payload.data.paymentLink).
 */

const STATUS_LABEL = {
  pending: 'Pendiente',
  pendiente: 'Pendiente',
  paid: 'Pagado',
  pagada: 'Pagada',
  confirmada: 'Confirmada',
  shipped: 'Enviado',
  enviada: 'Enviada',
  delivered: 'Entregado',
  entregada: 'Entregada',
  cancelled: 'Cancelada',
  cancelada: 'Cancelada',
};

const SHIPPING_LABEL = {
  standard: 'Standard',
  express: 'Express',
  pickup: 'Retiro en local',
};

const formatARS = (n) =>
  `$${Number(n || 0).toLocaleString('es-AR')}`;

export default function CheckoutPagoPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [processing, setProcessing] = useState(false);

  // Redirigir a /login si no hay sesión
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?returnTo=/checkout/pago/${orderId}`);
    }
  }, [authLoading, user, orderId, router]);

  // Cargar la orden desde la API
  useEffect(() => {
    if (!user || !orderId) return;

    let cancelled = false;
    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/ordenes/${orderId}`);
        const payload = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !payload?.success) {
          throw new Error(
            payload?.error || 'No pudimos cargar la orden.'
          );
        }
        setOrder(payload.data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [user, orderId]);

  const handlePagar = async () => {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch('/api/pagos/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.success) {
        throw new Error(
          payload?.error || 'No pudimos iniciar el pago.'
        );
      }

      // Con las credenciales APP_USR- (las nuevas de MP), el modo sandbox lo
      // determina el token, no la URL del checkout. El `sandbox_init_point`
      // (sandbox.mercadopago.com.ar) es legacy y tiene bugs con el simulador
      // de tarjetas usando APP_USR-; el `init_point` (www.mercadopago.com.ar)
      // anda bien y sigue siendo de prueba porque las credenciales lo son.
      const url =
        payload.data?.initPoint || payload.data?.sandboxInitPoint;
      if (!url) {
        throw new Error('Mercado Pago no devolvió URL de pago.');
      }

      // Redirección al checkout de Mercado Pago.
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  // ---------- Estados de UI ----------

  if (authLoading || (loading && !error)) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-[var(--crema)]">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[var(--gris-medio)]">
          Cargando…
        </p>
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="min-h-[60vh] bg-[var(--crema)] px-4 py-16">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <p className="text-[10px] tracking-[0.25em] uppercase text-red-700 font-semibold">
            Error al cargar
          </p>
          <p className="text-sm tracking-wide text-[var(--gris-oscuro)]">
            {error}
          </p>
          <Link href="/dashboard" className="admin-btn-outline">
            Volver a mis pedidos
          </Link>
        </div>
      </main>
    );
  }

  if (!order) return null;

  const shortId = String(order.id).slice(0, 8).toUpperCase();
  const fecha = new Date(order.created_at).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const yaPagada = !['pending', 'pendiente'].includes(order.status);
  const cantidadItems = (order.order_items || []).reduce(
    (acc, it) => acc + Number(it.cantidad || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[var(--crema)] px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="mb-10 text-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[var(--gris-medio)]">
            Procesar pago
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl tracking-[0.3em] font-semibold uppercase">
            Pago de pedido
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* ----------- IZQUIERDA: Resumen de la orden ----------- */}
          <section className="lg:col-span-2 bg-[var(--blanco)] border border-[var(--gris-claro)] p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--gris-medio)]">
                  Resumen de orden
                </p>
                <h2 className="mt-1 text-lg font-semibold font-mono tracking-[0.15em]">
                  #{shortId}
                </h2>
                <p className="text-[11px] text-[var(--gris-medio)] tracking-wide mt-1">
                  {fecha} · {cantidadItems}{' '}
                  {cantidadItems === 1 ? 'item' : 'items'}
                </p>
              </div>
              <span
                className={`text-[10px] tracking-[0.2em] uppercase font-semibold ${
                  yaPagada
                    ? 'text-green-700'
                    : 'text-yellow-700'
                }`}
              >
                {STATUS_LABEL[order.status] || order.status}
              </span>
            </div>

            {/* Items */}
            <ul className="divide-y divide-[var(--gris-claro)]">
              {(order.order_items || []).map((it) => (
                <li key={it.id} className="py-4 flex gap-3 items-center">
                  {it.imagen && (
                    // eslint-disable-next-line @next/next/no-img-element
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
                    {formatARS(Number(it.precio) * Number(it.cantidad))}
                  </p>
                </li>
              ))}
            </ul>

            {/* Totales */}
            <div className="pt-4 border-t border-[var(--gris-claro)] text-[12px] tracking-wide space-y-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatARS(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>
                  Envío (
                  {SHIPPING_LABEL[order.shipping_method] ||
                    order.shipping_method}
                  )
                </span>
                <span>
                  {Number(order.shipping_cost) === 0
                    ? 'GRATIS'
                    : formatARS(order.shipping_cost)}
                </span>
              </div>
              <div className="flex justify-between text-[14px] font-bold pt-2">
                <span>Total a pagar</span>
                <span>{formatARS(order.total)}</span>
              </div>
            </div>
          </section>

          {/* ----------- DERECHA: Métodos de pago ----------- */}
          <aside className="bg-[var(--blanco)] border border-[var(--gris-claro)] p-6 sm:p-8 h-fit space-y-6">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--gris-medio)] mb-2">
                Métodos de pago
              </p>
              <h2 className="text-sm font-semibold tracking-[0.2em] uppercase">
                Elegí cómo pagar
              </h2>
            </div>

            <ul className="space-y-3">
              <li className="border border-l-4 border-l-[var(--amarillo)] border-[var(--gris-claro)] p-4">
                <p className="text-[12px] font-semibold tracking-wide">
                  Mercado Pago
                </p>
                <p className="text-[11px] text-[var(--gris-medio)] tracking-wide mt-1">
                  Tarjeta, dinero en cuenta o transferencia
                </p>
              </li>
              <li className="border border-[var(--gris-claro)] p-4 opacity-60">
                <p className="text-[12px] font-semibold tracking-wide">
                  Transferencia bancaria
                </p>
                <p className="text-[10px] text-[var(--gris-medio)] tracking-[0.2em] uppercase mt-1">
                  Próximamente
                </p>
              </li>
            </ul>

            {error && (
              <p className="text-[11px] tracking-wide text-red-700 border border-red-300 bg-red-50 px-3 py-2">
                {error}
              </p>
            )}

            {yaPagada ? (
              <div className="space-y-3">
                <p className="text-[12px] tracking-wide text-[var(--gris-oscuro)]">
                  Este pedido ya fue procesado.
                </p>
                <Link href="/dashboard" className="admin-btn block text-center">
                  Ir a mis pedidos
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePagar}
                disabled={processing}
                className="admin-btn w-full"
              >
                {processing
                  ? 'Redirigiendo a Mercado Pago…'
                  : `Pagar con Mercado Pago — ${formatARS(order.total)}`}
              </button>
            )}

            <p className="text-[9px] text-center tracking-[0.2em] uppercase text-[var(--gris-medio)]">
              Pago seguro · Encriptado SSL
            </p>
          </aside>
        </div>

        {/* ----------- Navegación ----------- */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/dashboard"
            className="text-[10px] tracking-[0.2em] uppercase underline text-[var(--gris-medio)] hover:text-[var(--amarillo)] transition"
          >
            ← Volver a mis pedidos
          </Link>
        </div>
      </div>
    </main>
  );
}
