import type { ContentItem } from './model';
import { DATE_LOCALE, type Lang } from '../i18n';

export const today = () => new Date().toISOString().slice(0, 10);

export const fmtDate = (d: string, lang: Lang = 'da') =>
  new Date(d + 'T00:00:00Z').toLocaleDateString(DATE_LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const dayStamp = (d: string) => Date.parse(`${d}T00:00:00Z`);

export const isOverdue = (i: Pick<ContentItem, 'deadline' | 'status' | 'archived'>) =>
  !i.archived && i.status !== 'Published' && dayStamp(i.deadline) < dayStamp(today());

export const initials = (n: string) => n.split(' ').map((p) => p[0]).join('').slice(0, 2);

const rtfs: Record<string, Intl.RelativeTimeFormat> = {};
export function ago(iso: string, lang: Lang = 'da'): string {
  const rtf = (rtfs[lang] ??= new Intl.RelativeTimeFormat(DATE_LOCALE[lang], { numeric: 'auto' }));
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [u, n] of units) if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), u);
  return rtf.format(0, 'minute');
}

/** Plain-text teaser from markdown notes */
function stripFence(md: string): string {
  const parts = md.split('```');
  return parts.filter((_, i) => i % 2 === 0).join(' ');
}

function stripTags(md: string): string {
  return md.split('<').map((part, i) => (i === 0 ? part : part.slice(part.indexOf('>') + 1))).join(' ');
}

function takeLink(md: string, i: number): { text: string; next: number } | undefined {
  const bang = md[i] === '!' && md[i + 1] === '[';
  if (!bang && md[i] !== '[') return undefined;
  const labelAt = bang ? i + 2 : i + 1;
  const close = md.indexOf(']', labelAt);
  const end = close >= 0 && md[close + 1] === '(' ? md.indexOf(')', close + 2) : -1;
  if (end < 0) return undefined;
  return { text: md.slice(labelAt, close), next: end + 1 };
}

function stripMarkdownLink(md: string): string {
  let out = '';
  let i = 0;
  while (i < md.length) {
    const link = takeLink(md, i);
    out += link ? link.text : md[i];
    i = link ? link.next : i + 1;
  }
  return out;
}

function clipAtWord(t: string, max: number): string {
  const cut = t.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return (space > 0 ? cut.slice(0, space) : cut) + '…';
}

export function excerpt(md: string, max = 160): string {
  const t = stripMarkdownLink(stripTags(stripFence(md)))
    .replaceAll(/^[#>\-*+\d.\s]+/gm, '')
    .replaceAll(/[*_`~]/g, '')
    .replaceAll(/\s+/g, ' ')
    .trim();
  return t.length > max ? clipAtWord(t, max) : t;
}

/** Deterministic gradient fallback when a piece has no cover image */
export function fallbackCover(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + (c.codePointAt(0) ?? 0)) % 360;
  return `linear-gradient(135deg, hsl(${h} 45% 62%), hsl(${(h + 50) % 360} 55% 38%))`;
}

/** The piece's header image: explicit cover, else the first image in the body */
export function headerImage(item: Pick<ContentItem, 'cover' | 'body'>): string | undefined {
  if (item.cover) return item.cover;
  const md = /!\[[^\]]*\]\(([^)\s]+)/.exec(item.body);
  const html = /<img[^>]+src=["']([^"']+)/i.exec(item.body);
  return md?.[1] ?? html?.[1];
}

/** Smaller rendition for list thumbnails when the image lives on frihedsbrevet.dk's WordPress uploads */
export function thumbUrl(src: string): string {
  return /^https:\/\/frihedsbrevet\.dk\/app\/uploads\/.+\.(webp|jpe?g|png)$/i.test(src) ? src.replace(/\.(webp|jpe?g|png)$/i, '-384x384.$1') : src;
}
