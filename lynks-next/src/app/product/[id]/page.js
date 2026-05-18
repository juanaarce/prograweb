import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/ProductDetailClient';
import { getProductById } from '@/lib/products';

// Sacamos generateStaticParams: ahora cada detalle se renderiza on-demand
// para que un cambio de precio o un alta nueva desde admin aparezca al toque.

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getProductById(id);
  return {
    title: product ? `${product.nombre} | LYNKS` : 'Producto | LYNKS',
    description: product?.descripcion,
  };
}

/**
 * /product/[id]
 * Server Component que busca el producto en la BD y delega la UI interactiva
 * al ProductDetailClient.
 */
export default async function ProductDetailPage({ params }) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
