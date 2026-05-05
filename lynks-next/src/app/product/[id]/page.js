import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/ProductDetailClient';
import { getProductById, getProductsArray } from '@/lib/products';

// Pre-genera la página estática para cada producto.
export function generateStaticParams() {
  return getProductsArray().map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = getProductById(id);
  return {
    title: product ? `${product.nombre} | LYNKS` : 'Producto | LYNKS',
    description: product?.descripcion,
  };
}

/**
 * /product/[id]
 * Server Component que busca el producto en el catálogo y delega
 * la UI interactiva al ProductDetailClient.
 */
export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
