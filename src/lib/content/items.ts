import { randomBytes } from 'node:crypto';
import { getLiveCollection, getLiveEntry } from 'astro:content';
import type { SessionUser } from '../auth';
import { purgeArticle } from '../purge';
import { storage } from '../storage';
import { COLLECTIONS, collectionFor, type ContentItem, type ContentType } from '../model';
import { serialize } from './loader';
import { canManage, freshItem, mergedItem, refuseUnpublish, slug } from './rules';
import { clean, ValidationError, type ItemInput } from './validate';

export type Entry = { id: string; data: ContentItem; rendered?: { html: string } };

export async function listItems(user: SessionUser): Promise<Entry[]> {
  const groups = await Promise.all(
    COLLECTIONS.map(async (name) => {
      const { entries, error } = await getLiveCollection(name);
      if (error) throw error;
      return entries ?? [];
    }),
  );
  return groups
    .flat()
    .filter((e) => canManage(user, e.data))
    .sort((a, b) => b.data.updatedAt.localeCompare(a.data.updatedAt));
}

/** Public, newest first. Used by the article template's "popular" list (stand-in until we have read counts). */
export async function listPublished(excludeId: string, limit: number): Promise<Entry[]> {
  const groups = await Promise.all(COLLECTIONS.map(async (name) => (await getLiveCollection(name)).entries ?? []));
  return groups
    .flat()
    .filter((e) => e.id !== excludeId && e.data.status === 'Published' && !e.data.archived)
    .sort((a, b) => (b.data.publishedAt ?? b.data.updatedAt).localeCompare(a.data.publishedAt ?? a.data.updatedAt))
    .slice(0, limit);
}

/** Public lookup: only live, non-archived pieces. */
export async function getPublished(id: string): Promise<Entry | undefined> {
  if (!/^[a-z0-9-]+$/.test(id)) return undefined;
  // the collection isn't known from the id: ask all of them at once rather than one after another
  const hits = await Promise.all(COLLECTIONS.map(async (name) => (await getLiveEntry(name, { id })).entry));
  const entry = hits.find(Boolean);
  if (!entry) return undefined;
  if (entry.data.status !== 'Published' || entry.data.archived) return undefined;
  return entry;
}

export async function getItem(user: SessionUser, id: string): Promise<Entry | undefined> {
  if (!/^[a-z0-9-]+$/.test(id)) return undefined;
  const hits = await Promise.all(COLLECTIONS.map(async (name) => (await getLiveEntry(name, { id })).entry));
  const entry = hits.find(Boolean);
  return entry && canManage(user, entry.data) ? entry : undefined;
}

export { canManage, ValidationError };
export type { ItemInput };

async function write(id: string, item: ContentItem, previous?: ContentType) {
  await storage.write(collectionFor(item.type), id, serialize(item));
  if (previous && previous !== item.type) await storage.remove(collectionFor(previous), id);
}

export async function createItem(user: SessionUser, input: ItemInput, validUsers: string[]): Promise<Entry> {
  const c = clean({ status: 'Idea', type: 'Article', body: '', ...input }, validUsers);
  if (!c.title || !c.deadline) throw new ValidationError('Title and deadline are required.');
  const now = new Date().toISOString();
  const data = freshItem(user, c, now);
  const id = `${slug(c.title)}-${randomBytes(3).toString('hex')}`;
  await write(id, data);
  return { id, data };
}

export async function deleteItem(user: SessionUser, id: string): Promise<boolean> {
  const existing = await getItem(user, id);
  if (!existing) return false;
  await storage.remove(collectionFor(existing.data.type), id);
  if (existing.data.status === 'Published') await purgeArticle(id);
  return true;
}

export async function updateItem(user: SessionUser, id: string, input: ItemInput, validUsers: string[]): Promise<Entry | null> {
  const existing = await getItem(user, id);
  if (!existing) return null;
  const patch = clean(input, validUsers);
  refuseUnpublish(existing.data, patch);
  const data = mergedItem(existing.data, patch, user, new Date().toISOString());
  await write(id, data, existing.data.type);
  // live now, or was live (update / take-down via archive): refresh the CDN copy of the public page
  const live = data.status === 'Published' || existing.data.status === 'Published';
  if (live) await purgeArticle(id);
  return { id, data };
}
