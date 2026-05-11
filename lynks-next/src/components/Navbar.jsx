'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { abrirCarrito, carrito, isMounted } = useCart();

  // El contador del carrito sólo se renderiza después del montaje en el cliente
  // para evitar errores de hidratación (server: 0 vs client: N).
  const cartCount = isMounted ? carrito.length : 0;

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
              <Link href="/login">MI CUENTA</Link>
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
