import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sin tipos
import { latestStable } from './pin-action.mjs';

describe('latestStable', () => {
  it('picks the highest semver, not the last or the lexicographic one', () => {
    const out = [
      'aaa\trefs/tags/v1.9.0',
      'bbb\trefs/tags/v1.10.0',
      'ccc\trefs/tags/v2',
      'ddd\trefs/tags/v1.2.0',
    ].join('\n');
    expect(latestStable(out)).toMatchObject({ name: 'v1.10.0', sha: 'bbb' });
  });

  it('uses the commit of an annotated tag (the ^{} line), not the tag object', () => {
    const out = ['tagobj\trefs/tags/v3.0.0', 'commit\trefs/tags/v3.0.0^{}'].join('\n');
    expect(latestStable(out)).toMatchObject({ name: 'v3.0.0', sha: 'commit' });
  });

  it('ignores floating major tags and prereleases', () => {
    const out = ['a\trefs/tags/v4', 'b\trefs/tags/v4.1.0-beta.1', 'c\trefs/tags/v4.0.1'].join('\n');
    expect(latestStable(out)).toMatchObject({ name: 'v4.0.1' });
  });

  it('returns null when there are no stable tags', () => {
    expect(latestStable('a\trefs/tags/v4')).toBeNull();
  });
});
