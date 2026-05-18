'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const CATEGORIAS = ['tops', 'bottoms', 'gorros'];

// "$45.000" o "45.000" o "45000" → 45000
function parsePrecio(input) {
  if (typeof input === 'number') return Math.max(0, Math.floor(input));
  const n = parseInt(String(input).replace(/\D/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// "  Top Cardio  " → "top-cardio"
function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * ProductForm
 * - Si recibe `initialProduct` con id → modo EDIT (UPDATE en products).
 * - Si no → modo NEW (INSERT en products).
 * Usa el cliente browser de Supabase; las RLS exigen que el user sea admin.
 *
 * El precio se guarda como int en la DB (`45000`) pero la UI lo muestra como
 * "$45.000". Acá aceptamos cualquiera de las dos formas en el input.
 */
export default function ProductForm({ initialProduct }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const isEdit = Boolean(initialProduct?.id);

  const [form, setForm] = useState({
    id: initialProduct?.id || '',
    nombre: initialProduct?.nombre || '',
    precio: initialProduct?.precio
      ? String(parsePrecio(initialProduct.precio))
      : '',
    descripcion: initialProduct?.descripcion || '',
    imagen: initialProduct?.imagen || '',
    categoria: initialProduct?.categoria || 'tops',
    activo:
      initialProduct?.activo === undefined ? true : Boolean(initialProduct.activo),
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleNombreBlur = () => {
    if (!isEdit && !form.id && form.nombre) {
      setForm((f) => ({ ...f, id: slugify(f.nombre) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const id = isEdit ? initialProduct.id : slugify(form.id || form.nombre);
    const precio = parsePrecio(form.precio);

    if (!id) return setError('Falta el slug (id) del producto.');
    if (!form.nombre.trim()) return setError('Falta el nombre.');
    if (precio <= 0) return setError('El precio debe ser mayor a 0.');
    if (!form.imagen.trim()) return setError('Falta la URL de la imagen.');
    if (!CATEGORIAS.includes(form.categoria))
      return setError('Categoría inválida.');

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        precio,
        descripcion: form.descripcion.trim() || null,
        imagen: form.imagen.trim(),
        categoria: form.categoria,
        activo: form.activo,
      };

      if (isEdit) {
        const { error: upErr } = await supabase
          .from('products')
          .update(payload)
          .eq('id', id);
        if (upErr) throw upErr;
      } else {
        const { error: insErr } = await supabase
          .from('products')
          .insert({ id, ...payload });
        if (insErr) throw insErr;
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      console.error('Error guardando producto:', err);
      setError(err.message || 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="admin-card-form"
      style={{ display: 'grid', gap: '20px' }}
    >
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

      <div>
        <label className="admin-label">Slug (id)</label>
        <input
          type="text"
          value={form.id}
          onChange={handleChange('id')}
          disabled={isEdit}
          placeholder="top-cardio"
          className="admin-input"
        />
        <p
          style={{
            fontSize: '0.65rem',
            color: 'var(--gris-medio)',
            marginTop: '4px',
          }}
        >
          {isEdit
            ? 'El slug no se puede cambiar (preserva referencias en carritos y pedidos).'
            : 'Se autocompleta a partir del nombre.'}
        </p>
      </div>

      <div>
        <label className="admin-label">Nombre</label>
        <input
          type="text"
          value={form.nombre}
          onChange={handleChange('nombre')}
          onBlur={handleNombreBlur}
          className="admin-input"
        />
      </div>

      <div>
        <label className="admin-label">Precio (en pesos, sin puntos)</label>
        <input
          type="number"
          min="0"
          step="100"
          value={form.precio}
          onChange={handleChange('precio')}
          placeholder="45000"
          className="admin-input"
        />
        <p
          style={{
            fontSize: '0.65rem',
            color: 'var(--gris-medio)',
            marginTop: '4px',
          }}
        >
          Se muestra como{' '}
          {form.precio
            ? `$${Number(parsePrecio(form.precio)).toLocaleString('es-AR')}`
            : '$0'}
          .
        </p>
      </div>

      <div>
        <label className="admin-label">Categoría</label>
        <select
          value={form.categoria}
          onChange={handleChange('categoria')}
          className="admin-select"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="admin-label">Imagen (URL)</label>
        <input
          type="text"
          value={form.imagen}
          onChange={handleChange('imagen')}
          placeholder="/img/top-1.jpg"
          className="admin-input"
        />
        {form.imagen && (
          <div style={{ marginTop: '12px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.imagen}
              alt="preview"
              style={{
                width: '128px',
                height: '160px',
                objectFit: 'cover',
                border: '1px solid var(--gris-claro)',
                display: 'block',
              }}
            />
          </div>
        )}
      </div>

      <div>
        <label className="admin-label">Descripción</label>
        <textarea
          value={form.descripcion}
          onChange={handleChange('descripcion')}
          rows={3}
          className="admin-textarea"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          id="activo"
          type="checkbox"
          checked={form.activo}
          onChange={handleChange('activo')}
        />
        <label
          htmlFor="activo"
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Activo (visible en el sitio)
        </label>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '8px',
        }}
      >
        <button type="submit" disabled={saving} className="admin-btn">
          {saving
            ? 'Guardando…'
            : isEdit
            ? 'Guardar cambios'
            : 'Crear producto'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="admin-btn-outline"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
