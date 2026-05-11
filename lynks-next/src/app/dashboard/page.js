import Link from 'next/link';

// Stub temporal. Reemplazar cuando agregues sesión con Supabase.
export const metadata = {
  title: 'Mi cuenta | LYNKS',
};

export default function DashboardPage() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-20 bg-[var(--crema)]">
      <div className="max-w-md text-center">
        <h1
          className="text-3xl tracking-[0.3em] mb-4"
          style={{ fontFamily: "'Times New Roman', serif" }}
        >
          MI CUENTA
        </h1>
        <p className="text-sm tracking-wide text-[var(--gris-oscuro)] mb-8">
          Esta es tu zona privada. Acá vas a poder ver tus pedidos, datos y
          favoritos una vez que conectemos Supabase.
        </p>
        <Link
          href="/"
          className="inline-block bg-black text-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[var(--amarillo)] hover:text-black transition"
        >
          Volver a la tienda
        </Link>
      </div>
    </main>
  );
}
