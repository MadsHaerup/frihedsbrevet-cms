function escText(s: string) {
  const slash = String.fromCodePoint(92);
  const tick = '`';
  return s.replaceAll(slash, slash + slash).replaceAll('*', slash + '*').replaceAll('_', slash + '_').replaceAll(tick, slash + tick);
}

const MARKS: Record<string, [string, string]> = {
  STRONG: ['**', '**'],
  B: ['**', '**'],
  EM: ['*', '*'],
  I: ['*', '*'],
  U: ['<u>', '</u>'],
};

function inlineMarkup(node: HTMLElement, inner: string): string | undefined {
  if (node.tagName === 'STRONG' && node.classList.contains('x2')) return `<strong class="x2">${inner}</strong>`;
  const marks = MARKS[node.tagName];
  if (marks) return marks[0] + inner + marks[1];
  if (node.tagName === 'CODE') return `\`${node.textContent ?? ''}\``;
  if (node.tagName === 'A') return `[${inner}](${node.getAttribute('href') ?? ''})`;
  if (node.tagName === 'IMG') return `![${node.getAttribute('alt') ?? ''}](${node.getAttribute('src') ?? ''})`;
  if (node.tagName === 'BR') return '\n';
  return undefined;
}

function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escText(node.textContent ?? '');
  if (!(node instanceof HTMLElement)) return '';
  const inner = [...node.childNodes].map(inline).join('');
  return inlineMarkup(node, inner) ?? inner;
}

function liText(li: Element) {
  return [...li.childNodes]
    .map((n) => {
      if (n instanceof HTMLElement && (n.tagName === 'UL' || n.tagName === 'OL')) return '';
      if (n instanceof HTMLElement && n.tagName === 'P') return [...n.childNodes].map(inline).join('');
      return inline(n);
    })
    .join('')
    .split('\n')
    .map((part) => part.trim())
    .join(' ')
    .trim();
}

/** Blocks markdown can't express are stored as single-line raw HTML. */
function raw(node: HTMLElement): string {
  const c = node.cloneNode(true) as HTMLElement;
  [c, ...c.querySelectorAll<HTMLElement>('*')].forEach((el) => {
    el.removeAttribute('contenteditable');
    el.classList.remove('is-selected', 'dragging');
    if (!el.getAttribute('class')) el.removeAttribute('class');
  });
  c.querySelectorAll('figcaption').forEach((cap) => {
    if (!(cap.textContent ?? '').trim()) cap.remove();
  });
  return c.outerHTML.split('\n').map((part) => part.trim()).join(' ');
}

function plainText(node: HTMLElement): string {
  return [...node.childNodes].map(inline).join('').trim();
}

function headingBlock(node: HTMLElement, marks: string): string {
  return `${marks} ${plainText(node)}`.trim();
}

function listBlock(node: HTMLElement, marker: (index: number) => string): string {
  return [...node.querySelectorAll(':scope > li')].map((li, i) => `${marker(i)} ${liText(li)}`).join('\n');
}

function figureBlock(node: HTMLElement): string {
  const img = node.querySelector('img');
  const cap = (node.querySelector('figcaption')?.textContent ?? '').trim();
  if (img && !cap) return `![${img.getAttribute('alt') ?? ''}](${img.getAttribute('src') ?? ''})`;
  return raw(node);
}

function quoteBlock(node: HTMLElement): string {
  const inner = [...node.childNodes].map(block).filter(Boolean).join('\n\n');
  return inner.split('\n').map((line) => `> ${line}`).join('\n');
}

function keepsRawHtml(node: HTMLElement): boolean {
  const tag = node.tagName;
  if (tag === 'SECTION' || tag === 'ASIDE') return true;
  if (tag === 'DIV' && node.classList.contains('embed')) return true;
  if (tag === 'P' && node.classList.contains('dropcap')) return true;
  return tag === 'BLOCKQUOTE' && node.classList.contains('pull');
}

const HASHES: Record<string, string> = { H1: '#', H2: '##', H3: '###' };

function fence(node: HTMLElement): string {
  return '```\n' + (node.textContent ?? '').replace(/\n$/, '') + '\n```';
}

function renderBlock(node: HTMLElement): string {
  const hashes = HASHES[node.tagName];
  if (hashes) return headingBlock(node, hashes);
  if (node.tagName === 'HR') return '---';
  if (node.tagName === 'FIGURE') return figureBlock(node);
  if (node.tagName === 'UL') return listBlock(node, () => '-');
  if (node.tagName === 'OL') return listBlock(node, (i) => `${i + 1}.`);
  if (node.tagName === 'BLOCKQUOTE') return quoteBlock(node);
  if (node.tagName === 'PRE') return fence(node);
  return plainText(node);
}

function block(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return escText((node.textContent ?? '').trim());
  if (!(node instanceof HTMLElement)) return '';
  if (keepsRawHtml(node)) return raw(node);
  return renderBlock(node);
}

export function htmlToMarkdown(root: HTMLElement) {
  return [...root.childNodes].map(block).filter((s) => s !== '').join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}
