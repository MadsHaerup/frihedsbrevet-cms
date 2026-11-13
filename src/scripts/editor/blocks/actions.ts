import { ROUNDED, SECTION } from './constants';
import type { ActApi } from './types';

function setAttr(el: HTMLElement, key: string, value: string, fallback: string) {
  if (value === fallback) el.removeAttribute(`data-${key}`);
  else el.setAttribute(`data-${key}`, value);
}

function addColumn(el: HTMLElement) {
  const col = document.createElement('div');
  col.className = 'col';
  col.innerHTML = '<p><br></p>';
  el.append(col);
}

export function mutateBlock(act: string, value: string, el: HTMLElement, api: ActApi): boolean {
  if (act === 'parent') {
    api.pick(el.closest(SECTION));
    return false;
  }
  if (act === 'replace') {
    api.replace(el);
    return false;
  }
  if (act === 'remove') {
    el.remove();
    api.clear();
    api.hide();
    return true;
  }
  if (act === 'rounded') {
    el.toggleAttribute(ROUNDED);
    return true;
  }
  if (act === 'addcol') {
    addColumn(el);
    return true;
  }
  const fallback: Record<string, string> = { layout: 'stack', width: 'normal', gap: 'md', align: 'start' };
  if (!(act in fallback)) return false;
  setAttr(el, act, value, fallback[act]);
  return true;
}
