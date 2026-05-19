import { createClient } from '@/lib/supabase/server';
import { errorResponse } from './responses';

/**
 * Trae el usuario autenticado del request (vía cookies).
 * Si no hay sesión, devuelve un Response 401 listo para retornar.
 *
 * Uso típico en route handlers:
 *
 *   const { user, supabase, error } = await getApiUser();
 *   if (error) return error;
 *   // ... usar user.id, supabase, etc.
 */
export async function getApiUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return {
      user: null,
      supabase,
      error: errorResponse('No autenticado', 401, 'UNAUTHORIZED'),
    };
  }
  return { user, supabase, error: null };
}
