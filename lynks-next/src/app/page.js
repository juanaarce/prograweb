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

export default function Home() {
  const featured = HOME_FEATURED_IDS
    .map((id) => getProductById(id))
    .filter(Boolean);

  return (
    <main>
      <Hero />
      <ProductGrid products={featured} title="SHOP THE CAPSULE" />
    </main>
  );
}
