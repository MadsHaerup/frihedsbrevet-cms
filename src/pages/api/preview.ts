import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ArticleView from '../../components/ArticleView.astro';
import { renderMarkdown } from '../../lib/content/loader';
import { getItem } from '../../lib/content/items';
import { popularFor, teaserMarkdown } from '../../lib/article';
import { collLabel } from '../../i18n';

/**
 * POST /api/preview -> { html }
 * Renders the exact template the public page uses, from the editor's unsaved state.
 */
const container = AstroContainer.create(); // created once per instance

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return `${value}`;
  return '';
}

function textOr(value: unknown, fallback: string): string {
  const text = asString(value).trim();
  return text || fallback;
}

function previewProps(b: Record<string, unknown>, body: string, popular: Awaited<ReturnType<typeof popularFor>>, lang: Parameters<typeof collLabel>[0], caption?: string, viewerName?: string) {
  const visitor = b.mode === 'visitor';
  const type = asString(b.type) || 'Article';
  return {
    lang,
    popular,
    caption,
    viewerName,
    type,
    html: body,
    title: textOr(b.title, '—'),
    section: textOr(b.section, collLabel(lang, type)),
    cover: asString(b.cover) || undefined,
    authors: Array.isArray(b.authors) ? b.authors.map(String) : [],
    publishedAt: asString(b.publishedAt) || undefined,
    mode: visitor ? 'visitor' : 'member',
    preview: true,
    live: b.status === 'Published',
  };
}

const post: APIRoute = async ({ request, locals }) => {
  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = asString(b.id);
  const lang = locals.lang;
  const visitor = b.mode === 'visitor';
  const md = asString(b.markdown).slice(0, 200_000);
  const [saved, body, popular] = await Promise.all([
    id ? getItem(locals.user!, id) : Promise.resolve(undefined),
    renderMarkdown(visitor ? teaserMarkdown(md) : md),
    popularFor(id, lang),
  ]);

  const html = await (await container).renderToString(ArticleView, {
    props: previewProps(b, body, popular, lang, saved?.data.caption, locals.user?.name),
  });
  return Response.json({ html });
};

export { post as POST };
