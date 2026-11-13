import { LIST_UPDATED } from '../shared/selectors';

/**
 * Search as you type: refetch the list for the new query and swap just the list in place
 * (keeps focus and caret in the field). Clearing the field brings the full list back.
 */
export function initLiveSearch() {
  const input = document.querySelector<HTMLInputElement>('form.search input[name="q"]');
  if (!input) return;
  let timer = 0;
  let ticket = 0;
  const run = async () => {
    const params = new URLSearchParams(location.search);
    params.delete('open');
    params.delete('error');
    const v = input.value.trim();
    if (v) params.set('q', v);
    else params.delete('q');
    const qs = params.toString();
    const url = location.pathname + (qs ? `?${qs}` : '');
    ticket += 1;
    const mine = ticket;
    const res = await fetch(url, { headers: { accept: 'text/html' } });
    if (!res.ok || mine !== ticket) return; // a newer keystroke superseded this response
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    for (const sel of ['.list', '.list-meta']) {
      const next = doc.querySelector(sel);
      const cur = document.querySelector(sel);
      if (next && cur) cur.replaceWith(next);
    }
    history.replaceState(history.state, '', url);
    document.dispatchEvent(new Event(LIST_UPDATED));
  };
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = window.setTimeout(run, 160);
  });
}
