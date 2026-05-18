'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const STATUSES = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
];

/**
 * Selector de estado de una orden.
 * Hace UPDATE orders SET status=... WHERE id=...; las RLS exigen admin.
 * Después de cada cambio llama router.refresh() para que el detalle
 * (y la lista, si volvés) se vuelva a leer de la DB.
 */
export default function OrderStatusSelect({ orderId, status }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [current, setCurrent] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e) => {
    const next = e.target.value;
    if (next === current) return;

    setError('');
    setSaving(true);
    const prev = current;
    setCurrent(next); // optimistic

    try {
      const { error: upErr } = await supabase
        .from('orders')
        .update({ status: next })
        .eq('id', orderId);
      if (upErr) throw upErr;
      router.refresh();
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setError(err.message || 'No se pudo actualizar el estado.');
      setCurrent(prev);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label className="admin-label">Estado</label>
      <select
        value={current}
        onChange={handleChange}
        disabled={saving}
        className="admin-select"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {error && (
        <p style={{ fontSize: '0.7rem', color: '#b91c1c', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
