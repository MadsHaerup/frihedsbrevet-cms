import path from 'node:path';

export const CONTENT_ROOT = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), 'content'));
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads'));
declare const __ON_NETLIFY__: boolean | undefined;
export const useBlobs = __ON_NETLIFY__ === true || !!process.env.NETLIFY || process.env.STORAGE === 'blobs';

export interface Upload {
  data: Buffer;
  type: string;
}
