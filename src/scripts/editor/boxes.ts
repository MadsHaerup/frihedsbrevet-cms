import { insertHtml } from './insert';
import { createLink } from './selection';
import { markDirty, remember, restore } from './state';
import type { EditorState } from './state';
import { esc } from '../shared/html';

function hideBoxes(state: EditorState) {
  Object.values(state.boxes).forEach((box) => {
    box.hidden = true;
  });
}

function fillImageBox(box: HTMLElement, figure: HTMLElement) {
  const img = figure.querySelector('img');
  const src = box.querySelector<HTMLInputElement>('[name="_src"]');
  const alt = box.querySelector<HTMLInputElement>('[name="_alt"]');
  const caption = box.querySelector<HTMLInputElement>('[name="_caption"]');
  if (src) src.value = img?.getAttribute('src') ?? '';
  if (alt) alt.value = img?.getAttribute('alt') ?? '';
  if (caption) caption.value = figure.querySelector('figcaption')?.textContent ?? '';
}

export function openBox(state: EditorState, name: string, replace: HTMLElement | null = null) {
  state.replaceTarget = replace;
  remember(state);
  hideBoxes(state);
  const box = state.boxes[name];
  if (!box) return;
  box.querySelectorAll<HTMLInputElement>('input:not([type="file"])').forEach((input) => {
    input.value = '';
  });
  const status = box.querySelector<HTMLElement>('[data-box-status]');
  if (status) status.textContent = '';
  box.hidden = false;
  if (name === 'image' && replace) fillImageBox(box, replace);
  box.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
}

function closeBox(state: EditorState) {
  hideBoxes(state);
  restore(state);
}

function boxValue(box: HTMLElement, name?: string): string {
  const input = name ? box.querySelector<HTMLInputElement>(`[name="${name}"]`) : box.querySelector<HTMLInputElement>('input');
  return input?.value.trim() ?? '';
}

function embedSrc(url: string): string {
  const youtube = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`;
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  const spotify = /open\.spotify\.com\/(episode|track|show|playlist|album)\/(\w+)/.exec(url);
  if (spotify) return `https://open.spotify.com/embed/${spotify[1]}/${spotify[2]}`;
  return '';
}

function embedHtml(url: string): string {
  const src = embedSrc(url);
  if (src) return `<div class="embed" contenteditable="false"><iframe src="${src}" loading="lazy" allowfullscreen></iframe></div><p><br></p>`;
  return `<div class="embed embed-link" contenteditable="false"><a href="${esc(url)}">${esc(url)}</a></div><p><br></p>`;
}

function captionHtml(caption: string): string {
  if (!caption) return '';
  return `<figcaption>${esc(caption)}</figcaption>`;
}

function ensureChild(parent: HTMLElement, selector: string, tag: string): HTMLElement {
  const found = parent.querySelector(selector);
  if (found instanceof HTMLElement) return found;
  const created = document.createElement(tag);
  if (tag === 'img') parent.prepend(created);
  else parent.append(created);
  return created;
}

function swapFigure(state: EditorState, src: string, alt: string, caption: string) {
  const fig = state.replaceTarget;
  state.replaceTarget = null;
  if (!fig) return;
  const img = ensureChild(fig, 'img', 'img');
  img.setAttribute('src', src);
  img.setAttribute('alt', alt);
  if (caption) ensureChild(fig, 'figcaption', 'figcaption').textContent = caption;
  else fig.querySelector('figcaption')?.remove();
  markDirty(state);
  state.blocks.pick(fig);
}

function applyImage(state: EditorState, box: HTMLElement) {
  const src = boxValue(box, '_src');
  if (!/^(https?:\/\/|\/(?!\/))/.test(src)) {
    restore(state);
    return;
  }
  const caption = boxValue(box, '_caption');
  if (state.replaceTarget?.isConnected) {
    swapFigure(state, src, boxValue(box, '_alt'), caption);
    return;
  }
  const html = `<figure><img src="${esc(src)}" alt="${esc(boxValue(box, '_alt'))}">${captionHtml(caption)}</figure><p><br></p>`;
  insertHtml(state, html);
}

function applyEmbed(state: EditorState, box: HTMLElement) {
  const url = boxValue(box);
  if (/^https?:\/\//.test(url)) insertHtml(state, embedHtml(url));
  else restore(state);
}

function applyBox(state: EditorState, name: string) {
  const box = state.boxes[name];
  hideBoxes(state);
  if (name === 'link') {
    const url = boxValue(box);
    restore(state);
    if (url) createLink(url);
    markDirty(state);
    return;
  }
  if (name === 'image') {
    applyImage(state, box);
    return;
  }
  if (name === 'embed') applyEmbed(state, box);
}

export function bindBoxes(state: EditorState) {
  Object.entries(state.boxes).forEach(([name, box]) => {
    box.querySelector('[data-box-apply]')?.addEventListener('click', () => applyBox(state, name));
    box.querySelector('[data-box-cancel]')?.addEventListener('click', () => closeBox(state));
    box.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement;
      if (event.key === 'Enter' && target.tagName === 'INPUT') {
        event.preventDefault();
        applyBox(state, name);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeBox(state);
      }
    });
  });
}
