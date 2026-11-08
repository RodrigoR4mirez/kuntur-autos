/** Niveles de acceso a un anuncio, de menor a mayor. Ver docs/01-arquitectura.md. */
export const ACCESS_LEVELS = ['anonymous', 'registered', 'deposit_paid', 'closed'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export function atLeast(level: AccessLevel, minimum: AccessLevel): boolean {
  return ACCESS_LEVELS.indexOf(level) >= ACCESS_LEVELS.indexOf(minimum);
}
