import type { APIRoute } from 'astro';
import { Buffer } from 'node:buffer';
import { randomBytes } from 'node:crypto';

import { storage } from '../../lib/storage';
const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
const MAX = 8 * 1024 * 1024;

/** POST /api/upload (multipart `file`) -> { url } — images for the editor and header images */
const post: APIRoute = async ({ request }) => {
  const file = (await request.formData().catch(() => null))?.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'No file.' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return Response.json({ error: 'Only PNG, JPEG, WebP, GIF or AVIF images.' }, { status: 415 });
  if (file.size > MAX) return Response.json({ error: 'Max 8 MB.' }, { status: 413 });
  const name = `${randomBytes(8).toString('hex')}.${ext}`;
  await storage.putUpload(name, Buffer.from(await file.arrayBuffer()), file.type);
  return Response.json({ url: `/uploads/${name}` }, { status: 201 });
};

export { post as POST };
