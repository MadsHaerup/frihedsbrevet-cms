import { fillEditor, fitTitle, showEditorError } from './form';
import { closeAll } from '../menus/dropdown';
import { LIST_UPDATED } from '../shared/selectors';

/** The dashboard's modal editor: open a blank piece, or fetch one and fill the form. */
export function initEditorDialog() {
  const dialog = document.getElementById('editor-dialog') as HTMLDialogElement | null;
  const form = dialog?.querySelector<HTMLFormElement>('[data-editor]');
  if (!dialog || !form) return;

  const reveal = () => {
    if (!dialog.open) dialog.showModal();
    fitTitle(form);
    requestAnimationFrame(() => fitTitle(form));
  };
  dialog.querySelector('[data-close]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => closeAll());

  document.getElementById('open-new')?.addEventListener('click', () => {
    fillEditor(form, null);
    const err = form.querySelector<HTMLElement>('[data-editor-error]');
    if (err) err.hidden = true;
    reveal();
    (form.elements.namedItem('title') as HTMLInputElement | null)?.focus();
  });

  let ticket = 0;
  async function openItem(id: string) {
    ticket += 1;
    const mine = ticket;
    const res = await fetch(`/api/items/${encodeURIComponent(id)}`, { headers: { accept: 'application/json' } });
    if (!res.ok || mine !== ticket) return;
    fillEditor(form!, await res.json());
    showEditorError(form!);
    reveal();
  }

  // rows can be replaced by live search, so bind (idempotently) now and after every list update
  const bindRows = () =>
    document.querySelectorAll<HTMLElement>('[data-open]').forEach((el) => {
      if (!el.dataset.open || el.dataset.rowBound) return;
      el.dataset.rowBound = '1';
      el.addEventListener('click', () => openItem(el.dataset.open!));
    });
  bindRows();
  document.addEventListener(LIST_UPDATED, bindRows);
  document.addEventListener('astro:before-swap', () => document.removeEventListener(LIST_UPDATED, bindRows), { once: true });

  const openId = new URLSearchParams(location.search).get('open');
  if (openId) void openItem(openId);
}
