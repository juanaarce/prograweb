import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api/responses';

/**
 * GET /api/productos
 * Endpoint público: lista los productos activos del catálogo.
 * No requiere autenticación. Admite ?categoria= para filtrar.
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');

    let query = supabase
      .from('products')
      .select('id, nombre, precio, descripcion, imagen, categoria, stock')
      .eq('activo', true)
      .order('created_at', { ascending: true });

    if (categoria && categoria !== 'novedades') {
      query = query.eq('categoria', categoria);
    }

    const { data, error } = await query;
    if (error) {
      return errorResponse(error.message, 500);
    }

    return successResponse(data || []);
  } catch (err) {
    console.error('[GET /api/productos]', err);
    return errorResponse('Error al obtener productos', 500);
  }
}
