import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import SizeModal from '@/components/SizeModal';

export const metadata = {
  title: 'LYNKS | Ropa Deportiva Femenina',
  description:
    'LYNKS — Elevando tu rendimiento con estilo. Ropa deportiva diseñada para la mujer moderna.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            {children}
            <Footer />

            {/* Componentes globales que viven encima del contenido */}
            <CartDrawer />
            <SizeModal />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
