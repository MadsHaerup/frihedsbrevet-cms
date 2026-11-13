import { htmlToMarkdown } from './serialize';
import { dirty } from './state';
import type { EditorState } from './state';
import { esc } from '../shared/html';
import { tr } from '../shared/i18n';
import { PRESSED } from '../shared/selectors';

async function renderPreview(state: EditorState) {
  const preview = state.preview;
  if (!preview) return;
  const value = (name: string) => state.form.querySelector<HTMLInputElement>(`[name="${name}"]`)?.value ?? '';
  const names = [...state.form.querySelectorAll<HTMLInputElement>('input[name="authors"]:checked')].map((box) => box.dataset.name || box.value);
  const markdown = dirty.get(state.form) ? htmlToMarkdown(state.surface) : state.body.value;
  const editing = state.form.dataset.editing === 'true';
  const res = await fetch('/api/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      markdown,
      id: editing ? state.form.action.split('/').pop() : '',
      mode: state.pvMode,
      title: value('title'),
      section: value('section'),
      type: value('type'),
      cover: value('cover').trim(),
      status: value('status'),
      authors: names,
      publishedAt: state.form.dataset.published || '',
    }),
  });
  preview.innerHTML = res.ok ? (await res.json()).html : '<div class="pv-banner">Preview failed</div>';
}

async function onPreviewMode(state: EditorState, event: MouseEvent) {
  const preview = state.preview;
  if (!preview) return;
  const button = (event.target as HTMLElement).closest<HTMLElement>('[data-pv-mode]');
  if (!button) return;
  state.pvMode = button.dataset.pvMode as 'member' | 'visitor';
  preview.querySelectorAll<HTMLElement>('[data-pv-mode]').forEach((item) => item.setAttribute(PRESSED, String(item === button)));
  preview.classList.add('is-loading');
  const scroller = state.form.closest('dialog');
  const top = scroller?.scrollTop ?? window.scrollY;
  await renderPreview(state);
  preview.classList.remove('is-loading');
  if (scroller) scroller.scrollTop = top;
  else window.scrollTo({ top });
}

async function showPreview(state: EditorState, button: HTMLButtonElement | null, on: boolean) {
  const preview = state.preview;
  const editorBody = state.form.querySelector<HTMLElement>('.editor-body');
  if (!preview || !editorBody) return;
  editorBody.hidden = on;
  preview.hidden = !on;
  button?.setAttribute(PRESSED, String(on));
  const label = button?.querySelector('[data-preview-label]');
  if (label) label.textContent = on ? tr('ed.backToEdit') : tr('ed.preview');
  if (!on) return;
  preview.innerHTML = `<div class="pv-loading"><span class="spinner"></span>${esc(tr('pv.loading'))}</div>`;
  await renderPreview(state);
  state.form.closest('dialog')?.scrollTo({ top: 0 });
  window.scrollTo({ top: 0 });
}

export function bindPreview(state: EditorState) {
  const button = state.form.querySelector<HTMLButtonElement>('[data-preview-toggle]');
  state.preview?.addEventListener('click', (event) => onPreviewMode(state, event));
  button?.addEventListener('click', () => showPreview(state, button, button.getAttribute(PRESSED) !== 'true'));
  state.form.addEventListener('preview-off', () => showPreview(state, button, false));
}
