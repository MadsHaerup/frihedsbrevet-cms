import { defineMiddleware } from 'astro:middleware';
import { readSession } from './lib/auth';
import { DEFAULT_LANG, LANG_COOKIE, isLang, url, type Lang } from './i18n';

const PAGES = /^\/(login|dashboard|content)(\/|$)/;

function pickLang(pathLang: string | undefined, cookie: string | undefined): Lang {
  if (isLang(pathLang)) return pathLang;
  if (isLang(cookie)) return cookie;
  return DEFAULT_LANG;
}

function isStaticPath(pathname: string): boolean {
  return pathname.startsWith('/_astro') || pathname.startsWith('/uploads/') || /\.[a-z0-9]+$/i.test(pathname);
}

function isPublicRoute(pathname: string, first: string | undefined, rest: string[]): boolean {
  if (pathname === '/api/login' || pathname === '/api/logout') return true;
  if (!isLang(first)) return false;
  return rest.join('/') === 'login' || rest[0] === 'artikler';
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname } = ctx.url;
  if (isStaticPath(pathname)) return next();

  const [first, ...rest] = pathname.split('/').filter(Boolean);
  const lang = pickLang(first, ctx.cookies.get(LANG_COOKIE)?.value);
  ctx.locals.lang = lang;
  ctx.locals.user = await readSession(ctx.cookies);

  if (isLang(first)) ctx.cookies.set(LANG_COOKIE, first, { path: '/', maxAge: 31536000, sameSite: 'lax' });
  // Legacy/unprefixed page URLs -> locale-prefixed
  if (PAGES.test(pathname)) return ctx.redirect(url(lang, pathname) + ctx.url.search);

  const guest = !ctx.locals.user && pathname !== '/' && !isPublicRoute(pathname, first, rest);
  if (!guest) return next();
  if (pathname.startsWith('/api/')) return Response.json({ error: 'Unauthenticated' }, { status: 401 });
  return ctx.redirect(url(lang, 'login'));
});
