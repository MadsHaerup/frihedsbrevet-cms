import type { EditorState } from './state';

/**
 * Undo/redo for the article surface. Toolbar commands and block edits change the DOM directly, which the
 * browser's own undo stack doesn't see, so the editor keeps its own list of snapshots (HTML + caret).
 */
interface Snapshot {
  html: string;
  start: number;
  end: number;
}
interface Track {
  stack: Snapshot[];
  at: number;
  lastRecord: number;
}

const tracks = new WeakMap<HTMLFormElement, Track>();
const TYPING_GROUP_MS = 600;
const LIMIT = 200;

function offsets(surface: HTMLElement): { start: number; end: number } {
  const sel = window.getSelection();
  if (!sel?.rangeCount || !surface.contains(sel.anchorNode)) return { start: 0, end: 0 };
  const range = sel.getRangeAt(0);
  const before = document.createRange();
  before.selectNodeContents(surface);
  before.setEnd(range.startContainer, range.startOffset);
  const start = before.toString().length;
  return { start, end: start + range.toString().length };
}

function locate(surface: HTMLElement, offset: number): { node: Node; offset: number } {
  const walker = document.createTreeWalker(surface, NodeFilter.SHOW_TEXT);
  let left = offset;
  let last: Text | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    last = node as Text;
    if (left <= last.length) return { node: last, offset: left };
    left -= last.length;
  }
  return last ? { node: last, offset: last.length } : { node: surface, offset: 0 };
}

function snapshot(surface: HTMLElement): Snapshot {
  return { html: surface.innerHTML, ...offsets(surface) };
}

/** Start over from the surface's current content (on bind, and whenever a different piece is loaded). */
export function resetHistory(state: EditorState) {
  tracks.set(state.form, { stack: [{ html: state.surface.innerHTML, start: 0, end: 0 }], at: 0, lastRecord: 0 });
}

/** Call after every change. Quick successive typing is merged into one step. */
export function recordHistory(state: EditorState) {
  const track = tracks.get(state.form);
  if (!track) return;
  const next = snapshot(state.surface);
  if (next.html === track.stack[track.at].html) return;
  const now = Date.now();
  track.stack.length = track.at + 1;
  if (now - track.lastRecord < TYPING_GROUP_MS && track.at > 0) track.stack[track.at] = next;
  else track.stack.push(next);
  if (track.stack.length > LIMIT) track.stack.shift();
  track.at = track.stack.length - 1;
  track.lastRecord = now;
}

/** The next change starts a new undo step (used before toolbar commands). */
export function breakHistory(state: EditorState) {
  const track = tracks.get(state.form);
  if (track) track.lastRecord = 0;
}

function apply(state: EditorState, snap: Snapshot) {
  const { surface } = state;
  surface.innerHTML = snap.html;
  state.blocks.pick(null);
  surface.focus({ preventScroll: true });
  const from = locate(surface, snap.start);
  const to = locate(surface, snap.end);
  const range = document.createRange();
  range.setStart(from.node, from.offset);
  range.setEnd(to.node, to.offset);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** Step back (or forward). Returns whether anything changed. */
export function stepHistory(state: EditorState, direction: -1 | 1): boolean {
  const track = tracks.get(state.form);
  if (!track) return false;
  // make sure the latest edits are on the stack before moving away from them
  recordHistory(state);
  const target = track.at + direction;
  if (target < 0 || target >= track.stack.length) return false;
  track.at = target;
  track.lastRecord = 0;
  apply(state, track.stack[target]);
  return true;
}
