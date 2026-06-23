'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * /admin/orders/new
 * Formulario para que el admin registre una orden hecha por fuera del sitio
 * (Instagram, en local, transferencia directa, etc).
 *
 * Carga el listado de productos activos vía GET /api/productos y envía
 * la orden compuesta vía POST /api/admin/orders. El servidor valida que
 * el usuario sea admin y recalcula precios desde la DB.
 */

const TALLES = ['S', 'M', 'L'];

const SHIPPING_METHODS = [
  { id: 'standard', label: 'Standard', price: 5000 },
  { id: 'express', label: 'Express', price: 10000 },
  { id: 'pickup', label: 'Retiro en local', price: 0 },
];

const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'mercado_pago', label: 'Mercado Pago' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'otro', label: 'Otro' },
];

const parsePrecio = (s) => {
  const n = parseInt(String(s).replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

const formatARS = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

export default function NewManualOrderPage() {
  const router = useRouter();

  const [productos, setProductos] = useState([]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  const [shipping, setShipping] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
  });
  const [shippingMethod, setShippingMethod] = useState('pickup');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [marcarComoPagada, setMarcarComoPagada] = useState(true);
  const [decrementarStock, setDecrementarStock] = useState(true);

  const [items, setItems] = useState([]);

  // Selector de items por agregar
  const [pickProductId, setPickProductId] = useState('');
  const [pickTalle, setPickTalle] = useState('M');
  const [pickCantidad, setPickCantidad] = useState(1);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Cargar productos al montar
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/productos');
        const payload = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && payload?.success) {
          setProductos(payload.data || []);
          if (payload.data?.length > 0) {
            setPickProductId(payload.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error cargando productos:', err);
      } finally {
        if (!cancelled) setLoadingProductos(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleShippingChange = (field) => (e) => {
    setShipping((s) => ({ ...s, [field]: e.target.value }));
  };

  const handleAgregarItem = () => {
    if (!pickProductId || !pickTalle) return;
    const cant =
      Number.isInteger(pickCantidad) && pickCantidad > 0 ? pickCantidad : 1;
    setItems((prev) => {
      const idx = prev.findIndex(
        (it) => it.product_id === pickProductId && it.talle === pickTalle
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + cant };
        return next;
      }
      return [
        ...prev,
        { product_id: pickProductId, talle: pickTalle, cantidad: cant },
      ];
    });
    setPickCantidad(1);
  };

  const handleQuitarItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Resumen y total
  const productoById = useMemo(() => {
    const m = new Map();
    for (const p of productos) m.set(p.id, p);
    return m;
  }, [productos]);

  const subtotal = items.reduce((acc, it) => {
    const p = productoById.get(it.product_id);
    if (!p) return acc;
    return acc + parsePrecio(p.precio) * it.cantidad;
  }, 0);
  const envio =
    SHIPPING_METHODS.find((m) => m.id === shippingMethod)?.price || 0;
  const total = subtotal + envio;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas
    const required = [
      'nombre',
      'apellido',
      'email',
      'direccion',
      'ciudad',
      'provincia',
      'codigoPostal',
    ];
    for (const f of required) {
      if (!String(shipping[f] || '').trim()) {
        setError(`Falta completar ${f}.`);
        return;
      }
    }
    if (items.length === 0) {
      setError('Agregá al menos un producto.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipping,
          shippingMethod,
          items,
          metodoPago,
          marcarComoPagada,
          decrementarStock,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'No se pudo crear la orden.');
      }
      router.push(`/admin/orders/${payload.data.orderId}`);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Error al crear la orden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <Link href="/admin/orders" className="admin-link muted">
          ← Volver a órdenes
        </Link>
        <h2
          style={{
            marginTop: '8px',
            fontSize: '0.85rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Nueva orden manual
        </h2>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--gris-medio)',
            marginTop: '6px',
          }}
        >
          Registrá una venta hecha por fuera del sitio (Instagram, en local,
          transferencia directa, etc).
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
        {error && (
          <p
            style={{
              fontSize: '0.75rem',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              backgroundColor: '#fef2f2',
              padding: '10px 12px',
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        {/* ---- Datos del cliente ---- */}
        <section
          style={{
            backgroundColor: 'var(--blanco)',
            border: '1px solid var(--gris-claro)',
            padding: '28px',
            display: 'grid',
            gap: '14px',
          }}
        >
          <h3
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Datos del cliente
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <div>
              <label className="admin-label">Nombre</label>
              <input
                type="text"
                className="admin-input"
                value={shipping.nombre}
                onChange={handleShippingChange('nombre')}
              />
            </div>
            <div>
              <label className="admin-label">Apellido</label>
              <input
                type="text"
                className="admin-input"
                value={shipping.apellido}
                onChange={handleShippingChange('apellido')}
              />
            </div>
            <div>
              <label className="admin-label">Email</label>
              <input
                type="email"
                className="admin-input"
                value={shipping.email}
                onChange={handleShippingChange('email')}
              />
            </div>
            <div>
              <label className="admin-label">Teléfono</label>
              <input
                type="tel"
                className="admin-input"
                value={shipping.telefono}
                onChange={handleShippingChange('telefono')}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="admin-label">Dirección</label>
              <input
                type="text"
                className="admin-input"
                value={shipping.direccion}
                onChange={handleShippingChange('direccion')}
              />
            </div>
            <div>
              <label className="admin-label">Ciudad</label>
              <input
                type="text"
                className="admin-input"
                value={shipping.ciudad}
                onChange={handleShippingChange('ciudad')}
              />
            </div>
            <div>
              <label className="admin-label">Provincia</label>
              <input
                type="text"
                className="admin-input"
                value={shipping.provincia}
                onChange={handleShippingChange('provincia')}
              />
            </div>
            <div>
              <label className="admin-label">Código postal</label>
              <input
                type="text"
                className="admin-input"
                value={shipping.codigoPostal}
                onChange={handleShippingChange('codigoPostal')}
              />
            </div>
          </div>
        </section>

        {/* ---- Items ---- */}
        <section
          style={{
            backgroundColor: 'var(--blanco)',
            border: '1px solid var(--gris-claro)',
            padding: '28px',
            display: 'grid',
            gap: '16px',
          }}
        >
          <h3
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Productos
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 100px 100px auto',
              gap: '12px',
              alignItems: 'end',
            }}
          >
            <div>
              <label className="admin-label">Producto</label>
              <select
                className="admin-select"
                value={pickProductId}
                onChange={(e) => setPickProductId(e.target.value)}
                disabled={loadingProductos}
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {p.precio} (stock: {p.stock ?? 0})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label">Talle</label>
              <select
                className="admin-select"
                value={pickTalle}
                onChange={(e) => setPickTalle(e.target.value)}
              >
                {TALLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label">Cant.</label>
              <input
                type="number"
                min="1"
                step="1"
                className="admin-input"
                value={pickCantidad}
                onChange={(e) =>
                  setPickCantidad(parseInt(e.target.value, 10) || 1)
                }
              />
            </div>
            <button
              type="button"
              className="admin-btn-outline"
              onClick={handleAgregarItem}
              disabled={!pickProductId}
            >
              + Agregar
            </button>
          </div>

          {items.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Talle</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th style={{ textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => {
                  const p = productoById.get(it.product_id);
                  const linea = p
                    ? parsePrecio(p.precio) * it.cantidad
                    : 0;
                  return (
                    <tr key={`${it.product_id}-${it.talle}-${idx}`}>
                      <td>{p?.nombre || it.product_id}</td>
                      <td>{it.talle}</td>
                      <td>{it.cantidad}</td>
                      <td>{formatARS(linea)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="admin-link danger"
                          onClick={() => handleQuitarItem(idx)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ fontSize: '0.75rem', color: 'var(--gris-medio)' }}>
              Todavía no agregaste productos.
            </p>
          )}
        </section>

        {/* ---- Envío y pago ---- */}
        <section
          style={{
            backgroundColor: 'var(--blanco)',
            border: '1px solid var(--gris-claro)',
            padding: '28px',
            display: 'grid',
            gap: '16px',
          }}
        >
          <h3
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Envío y pago
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <div>
              <label className="admin-label">Método de envío</label>
              <select
                className="admin-select"
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
              >
                {SHIPPING_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {formatARS(m.price)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="admin-label">Método de pago</label>
              <select
                className="admin-select"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              id="marcar-pagada"
              type="checkbox"
              checked={marcarComoPagada}
              onChange={(e) => setMarcarComoPagada(e.target.checked)}
            />
            <label
              htmlFor="marcar-pagada"
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Marcar como pagada (status = paid, pagado_en = ahora)
            </label>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <input
              id="dec-stock"
              type="checkbox"
              checked={decrementarStock}
              onChange={(e) => setDecrementarStock(e.target.checked)}
            />
            <label
              htmlFor="dec-stock"
              style={{
                fontSize: '0.7rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Descontar stock automáticamente
            </label>
          </div>
        </section>

        {/* ---- Totales y submit ---- */}
        <section
          style={{
            backgroundColor: 'var(--blanco)',
            border: '1px solid var(--gris-claro)',
            padding: '28px',
            display: 'grid',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
            }}
          >
            <span>Subtotal</span>
            <span>{formatARS(subtotal)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
            }}
          >
            <span>Envío</span>
            <span>{envio === 0 ? 'GRATIS' : formatARS(envio)}</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.95rem',
              fontWeight: 700,
              paddingTop: '8px',
              borderTop: '1px solid var(--gris-claro)',
            }}
          >
            <span>Total</span>
            <span>{formatARS(total)}</span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '8px',
            }}
          >
            <button
              type="submit"
              className="admin-btn"
              disabled={saving || items.length === 0}
            >
              {saving ? 'Creando orden…' : 'Crear orden'}
            </button>
            <Link href="/admin/orders" className="admin-btn-outline">
              Cancelar
            </Link>
          </div>
        </section>
      </form>
    </div>
  );
}
