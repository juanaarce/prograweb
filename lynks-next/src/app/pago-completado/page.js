import { Suspense } from 'react';
import Link from 'next/link';
import PagoResultClient from './PagoResultClient';

/**
 * /pago-completado
 * Mercado Pago redirige acá cuando un pago se aprobó.
 * Lee los query params payment_id, status, external_reference (orden).
 *
 * Recibe los query params via Suspense porque useSearchParams() los necesita.
 */
export default function PagoCompletadoPage() {
  return (
    <main className="min-h-[70vh] bg-[var(--crema)] px-4 py-16">
      <div className="max-w-xl mx-auto">
        <Suspense fallback={null}>
          <PagoResultClient
            tipo="success"
            titulo="Pago completado"
            mensaje="Tu pago fue aprobado correctamente. Te llegará un email con el detalle del pedido."
            color="#15803d"
          />
        </Suspense>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="admin-btn text-center">
            Ver mis pedidos
          </Link>
          <Link href="/shop" className="admin-btn-outline text-center">
            Seguir comprando
          </Link>
        </div>
      </div>
    </main>
  );
}
