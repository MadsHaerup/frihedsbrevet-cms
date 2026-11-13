/** Drop CDN copies of a public article (and listings) so a publish/update shows up immediately. No-op outside Netlify. */
import { useBlobs } from './storage';

export async function purgeArticle(id: string) {
  if (!useBlobs) return;
  try {
    const { purgeCache } = await import('@netlify/cache');
    await purgeCache({ tags: [`article-${id}`, 'articles'] });
  } catch (err) {
    console.error('cache purge failed', err);
  }
}
