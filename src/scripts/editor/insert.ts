import { markDirty, restore } from './state';
import type { EditorState } from './state';

function blockAnchor(surface: HTMLElement, range: Range | null): Node | null {
  let anchor: Node | null = range?.startContainer ?? null;
  while (anchor && anchor.parentNode !== surface) anchor = anchor.parentNode;
  return anchor;
}

function placeCaret(sel: Selection | null, tail: HTMLElement | undefined) {
  if (!tail || !sel) return;
  const range = document.createRange();
  range.selectNodeContents(tail);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function dropEmptyParagraph(anchor: Node | null) {
  if (!(anchor instanceof HTMLElement) || anchor.tagName !== 'P') return;
  if ((anchor.textContent ?? '').trim() || anchor.querySelector('img,iframe')) return;
  anchor.remove();
}

/** Insert block-level HTML after the block holding the caret. */
export function insertHtml(state: EditorState, html: string) {
  restore(state);
  const sel = window.getSelection();
  const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
  if (range && !range.collapsed) range.deleteContents();
  const anchor = blockAnchor(state.surface, range);
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const nodes = [...tpl.content.childNodes];
  const tail = nodes.findLast((node): node is HTMLElement => node instanceof HTMLElement);
  if (anchor) (anchor as ChildNode).after(...nodes);
  else state.surface.append(...nodes);
  dropEmptyParagraph(anchor);
  placeCaret(sel, tail);
  markDirty(state);
}

export function insertAtCaret(html: string) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;
  const range = sel.getRangeAt(0);
  range.deleteContents();
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const last = [...tpl.content.childNodes].at(-1);
  range.insertNode(tpl.content);
  if (!last) return;
  const caret = document.createRange();
  caret.setStartAfter(last);
  caret.collapse(true);
  sel.removeAllRanges();
  sel.addRange(caret);
}
