import { headerImage, thumbUrl } from './format';
import { listPublished } from './content/items';
import { typeLabel, type Lang } from '../i18n';

/** Visitors get the opening of the piece. Cuts the Markdown after N blocks (blocks are separated by blank lines). */
export function teaserMarkdown(md: string, blocks = 3): string {
  const parts = md.split(/\n{2,}/);
  return parts.length <= blocks ? md : parts.slice(0, blocks).join('\n\n');
}

// The sidebar list changes rarely and every preview / public render asks for it: keep it for a minute per instance.
const POPULAR_TTL_MS = 60_000;
let popularCache: { at: number; entries: Awaited<ReturnType<typeof listPublished>> } | null = null;

export async function popularFor(excludeId: string, lang: Lang) {
  if (!popularCache || Date.now() - popularCache.at > POPULAR_TTL_MS) {
    popularCache = { at: Date.now(), entries: await listPublished('', 12) };
  }
  return popularCache.entries
    .filter((e) => e.id !== excludeId)
    .slice(0, 4)
    .map(({ id, data }) => {
      const img = headerImage(data);
      return { id, title: data.title, kicker: data.section || typeLabel(lang, data.type), image: img ? thumbUrl(img) : '' };
    });
}

export const publicPath = (lang: Lang, id: string) => `/${lang}/artikler/${id}`;
