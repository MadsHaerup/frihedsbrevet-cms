import { da } from './messages/da';
import { en, type Key } from './messages/en';

export const LOCALES = ['da', 'en'] as const;
export type Lang = (typeof LOCALES)[number];
export const DEFAULT_LANG: Lang = 'da';
export const LANG_COOKIE = 'fb_lang';
export const isLang = (v: unknown): v is Lang => LOCALES.includes(v as Lang);
export const DATE_LOCALE: Record<Lang, string> = { en: 'en-GB', da: 'da-DK' };


export const messages: Record<Lang, Record<Key, string>> = { en, da };
export type { Key };

export function useT(lang: Lang) {
  const dict = messages[lang];
  return (key: Key) => dict[key] ?? en[key] ?? key;
}

function trimSlashes(path: string): string {
  let start = 0;
  let end = path.length;
  while (path.charAt(start) === '/') start += 1;
  while (end > start && path.charAt(end - 1) === '/') end -= 1;
  return path.slice(start, end);
}

/** Locale-prefixed URL, e.g. url('da', 'dashboard') -> /da/dashboard */
export const url = (lang: Lang, path = '') => '/' + [lang, trimSlashes(path)].filter(Boolean).join('/');

export const statusLabel = (lang: Lang, s: string) => messages[lang][`status.${s}` as Key] ?? s;
export const typeLabel = (lang: Lang, s: string) => messages[lang][`type.${s}` as Key] ?? s;
export const collLabel = (lang: Lang, s: string) => messages[lang][`coll.${s}` as Key] ?? 'Content';

/** Swap (or add) the locale prefix of a pathname */
export function switchLocalePath(pathname: string, to: Lang): string {
  const parts = pathname.split('/').filter(Boolean);
  if (isLang(parts[0])) parts.shift();
  return '/' + [to, ...parts].join('/');
}
