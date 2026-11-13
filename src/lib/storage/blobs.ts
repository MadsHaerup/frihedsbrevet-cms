import fs from 'node:fs/promises';
import path from 'node:path';
import type { Upload } from './config';
import { dir } from './files';

/** Netlify Blobs backend (serverless, read-only disk). The repo's content/ folder seeds the store on first use. */
const seeded = new Set<string>();
async function stores() {
  const { getStore } = await import('@netlify/blobs');
  return { content: getStore({ name: 'content', consistency: 'strong' }), uploads: getStore({ name: 'uploads', consistency: 'strong' }) };
}

/** First use of a folder: copy the repo's bundled seed pieces into the store (once). */
async function seed(folder: string) {
  if (seeded.has(folder)) return;
  seeded.add(folder);
  const { content } = await stores();
  if (await content.get(`__seeded/${folder}`)) return;
  const names = (await fs.readdir(dir(folder)).catch(() => [])).filter((f) => f.endsWith('.md'));
  await Promise.all(names.map(async (f) => {
    const key = `${folder}/${f}`;
    const existing = await content.get(key);
    if (!existing) await content.set(key, await fs.readFile(path.join(dir(folder), f), 'utf8'));
  }));
  await content.set(`__seeded/${folder}`, '1');
}

export const blobs = {
  async ids(folder: string) {
    await seed(folder);
    const { content } = await stores();
    const { blobs } = await content.list({ prefix: `${folder}/` });
    return blobs.map((b) => b.key.slice(folder.length + 1, -3));
  },
  async read(folder: string, id: string) {
    await seed(folder);
    return (await (await stores()).content.get(`${folder}/${id}.md`, { type: 'text' })) ?? null;
  },
  async write(folder: string, id: string, text: string) {
    await seed(folder);
    await (await stores()).content.set(`${folder}/${id}.md`, text);
  },
  async remove(folder: string, id: string) {
    await (await stores()).content.delete(`${folder}/${id}.md`);
  },
  async putUpload(name: string, data: Buffer, type: string) {
    await (await stores()).uploads.set(name, new Uint8Array(data).buffer as ArrayBuffer, { metadata: { type } });
  },
  async getUpload(name: string): Promise<Upload | null> {
    const hit = await (await stores()).uploads.getWithMetadata(name, { type: 'arrayBuffer' });
    if (!hit) return null;
    const mime = hit.metadata.type;
    const type = typeof mime === 'string' && mime ? mime : 'application/octet-stream';
    return { data: Buffer.from(hit.data), type };
  },
};
