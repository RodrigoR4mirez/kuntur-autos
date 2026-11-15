/** Anchos (px) de las versiones WebP que acompañan a cada foto JPG de `public/`. */
export const PHOTO_WIDTHS = [480, 640, 960, 1400] as const;

/** `/ejemplo/x.jpg` → `/ejemplo/x-480.webp`. */
export function photoVariant(src: string, width: number): string {
  return src.replace(/\.jpe?g$/i, `-${width}.webp`);
}

/** Valor de `srcset` con todas las versiones WebP de una foto. */
export function photoSrcSet(src: string): string {
  return PHOTO_WIDTHS.map((w) => `${photoVariant(src, w)} ${w}w`).join(', ');
}
