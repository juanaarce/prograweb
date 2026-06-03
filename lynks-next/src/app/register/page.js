'use client';

// Necesario porque la página usa `useSearchParams()` para leer ?returnTo=...
// Sin esto Next.js intenta pre-renderizarla estática y rompe el build en Vercel.
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function safeReturnTo(value, fallback = '/dashboard') {
  if (!value || typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}

/**
 * RegisterPage
 * Página de creación de cuenta de LYNKS — conectada a Supabase Auth.
 * - Validación cliente: nombre/apellido requeridos, email regex,
 *   contraseña mínima 8 chars + al menos 1 número, confirmación que matchee.
 * - Manejo de errores por campo + banner general.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function traducirErrorSupabase(err) {
  const msg = err?.message?.toLowerCase() || '';
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Ya existe una cuenta con este email. Probá iniciando sesión.';
  }
  if (msg.includes('password should be at least')) {
    return 'La contraseña no cumple el mínimo de seguridad de Supabase.';
  }
  if (msg.includes('invalid email')) {
    return 'El email no es válido.';
  }
  return err?.message || 'No pudimos crear tu cuenta. Probá de nuevo.';
}

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const { signUp } = useAuth();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (serverError) setServerError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!form.nombre.trim()) {
      newErrors.nombre = 'Ingresá tu nombre.';
    }
    if (!form.apellido.trim()) {
      newErrors.apellido = 'Ingresá tu apellido.';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Ingresá tu email.';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      newErrors.email = 'El email no es válido.';
    }

    if (!form.password) {
      newErrors.password = 'Ingresá una contraseña.';
    } else if (form.password.length < 8) {
      newErrors.password = 'Debe tener al menos 8 caracteres.';
    } else if (!/\d/.test(form.password)) {
      newErrors.password = 'Debe incluir al menos un número.';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Confirmá tu contraseña.';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    if (!acceptTerms) {
      newErrors.terms = 'Tenés que aceptar los términos.';
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
      const { session } = await signUp({
        email: form.email,
        password: form.password,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
      });

      // Si Supabase tiene confirmación de email habilitada (default),
      // signUp NO crea sesión: hay que confirmar el mail primero.
      if (!session) {
        setEmailEnviado(true);
        setLoading(false);
        return;
      }

      // Si no hay confirmación de email, ya estás logueado.
      router.push(returnTo);
      router.refresh();
    } catch (err) {
      setServerError(traducirErrorSupabase(err));
      setLoading(false);
    }
  };

  // ---- UI helpers ----
  const labelClass =
    'block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2 text-black';

  const inputClass = (hasError) =>
    `w-full bg-white border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-black ${
      hasError ? 'border-red-400' : 'border-[var(--gris-claro)]'
    }`;

  // Pantalla de "te enviamos un email" cuando la confirmación está activa.
  if (emailEnviado) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--crema)]">
        <div className="w-full max-w-md bg-[var(--blanco)] border border-[var(--gris-claro)] p-10 text-center">
          <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-black flex items-center justify-center">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="text-xs tracking-[0.25em] uppercase font-semibold mb-4">
            Revisá tu email
          </h2>
          <p className="text-sm tracking-wide text-[var(--gris-oscuro)] mb-2">
            Te mandamos un link a <strong>{form.email}</strong>.
          </p>
          <p className="text-[12px] tracking-wide text-[var(--gris-medio)] mb-8">
            Hacé click en el link para confirmar tu cuenta y poder iniciar sesión.
          </p>
          <Link
            href={
              returnTo === '/dashboard'
                ? '/login'
                : `/login?returnTo=${encodeURIComponent(returnTo)}`
            }
            className="inline-block bg-black text-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[var(--amarillo)] hover:text-black transition"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--crema)]">
      <div className="w-full max-w-md">
        {/* Subtítulo de bienvenida */}
        <div className="mb-10 text-center">
          <p className="text-[11px] tracking-[0.25em] uppercase text-[var(--gris-medio)]">
            Sumate a LYNKS
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--blanco)] border border-[var(--gris-claro)] p-8 sm:p-10 shadow-sm">
          <h2 className="text-xs tracking-[0.25em] uppercase font-semibold text-black mb-8 text-center">
            Crear cuenta
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
            {/* Nombre + Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="nombre" className={labelClass}>Nombre</label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  autoComplete="given-name"
                  value={form.nombre}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.nombre)}
                  aria-describedby={errors.nombre ? 'nombre-error' : undefined}
                  className={inputClass(Boolean(errors.nombre))}
                />
                {errors.nombre && (
                  <p id="nombre-error" className="mt-2 text-[11px] tracking-wide text-red-600">
                    {errors.nombre}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="apellido" className={labelClass}>Apellido</label>
                <input
                  id="apellido"
                  name="apellido"
                  type="text"
                  autoComplete="family-name"
                  value={form.apellido}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.apellido)}
                  aria-describedby={errors.apellido ? 'apellido-error' : undefined}
                  className={inputClass(Boolean(errors.apellido))}
                />
                {errors.apellido && (
                  <p id="apellido-error" className="mt-2 text-[11px] tracking-wide text-red-600">
                    {errors.apellido}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className={labelClass}>Email</label>
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
                className={inputClass(Boolean(errors.email))}
              />
              {errors.email && (
                <p id="email-error" className="mt-2 text-[11px] tracking-wide text-red-600">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className={labelClass}>Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : 'password-hint'}
                  placeholder="••••••••"
                  className={`${inputClass(Boolean(errors.password))} pr-16`}
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
              {errors.password ? (
                <p id="password-error" className="mt-2 text-[11px] tracking-wide text-red-600">
                  {errors.password}
                </p>
              ) : (
                <p id="password-hint" className="mt-2 text-[11px] tracking-wide text-[var(--gris-medio)]">
                  Mínimo 8 caracteres e incluí al menos un número.
                </p>
              )}
            </div>

            {/* Confirmar password */}
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                  placeholder="••••••••"
                  className={`${inputClass(Boolean(errors.confirmPassword))} pr-16`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-[10px] tracking-[0.15em] uppercase text-[var(--gris-medio)] hover:text-black transition"
                  aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                >
                  {showConfirm ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirm-error" className="mt-2 text-[11px] tracking-wide text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Términos */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => {
                    setAcceptTerms(e.target.checked);
                    if (errors.terms) {
                      setErrors((prev) => ({ ...prev, terms: undefined }));
                    }
                  }}
                  className="accent-black w-4 h-4 mt-0.5"
                />
                <span className="text-[12px] tracking-wide text-[var(--gris-oscuro)] leading-relaxed">
                  Acepto los{' '}
                  <a href="#" className="underline hover:text-black">términos y condiciones</a>{' '}
                  y la{' '}
                  <a href="#" className="underline hover:text-black">política de privacidad</a>.
                </span>
              </label>
              {errors.terms && (
                <p className="mt-2 text-[11px] tracking-wide text-red-600">
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 text-xs font-bold tracking-[0.2em] uppercase transition hover:bg-[var(--amarillo)] hover:text-black disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white"
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
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

          {/* Link a login */}
          <p className="text-center text-[12px] tracking-wide text-[var(--gris-oscuro)]">
            ¿Ya tenés cuenta?{' '}
            <Link
              href={
                returnTo === '/dashboard'
                  ? '/login'
                  : `/login?returnTo=${encodeURIComponent(returnTo)}`
              }
              className="font-semibold uppercase tracking-[0.15em] text-black border-b border-black hover:text-[var(--gris-medio)] hover:border-[var(--gris-medio)] transition"
            >
              Ingresar
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
