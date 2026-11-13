// Single client entry (imported by Layout.astro). Page-level wiring only; features live in their own folders.
import './menus/dropdown';
import { bindEditor } from './editor/index';
import { initEditorDialog } from './editor/dialog';
import { showEditorError } from './editor/form';
import { initLiveSearch } from './search/live-search';

function start() {
  // the body is replaced on client navigation, so this flag is per page; it also makes first-load + page-load calls harmless
  if (document.body.dataset.uiStarted) return;
  document.body.dataset.uiStarted = '1';
  document.querySelectorAll<HTMLFormElement>('[data-editor]').forEach((form) => {
    bindEditor(form);
    if (form.dataset.mode === 'page') showEditorError(form);
  });
  initEditorDialog();
  initLiveSearch();
}

// With the client router the page is swapped, not reloaded: (re)bind on every arrival.
start();
document.addEventListener('astro:page-load', start);

// Sorting / filtering links keep the reader where they are instead of jumping to the top.
let keepScrollY: number | null = null;
document.addEventListener('click', (e) => {
  keepScrollY = (e.target as HTMLElement).closest('[data-keep-scroll]') ? window.scrollY : null;
});
document.addEventListener('astro:page-load', () => {
  if (keepScrollY !== null) window.scrollTo({ top: keepScrollY });
  keepScrollY = null;
});
