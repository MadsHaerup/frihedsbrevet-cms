import { icon, type IconName } from '../../../lib/icons';
import { GAPS, LAYOUTS, RULE, ROUNDED, SECTION, WIDTHS } from './constants';
import type { BlockHooks } from './types';

/** Markup for the floating bar that edits the selected block (what it offers depends on the block type). */
function btn(act: string, label: string, ic: IconName, on = false, extra = '') {
  return `<button type="button" data-act="${act}" ${extra} data-tip="${label}" aria-label="${label}" aria-pressed="${on}">${icon(ic)}</button>`;
}

function gapButton(tr: BlockHooks['tr'], name: string, current: string) {
  const on = current === name;
  const label = tr(`blk.gap.${name}`);
  const cls = on ? 'txt on' : 'txt';
  return `<button type="button" data-act="gap:${name}" class="${cls}" aria-pressed="${on}" data-tip="${tr('blk.gap')}">${label}</button>`;
}

function widthRow(tr: BlockHooks['tr'], current: string) {
  return WIDTHS.map((x) => btn(`width:${x}`, tr(`blk.width.${x}`), x, current === x)).join('');
}

function roundedButton(tr: BlockHooks['tr'], el: HTMLElement) {
  return RULE + btn('rounded', tr('blk.rounded'), 'rounded', el.hasAttribute(ROUNDED));
}

function parentButton(tr: BlockHooks['tr'], el: HTMLElement): string {
  const parentSec = el.parentElement?.closest(SECTION);
  if (!parentSec || !el.parentElement?.classList.contains('col')) return '';
  return `<button type="button" data-act="parent" class="txt" data-tip="${tr('blk.parent')}">${icon('parent')}${tr('blk.parent')}</button>${RULE}`;
}

function figureButtons(tr: BlockHooks['tr'], el: HTMLElement): string {
  if (!el.matches('figure')) return '';
  const replace = `<button type="button" data-act="replace" class="txt" data-tip="${tr('blk.replace')}">${icon('replace')}${tr('blk.replace')}</button>${RULE}`;
  return replace + widthRow(tr, el.dataset.width ?? 'normal') + roundedButton(tr, el);
}

function sectionButtons(tr: BlockHooks['tr'], el: HTMLElement): string {
  if (!el.matches(SECTION)) return '';
  const layout = el.dataset.layout ?? 'stack';
  const width = el.dataset.width ?? 'normal';
  const gap = el.dataset.gap ?? 'md';
  const align = el.dataset.align ?? 'start';
  const layouts = LAYOUTS.map((x) => btn(`layout:${x}`, tr(`blk.layout.${x}`), x, layout === x)).join('') + RULE;
  const gaps = GAPS.map((x) => gapButton(tr, x, gap)).join('') + RULE;
  const sides = btn('align:start', tr('blk.align.start'), 'start', align === 'start');
  const center = btn('align:center', tr('blk.align.center'), 'center', align === 'center');
  return layouts + widthRow(tr, width) + RULE + gaps + sides + center + RULE + btn('addcol', tr('blk.addCol'), 'col');
}

function embedButtons(tr: BlockHooks['tr'], el: HTMLElement): string {
  const width = el.dataset.width ?? 'normal';
  const iframe = el.querySelector('iframe');
  if (!el.classList.contains('embed') || el.tagName === 'FIGURE' || !iframe) return '';
  return widthRow(tr, width) + roundedButton(tr, el);
}

export function barMarkup(tr: BlockHooks['tr'], el: HTMLElement): string {
  const body = parentButton(tr, el) + figureButtons(tr, el) + sectionButtons(tr, el) + embedButtons(tr, el);
  return body + (body ? RULE : '') + btn('remove', tr('blk.remove'), 'remove');
}
