/**
 * Where pieces and uploaded images live: local files in dev / on any Node host, Netlify Blobs on Netlify.
 * Both backends expose the same interface; this picks one.
 */
import { blobs } from './blobs';
import { useBlobs } from './config';
import { files } from './files';

export { CONTENT_ROOT, UPLOAD_DIR, useBlobs, type Upload } from './config';

export const storage = {
  ids: (folder: string) => (useBlobs ? blobs.ids(folder) : files.ids(folder)),
  read: (folder: string, id: string) => (useBlobs ? blobs.read(folder, id) : files.read(folder, id)),
  write: (folder: string, id: string, text: string) => (useBlobs ? blobs.write(folder, id, text) : files.write(folder, id, text)),
  remove: (folder: string, id: string) => (useBlobs ? blobs.remove(folder, id) : files.remove(folder, id)),
  putUpload: (name: string, data: Buffer, type: string) => (useBlobs ? blobs.putUpload(name, data, type) : files.putUpload(name, data)),
  getUpload: (name: string) => (useBlobs ? blobs.getUpload(name) : files.getUpload(name)),
};
