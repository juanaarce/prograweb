import Link from 'next/link';

// Stub mínimo. Reusá la estructura del /login para armarlo cuando quieras.
export const metadata = {
  title: 'Crear cuenta | LYNKS',
};

export default function RegisterPage() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-20 bg-[var(--crema)]">
      <div className="max-w-md text-center">
        <h1
          className="text-3xl tracking-[0.3em] mb-4"
          style={{ fontFamily: "'Times New Roman', serif" }}
        >
          CREAR CUENTA
        </h1>
        <p className="text-sm tracking-wide text-[var(--gris-oscuro)] mb-8">
          Próximamente vas a poder registrarte para guardar tus favoritos y
          ver tus pedidos.
        </p>
        <Link
          href="/login"
          className="inline-block border-b border-black text-xs font-bold tracking-[0.2em] uppercase hover:text-[var(--gris-medio)] hover:border-[var(--gris-medio)] transition pb-1"
        >
          Ya tengo cuenta — Ingresar
        </Link>
      </div>
    </main>
  );
}
