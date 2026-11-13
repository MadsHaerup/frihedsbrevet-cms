import { DISABLED, MENU, MENU_OPEN, OPTION } from '../shared/selectors';

export type Menu = HTMLElement;

const pop = (menu: Menu) => menu.querySelector('.menu-pop') as HTMLElement | null;
const trigger = (menu: Menu) => menu.querySelector('.menu-btn') as HTMLButtonElement | null;

function close(menu: Menu) {
  if (menu.dataset.open === undefined) return;
  delete menu.dataset.open;
  trigger(menu)?.setAttribute('aria-expanded', 'false');
  const panel = pop(menu);
  if (panel) panel.hidden = true;
  if (panel?.contains(document.activeElement)) trigger(menu)?.focus();
}

export function closeAll(except?: Menu) {
  document.querySelectorAll<Menu>(MENU_OPEN).forEach((m) => {
    if (m !== except) close(m);
  });
}

function place(menu: Menu) {
  const panel = pop(menu);
  const btn = trigger(menu);
  if (!panel || !btn) return;
  panel.hidden = false;
  const alignEnd = menu.classList.contains('mode') || menu.classList.contains('split');
  panel.style.position = 'absolute';
  panel.style.minWidth = `${Math.max(btn.offsetWidth, 188)}px`;
  panel.style.left = alignEnd ? 'auto' : '0';
  panel.style.right = alignEnd ? '0' : 'auto';
  const spaceBelow = window.innerHeight - btn.getBoundingClientRect().bottom;
  if (spaceBelow < panel.offsetHeight + 16) {
    panel.style.top = 'auto';
    panel.style.bottom = 'calc(100% + 8px)';
  } else {
    panel.style.bottom = 'auto';
    panel.style.top = 'calc(100% + 8px)';
  }
}

function open(menu: Menu) {
  closeAll(menu);
  menu.dataset.open = '';
  trigger(menu)?.setAttribute('aria-expanded', 'true');
  place(menu);
  const selected =
    pop(menu)?.querySelector<HTMLElement>('[aria-selected="true"]') ??
    pop(menu)?.querySelector<HTMLElement>(OPTION);
  selected?.focus();
}

export function applyValue(menu: Menu, value: string) {
  const input = menu.querySelector('input[type="hidden"]') as HTMLInputElement | null;
  if (input) input.value = value;
  const options = [...menu.querySelectorAll<HTMLElement>(OPTION)];
  const opt = options.find((o) => o.dataset.value === value);
  const label = menu.querySelector('.menu-label');
  if (label && opt) {
    const text = (opt.querySelector('.badge') ?? opt.querySelector('span:last-child'))?.textContent?.trim() || value;
    label.textContent = text;
    if (menu.dataset.swatch === 'true') label.className = `menu-label badge s-${value}`;
  }
  options.forEach((o) => o.setAttribute('aria-selected', o.dataset.value === value ? 'true' : 'false'));
  menu.dispatchEvent(new CustomEvent('menu-change', { bubbles: true, detail: { name: input?.name ?? '', value } }));
}

function selectOption(menu: Menu, opt: HTMLElement) {
  applyValue(menu, opt.dataset.value ?? '');
  close(menu);
  if (menu.dataset.submit === 'true') menu.closest('form')?.requestSubmit();
}

document.addEventListener('click', (e) => {
  const t = e.target as HTMLElement;
  const opt = t.closest(`${MENU} ${OPTION}`) as HTMLElement | null;
  if (opt) {
    if (opt.getAttribute(DISABLED) === 'true') return;
    selectOption(opt.closest(MENU) as Menu, opt);
    return;
  }
  const btn = t.closest('.menu-btn');
  if (btn) {
    const menu = btn.closest(MENU) as Menu | null;
    if (!menu) return;
    if (menu.dataset.open !== undefined) close(menu);
    else open(menu);
    return;
  }
  if (!t.closest(MENU)) closeAll();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const link = document.querySelector<HTMLElement>('[data-box]:not([hidden])');
    if (link) return;
    closeAll();
    return;
  }
  const menu = (e.target as HTMLElement | null)?.closest?.(MENU_OPEN) as Menu | null;
  if (!menu) return;
  const opts = [...menu.querySelectorAll<HTMLElement>(OPTION)];
  if (!opts.length) return;
  const i = opts.indexOf(document.activeElement as HTMLElement);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = i < 0 ? 0 : (i + 1) % opts.length;
    opts[next]?.focus();
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = i <= 0 ? opts.length - 1 : i - 1;
    opts[prev]?.focus();
  }
});

window.addEventListener('resize', () => {
  document.querySelectorAll<Menu>(MENU_OPEN).forEach(place);
});
