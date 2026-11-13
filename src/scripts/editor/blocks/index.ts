/**
 * Block-level editing for the article surface: hover handles, click-to-select, the floating
 * block bar (layout/width/gap/replace/remove) and drag-to-reorder.
 */
import { barMarkup } from './bar';
import { mutateBlock } from './actions';
import { SECTION } from './constants';
import { initDrag } from './drag';
import { clickedBlock, positionHandles } from './handles';
import type { BlockHooks } from './types';

export type { BlockHooks } from './types';

export function initBlocks(form: HTMLFormElement, surface: HTMLElement, hooks: BlockHooks) {
  const copy = surface.closest<HTMLElement>('.editor-copy')!;
  const handle = form.querySelector<HTMLButtonElement>('[data-handle]');
  const secHandle = form.querySelector<HTMLButtonElement>('[data-handle-sec]');
  const bar = form.querySelector<HTMLElement>('[data-blockbar]');
  if (!copy || !handle || !secHandle || !bar) return { clear() {}, pick() {}, picked: () => null as HTMLElement | null };
  const above = handle;
  const side = secHandle;
  const { tr } = hooks;

  const isBlock = (el: Element | null): el is HTMLElement =>
    !!el && (el.parentElement === surface || (el.parentElement?.classList.contains('col') ?? false));

  function blockAt(target: EventTarget | null): HTMLElement | null {
    let el = target instanceof Element ? target : null;
    while (el && el !== surface) {
      if (isBlock(el)) return el;
      el = el.parentElement;
    }
    return null;
  }

  // side handle -> top-level block (paragraphs, images, sections…); above handle -> element inside a column
  let hoveredNested: HTMLElement | null = null;
  let hoveredTop: HTMLElement | null = null;
  let picked: HTMLElement | null = null;
  let hideTimer = 0;

  const rel = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const c = copy.getBoundingClientRect();
    return { top: r.top - c.top, left: r.left - c.left, bottom: r.bottom - c.top, width: r.width };
  };

  /** Handles stay put while the pointer is on the block, the handle, or the gap between. */
  function placeHandles(block: HTMLElement | null) {
    const placed = positionHandles(block, surface, above, side, rel);
    hoveredNested = placed.nested;
    hoveredTop = placed.top;
  }
  const hideHandles = () => {
    hoveredNested = hoveredTop = null;
    handle!.hidden = true;
    secHandle!.hidden = true;
  };

  surface.addEventListener('mousemove', (e) => {
    if (form.dataset.locked === 'true' || drag.active()) return;
    clearTimeout(hideTimer);
    const b = blockAt(e.target) ?? (e.target as HTMLElement).closest<HTMLElement>(SECTION);
    if (!b) return; // in a gap: keep the current handles so they can be reached
    if (b !== hoveredNested && b !== hoveredTop) placeHandles(b);
  });
  const scheduleHide = () => {
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      if (!drag.active()) hideHandles();
    }, 500);
  };
  surface.addEventListener('mouseleave', scheduleHide);
  [handle, secHandle].forEach((h) => {
    h.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    h.addEventListener('mouseleave', scheduleHide);
  });

  // ---- selection + block bar ----
  function clearPick() {
    picked?.classList.remove('is-selected');
    picked = null;
    bar!.hidden = true;
  }

  function renderBar(el: HTMLElement) {
    bar!.innerHTML = barMarkup(tr, el);
    bar!.hidden = false;
    const p = rel(el);
    bar!.style.top = `${Math.max(0, p.top - 54)}px`;
    bar!.style.left = `${Math.max(0, p.left)}px`;
  }

  function pick(el: HTMLElement | null) {
    clearPick();
    if (!el) return;
    picked = el;
    el.classList.add('is-selected');
    renderBar(el);
  }

  bar.addEventListener('mousedown', (e) => e.preventDefault());
  bar.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!b || !picked) return;
    const [act, val] = b.dataset.act!.split(':');
    const el = picked;
    const changed = mutateBlock(act, val, el, { pick, clear: clearPick, hide: hideHandles, replace: hooks.replaceImage });
    if (!changed) return;
    hooks.markDirty();
    if (document.contains(el)) renderBar(el);
  });

  handle.addEventListener('click', () => hoveredNested && pick(hoveredNested));
  secHandle.addEventListener('click', () => hoveredTop && pick(hoveredTop));

  surface.addEventListener('click', (e) => pick(clickedBlock(e.target as HTMLElement)));
  surface.addEventListener('dblclick', (e) => {
    const fig = (e.target as HTMLElement).closest<HTMLElement>('figure');
    if (!fig) return;
    if (fig.querySelector('img')) hooks.replaceImage(fig);
  });
  const onDocMouseDown = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.editor-copy')) clearPick();
  };
  document.addEventListener('mousedown', onDocMouseDown);
  surface.addEventListener('keydown', (e) => {
    if (picked && !picked.matches(SECTION) && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      picked.remove();
      clearPick();
      hooks.markDirty();
    }
  });
  const onScroll = () => picked && renderBar(picked);
  window.addEventListener('scroll', onScroll, true);
  // the client router swaps pages without a reload: drop global listeners when this editor goes away
  document.addEventListener(
    'astro:before-swap',
    () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('scroll', onScroll, true);
    },
    { once: true },
  );

  const drag = initDrag({
    form,
    surface,
    copy,
    nested: handle,
    side: secHandle,
    hovered: () => ({ nested: hoveredNested, top: hoveredTop }),
    blockAt,
    rel,
    pick,
    placeHandles,
    markDirty: hooks.markDirty,
  });

  return { pick, clear: clearPick, picked: () => picked };
}
