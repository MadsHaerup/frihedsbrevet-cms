import type { APIRoute } from 'astro';
import { listUsers } from '../../../lib/auth';
import { deleteItem, getItem, updateItem, ValidationError, type ItemInput } from '../../../lib/content/items';
import { fail, readBody, respond } from '../../../lib/http';
import { url } from '../../../i18n';

const get: APIRoute = async ({ locals, params }) => {
  const item = await getItem(locals.user!, params.id!);
  return item
    ? Response.json({ id: item.id, ...item.data, html: item.rendered?.html ?? '' })
    : Response.json({ error: 'Not found' }, { status: 404 });
};

async function patch(ctx: Parameters<APIRoute>[0], input: ItemInput, to?: string) {
  try {
    const users = (await listUsers()).map((u) => u.id);
    const item = await updateItem(ctx.locals.user!, ctx.params.id!, input, users);
    if (!item) return Response.json({ error: 'Not found' }, { status: 404 });
    return respond(ctx, { id: item.id, ...item.data }, to ?? url(ctx.locals.lang, `content/${item.id}`));
  } catch (e) {
    if (e instanceof ValidationError) return fail(ctx, e.message);
    throw e;
  }
}

/** PATCH /api/items/:id — update any field, e.g. {"status":"Review"} */
const patchItem: APIRoute = async (ctx) => patch(ctx, await readBody(ctx.request));

/** DELETE /api/items/:id — permanently removes the piece (use `archived: true` via PATCH to keep it). */
async function remove(ctx: Parameters<APIRoute>[0]) {
  const ok = await deleteItem(ctx.locals.user!, ctx.params.id!);
  if (!ok) return Response.json({ error: 'Not found' }, { status: 404 });
  return respond(ctx, { deleted: ctx.params.id }, url(ctx.locals.lang, 'dashboard'));
}
export const DELETE: APIRoute = remove;

/**
 * POST (HTML forms can't PATCH). `intent` picks the action:
 * publish | update | archive | restore | delete | save (default — edit fields) | status (dashboard quick-change)
 */
const post: APIRoute = async (ctx) => {
  const { intent = 'save', next, ...fields } = await readBody(ctx.request);
  const back = next && String(next).startsWith('/') && !String(next).startsWith('//') ? String(next) : undefined;
  if (intent === 'publish') return patch(ctx, { ...fields, status: 'Published' }, back);
  if (intent === 'update') return patch(ctx, { ...fields, status: 'Published' }, back);
  if (intent === 'delete') return remove(ctx);
  if (intent === 'archive') return patch(ctx, { archived: true }, back);
  if (intent === 'restore') return patch(ctx, { archived: false }, back);
  if (intent === 'status') return patch(ctx, { status: fields.status }, back);
  return patch(ctx, fields, back);
};

export { get as GET, patchItem as PATCH, post as POST };
