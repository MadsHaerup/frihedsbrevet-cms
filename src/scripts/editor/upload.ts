import { paintChrome } from './form';
import { dirty } from './state';
import type { EditorState } from './state';
import { tr } from '../shared/i18n';
import { COVER, UPLOADING } from '../shared/selectors';

async function shrink(file: File): Promise<File> {
  if (file.type === 'image/gif' || file.size < 350_000) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, 'image/webp', 0.86));
    if (blob && blob.size < file.size) return new File([blob], 'image.webp', { type: 'image/webp' });
    return file;
  } catch {
    return file;
  }
}

function toast(text: string) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.innerHTML = '<span class="spinner"></span><span class="toast-text"></span>';
  const label = el.querySelector('.toast-text') as HTMLElement;
  label.textContent = text;
  document.body.append(el);
  return {
    set: (next: string) => {
      label.textContent = next;
    },
    close: (delay = 0) => window.setTimeout(() => el.remove(), delay),
  };
}

function uploadRequest(file: File, say: (msg: string) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      say(`${tr(UPLOADING)} ${Math.round((event.loaded / event.total) * 100)}%`);
    };
    xhr.onload = () => readUpload(xhr, resolve, reject);
    xhr.onerror = () => reject(new Error(tr('ins.uploadFail')));
    const body = new FormData();
    body.append('file', file);
    say(`${tr(UPLOADING)} 0%`);
    xhr.send(body);
  });
}

function readUpload(xhr: XMLHttpRequest, resolve: (url: string) => void, reject: (err: Error) => void) {
  let json: { url?: string; error?: string } = {};
  try {
    json = JSON.parse(xhr.responseText);
  } catch {
    json = {};
  }
  if (xhr.status < 300 && json.url) resolve(json.url);
  else reject(new Error(json.error ?? tr('ins.uploadFail')));
}

export async function upload(file: File, status?: HTMLElement): Promise<string> {
  const note = toast(tr('ins.optimising'));
  const say = (msg: string) => {
    note.set(msg);
    if (status) status.textContent = msg;
  };
  say(tr('ins.optimising'));
  try {
    return await uploadRequest(await shrink(file), say);
  } finally {
    note.close();
  }
}

export function bindUploads(state: EditorState) {
  state.boxes.image?.querySelector<HTMLInputElement>('[data-upload]')?.addEventListener('change', async (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const status = state.boxes.image.querySelector<HTMLElement>('[data-box-status]');
    if (!file || !status) return;
    status.textContent = tr(UPLOADING);
    try {
      const src = state.boxes.image.querySelector<HTMLInputElement>('[name="_src"]');
      if (src) src.value = await upload(file, status);
      status.textContent = file.name;
    } catch (err) {
      status.textContent = (err as Error).message;
    }
    input.value = '';
  });
  state.form.querySelector<HTMLInputElement>('[data-cover-upload]')?.addEventListener('change', async (event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const label = input.closest('label');
    label?.classList.add('is-busy');
    try {
      const cover = state.form.querySelector(COVER) as HTMLInputElement | null;
      if (cover) cover.value = await upload(file);
      paintChrome(state.form);
      dirty.set(state.form, dirty.get(state.form) ?? false);
    } catch (err) {
      alert((err as Error).message);
    }
    label?.classList.remove('is-busy');
    input.value = '';
  });
}
