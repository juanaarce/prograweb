'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/**
 * Página de confirmación post-checkout.
 * Lee ?order_id=xxx desde la URL para mostrar el número de pedido.
 * El número visible es un prefijo corto del UUID (más amigable).
 */

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : null;

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-[var(--crema)]">
      <div className="max-w-lg w-full text-center bg-[var(--blanco)] border border-[var(--gris-claro)] p-10 sm:p-14">
        {/* Checkmark */}
        <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-black flex items-center justify-center">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>

        <h1
          className="text-2xl sm:text-3xl tracking-[0.3em] mb-4"
          style={{ fontFamily: "'Times New Roman', serif" }}
        >
          ¡GRACIAS!
        </h1>
        <p className="text-sm tracking-wide text-[var(--gris-oscuro)] mb-2">
          Recibimos tu pedido correctamente.
        </p>

        {shortId && (
          <div className="my-6 inline-block border border-[var(--gris-claro)] px-5 py-3 bg-[var(--crema)]">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[var(--gris-medio)] mb-1">
              Nº de pedido
            </p>
            <p className="text-sm font-bold tracking-[0.2em]">#{shortId}</p>
          </div>
        )}

        <p className="text-[12px] tracking-wide text-[var(--gris-medio)] mb-8">
          Podés ver el detalle y el estado de tu pedido en tu cuenta.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-block bg-black text-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[var(--amarillo)] hover:text-black transition"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/shop"
            className="inline-block border border-black px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-black hover:text-white transition"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </main>
  );
}

// useSearchParams requiere Suspense para no romper el prerender.
export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] flex items-center justify-center bg-[var(--crema)]">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[var(--gris-medio)]">
            Cargando…
          </p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
