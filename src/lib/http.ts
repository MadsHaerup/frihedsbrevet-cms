import type { APIContext } from 'astro';

/** Accept either JSON (API clients) or form posts (the UI) */
export async function readBody(req: Request): Promise<Record<string, any>> {
  if (req.headers.get('content-type')?.includes('application/json')) return req.json().catch(() => ({}));
  const fd = await req.formData().catch(() => null);
  if (!fd) return {};
  const o: Record<string, any> = {};
  for (const k of new Set(fd.keys())) {
    const all = fd.getAll(k).map(String);
    o[k] = k === 'authors' ? all : all[0];
  }
  return o;
}

export const wantsJson = (req: Request) =>
  req.headers.get('content-type')?.includes('application/json') || req.headers.get('accept')?.includes('application/json');

/** Redirect back (forms) or return JSON (API clients). */
export function respond(ctx: APIContext, json: unknown, to: string, status = 200) {
  return wantsJson(ctx.request) ? Response.json(json, { status }) : ctx.redirect(to, 303);
}

export function fail(ctx: APIContext, message: string) {
  if (wantsJson(ctx.request)) return Response.json({ error: message }, { status: 400 });
  const ref = ctx.request.headers.get('referer');
  const u = new URL(ref ?? `/${ctx.locals.lang}/dashboard`, ctx.url);
  u.searchParams.set('error', message);
  return ctx.redirect(u.pathname + u.search, 303);
}
