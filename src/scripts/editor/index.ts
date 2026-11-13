import { initBlocks } from './blocks';
import { resetHistory } from './history';
import { bindBoxes, openBox } from './boxes';
import { bindCommands } from './commands';
import { paintChrome } from './form';
import { onPaste } from './paste';
import { bindPreview } from './preview';
import { htmlToMarkdown } from './serialize';
import { dirty, markDirty } from './state';
import type { EditorState } from './state';
import { bindUploads } from './upload';
import { LANG, tr } from '../shared/i18n';

function onSubmit(state: EditorState, event: SubmitEvent) {
  const confirmMsg = (event.submitter as HTMLElement | null)?.dataset.confirm;
  if (confirmMsg && !confirm(confirmMsg)) {
    event.preventDefault();
    return;
  }
  if (dirty.get(state.form)) state.body.value = htmlToMarkdown(state.surface);
  const intent = (event.submitter as HTMLButtonElement | null)?.value;
  const next = state.form.querySelector<HTMLInputElement>('[data-next]');
  if (intent === 'archive' && next) {
    next.disabled = false;
    next.value = `/${LANG}/dashboard`;
  }
}

function bindForm(state: EditorState) {
  state.form.addEventListener('input', (event) => {
    const target = event.target as HTMLElement;
    if (target.matches('[name="title"], [data-cover], input[name="authors"]')) paintChrome(state.form);
  });
  state.form.addEventListener('menu-change', () => paintChrome(state.form));
  state.form.querySelector('textarea[name="title"]')?.addEventListener('keydown', (event) => {
    if ((event as KeyboardEvent).key !== 'Enter') return;
    event.preventDefault();
    state.surface.focus({ preventScroll: true });
  });
  state.form.addEventListener('submit', (event) => onSubmit(state, event));
  state.form.addEventListener('keydown', (event) => {
    if (!(event.metaKey || event.ctrlKey) || event.key !== 'Enter') return;
    event.preventDefault();
    const save = state.form.querySelector<HTMLButtonElement>('[data-update]:not([hidden]), [data-save]:not([hidden])');
    if (save && !save.hidden) state.form.requestSubmit(save);
  });
  state.form.querySelector<HTMLAnchorElement>('[data-open-page]')?.addEventListener('click', (event) => {
    if (dirty.get(state.form) && !confirm(tr('ed.openUnsaved'))) event.preventDefault();
  });
}

export function bindEditor(form: HTMLFormElement) {
  if (form.dataset.bound) return;
  form.dataset.bound = 'true';
  const surface = form.querySelector('.surface') as HTMLElement;
  const state: EditorState = {
    form,
    surface,
    body: form.querySelector('textarea[name="body"]') as HTMLTextAreaElement,
    saved: null,
    boxes: Object.fromEntries([...form.querySelectorAll<HTMLElement>('[data-box]')].map((box) => [box.dataset.box!, box])),
    replaceTarget: null,
    pvMode: 'member',
    preview: form.querySelector<HTMLElement>('[data-preview]'),
    blocks: { pick() {} },
  };
  resetHistory(state);
  form.addEventListener('surface-reset', () => resetHistory(state));
  surface?.addEventListener('input', () => markDirty(state));
  surface?.addEventListener('paste', (event) => onPaste(state, event));
  state.blocks = initBlocks(form, surface, { tr, markDirty: () => markDirty(state), replaceImage: (fig) => openBox(state, 'image', fig) });
  bindUploads(state);
  bindBoxes(state);
  bindCommands(state, form.querySelector('.fmt:not(.blockbar)'));
  bindPreview(state);
  bindForm(state);
}
