'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * ProfileEditor
 * Permite al usuario logueado editar SUS PROPIOS datos:
 *   - Nombre y apellido (user_metadata)
 *   - Contraseña (con re-autenticación previa)
 *
 * Seguridad: el cliente de Supabase usa el JWT de la sesión actual; la API
 * de auth.updateUser sólo actualiza al usuario autenticado. No hay forma
 * de que un usuario edite datos de otro desde acá.
 */
export default function ProfileEditor() {
  const { user, supabase } = useAuth();

  // ----- Nombre / apellido -----
  const [nombre, setNombre] = useState(user?.user_metadata?.nombre || '');
  const [apellido, setApellido] = useState(user?.user_metadata?.apellido || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState({ type: '', text: '' });

  const handleSaveName = async (e) => {
    e.preventDefault();
    setNameMsg({ type: '', text: '' });

    if (!nombre.trim()) {
      setNameMsg({ type: 'error', text: 'El nombre no puede estar vacío.' });
      return;
    }

    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { nombre: nombre.trim(), apellido: apellido.trim() },
      });
      if (error) throw error;
      setNameMsg({ type: 'success', text: 'Datos actualizados.' });
    } catch (err) {
      console.error('Error guardando datos:', err);
      setNameMsg({
        type: 'error',
        text: err.message || 'No se pudieron guardar los datos.',
      });
    } finally {
      setSavingName(false);
    }
  };

  // ----- Contraseña -----
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });

    if (!currentPass) {
      setPassMsg({ type: 'error', text: 'Ingresá tu contraseña actual.' });
      return;
    }
    if (newPass.length < 6) {
      setPassMsg({
        type: 'error',
        text: 'La nueva contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    setSavingPass(true);
    try {
      // 1) Re-autenticamos para verificar la contraseña actual.
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPass,
      });
      if (signErr) {
        throw new Error('La contraseña actual es incorrecta.');
      }

      // 2) Si pasó, actualizamos la contraseña.
      const { error: upErr } = await supabase.auth.updateUser({
        password: newPass,
      });
      if (upErr) throw upErr;

      setPassMsg({ type: 'success', text: 'Contraseña actualizada.' });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      console.error('Error cambiando contraseña:', err);
      setPassMsg({
        type: 'error',
        text: err.message || 'No se pudo cambiar la contraseña.',
      });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <section className="mt-8 bg-[var(--blanco)] border border-[var(--gris-claro)] p-6 sm:p-10 space-y-10">
      <h2 className="text-xs font-semibold tracking-[0.25em] uppercase">
        Editar datos
      </h2>

      {/* ----- Nombre / apellido ----- */}
      <form onSubmit={handleSaveName} className="space-y-4">
        <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--gris-medio)]">
          Nombre
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--gris-medio)] mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-[var(--gris-claro)] px-3 py-2 text-sm tracking-wide bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--gris-medio)] mb-2">
              Apellido
            </label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="w-full border border-[var(--gris-claro)] px-3 py-2 text-sm tracking-wide bg-white"
            />
          </div>
        </div>

        {nameMsg.text && (
          <p
            className={`text-[12px] tracking-wide px-3 py-2 ${
              nameMsg.type === 'success'
                ? 'text-green-700 border border-green-300 bg-green-50'
                : 'text-red-700 border border-red-300 bg-red-50'
            }`}
          >
            {nameMsg.text}
          </p>
        )}

        <button type="submit" disabled={savingName} className="admin-btn">
          {savingName ? 'Guardando…' : 'Guardar nombre'}
        </button>
      </form>

      <hr className="border-[var(--gris-claro)]" />

      {/* ----- Contraseña ----- */}
      <form onSubmit={handleChangePassword} className="space-y-4">
        <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--gris-medio)]">
          Cambiar contraseña
        </h3>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--gris-medio)] mb-2">
            Contraseña actual
          </label>
          <input
            type="password"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            autoComplete="current-password"
            className="w-full border border-[var(--gris-claro)] px-3 py-2 text-sm tracking-wide bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--gris-medio)] mb-2">
              Nueva contraseña
            </label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-[var(--gris-claro)] px-3 py-2 text-sm tracking-wide bg-white"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-[var(--gris-medio)] mb-2">
              Repetir nueva contraseña
            </label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-[var(--gris-claro)] px-3 py-2 text-sm tracking-wide bg-white"
            />
          </div>
        </div>

        {passMsg.text && (
          <p
            className={`text-[12px] tracking-wide px-3 py-2 ${
              passMsg.type === 'success'
                ? 'text-green-700 border border-green-300 bg-green-50'
                : 'text-red-700 border border-red-300 bg-red-50'
            }`}
          >
            {passMsg.text}
          </p>
        )}

        <button type="submit" disabled={savingPass} className="admin-btn">
          {savingPass ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
      </form>
    </section>
  );
}
