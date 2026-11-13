import { recordHistory } from './history';
import { normalizeSections } from './sections';

export interface EditorState {
  form: HTMLFormElement;
  surface: HTMLElement;
  body: HTMLTextAreaElement;
  saved: Range | null;
  boxes: Record<string, HTMLElement>;
  replaceTarget: HTMLElement | null;
  pvMode: 'member' | 'visitor';
  preview: HTMLElement | null;
  blocks: { pick: (el: HTMLElement | null) => void };
}

/** Whether the surface changed since it was loaded (otherwise the stored Markdown is submitted untouched). */
export const dirty = new WeakMap<HTMLFormElement, boolean>();

export function markDirty(state: EditorState) {
  normalizeSections(state.surface);
  dirty.set(state.form, true);
  const empty = !(state.surface.textContent ?? '').trim();
  state.surface.classList.toggle('is-empty', empty);
  recordHistory(state);
}

export function remember(state: EditorState) {
  const sel = window.getSelection();
  state.saved = sel?.rangeCount && state.surface.contains(sel.anchorNode) ? sel.getRangeAt(0).cloneRange() : state.saved;
}

export function restore(state: EditorState) {
  state.surface.focus({ preventScroll: true });
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  const saved = state.saved;
  if (saved && state.surface.contains(saved.commonAncestorContainer)) {
    sel.addRange(saved);
    return;
  }
  const end = document.createRange();
  end.selectNodeContents(state.surface);
  end.collapse(false);
  sel.addRange(end);
}
