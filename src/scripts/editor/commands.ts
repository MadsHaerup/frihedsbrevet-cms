import { breakHistory, stepHistory } from './history';
import { openBox } from './boxes';
import { applySimple, setBlock } from './formatting';
import { insertHtml } from './insert';
import { currentBlock } from './selection';
import { markDirty, remember } from './state';
import type { EditorState } from './state';
import { closeAll } from '../menus/dropdown';
import { esc } from '../shared/html';
import { tr } from '../shared/i18n';

function toggleDropcap(state: EditorState) {
  let paragraph = currentBlock(state.surface, 'p');
  if (!paragraph) {
    setBlock(state.surface, 'p');
    paragraph = currentBlock(state.surface, 'p');
  }
  paragraph?.classList.toggle('dropcap');
  if (paragraph && !paragraph.getAttribute('class')) paragraph.removeAttribute('class');
  markDirty(state);
}

function insertColumns(state: EditorState, count: number) {
  const col = '<div class="col"><p><br></p></div>';
  const cols = Array.from({ length: count }, () => col).join('');
  insertHtml(state, `<section class="sec" data-layout="grid-${count}">${cols}</section><p><br></p>`);
}

function insertBlock(state: EditorState, cmd: string, selected: string) {
  if (cmd === 'section') insertHtml(state, '<hr><p><br></p>');
  if (cmd === 'sec2') insertColumns(state, 2);
  if (cmd === 'sec3') insertColumns(state, 3);
  if (cmd === 'callout') insertHtml(state, `<aside class="callout"><p>${esc(selected) || tr('ins.calloutPh')}</p></aside><p><br></p>`);
  if (cmd === 'pull') insertHtml(state, `<blockquote class="pull"><p>${esc(selected) || tr('ins.pullPh')}</p></blockquote><p><br></p>`);
  if (cmd === 'code') insertHtml(state, `<pre>${esc(selected) || tr('ins.codePh')}</pre><p><br></p>`);
}

function run(state: EditorState, cmd: string) {
  if (state.form.dataset.locked === 'true') return;
  state.surface.focus({ preventScroll: true });
  breakHistory(state);
  if (cmd === 'bold' || cmd === 'italic' || cmd === 'underline' || cmd === 'ul' || cmd === 'ol' || cmd === 'h2' || cmd === 'quote') {
    applySimple(state.surface, cmd);
    markDirty(state);
    return;
  }
  if (cmd === 'link' || cmd === 'image' || cmd === 'embed') {
    openBox(state, cmd);
    return;
  }
  if (cmd === 'dropcap') {
    toggleDropcap(state);
    return;
  }
  remember(state);
  insertBlock(state, cmd, (state.saved?.toString() ?? '').trim());
}

function guardColumnBackspace(event: KeyboardEvent) {
  if (event.key !== 'Backspace') return;
  const sel = window.getSelection();
  if (!sel?.rangeCount || !sel.isCollapsed) return;
  const node = sel.anchorNode;
  const el = node instanceof HTMLElement ? node : node?.parentElement;
  const col = el?.closest<HTMLElement>('.col');
  const first = col?.firstElementChild ?? null;
  if (!first) return;
  if (!first.contains(sel.anchorNode)) return;
  const head = document.createRange();
  head.setStart(first, 0);
  head.setEnd(sel.anchorNode!, sel.anchorOffset);
  if (head.toString() === '' && !head.cloneContents().querySelector('img')) event.preventDefault();
}

export function bindCommands(state: EditorState, toolbar: Element | null) {
  toolbar?.addEventListener('mousedown', (event) => {
    if ((event.target as HTMLElement).closest('[data-cmd], .menu-btn')) event.preventDefault();
  });
  toolbar?.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-cmd]');
    if (!button?.dataset.cmd) return;
    run(state, button.dataset.cmd);
    closeAll();
  });
  state.surface.addEventListener('keydown', guardColumnBackspace);
  state.surface.addEventListener('keydown', (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
    event.preventDefault();
    if (stepHistory(state, event.shiftKey ? 1 : -1)) markDirty(state);
  });
  state.surface.addEventListener('keydown', (event) => {
    if (!(event.metaKey || event.ctrlKey)) return;
    const cmd = { b: 'bold', i: 'italic', u: 'underline', k: 'link' }[event.key.toLowerCase()];
    if (!cmd) return;
    event.preventDefault();
    run(state, cmd);
  });
}
