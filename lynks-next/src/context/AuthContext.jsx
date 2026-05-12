'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext(null);

/**
 * AuthProvider
 * Expone:
 *  - user: el usuario actual (o null si no hay sesión)
 *  - session: la sesión completa (o null)
 *  - loading: true mientras intentamos rehidratar la sesión inicial
 *  - signIn(email, password)
 *  - signUp({ email, password, nombre, apellido })
 *  - signOut()
 *
 * El listener onAuthStateChange mantiene el estado sincronizado
 * con cualquier cambio (login, logout, refresh, token expirado, etc).
 */
export function AuthProvider({ children }) {
  // Creamos el cliente una sola vez por mount.
  const supabase = useMemo(() => createClient(), []);

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 1) Rehidratar sesión inicial.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // 2) Escuchar cambios futuros.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // --- Acciones ---
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async ({ email, password, nombre, apellido }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { nombre, apellido },
        emailRedirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/login`
            : undefined,
      },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated: Boolean(user),
    signIn,
    signUp,
    signOut,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
