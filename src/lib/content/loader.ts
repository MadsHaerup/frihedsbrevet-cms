import YAML from 'yaml';
import type { LiveLoader } from 'astro/loaders';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { sanitizeHtml } from '../sanitize';
import { storage } from '../storage';
import { typeForCollection, type CollectionName, type ContentItem } from '../model';

let processor: ReturnType<typeof createMarkdownProcessor> | undefined;
const md = () => (processor ??= createMarkdownProcessor());

export async function renderMarkdown(src: string) {
  return sanitizeHtml((await (await md()).render(src)).code);
}

export function parseFile(raw: string): Record<string, unknown> & { body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { body: raw };
  return { ...YAML.parse(m[1]), body: m[2].trim() };
}

export function serialize(item: ContentItem): string {
  const { body, ...front } = item;
  return `---\n${YAML.stringify(front).trim()}\n---\n\n${body.trim()}\n`;
}

function iso(v: unknown): string | undefined {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return `${v}`;
  if (typeof v !== 'string' || v === '') return undefined;
  return v;
}

/** `render: false` for list views: rendering Markdown for every piece is the expensive part and lists only need the data. */
async function readEntry(folder: CollectionName, id: string, render = true) {
  const raw = await storage.read(folder, id);
  if (raw === null) throw new Error('not found');
  const data = parseFile(raw) as unknown as ContentItem;
  // The folder is the collection; keep frontmatter aligned with it.
  const fromFolder = typeForCollection(folder);
  if (fromFolder) data.type = fromFolder;
  // YAML parses bare dates into Date objects; keep plain strings.
  const deadline = data.deadline as unknown;
  const deadlineText = deadline instanceof Date ? deadline.toISOString() : iso(deadline) ?? '';
  data.deadline = deadlineText.slice(0, 10);
  data.createdAt = iso(data.createdAt) ?? new Date().toISOString();
  data.updatedAt = iso(data.updatedAt) ?? data.createdAt;
  const published = iso(data.publishedAt);
  if (published) data.publishedAt = published;
  else delete data.publishedAt;
  return render ? { id, data, rendered: { html: await renderMarkdown(data.body ?? '') } } : { id, data };
}

/**
 * Live loader for a single collection folder. Pieces are markdown files editors
 * create at runtime; each content type has its own loader and directory.
 */
export function itemsLoader(folder: CollectionName): LiveLoader<ContentItem, { id: string }> {
  return {
    name: `markdown-${folder}`,
    async loadCollection() {
      const ids = await storage.ids(folder);
      const entries = await Promise.all(ids.map((id) => readEntry(folder, id, false)));
      return { entries };
    },
    async loadEntry({ filter }) {
      if (!/^[a-z0-9-]+$/.test(filter.id)) return undefined;
      try {
        return await readEntry(folder, filter.id);
      } catch {
        return undefined;
      }
    },
  };
}
