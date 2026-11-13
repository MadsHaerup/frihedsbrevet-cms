// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from './serialize';

const md = (html: string) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  return htmlToMarkdown(root);
};

describe('editor HTML to Markdown', () => {
  it('serializes headings, inline marks, links and lists', () => {
    expect(md('<h2>Title</h2><p>One <strong>bold</strong> and <em>it</em> <a href="/x">link</a></p><ul><li>a</li><li>b</li></ul>'))
      .toBe('## Title\n\nOne **bold** and *it* [link](/x)\n\n- a\n- b');
  });

  it('keeps layout blocks Markdown cannot express as raw HTML', () => {
    expect(md('<section class="sec" data-layout="grid-2"><div class="col"><p>x</p></div></section>'))
      .toBe('<section class="sec" data-layout="grid-2"><div class="col"><p>x</p></div></section>');
    expect(md('<p class="dropcap">Hello</p>')).toBe('<p class="dropcap">Hello</p>');
  });

  it('writes a plain figure as a Markdown image', () => {
    expect(md('<figure><img src="/u/a.webp" alt="A"></figure>')).toBe('![A](/u/a.webp)');
  });

  it('keeps the extra-bold step as inline HTML', () => {
    expect(md('<p>a <strong class="x2">b</strong> <strong>c</strong></p>')).toBe('a <strong class="x2">b</strong> **c**');
  });
});
