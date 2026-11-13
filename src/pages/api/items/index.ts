import type { APIRoute } from 'astro';
import { listUsers } from '../../../lib/auth';
import { createItem, listItems, ValidationError } from '../../../lib/content/items';
import { url } from '../../../i18n';
import { fail, readBody, respond } from '../../../lib/http';

/** GET /api/items — role-filtered list. Optional ?status=Draft&type=Video */
const get: APIRoute = async ({ locals, url }) => {
  let items = await listItems(locals.user!);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  if (status) items = items.filter((i) => i.data.status === status);
  if (type) items = items.filter((i) => i.data.type === type);
  return Response.json(items.map(({ id, data }) => {
    const listed: Partial<typeof data> = { ...data };
    delete listed.body;
    return { id, ...listed };
  }));
};

/** POST /api/items — create a piece */
const post: APIRoute = async (ctx) => {
  try {
    const users = (await listUsers()).map((u) => u.id);
    const item = await createItem(ctx.locals.user!, await readBody(ctx.request), users);
    return respond(ctx, { id: item.id, ...item.data }, `${url(ctx.locals.lang, 'dashboard')}?open=${item.id}`, 201);
  } catch (e) {
    if (e instanceof ValidationError) return fail(ctx, e.message);
    throw e;
  }
};

export { get as GET, post as POST };
