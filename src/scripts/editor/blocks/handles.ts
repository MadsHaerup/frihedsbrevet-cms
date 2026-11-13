import { SECTION } from './constants';

export function positionHandles(
  block: HTMLElement | null,
  surface: HTMLElement,
  above: HTMLButtonElement,
  side: HTMLButtonElement,
  rel: (el: HTMLElement) => { top: number; left: number },
): { nested: HTMLElement | null; top: HTMLElement | null } {
  const nested = block?.parentElement?.classList.contains('col') ? block : null;
  let top: HTMLElement | null = block;
  while (top && top.parentElement !== surface) top = top.parentElement;
  if (nested) {
    const p = rel(nested);
    above.hidden = false;
    above.style.top = `${p.top - 19}px`;
    above.style.left = `${p.left}px`;
  } else above.hidden = true;
  if (top) {
    const p = rel(top);
    side.hidden = false;
    side.style.top = `${p.top + 2}px`;
    side.style.left = `${Math.max(0, p.left - 32)}px`;
  } else side.hidden = true;
  return { nested, top };
}

export function clickedBlock(target: HTMLElement): HTMLElement | null {
  const hit = target.closest<HTMLElement>('.embed, figure, hr, aside.callout');
  if (hit && !target.closest('figcaption')) return hit;
  if (target.matches(SECTION)) return target;
  if (target.matches('.col')) return target.parentElement as HTMLElement;
  return null;
}
