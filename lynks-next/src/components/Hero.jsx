import Link from 'next/link';

// Hero estático: no necesita 'use client'.
export default function Hero() {
  return (
    <section className="hero-new">
      <div className="hero-img-large">
        <img src="/hero1.jpg" alt="Hero principal LYNKS" />
      </div>

      <div className="hero-center">
        <div className="text-top">
          <h1 className="hero-title">THE HALO CAPSULE</h1>
          <span className="hero-subtitle">NEW DROP</span>
        </div>
        <img src="/hero2.jpg" className="img-middle" alt="LYNKS capsule" />
      </div>

      <div className="hero-right">
        <img src="/hero3.jpg" className="img-small" alt="LYNKS detalle" />
        <div className="text-bottom">
          <p className="text-bottom">For warm days and clear skies.</p>
          <Link href="/shop/novedades" className="ver-novedades">
            VER NOVEDADES
          </Link>
        </div>
      </div>
    </section>
  );
}
