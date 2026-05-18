import Hero from '@/components/Hero';
import ProductGrid from '@/components/ProductGrid';
import { getProductById } from '@/lib/products';

// Productos destacados en el Home (mismos que en el index.html original)
const HOME_FEATURED_IDS = [
  'core-tank-vanilla',
  'high-waist-stone',
  'luna-top-white',
  'airlift-cap-chocolate',
];

export default async function Home() {
  // Buscamos los 4 productos destacados en paralelo. Si alguno no existe
  // (porque la admin lo dio de baja), simplemente lo filtramos.
  const featuredRaw = await Promise.all(
    HOME_FEATURED_IDS.map((id) => getProductById(id))
  );
  const featured = featuredRaw.filter(Boolean);

  return (
    <main>
      <Hero />
      <ProductGrid products={featured} title="SHOP THE CAPSULE" />
    </main>
  );
}
