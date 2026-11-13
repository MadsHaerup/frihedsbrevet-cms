import type { SessionUser } from '../auth';
import type { ContentItem } from '../model';
import { ValidationError } from './validate';

/** Editors manage everything; contributors only pieces they created or co-author. */
export const canManage = (u: SessionUser, i: ContentItem) =>
  u.role === 'editor' || i.createdBy === u.id || i.authors.includes(u.id);

export const slug = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'untitled';


function ownedAuthors(user: SessionUser, authors: string[] | undefined): string[] {
  const listed = authors ?? [user.id];
  if (user.role !== 'contributor') return listed;
  return [...new Set([user.id, ...listed])];
}

function withOptional(data: ContentItem, patch: Partial<ContentItem>) {
  if (patch.cover) data.cover = patch.cover;
  if (patch.caption) data.caption = patch.caption;
  if (patch.section) data.section = patch.section;
  if (patch.status === 'Published') data.publishedAt = data.publishedAt ?? data.updatedAt;
}

export function freshItem(user: SessionUser, c: Partial<ContentItem>, now: string): ContentItem {
  const data: ContentItem = {
    title: c.title ?? '',
    status: c.status ?? 'Idea',
    type: c.type ?? 'Article',
    authors: ownedAuthors(user, c.authors),
    createdBy: user.id,
    deadline: c.deadline ?? '',
    archived: false,
    createdAt: now,
    updatedAt: now,
    body: c.body ?? '',
  };
  withOptional(data, c);
  return data;
}

export function refuseUnpublish(existing: ContentItem, patch: Partial<ContentItem>) {
  const leaving = existing.status === 'Published' && patch.status !== undefined && patch.status !== 'Published';
  if (leaving) throw new ValidationError('A published piece cannot go back to draft. Edit it to update the live version.');
}

function keepOwner(user: SessionUser, existing: ContentItem, patch: Partial<ContentItem>) {
  if (!patch.authors || user.role !== 'contributor') return;
  patch.authors = [...new Set([...patch.authors, existing.createdBy])];
}

function dropEmpty(data: ContentItem) {
  if (data.cover === undefined) delete data.cover;
  if (data.caption === undefined) delete data.caption;
  if (data.section === undefined) delete data.section;
}

export function mergedItem(existing: ContentItem, patch: Partial<ContentItem>, user: SessionUser, now: string): ContentItem {
  keepOwner(user, existing, patch);
  const data: ContentItem = { ...existing, ...patch, updatedAt: now };
  if (data.status === 'Published' && !data.publishedAt) data.publishedAt = now;
  dropEmpty(data);
  return data;
}
