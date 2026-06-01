import { createClient } from '@/lib/supabase/server';
import { successResponse } from '@/lib/api/responses';

/**
 * GET /api/auth/rol
 * Devuelve { rol, autenticado, email } del usuario actual.
 * - Si no hay sesión: { rol: null, autenticado: false }.
 * - Si hay sesión: consulta `profiles.rol` y lo retorna.
 *
 * Como fallback (para sesiones viejas creadas antes de agregar la
 * columna `rol`), si rol viene vacío usamos `is_admin` para inferirlo.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return successResponse({ rol: null, autenticado: false });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, is_admin')
      .eq('id', user.id)
      .maybeSingle();

    const rol =
      profile?.rol ||
      (profile?.is_admin ? 'admin' : 'cliente');

    return successResponse({
      rol,
      autenticado: true,
      email: user.email,
    });
  } catch (err) {
    console.error('[GET /api/auth/rol]', err);
    return successResponse({ rol: null, autenticado: false });
  }
}
