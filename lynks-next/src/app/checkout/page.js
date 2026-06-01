'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

/**
 * Checkout
 * - Resumen del carrito agrupado por producto+talle (con cantidades).
 * - Form de envío con validación.
 * - Método de envío (Standard / Express / Retiro).
 * - Form de facturación, con opción de usar la misma dirección de envío.
 * - Breakdown de costos: subtotal, envío, IVA (incluido), total.
 * - Al confirmar, inserta `orders` + `order_items` en Supabase y
 *   redirige a /checkout/success?order_id=xxx
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SHIPPING_METHODS = [
  {
    id: 'standard',
    label: 'Standard',
    eta: '5–7 días hábiles',
    price: 5000,
  },
  {
    id: 'express',
    label: 'Express',
    eta: '1–2 días hábiles',
    price: 12000,
  },
  {
    id: 'pickup',
    label: 'Retiro en local',
    eta: 'Listo en 24hs',
    price: 0,
  },
];

const EMPTY_ADDRESS = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigoPostal: '',
};

// Pretty currency en pesos argentinos
const formatARS = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

// Parsea "$45.000" → 45000
const parsePrecio = (s) => {
  const num = parseInt(String(s).replace(/\D/g, ''), 10);
  return Number.isFinite(num) ? num : 0;
};

// ---- Helpers de UI (constantes a nivel de módulo) ----
// IMPORTANTE: estas funciones y el componente AddressForm viven fuera
// de CheckoutPage. Si los definís adentro, React los recrea en cada render
// y los inputs pierden el foco después de cada tecla.
const labelClass =
  'block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2 text-black';

const inputClass = (hasError) =>
  `w-full bg-white border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-black ${
    hasError ? 'border-red-400' : 'border-[var(--gris-claro)]'
  }`;

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="mt-1 text-[11px] tracking-wide text-red-600">{msg}</p>;
}

function AddressForm({ target, value, errors, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div>
        <label className={labelClass} htmlFor={`${target}-nombre`}>Nombre</label>
        <input
          id={`${target}-nombre`}
          data-field={`${target}.nombre`}
          type="text"
          autoComplete="given-name"
          value={value.nombre}
          onChange={(e) => onChange('nombre', e.target.value)}
          className={inputClass(Boolean(errors[`${target}.nombre`]))}
        />
        <FieldError msg={errors[`${target}.nombre`]} />
      </div>

      <div>
        <label className={labelClass} htmlFor={`${target}-apellido`}>Apellido</label>
        <input
          id={`${target}-apellido`}
          data-field={`${target}.apellido`}
          type="text"
          autoComplete="family-name"
          value={value.apellido}
          onChange={(e) => onChange('apellido', e.target.value)}
          className={inputClass(Boolean(errors[`${target}.apellido`]))}
        />
        <FieldError msg={errors[`${target}.apellido`]} />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={`${target}-email`}>Email</label>
        <input
          id={`${target}-email`}
          data-field={`${target}.email`}
          type="email"
          autoComplete="email"
          value={value.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="tu@email.com"
          className={inputClass(Boolean(errors[`${target}.email`]))}
        />
        <FieldError msg={errors[`${target}.email`]} />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={`${target}-telefono`}>
          Teléfono <span className="text-[var(--gris-medio)] normal-case tracking-normal">(opcional)</span>
        </label>
        <input
          id={`${target}-telefono`}
          type="tel"
          autoComplete="tel"
          value={value.telefono}
          onChange={(e) => onChange('telefono', e.target.value)}
          placeholder="+54 11 ..."
          className={inputClass(false)}
        />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={`${target}-direccion`}>Dirección</label>
        <input
          id={`${target}-direccion`}
          data-field={`${target}.direccion`}
          type="text"
          autoComplete="street-address"
          value={value.direccion}
          onChange={(e) => onChange('direccion', e.target.value)}
          placeholder="Av. ejemplo 1234, depto B"
          className={inputClass(Boolean(errors[`${target}.direccion`]))}
        />
        <FieldError msg={errors[`${target}.direccion`]} />
      </div>

      <div>
        <label className={labelClass} htmlFor={`${target}-ciudad`}>Ciudad</label>
        <input
          id={`${target}-ciudad`}
          data-field={`${target}.ciudad`}
          type="text"
          autoComplete="address-level2"
          value={value.ciudad}
          onChange={(e) => onChange('ciudad', e.target.value)}
          className={inputClass(Boolean(errors[`${target}.ciudad`]))}
        />
        <FieldError msg={errors[`${target}.ciudad`]} />
      </div>

      <div>
        <label className={labelClass} htmlFor={`${target}-provincia`}>Provincia</label>
        <input
          id={`${target}-provincia`}
          data-field={`${target}.provincia`}
          type="text"
          autoComplete="address-level1"
          value={value.provincia}
          onChange={(e) => onChange('provincia', e.target.value)}
          placeholder="Buenos Aires"
          className={inputClass(Boolean(errors[`${target}.provincia`]))}
        />
        <FieldError msg={errors[`${target}.provincia`]} />
      </div>

      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor={`${target}-cp`}>Código postal</label>
        <input
          id={`${target}-cp`}
          data-field={`${target}.codigoPostal`}
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          value={value.codigoPostal}
          onChange={(e) => onChange('codigoPostal', e.target.value)}
          className={inputClass(Boolean(errors[`${target}.codigoPostal`]))}
        />
        <FieldError msg={errors[`${target}.codigoPostal`]} />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { carrito, isMounted, vaciarCarrito } = useCart();
  const { user, loading: authLoading } = useAuth();

  const [shipping, setShipping] = useState(EMPTY_ADDRESS);
  const [billing, setBilling] = useState(EMPTY_ADDRESS);
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [shippingMethodId, setShippingMethodId] = useState('standard');

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Prefill del email con el usuario logueado.
  useEffect(() => {
    if (user?.email && !shipping.email) {
      setShipping((prev) => ({
        ...prev,
        email: user.email,
        nombre: user.user_metadata?.nombre || prev.nombre,
        apellido: user.user_metadata?.apellido || prev.apellido,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // El CartContext ya entrega cada línea con su `cantidad`.
  // Acá sólo derivamos `precioUnit` numérico para los cálculos.
  const lineas = useMemo(
    () =>
      carrito.map((item) => ({
        key: `${item.id}__${item.talle}`,
        id: item.id,
        nombre: item.nombre,
        imagen: item.imagen,
        talle: item.talle,
        precioUnit: parsePrecio(item.precio),
        cantidad: item.cantidad,
      })),
    [carrito]
  );

  // Cálculos económicos
  const subtotal = lineas.reduce(
    (acc, l) => acc + l.precioUnit * l.cantidad,
    0
  );
  const metodo =
    SHIPPING_METHODS.find((m) => m.id === shippingMethodId) ?? SHIPPING_METHODS[0];
  const envio = metodo.price;
  // IVA está incluido en los precios mostrados (estándar AR).
  const ivaIncluido = Math.round((subtotal / 1.21) * 0.21);
  const total = subtotal + envio;

  // ---- Empty state ----
  if (isMounted && lineas.length === 0) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4 py-20 bg-[var(--crema)]">
        <div className="max-w-md text-center">
          <h1
            className="text-3xl tracking-[0.3em] mb-4"
            style={{ fontFamily: "'Times New Roman', serif" }}
          >
            CHECKOUT
          </h1>
          <p className="text-sm tracking-wide text-[var(--gris-oscuro)] mb-8">
            Tu carrito está vacío. Sumá algo antes de continuar.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-black text-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-[var(--amarillo)] hover:text-black transition"
          >
            Ir a la tienda
          </Link>
        </div>
      </main>
    );
  }

  // ---- Handlers ----
  const updateField = (target, field, value) => {
    const setter = target === 'shipping' ? setShipping : setBilling;
    setter((prev) => ({ ...prev, [field]: value }));
    if (errors[`${target}.${field}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`${target}.${field}`];
        return next;
      });
    }
    if (serverError) setServerError('');
  };

  const validateAddress = (addr, prefix) => {
    const errs = {};
    if (!addr.nombre.trim()) errs[`${prefix}.nombre`] = 'Requerido';
    if (!addr.apellido.trim()) errs[`${prefix}.apellido`] = 'Requerido';
    if (!addr.email.trim()) {
      errs[`${prefix}.email`] = 'Requerido';
    } else if (!EMAIL_REGEX.test(addr.email.trim())) {
      errs[`${prefix}.email`] = 'Email inválido';
    }
    if (!addr.direccion.trim()) errs[`${prefix}.direccion`] = 'Requerido';
    if (!addr.ciudad.trim()) errs[`${prefix}.ciudad`] = 'Requerido';
    if (!addr.provincia.trim()) errs[`${prefix}.provincia`] = 'Requerido';
    if (!addr.codigoPostal.trim()) {
      errs[`${prefix}.codigoPostal`] = 'Requerido';
    } else if (!/^[0-9A-Za-z]{3,10}$/.test(addr.codigoPostal.trim())) {
      errs[`${prefix}.codigoPostal`] = 'CP inválido';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // 1) Requiere sesión iniciada (las RLS exigen user_id = auth.uid())
    if (!user) {
      setServerError(
        'Necesitás iniciar sesión para finalizar la compra.'
      );
      return;
    }

    const shippingErrs = validateAddress(shipping, 'shipping');
    const billingErrs = useSameAddress
      ? {}
      : validateAddress(billing, 'billing');
    const allErrors = { ...shippingErrs, ...billingErrs };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // Scroll al primer error
      const firstErrorKey = Object.keys(allErrors)[0];
      const node = document.querySelector(`[data-field="${firstErrorKey}"]`);
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);

    try {
      // 2) Llamar a la API route. Toda la lógica de negocio (validación de
      //    stock, cálculo de total, inserción de orders + order_items y
      //    decremento de stock) corre server-side. El cliente sólo manda
      //    los datos de envío y el método elegido.
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingMethod: shippingMethodId,
          shipping: {
            nombre: shipping.nombre.trim(),
            apellido: shipping.apellido.trim(),
            email: shipping.email.trim(),
            telefono: shipping.telefono.trim(),
            direccion: shipping.direccion.trim(),
            ciudad: shipping.ciudad.trim(),
            provincia: shipping.provincia.trim(),
            codigoPostal: shipping.codigoPostal.trim(),
          },
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.success) {
        throw new Error(
          payload?.error || 'No pudimos crear tu pedido. Probá de nuevo.'
        );
      }

      // 3) Vaciar carrito local y mandar a la página de procesar pago.
      //    El paso de "success" queda para después del pago real (Semana 13).
      vaciarCarrito();
      router.push(`/checkout/pago/${payload.data.orderId}`);
    } catch (err) {
      setServerError(err.message || 'Error al procesar la compra.');
      setLoading(false);
    }
  };

  // AddressForm vive a nivel de módulo (arriba del archivo) para no
  // perder el foco de los inputs al re-renderizar la página.

  return (
    <main className="bg-[var(--crema)] min-h-screen px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="mb-10 text-center">
          <h1
            className="text-3xl sm:text-4xl tracking-[0.3em] mb-2"
            style={{ fontFamily: "'Times New Roman', serif" }}
          >
            CHECKOUT
          </h1>
          <p className="text-[11px] tracking-[0.25em] uppercase text-[var(--gris-medio)]">
            Finalizá tu compra
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12"
        >
          {/* ---------- IZQUIERDA: forms ---------- */}
          <div className="lg:col-span-2 space-y-10">
            {/* Sesión requerida */}
            {!authLoading && !user && (
              <div
                role="alert"
                className="bg-[var(--blanco)] border border-[var(--gris-claro)] border-l-4 border-l-[var(--amarillo)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5 sm:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[var(--gris-medio)]">
                    Sesión requerida
                  </p>
                  <p className="text-sm tracking-wide text-[var(--gris-oscuro)]">
                    Necesitás iniciar sesión para finalizar tu compra.
                  </p>
                </div>
                <Link
                  href="/login?returnTo=/checkout"
                  className="inline-block bg-black text-white px-7 py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-[var(--amarillo)] hover:text-black transition text-center whitespace-nowrap"
                >
                  Iniciar sesión
                </Link>
              </div>
            )}

            {/* Error general */}
            {serverError && (
              <div
                role="alert"
                className="border border-red-300 bg-red-50 px-4 py-3 text-[12px] tracking-wide text-red-700"
              >
                {serverError}
              </div>
            )}

            {/* Sección: Envío */}
            <section className="bg-[var(--blanco)] border border-[var(--gris-claro)] p-6 sm:p-8">
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase mb-6">
                Datos de envío
              </h2>
              <AddressForm
                target="shipping"
                value={shipping}
                errors={errors}
                onChange={(field, value) => updateField('shipping', field, value)}
              />
            </section>

            {/* Sección: Método de envío */}
            <section className="bg-[var(--blanco)] border border-[var(--gris-claro)] p-6 sm:p-8">
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase mb-6">
                Método de envío
              </h2>
              <div className="space-y-3">
                {SHIPPING_METHODS.map((m) => {
                  const selected = shippingMethodId === m.id;
                  return (
                    <label
                      key={m.id}
                      className={`flex items-center justify-between gap-4 border px-4 py-4 cursor-pointer transition ${
                        selected
                          ? 'border-black bg-white'
                          : 'border-[var(--gris-claro)] bg-white hover:border-black'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="radio"
                          name="shippingMethod"
                          value={m.id}
                          checked={selected}
                          onChange={() => setShippingMethodId(m.id)}
                          className="accent-black"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold tracking-[0.15em] uppercase">
                            {m.label}
                          </p>
                          <p className="text-[11px] text-[var(--gris-medio)] tracking-wide">
                            {m.eta}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold whitespace-nowrap">
                        {m.price === 0 ? 'GRATIS' : formatARS(m.price)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            {/* Sección: Facturación */}
            <section className="bg-[var(--blanco)] border border-[var(--gris-claro)] p-6 sm:p-8">
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase mb-6">
                Datos de facturación
              </h2>

              <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={useSameAddress}
                  onChange={(e) => setUseSameAddress(e.target.checked)}
                  className="accent-black w-4 h-4"
                />
                <span className="text-[12px] tracking-wide text-[var(--gris-oscuro)]">
                  Usar la misma dirección de envío para la facturación
                </span>
              </label>

              {!useSameAddress && (
                <AddressForm
                  target="billing"
                  value={billing}
                  errors={errors}
                  onChange={(field, value) => updateField('billing', field, value)}
                />
              )}
            </section>
          </div>

          {/* ---------- DERECHA: order summary ---------- */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-28 bg-[var(--blanco)] border border-[var(--gris-claro)] p-6 sm:p-8">
              <h2 className="text-xs font-semibold tracking-[0.25em] uppercase mb-6">
                Tu pedido
              </h2>

              {/* Items */}
              <ul className="divide-y divide-[var(--gris-claro)]">
                {lineas.map((l) => (
                  <li key={l.key} className="flex gap-4 py-4">
                    <div className="relative w-16 h-20 flex-shrink-0 bg-gray-100">
                      <img
                        src={l.imagen}
                        alt={l.nombre}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-black text-white text-[10px] flex items-center justify-center rounded-full">
                        {l.cantidad}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold tracking-[0.1em] uppercase truncate">
                        {l.nombre}
                      </p>
                      <p className="text-[11px] text-[var(--gris-medio)] tracking-wide">
                        TALLE: {l.talle}
                      </p>
                      <p className="text-[11px] text-[var(--gris-medio)] tracking-wide">
                        {formatARS(l.precioUnit)} c/u
                      </p>
                    </div>
                    <p className="text-[12px] font-semibold whitespace-nowrap">
                      {formatARS(l.precioUnit * l.cantidad)}
                    </p>
                  </li>
                ))}
              </ul>

              {/* Costos */}
              <div className="mt-4 pt-4 border-t border-[var(--gris-claro)] space-y-2 text-[12px] tracking-wide">
                <div className="flex justify-between">
                  <span className="text-[var(--gris-oscuro)]">Subtotal</span>
                  <span>{formatARS(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--gris-oscuro)]">Envío</span>
                  <span>{envio === 0 ? 'GRATIS' : formatARS(envio)}</span>
                </div>
                <div className="flex justify-between text-[var(--gris-medio)]">
                  <span>IVA 21% (incluido)</span>
                  <span>{formatARS(ivaIncluido)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--gris-claro)] flex justify-between text-sm font-bold tracking-[0.1em] uppercase">
                <span>Total</span>
                <span>{formatARS(total)}</span>
              </div>

              <button
                type="submit"
                disabled={loading || authLoading || !user}
                className="mt-6 w-full bg-black text-white py-4 text-xs font-bold tracking-[0.2em] uppercase transition hover:bg-[var(--amarillo)] hover:text-black disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white"
              >
                {loading
                  ? 'Procesando…'
                  : !user
                  ? 'Iniciá sesión para comprar'
                  : 'Completar compra'}
              </button>

              <p className="mt-4 text-center text-[10px] tracking-[0.15em] uppercase text-[var(--gris-medio)]">
                Pago seguro · Encriptado
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
