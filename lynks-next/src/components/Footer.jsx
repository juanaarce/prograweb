// Footer es estático: lo dejamos como Server Component (sin 'use client').

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <div className="footer-col">
          <img src="/LOGO.png" alt="LYNKS Logo" className="footer-logo" />
          <p className="footer-description">
            Elevando tu rendimiento con estilo. Ropa deportiva diseñada para la mujer moderna.
          </p>
        </div>

        <div className="footer-col">
          <h4>AYUDA</h4>
          <ul>
            <li><a href="#">Envíos y Entregas</a></li>
            <li><a href="#">Cambios y Devoluciones</a></li>
            <li><a href="#">Guía de Talles</a></li>
            <li><a href="#">Contacto</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>NEWSLETTER</h4>
          <p>Suscribite para recibir novedades y beneficios exclusivos.</p>
          <form
            className="newsletter-wrapper"
            action="#"
            method="post"
          >
            <input
              className="newsletter-input"
              type="email"
              placeholder="Tu email aquí"
              required
            />
            <button className="btn-black" type="submit">UNIRSE</button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 LINKS AR - Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
