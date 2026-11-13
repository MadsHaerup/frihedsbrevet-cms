import { activeRange, nearestBlock, selectContents } from './selection';

function replaceBlock(block: HTMLElement, tag: string) {
  if (block.tagName.toLowerCase() === tag) return;
  const next = document.createElement(tag);
  next.append(...block.childNodes);
  block.replaceWith(next);
  selectContents(next);
}

export function setBlock(surface: HTMLElement, tag: string) {
  const block = nearestBlock(surface);
  if (block) replaceBlock(block, tag);
}

function toggleInline(tag: string) {
  const range = activeRange();
  if (!range) return;
  const host = (range.commonAncestorContainer instanceof HTMLElement
    ? range.commonAncestorContainer
    : range.commonAncestorContainer.parentElement
  )?.closest(tag);
  if (host instanceof HTMLElement && host.contains(range.startContainer) && host.contains(range.endContainer)) {
    unwrapInline(host, range);
    return;
  }
  if (range.collapsed) {
    const el = document.createElement(tag);
    const marker = document.createTextNode('\u200b');
    el.append(marker);
    range.insertNode(el);
    const caret = document.createRange();
    caret.setStart(marker, marker.length);
    caret.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(caret);
    return;
  }
  const el = document.createElement(tag);
  el.append(range.extractContents());
  range.insertNode(el);
  selectContents(el);
}

/** The bold element the selection sits in, or the one the selection covers exactly. */
function boldAround(range: Range): HTMLElement | null {
  const node = range.commonAncestorContainer;
  const el = node instanceof HTMLElement ? node : node.parentElement;
  const host = el?.closest('strong');
  if (host instanceof HTMLElement && host.contains(range.startContainer) && host.contains(range.endContainer)) return host;
  const text = range.toString();
  if (!text) return null;
  const covered = [...(el?.querySelectorAll('strong') ?? [])].find((s) => s.textContent === text && range.intersectsNode(s));
  return covered instanceof HTMLElement ? covered : null;
}

/** Bold cycles: normal, bold, extra bold (`strong.x2`), back to normal. The selection stays on the text throughout. */
function cycleBold() {
  const range = activeRange();
  if (!range) return;
  const host = boldAround(range);
  if (!host) {
    toggleInline('strong');
    return;
  }
  if (!host.classList.contains('x2')) {
    host.classList.add('x2');
    selectContents(host);
    return;
  }
  const nodes = [...host.childNodes];
  unwrapInline(host, range);
  if (!nodes.length || !nodes[0].isConnected) return;
  const again = document.createRange();
  again.setStartBefore(nodes[0]);
  again.setEndAfter(nodes[nodes.length - 1]);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(again);
}

function inlineHasContent(el: HTMLElement) {
  if (el.querySelector('img, br')) return true;
  return [...el.childNodes].some((node) => node.textContent !== '');
}

function unwrapInline(host: HTMLElement, range: Range) {
  const whole = document.createRange();
  whole.selectNodeContents(host);
  const coversAll = range.compareBoundaryPoints(Range.START_TO_START, whole) <= 0
    && range.compareBoundaryPoints(Range.END_TO_END, whole) >= 0;
  const marker = document.createTextNode('');
  const frag = document.createDocumentFragment();
  if (coversAll) {
    frag.append(...host.childNodes, marker);
  } else {
    const lead = document.createElement(host.tagName);
    const tail = document.createElement(host.tagName);
    const before = whole.cloneRange();
    before.setEnd(range.startContainer, range.startOffset);
    const after = whole.cloneRange();
    after.setStart(range.endContainer, range.endOffset);
    lead.append(before.cloneContents());
    tail.append(after.cloneContents());
    if (inlineHasContent(lead)) frag.append(lead);
    frag.append(marker, range.cloneContents());
    if (inlineHasContent(tail)) frag.append(tail);
  }
  host.replaceWith(frag);
  const caret = document.createRange();
  caret.setStart(marker, 0);
  caret.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(caret);
}

function toggleList(surface: HTMLElement, ordered: boolean) {
  const tag = ordered ? 'ol' : 'ul';
  const block = nearestBlock(surface);
  if (!block) return;
  const list = block.closest('ul,ol');
  if (list instanceof HTMLElement && surface.contains(list)) {
    if (list.tagName.toLowerCase() === tag) {
      const paras = [...list.children].map((li) => {
        const p = document.createElement('p');
        p.append(...li.childNodes);
        return p;
      });
      list.replaceWith(...paras);
      const first = paras[0];
      if (first) selectContents(first);
      return;
    }
    replaceBlock(list, tag);
    return;
  }
  const li = document.createElement('li');
  li.append(...block.childNodes);
  const next = document.createElement(tag);
  next.append(li);
  block.replaceWith(next);
  selectContents(li);
}

function toggleBlock(surface: HTMLElement, tag: string) {
  const block = nearestBlock(surface);
  const list = block?.closest('ul, ol');
  if (block?.tagName === 'LI' && list instanceof HTMLElement && surface.contains(list) && list.children.length === 1) {
    const next = document.createElement(tag);
    next.append(...block.childNodes);
    list.replaceWith(next);
    selectContents(next);
    return;
  }
  setBlock(surface, block?.tagName.toLowerCase() === tag ? 'p' : tag);
}

export function applySimple(surface: HTMLElement, cmd: string) {
  if (cmd === 'bold') cycleBold();
  if (cmd === 'italic') toggleInline('em');
  if (cmd === 'underline') toggleInline('u');
  if (cmd === 'ul') toggleList(surface, false);
  if (cmd === 'ol') toggleList(surface, true);
  if (cmd === 'h2') toggleBlock(surface, 'h2');
  if (cmd === 'quote') toggleBlock(surface, 'blockquote');
}
