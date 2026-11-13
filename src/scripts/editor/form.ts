import { dirty } from './state';
import { applyValue } from '../menus/dropdown';
import type { Menu } from '../menus/dropdown';
import { LANG, collectionLabel, tr } from '../shared/i18n';
import { COVER, DISABLED, MENU, OPTION } from '../shared/selectors';

/** Title is a textarea so long headlines wrap instead of scrolling sideways. */
export function fitTitle(form: HTMLFormElement) {
  const el = form.elements.namedItem('title') as HTMLTextAreaElement | null;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function paintCover(form: HTMLFormElement) {
  const url = (form.querySelector(COVER) as HTMLInputElement | null)?.value.trim() ?? '';
  form.querySelectorAll<HTMLElement>('[data-hero], [data-editor-mark]').forEach((box) => {
    box.replaceChildren();
    if (box.dataset.hero !== undefined) box.hidden = !url;
    if (!url) return;
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    box.append(img);
  });
}

export function paintChrome(form: HTMLFormElement) {
  fitTitle(form);
  const title = (form.elements.namedItem('title') as HTMLInputElement | null)?.value.trim() || tr('ed.untitled');
  const type = (form.querySelector('input[name="type"]') as HTMLInputElement | null)?.value ?? '';
  const crumb = form.querySelector('[data-crumb]');
  if (crumb) crumb.textContent = title;
  const col = form.querySelector('[data-collection]');
  if (col) col.textContent = collectionLabel(type);
  const names = [...form.querySelectorAll<HTMLInputElement>('input[name="authors"]:checked')].map((c) => c.dataset.name || c.value);
  const by = form.querySelector('[data-byline]');
  if (by) by.textContent = names.join(', ') || tr('ed.noOne');
  paintCover(form);
}

/** Live pieces can't return to draft: swap Save draft/Publish for Update live, and lock the Mode menu to match. */
function syncLive(form: HTMLFormElement) {
  const locked = form.dataset.locked === 'true';
  const live = form.dataset.live === 'true';
  const show = (sel: string, on: boolean) => {
    const el = form.querySelector<HTMLElement>(sel);
    if (el) el.hidden = !on;
  };
  show('[data-save]', !locked && !live);
  show('[data-publish]', !locked && !live);
  show('[data-update]', !locked && live);
  show('[data-live-link]', !locked && live);
  const liveLink = form.querySelector<HTMLAnchorElement>('[data-live-link]');
  const pieceId = form.dataset.editing === 'true' ? form.action.split('/').pop() : '';
  if (liveLink && pieceId) liveLink.href = `/${LANG}/artikler/${pieceId}`;
  form.querySelector('input[name="status"]')?.closest(MENU)?.querySelectorAll<HTMLElement>(OPTION).forEach((el) => {
    const published = el.dataset.value === 'Published';
    if (live ? !published : published) el.setAttribute(DISABLED, 'true');
    else el.removeAttribute(DISABLED);
  });
}

function setLocked(form: HTMLFormElement, locked: boolean) {
  form.dataset.locked = locked ? 'true' : 'false';
  const surface = form.querySelector('.surface') as HTMLElement | null;
  if (surface) surface.contentEditable = locked ? 'false' : 'true';
  form.querySelectorAll('fieldset').forEach((f) => {
    f.disabled = locked;
  });
  const show = (sel: string, on: boolean) => {
    const el = form.querySelector<HTMLElement>(sel);
    if (el) el.hidden = !on;
  };
  show('[data-restore]', locked);
  syncLive(form);
  show('[data-archive]', !locked && form.dataset.editing === 'true');
  show('[data-delete]', form.dataset.editing === 'true');
  show('[data-locked-banner]', locked);
}

interface Payload {
  id?: string;
  title?: string;
  status?: string;
  type?: string;
  authors?: string[];
  deadline?: string;
  cover?: string;
  caption?: string;
  section?: string;
  publishedAt?: string;
  body?: string;
  html?: string;
  archived?: boolean;
}

function setMenu(form: HTMLFormElement, name: string, value: string) {
  const input = form.querySelector<HTMLInputElement>(`[data-menu] input[name="${name}"]`);
  const menu = input?.closest(MENU) as Menu | null;
  if (menu) applyValue(menu, value);
}

function field(form: HTMLFormElement, name: string): HTMLInputElement | HTMLTextAreaElement | null {
  return form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
}

function writeField(form: HTMLFormElement, name: string, value: string) {
  const el = field(form, name);
  if (el) el.value = value;
}

function fillIdentity(form: HTMLFormElement, item: Payload | null, editing: boolean) {
  form.dataset.editing = editing ? 'true' : 'false';
  form.dataset.published = item?.publishedAt ?? '';
  form.dataset.live = item?.status === 'Published' ? 'true' : 'false';
  form.action = editing ? `/api/items/${item?.id ?? ''}` : '/api/items';
}

function fillCopy(form: HTMLFormElement, item: Payload | null) {
  writeField(form, 'title', item?.title ?? '');
  const surface = form.querySelector('.surface') as HTMLElement;
  surface.innerHTML = item?.html || '';
  const notes = form.querySelector('textarea[name="body"]') as HTMLTextAreaElement;
  notes.value = item?.body ?? '';
  dirty.set(form, false);
  form.dispatchEvent(new Event('surface-reset'));
  const empty = !(surface.textContent ?? '').trim();
  surface.classList.toggle('is-empty', empty);
}

function fillMenus(form: HTMLFormElement, item: Payload | null) {
  setMenu(form, 'status', item?.status ?? 'Idea');
  setMenu(form, 'type', item?.type ?? 'Article');
  const deadline = item?.deadline ?? new Date().toISOString();
  writeField(form, 'deadline', deadline.slice(0, 10));
  const cover = form.querySelector(COVER) as HTMLInputElement | null;
  if (cover) cover.value = item?.cover ?? '';
  writeField(form, 'caption', item?.caption ?? '');
  setMenu(form, 'section', item?.section ?? '');
}

function fillAuthors(form: HTMLFormElement, item: Payload | null) {
  const mine = form.dataset.me ? [form.dataset.me] : [];
  const picked = new Set(item?.authors ?? mine);
  form.querySelectorAll<HTMLInputElement>('input[name="authors"]').forEach((box) => {
    box.checked = picked.has(box.value);
  });
}

function fillPageLink(form: HTMLFormElement, item: Payload | null, editing: boolean) {
  const page = form.querySelector<HTMLAnchorElement>('[data-open-page]');
  if (!page) return;
  page.hidden = form.dataset.mode !== 'modal' || !editing;
  if (item?.id) page.href = `/${LANG}/content/${item.id}`;
}

function fillReturnTarget(form: HTMLFormElement, item: Payload | null) {
  const next = form.querySelector<HTMLInputElement>('[data-next]');
  if (!next) return;
  const back = form.dataset.mode === 'modal' && Boolean(item?.id);
  next.disabled = !back;
  if (!back || !item?.id) {
    next.value = '';
    return;
  }
  const u = new URL(location.href);
  u.searchParams.set('open', item.id);
  u.searchParams.delete('error');
  next.value = u.pathname + u.search;
}

export function fillEditor(form: HTMLFormElement, item: Payload | null) {
  const editing = Boolean(item?.id);
  form.dispatchEvent(new Event('preview-off'));
  fillIdentity(form, item, editing);
  fillCopy(form, item);
  fillMenus(form, item);
  fillAuthors(form, item);
  fillPageLink(form, item, editing);
  fillReturnTarget(form, item);
  setLocked(form, Boolean(item?.archived));
  paintChrome(form);
}

export function showEditorError(form: HTMLFormElement) {
  const err = form.querySelector<HTMLElement>('[data-editor-error]');
  const message = new URLSearchParams(location.search).get('error');
  if (!err) return;
  err.hidden = !message;
  err.textContent = message ?? '';
}
