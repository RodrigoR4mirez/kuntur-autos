import { describe, expect, it } from 'vitest';
import { photoSrcSet, photoVariant } from './photo.ts';

describe('fotos responsivas', () => {
  it('nombra cada versión WebP junto al JPG', () => {
    expect(photoVariant('/ejemplo/ram.jpg', 480)).toBe('/ejemplo/ram-480.webp');
    expect(photoVariant('/ejemplo/ram.JPEG', 960)).toBe('/ejemplo/ram-960.webp');
  });

  it('arma el srcset con todos los anchos', () => {
    expect(photoSrcSet('/a/b.jpg')).toBe(
      '/a/b-480.webp 480w, /a/b-640.webp 640w, /a/b-960.webp 960w, /a/b-1400.webp 1400w',
    );
  });
});
