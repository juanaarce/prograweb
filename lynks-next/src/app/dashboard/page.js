'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Si terminó de cargar la sesión y no hay user, mandamos al login.
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  // Loading state (rehidratando sesión).
  if (loading || !user) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-[var(--crema)]">
        <p className="text-[11px] tracking-[0.25em] uppercase text-[var(--gris-medio)]">
          Cargando…
        </p>
      </main>
    );
  }

  // Sacamos nombre/apellido de los metadatos que guardamos en el signup.
  const { nombre, apellido } = user.user_metadata || {};
  const saludo = nombre
    ? `Hola, ${nombre}${apellido ? ' ' + apellido : ''}`
    : 'Bienvenida';

  return (
    <main className="min-h-[70vh] bg-[var(--crema)] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10 text-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[var(--gris-medio)] mb-2">
            Mi cuenta
          </p>
          <h1
            className="text-3xl sm:text-4xl tracking-[0.3em]"
            style={{ fontFamily: "'Times New Roman', serif" }}
          >
            {saludo.toUpperCase()}
          </h1>
        </header>

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

        <section className="mt-8 bg-[var(--blanco)] border border-[var(--gris-claro)] p-6 sm:p-10">
          <h2 className="text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            Mis pedidos
          </h2>
          <p className="text-sm tracking-wide text-[var(--gris-oscuro)]">
            Acá vas a ver tus pedidos cuando conectemos la tabla de órdenes
            (Etapa 2).
          </p>
        </section>

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
