// Helpers de catálogo de productos LYNKS.
// Antes era un objeto en memoria; ahora lee de la tabla `products` en Supabase.
// Mantenemos los nombres de funciones para no romper a los consumers,
// pero todas son ahora ASÍNCRONAS — usalas con `await` desde Server Components.

import { createClient } from '@/lib/supabase/server';

// Cuando supabase-js devuelve un error de red, `error.message` suele ser
// "TypeError: fetch failed" (genérico). La causa real (DNS, timeout, proyecto
// pausado) vive en `error.cause`. Este helper deja ambas cosas en consola
// para poder diagnosticar sin tener que adivinar.
function logSupabaseError(tag, error) {
  console.error(`[products] ${tag} error:`, error?.message);
  if (error?.cause) {
    console.error(`[products] ${tag} cause:`, error.cause);
  }
}

/**
 * Formatea un precio entero (en pesos) al formato "$45.000" usado en toda la UI.
 * La función `parsePrecio` del CartContext hace el camino inverso.
 */
function formatPrecio(precio) {
  return `$${Number(precio).toLocaleString('es-AR')}`;
}

/**
 * Convierte una fila cruda de Supabase al shape que esperan los componentes
 * (precio como string con "$", id/imagen/categoria tal cual).
 */
function rowToProduct(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    precio: formatPrecio(row.precio),
    descripcion: row.descripcion || '',
    imagen: row.imagen,
    categoria: row.categoria,
    stock: Number(row.stock ?? 0),
  };
}

/**
 * Devuelve todos los productos activos, en orden de creación (más viejo primero).
 */
export async function getProductsArray() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: true });

  if (error) {
    logSupabaseError('getProductsArray', error);
    return [];
  }
  return (data || []).map(rowToProduct);
}

/**
 * Busca un producto por id (slug). Devuelve null si no existe o está inactivo.
 */
export async function getProductById(id) {
  if (!id) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('activo', true)
    .maybeSingle();

  if (error) {
    logSupabaseError('getProductById', error);
    return null;
  }
  if (!data) return null;
  return rowToProduct(data);
}

/**
 * Devuelve productos de una categoría. "novedades" se trata como "todos".
 */
export async function getProductsByCategory(categoria) {
  if (!categoria || categoria === 'novedades') {
    return getProductsArray();
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('activo', true)
    .eq('categoria', categoria)
    .order('created_at', { ascending: true });

  if (error) {
    logSupabaseError('getProductsByCategory', error);
    return [];
  }
  return (data || []).map(rowToProduct);
}

// Lista de categorías válidas para la ruta dinámica /shop/[category].
// Se mantiene hardcodeada porque el constraint de la BD también las restringe a estas tres.
export const validCategories = ['tops', 'bottoms', 'gorros', 'novedades'];
