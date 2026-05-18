import ProductGrid from '@/components/ProductGrid';
import { getProductsArray } from '@/lib/products';

export const metadata = {
  title: 'SHOP | LYNKS',
};

// /shop  -> muestra todos los productos
export default async function ShopPage() {
  const productos = await getProductsArray();

  return (
    <main>
      <ProductGrid products={productos} title="SHOP THE CAPSULE" />
    </main>
  );
}
