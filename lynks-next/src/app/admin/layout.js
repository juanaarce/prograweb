import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Layout protegido para /admin/*
 * - Corre en el servidor: verifica la sesión y el flag is_admin.
 * - Si no hay user → /login.
 * - Si hay user pero NO es admin → /.
 * - Si pasa el chequeo, renderiza la sub-nav admin (estilo barra continua
 *   debajo del navbar principal) + el children.
 *
 * Importante: NO usamos <header> acá adentro porque globals.css aplica
 * `position: sticky` a todo <header>, lo que hacía que la sub-nav admin
 * quedara pegada arriba del navbar principal y se superpusieran.
 */
export default async function AdminLayout({ children }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    redirect('/');
  }

  return (
    <div className="admin-section">
      <div className="admin-subnav">
        <div className="admin-subnav-inner">
          <div>
            <p className="admin-subnav-label">Panel de administración</p>
            <h1 className="admin-subnav-title">Admin</h1>
          </div>
          <ul className="admin-subnav-links">
            <li>
              <Link href="/admin">Inicio</Link>
            </li>
            <li>
              <Link href="/admin/products">Productos</Link>
            </li>
            <li>
              <Link href="/admin/orders">Órdenes</Link>
            </li>
            <li>
              <Link href="/" className="back-link">
                ← Volver al sitio
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="admin-content">{children}</div>
    </div>
  );
}
