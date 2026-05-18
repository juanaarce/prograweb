import { notFound } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import {
  getProductsByCategory,
  validCategories,
} from '@/lib/products';

// Sacamos generateStaticParams: ahora la página se renderiza on-demand
// para que los cambios desde el panel admin se vean al toque.

export async function generateMetadata({ params }) {
  const { category } = await params;
  return {
    title: `${category?.toUpperCase() ?? 'SHOP'} | LYNKS`,
  };
}

/**
 * /shop/[category]
 * Server Component que filtra productos por categoría usando el segmento
 * dinámico de URL (tops, bottoms, gorros, novedades).
 */
export default async function CategoryPage({ params }) {
  const { category } = await params;

  if (!validCategories.includes(category)) {
    notFound();
  }

  const productos = await getProductsByCategory(category);

  const titulo =
    category === 'novedades'
      ? 'NOVEDADES'
      : category.toUpperCase();

  return (
    <main>
      <ProductGrid products={productos} title={titulo} />
    </main>
  );
}
