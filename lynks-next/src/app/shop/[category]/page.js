import { notFound } from 'next/navigation';
import ProductGrid from '@/components/ProductGrid';
import {
  getProductsByCategory,
  validCategories,
} from '@/lib/products';

// Pre-genera las rutas estáticas para cada categoría conocida.
export function generateStaticParams() {
  return validCategories.map((category) => ({ category }));
}

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

  const productos = getProductsByCategory(category);

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
