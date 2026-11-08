/**
 * Resultado explícito para errores esperados del negocio.
 * Las excepciones quedan para fallos inesperados (red, base de datos caída, bugs).
 */
export type Result<T, E> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
