import { insertAtCaret, insertHtml } from './insert';
import { markDirty, remember } from './state';
import type { EditorState } from './state';
import { upload } from './upload';
import { esc } from '../shared/html';

const BLOCKY = /<(p|h[1-6]|ul|ol|blockquote|figure|hr|pre|table)\b/i;
const KEEP = new Set(['P', 'H2', 'H3', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'STRONG', 'EM', 'U', 'A', 'IMG', 'FIGURE', 'FIGCAPTION', 'BR', 'HR', 'PRE', 'CODE']);
const PASTE_MAP: Record<string, string> = { B: 'STRONG', I: 'EM', H1: 'H2', H4: 'H3', H5: 'H3', H6: 'H3' };
const DROPPED = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'META', 'LINK']);

function wrappedBlock(tag: string, inner: string): string {
  if (tag !== 'DIV' && tag !== 'SECTION' && tag !== 'ARTICLE') return inner;
  return inner.trim() ? `<p>${inner}</p>` : '';
}

function anchorHtml(node: HTMLElement, inner: string): string {
  const href = node.getAttribute('href') ?? '';
  if (!/^(https?:|mailto:|\/)/.test(href)) return inner;
  return `<a href="${esc(href)}">${inner}</a>`;
}

function imageHtml(node: HTMLElement): string {
  const src = node.getAttribute('src') ?? '';
  if (!/^https?:\/\//.test(src)) return '';
  return `<img src="${esc(src)}" alt="${esc(node.getAttribute('alt') ?? '')}">`;
}

function keptTag(node: HTMLElement, tag: string, inner: string): string {
  if (tag === 'A') return anchorHtml(node, inner);
  if (tag === 'IMG') return imageHtml(node);
  const name = tag.toLowerCase();
  if (tag === 'BR' || tag === 'HR') return `<${name}>`;
  return `<${name}>${inner}</${name}>`;
}

function cleanNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return esc(node.textContent ?? '');
  if (!(node instanceof HTMLElement) || DROPPED.has(node.tagName)) return '';
  const inner = [...node.childNodes].map(cleanNode).join('');
  const tag = PASTE_MAP[node.tagName] ?? node.tagName;
  if (!KEEP.has(tag)) return wrappedBlock(node.tagName, inner);
  return keptTag(node, tag, inner);
}

function cleanPaste(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return [...doc.body.childNodes].map(cleanNode).join('').replace(/<p>\s*<\/p>/g, '');
}

async function pasteImages(state: EditorState, files: File[]): Promise<boolean> {
  if (!files.length) return false;
  remember(state);
  try {
    const urls = await Promise.all(files.map((file) => upload(file)));
    for (const src of urls) insertHtml(state, `<figure><img src="${esc(src)}" alt=""></figure><p><br></p>`);
  } catch (err) {
    alert((err as Error).message);
  }
  return true;
}

function pasteRich(state: EditorState, html: string): boolean {
  if (!html) return false;
  const clean = cleanPaste(html);
  if (!clean.trim()) return false;
  if (BLOCKY.test(clean)) {
    remember(state);
    insertHtml(state, clean);
    return true;
  }
  insertAtCaret(clean);
  markDirty(state);
  return true;
}

function pastePlain(state: EditorState, text: string) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  markDirty(state);
}

export async function onPaste(state: EditorState, event: ClipboardEvent) {
  event.preventDefault();
  const files = [...(event.clipboardData?.files ?? [])].filter((file) => file.type.startsWith('image/'));
  if (await pasteImages(state, files)) return;
  const html = event.clipboardData?.getData('text/html') ?? '';
  if (pasteRich(state, html)) return;
  pastePlain(state, event.clipboardData?.getData('text/plain') ?? '');
}
