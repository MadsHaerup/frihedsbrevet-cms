import { describe, expect, it } from 'vitest';
import type { SessionUser } from '../auth';
import type { ContentItem } from '../model';
import { canManage, mergedItem, refuseUnpublish } from './rules';
import { ValidationError } from './validate';

const item = (over: Partial<ContentItem> = {}): ContentItem => ({
  title: 'T', status: 'Draft', type: 'Article', authors: ['a'], createdBy: 'a', deadline: '2026-01-01',
  archived: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', body: '', ...over,
});
const user = (id: string, role: 'editor' | 'contributor') => ({ id, role, name: id, email: `${id}@x` }) as SessionUser;

describe('publish rules', () => {
  it('refuses to send a published piece back to draft', () => {
    expect(() => refuseUnpublish(item({ status: 'Published' }), { status: 'Draft' })).toThrow(ValidationError);
  });

  it('allows updating a published piece and keeps it live', () => {
    expect(() => refuseUnpublish(item({ status: 'Published' }), { title: 'New' })).not.toThrow();
    expect(() => refuseUnpublish(item({ status: 'Published' }), { status: 'Published' })).not.toThrow();
  });

  it('stamps publishedAt once, on first publish', () => {
    const first = mergedItem(item(), { status: 'Published' }, user('a', 'editor'), '2026-02-01T00:00:00Z');
    expect(first.publishedAt).toBe('2026-02-01T00:00:00Z');
    const later = mergedItem(first, { title: 'Edit' }, user('a', 'editor'), '2026-03-01T00:00:00Z');
    expect(later.publishedAt).toBe('2026-02-01T00:00:00Z');
  });
});

describe('access', () => {
  it('lets editors manage everything and contributors only their own', () => {
    expect(canManage(user('e', 'editor'), item())).toBe(true);
    expect(canManage(user('a', 'contributor'), item())).toBe(true);
    expect(canManage(user('b', 'contributor'), item())).toBe(false);
  });
});
