import { Suspense } from 'react';
import Link from 'next/link';
import PagoResultClient from '../pago-completado/PagoResultClient';

export default function PagoPendientePage() {
  return (
    <main className="min-h-[70vh] bg-[var(--crema)] px-4 py-16">
      <div className="max-w-xl mx-auto">
        <Suspense fallback={null}>
          <PagoResultClient
            tipo="pending"
            titulo="Pago en proceso"
            mensaje="Tu pago está esperando confirmación. Si pagaste por transferencia o efectivo (Rapipago / Pago Fácil) puede tardar hasta 1-2 días hábiles. Te avisamos por mail cuando se acredite."
            color="#a16207"
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
