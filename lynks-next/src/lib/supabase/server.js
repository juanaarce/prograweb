// Cliente de Supabase para Server Components, Route Handlers y Server Actions.
// Lee/escribe la sesión desde las cookies del request.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Si se llama desde un Server Component (no Action),
            // Next.js no permite escribir cookies — el middleware
            // se encarga de mantener la sesión fresca igual.
          }
        },
      },
    }
  );
}
