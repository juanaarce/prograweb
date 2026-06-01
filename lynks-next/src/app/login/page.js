'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Sólo permitimos returnTo dentro del mismo sitio (paths que empiezan con "/"
// y no son `//` ni protocolos externos). Esto evita open-redirect.
function safeReturnTo(value, fallback = '/dashboard') {
  if (!value || typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}

/**
 * LoginPage
 * Página de inicio de sesión de LYNKS.
 * - Validación cliente: email con regex + password mínimo 6 chars.
 * - Manejo de errores por campo y un banner general para el submit.
 * - Llama a signIn() del AuthContext (Supabase).
 * - Redirige a /dashboard al loguear con éxito.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Traducción amigable de los códigos de error de Supabase.
function traducirErrorSupabase(err) {
  const msg = err?.message?.toLowerCase() || '';
  if (msg.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Tenés que confirmar tu email antes de iniciar sesión. Revisá tu casilla.';
  }
  if (msg.includes('too many requests')) {
    return 'Demasiados intentos. Esperá un momento e intentá de nuevo.';
  }
  return err?.message || 'No pudimos iniciar tu sesión. Probá de nuevo.';
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const { signIn } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Limpio el error del campo en cuanto el usuario escribe
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = 'Ingresá tu email.';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      newErrors.email = 'El email no es válido.';
    }
    if (!form.password) {
      newErrors.password = 'Ingresá tu contraseña.';
    } else if (form.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await signIn(form.email, form.password);
      router.push(returnTo);
      router.refresh(); // sincroniza Server Components con la nueva sesión
    } catch (err) {
      setServerError(traducirErrorSupabase(err));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--crema)]">
      <div className="w-full max-w-md">
        {/* Subtítulo de bienvenida */}
        <div className="mb-10 text-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[var(--gris-medio)]">
            Bienvenida de nuevo
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--blanco)] border border-[var(--gris-claro)] p-8 sm:p-10 shadow-sm">
          <h2 className="text-xs tracking-[0.25em] uppercase font-semibold text-black mb-8 text-center">
            Iniciar Sesión
          </h2>

          {/* Banner de error del servidor */}
          {serverError && (
            <div
              role="alert"
              className="mb-6 border border-red-300 bg-red-50 px-4 py-3 text-[12px] tracking-wide text-red-700"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2 text-black"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
                placeholder="tu@email.com"
                className={`w-full bg-white border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-black ${
                  errors.email ? 'border-red-400' : 'border-[var(--gris-claro)]'
                }`}
              />
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-2 text-[11px] tracking-wide text-red-600"
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2 text-black"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  placeholder="••••••"
                  className={`w-full bg-white border px-4 py-3 pr-16 text-sm outline-none transition placeholder:text-gray-400 focus:border-black ${
                    errors.password ? 'border-red-400' : 'border-[var(--gris-claro)]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-[10px] tracking-[0.15em] uppercase text-[var(--gris-medio)] hover:text-black transition"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-2 text-[11px] tracking-wide text-red-600"
                >
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 text-xs font-bold tracking-[0.2em] uppercase transition hover:bg-[var(--amarillo)] hover:text-black disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white"
            >
              {loading ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>

          {/* Separador */}
          <div className="flex items-center my-8">
            <div className="flex-1 h-px bg-[var(--gris-claro)]" />
            <span className="px-3 text-[10px] tracking-[0.25em] uppercase text-[var(--gris-medio)]">
              o
            </span>
            <div className="flex-1 h-px bg-[var(--gris-claro)]" />
          </div>

          {/* Link a registro */}
          <p className="text-center text-[12px] tracking-wide text-[var(--gris-oscuro)]">
            ¿No tenés cuenta?{' '}
            <Link
              href={
                returnTo === '/dashboard'
                  ? '/register'
                  : `/register?returnTo=${encodeURIComponent(returnTo)}`
              }
              className="font-semibold uppercase tracking-[0.15em] text-black border-b border-black hover:text-[var(--gris-medio)] hover:border-[var(--gris-medio)] transition"
            >
              Registrate
            </Link>
          </p>
        </div>

        {/* Volver al sitio */}
        <p className="mt-8 text-center">
          <Link
            href="/"
            className="text-[11px] tracking-[0.2em] uppercase text-[var(--gris-medio)] hover:text-black transition"
          >
            ← Volver a la tienda
          </Link>
        </p>
      </div>
    </div>
  );
}
