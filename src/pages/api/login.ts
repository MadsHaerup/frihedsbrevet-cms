import type { APIRoute } from 'astro';
import { authenticate, startSession } from '../../lib/auth';
import { readBody, wantsJson } from '../../lib/http';
import { url } from '../../i18n';

const post: APIRoute = async (ctx) => {
  const { email = '', password = '' } = await readBody(ctx.request);
  const user = await authenticate(String(email), String(password));
  if (!user) {
    return wantsJson(ctx.request)
      ? Response.json({ error: 'Invalid credentials' }, { status: 401 })
      : ctx.redirect(url(ctx.locals.lang, 'login') + '?error=1', 303);
  }
  startSession(ctx.cookies, user.id);
  return wantsJson(ctx.request) ? Response.json({ user }) : ctx.redirect(url(ctx.locals.lang, 'dashboard'), 303);
};

export { post as POST };
