import { describe, expect, it } from 'vitest';
import { clean, ValidationError } from './validate';

describe('input validation', () => {
  it('rejects an empty title and unknown statuses', () => {
    expect(() => clean({ title: '   ' }, [])).toThrow(ValidationError);
    expect(() => clean({ status: 'Nope' }, [])).toThrow(ValidationError);
  });

  it('only accepts known authors and at least one of them', () => {
    expect(clean({ authors: ['a', 'ghost'] }, ['a']).authors).toEqual(['a']);
    expect(() => clean({ authors: ['ghost'] }, ['a'])).toThrow(ValidationError);
  });

  it('only accepts http(s) or site-relative cover images', () => {
    expect(clean({ cover: '/uploads/x.webp' }, []).cover).toBe('/uploads/x.webp');
    expect(() => clean({ cover: 'javascript:alert(1)' }, [])).toThrow(ValidationError);
  });
});
