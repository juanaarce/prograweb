'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { abrirCarrito, totalItems, isMounted } = useCart();
  const { isAuthenticated, isAdmin, signOut, loading: authLoading } = useAuth();

  const cartCount = isMounted ? totalItems : 0;

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  // Mientras se rehidrata la sesión, mostramos "MI CUENTA" estilo guest
  // para no parpadear entre estados.
  const showAuthed = isMounted && !authLoading && isAuthenticated;

  return (
    <header>
      <nav className="navbar">
        <div className="logo">
          <Link href="/">
            <img src="/LOGO.png" alt="LYNKS Logo" />
          </Link>
        </div>

        <ul className="nav-links">
          <li>
            <Link href="/">INICIO</Link>
          </li>

          <li className="dropdown">
            <ul>
              <Link href="/shop/tops">TOPS</Link>
              <Link href="/shop/bottoms">BOTTOMS</Link>
              <Link href="/shop/gorros">GORROS</Link>

              {showAuthed ? (
                <>
                  <Link href="/dashboard">MI CUENTA</Link>
                  {isAdmin && <Link href="/admin">ADMIN</Link>}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                  >
                    SALIR
                  </a>
                </>
              ) : (
                <Link href="/login">MI CUENTA</Link>
              )}

              <a
                href="#"
                className="carrito-link"
                onClick={(e) => {
                  e.preventDefault();
                  abrirCarrito();
                }}
              >
                CARRITO{isMounted && cartCount > 0 ? ` (${cartCount})` : ''}
              </a>
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  );
}
