'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Acciones por fila de la tabla de productos admin.
 * - "Desactivar" hace un soft delete (activo=false) → desaparece del sitio
 *   público pero queda referenciable desde pedidos viejos.
 * - "Activar" vuelve a ponerlo visible.
 *
 * Tras la mutación, llama a router.refresh() para que el server component
 * que renderiza la tabla vuelva a leer de Supabase.
 */
export default function ProductRowActions({ id, activo }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    const next = !activo;
    const confirmar = next
      ? true
      : window.confirm(
          '¿Desactivar este producto? Deja de aparecer en el sitio público.'
        );
    if (!confirmar) return;

    setBusy(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ activo: next })
        .eq('id', id);
      if (error) throw error;
      router.refresh();
    } catch (err) {
      console.error('Error toggling producto:', err);
      alert(err.message || 'No se pudo actualizar el producto.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`admin-link ${activo ? 'danger' : 'success'}`}
    >
      {busy ? '…' : activo ? 'Desactivar' : 'Activar'}
    </button>
  );
}
