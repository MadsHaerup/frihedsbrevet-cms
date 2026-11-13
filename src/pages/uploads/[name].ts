import type { APIRoute } from 'astro';
import { storage } from '../../lib/storage';

const get: APIRoute = async ({ params }) => {
  const name = params.name ?? '';
  if (!/^[a-f0-9]{16}\.(png|jpg|webp|gif|avif)$/.test(name)) return new Response('Not found', { status: 404 });
  const file = await storage.getUpload(name);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(file.data), { headers: { 'content-type': file.type, 'cache-control': 'public, max-age=31536000, immutable' } });
};

export { get as GET };
