/** Niveles de acceso a un anuncio. Ver docs/01-arquitectura.md. */
export const ACCESS_LEVELS = ['anonymous', 'registered', 'deposit_paid', 'closed'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];
