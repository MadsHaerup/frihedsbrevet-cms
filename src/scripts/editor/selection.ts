const BLOCKS = 'p,h1,h2,h3,h4,blockquote,pre,li';

export function nearestBlock(surface: HTMLElement): HTMLElement | null {
  const node = window.getSelection()?.anchorNode;
  const el = node instanceof HTMLElement ? node : node?.parentElement;
  const hit = el?.closest(BLOCKS);
  return hit instanceof HTMLElement && surface.contains(hit) ? hit : null;
}

export function activeRange(): Range | null {
  const sel = window.getSelection();
  return sel?.rangeCount ? sel.getRangeAt(0) : null;
}

export function selectContents(el: HTMLElement) {
  const item = el.matches('ul, ol') ? el.querySelector('li') : null;
  const caret = document.createRange();
  caret.selectNodeContents(item ?? el);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(caret);
}

export function createLink(url: string) {
  const range = activeRange();
  if (!range || range.collapsed) return;
  const link = document.createElement('a');
  link.href = url;
  link.append(range.extractContents());
  range.insertNode(link);
}

export function currentBlock(surface: HTMLElement, tag: string): HTMLElement | null {
  const node = window.getSelection()?.anchorNode;
  const el = node instanceof HTMLElement ? node : node?.parentElement;
  const hit = el?.closest(tag) as HTMLElement | null;
  return hit && surface.contains(hit) ? hit : null;
}
