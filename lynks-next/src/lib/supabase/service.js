// Cliente de Supabase con SERVICE ROLE KEY.
// Solo para usar en endpoints server-side que NO tienen sesión de usuario
// (típicamente: webhooks de servicios externos como Mercado Pago).
//
// La service role key BYPASEA todas las RLS, así que NUNCA debe exponerse al
// cliente. Por eso la variable de entorno es SUPABASE_SERVICE_ROLE_KEY (sin
// el prefijo NEXT_PUBLIC_).
//
// Para todo lo demás (server components, route handlers con usuario logueado)
// seguí usando el cliente de `./server.js`, que respeta las RLS.

import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las env vars.'
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
