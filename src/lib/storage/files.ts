import fs from 'node:fs/promises';
import path from 'node:path';
import { CONTENT_ROOT, UPLOAD_DIR, type Upload } from './config';

/** Local disk backend: Markdown files under content/<collection>/ and images under uploads/. */
export const dir = (folder: string) => path.join(CONTENT_ROOT, folder);

export const files = {
  async ids(folder: string) {
    await fs.mkdir(dir(folder), { recursive: true });
    return (await fs.readdir(dir(folder))).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
  },
  read(folder: string, id: string) {
    return fs.readFile(path.join(dir(folder), `${id}.md`), 'utf8').catch(() => null);
  },
  async write(folder: string, id: string, text: string) {
    await fs.mkdir(dir(folder), { recursive: true });
    await fs.writeFile(path.join(dir(folder), `${id}.md`), text, 'utf8');
  },
  async remove(folder: string, id: string) {
    await fs.rm(path.join(dir(folder), `${id}.md`), { force: true });
  },
  async putUpload(name: string, data: Buffer) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, name), data);
  },
  async getUpload(name: string): Promise<Upload | null> {
    const ext = name.split('.').pop() ?? '';
    const type = ({ png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', avif: 'image/avif' } as Record<string, string>)[ext];
    const data = await fs.readFile(path.join(UPLOAD_DIR, name)).catch(() => null);
    return data && type ? { data, type } : null;
  },
};
