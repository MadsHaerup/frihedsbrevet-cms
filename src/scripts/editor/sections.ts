/** Sections must only contain columns. Editing can leave strays behind, which blows up the grid. */
export function normalizeSections(surface: HTMLElement) {
  surface.querySelectorAll<HTMLElement>('section.sec').forEach((sec) => {
    absorbStrays(sec);
    if (!sec.querySelector(':scope > .col')) sec.innerHTML = '<div class="col"><p><br></p></div>';
    sec.querySelectorAll<HTMLElement>(':scope > .col').forEach((col) => {
      if (!col.children.length) col.innerHTML = '<p><br></p>';
    });
  });
}

function absorbStrays(sec: HTMLElement) {
  let col: HTMLElement | null = null;
  [...sec.childNodes].forEach((node) => {
    if (node instanceof HTMLElement && node.classList.contains('col')) {
      col = null;
      return;
    }
    if (node.nodeType === Node.TEXT_NODE && !(node.textContent ?? '').trim()) return;
    if (!col) {
      col = document.createElement('div');
      col.className = 'col';
      node.before(col);
    }
    col.append(node);
  });
}
