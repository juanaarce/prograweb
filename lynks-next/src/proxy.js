import { updateSession } from '@/lib/supabase/proxy';

// En Next.js 16, "middleware" se renombró a "proxy".
// Esta función corre antes de cada request y refresca el token de Supabase.
export async function proxy(request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Aplicar a todas las rutas excepto archivos estáticos y assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
