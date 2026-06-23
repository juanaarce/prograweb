import { Suspense } from 'react';
import Link from 'next/link';
import PagoResultClient from '../pago-completado/PagoResultClient';

export default function PagoFallidoPage() {
  return (
    <main className="min-h-[70vh] bg-[var(--crema)] px-4 py-16">
      <div className="max-w-xl mx-auto">
        <Suspense fallback={null}>
          <PagoResultClient
            tipo="failure"
            titulo="Pago rechazado"
            mensaje="El pago no pudo procesarse. Esto puede pasar por fondos insuficientes, tarjeta rechazada o cancelación voluntaria. Podés intentar de nuevo."
            color="#b91c1c"
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
