import Link from 'next/link';

export const metadata = {
  title: 'Compra confirmada | LYNKS',
};

// Página simple de confirmación post-compra.
export default function CheckoutSuccessPage() {
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
        <p className="text-[12px] tracking-wide text-[var(--gris-medio)] mb-8">
          Te enviamos un email con los detalles. Vas a recibir otro mail cuando
          el pedido salga del depósito.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-block bg-black text-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[var(--amarillo)] hover:text-black transition"
          >
            Volver al inicio
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
