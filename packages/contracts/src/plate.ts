import { z } from 'zod';

/** Placa: se acepta con o sin guion y en cualquier caja; se normaliza a 6 caracteres en mayúsculas. */
export const plateSchema = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, '').toUpperCase())
  .pipe(z.string().regex(/^[A-Z0-9]{6}$/, 'La placa debe tener 6 letras o números.'));
