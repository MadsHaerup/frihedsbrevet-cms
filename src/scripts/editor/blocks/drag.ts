import { SECTION } from './constants';

export type DropSpot = { el: HTMLElement; before: boolean } | { col: HTMLElement };

function emptyColumn(target: HTMLElement, dragged: HTMLElement): HTMLElement | null {
  if (dragged.matches(SECTION)) return null;
  if (!target.matches('.col') || target.children.length) return null;
  return target;
}

function hoverBlock(
  target: HTMLElement,
  dragged: HTMLElement,
  y: number,
  surface: HTMLElement,
  blockAt: (node: EventTarget | null) => HTMLElement | null,
  nearestTop: (y: number) => HTMLElement | null,
): HTMLElement | null {
  let block = target === surface ? nearestTop(y) : blockAt(target);
  if (dragged.matches(SECTION)) {
    while (block && block.parentElement !== surface) block = block.parentElement;
  }
  if (!block || block === dragged || dragged.contains(block)) return null;
  return block;
}

function paintLine(line: HTMLElement, box: { top: number; bottom: number; left: number; width: number }, before: boolean) {
  line.hidden = false;
  line.style.top = `${(before ? box.top : box.bottom) - 2}px`;
  line.style.left = `${box.left}px`;
  line.style.width = `${box.width}px`;
}

function beginDrag(e: DragEvent, el: HTMLElement | null, pick: (el: HTMLElement) => void): HTMLElement | null {
  if (!el) {
    e.preventDefault();
    return null;
  }
  el.classList.add('dragging');
  pick(el);
  e.dataTransfer?.setData('text/plain', 'block');
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(el, 0, 0);
  }
  return el;
}

function nearestTop(surface: HTMLElement, y: number): HTMLElement | null {
  const kids = [...surface.children] as HTMLElement[];
  return kids.find((k) => k.getBoundingClientRect().bottom > y) ?? kids.at(-1) ?? null;
}

function moveDragged(dragged: HTMLElement, spot: DropSpot) {
  if ('col' in spot) {
    spot.col.append(dragged);
    return;
  }
  if (spot.before) spot.el.before(dragged);
  else spot.el.after(dragged);
}

export interface DragContext {
  form: HTMLFormElement;
  surface: HTMLElement;
  copy: HTMLElement;
  /** handle above a nested element / handle on the side of a top-level block */
  nested: HTMLButtonElement;
  side: HTMLButtonElement;
  hovered: () => { nested: HTMLElement | null; top: HTMLElement | null };
  blockAt: (node: EventTarget | null) => HTMLElement | null;
  rel: (el: HTMLElement) => { top: number; left: number; bottom: number; width: number };
  pick: (el: HTMLElement | null) => void;
  placeHandles: (el: HTMLElement | null) => void;
  markDirty: () => void;
}

/** Drag-to-reorder: grab a handle, a line shows the drop spot, drop moves the block. */
export function initDrag(ctx: DragContext) {
  const { surface, copy, nested, side, rel } = ctx;
  let dragged: HTMLElement | null = null;
  let drop: DropSpot | null = null;
  const line = document.createElement('div');
  line.className = 'drop-line';
  line.hidden = true;
  copy.append(line);

  const endDrag = () => {
    dragged?.classList.remove('dragging');
    dragged = null;
    drop = null;
    line.hidden = true;
  };
  nested.addEventListener('dragstart', (e) => {
    dragged = beginDrag(e, ctx.hovered().nested, ctx.pick);
  });
  side.addEventListener('dragstart', (e) => {
    dragged = beginDrag(e, ctx.hovered().top, ctx.pick);
  });
  [nested, side].forEach((h) => h.addEventListener('dragend', endDrag));

  surface.addEventListener('dragenter', (e) => dragged && e.preventDefault());
  surface.addEventListener('dragover', (e) => {
    if (!dragged) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    const target = e.target as HTMLElement;
    const col = emptyColumn(target, dragged);
    if (col) {
      drop = { col };
      line.hidden = true;
      return;
    }
    const block = hoverBlock(target, dragged, e.clientY, surface, ctx.blockAt, (y) => nearestTop(surface, y));
    if (!block) return;
    const rect = block.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    drop = { el: block, before };
    paintLine(line, rel(block), before);
  });
  surface.addEventListener('drop', (e) => {
    if (!dragged) return;
    e.preventDefault(); // never let the browser insert the drag payload as text
    if (!drop) {
      endDrag();
      return;
    }
    const moved = dragged;
    moveDragged(moved, drop);
    endDrag();
    // columns must never be left without a paragraph to type in
    surface.querySelectorAll('.col').forEach((c) => {
      if (!c.children.length) c.innerHTML = '<p><br></p>';
    });
    ctx.markDirty();
    ctx.placeHandles(moved);
    ctx.pick(moved);
  });

  return { active: () => dragged !== null };
}
