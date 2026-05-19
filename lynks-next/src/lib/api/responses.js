/**
 * Helpers para construir respuestas consistentes desde las API Routes.
 * Mantenemos un formato { success, data } para éxito y
 * { success: false, error, code? } para errores, usando códigos HTTP estándar.
 */

export function successResponse(data, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export function errorResponse(error, status = 500, code) {
  const body = { success: false, error };
  if (code) body.code = code;
  return Response.json(body, { status });
}
