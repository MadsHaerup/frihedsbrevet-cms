const EMBED_HOSTS = new Set(['www.youtube-nocookie.com', 'www.youtube.com', 'player.vimeo.com', 'open.spotify.com']);

function isSpace(ch: string | undefined): boolean {
  return ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r';
}

function letter(ch: string): boolean {
  const folded = ch.toLowerCase();
  return folded >= 'a' && folded <= 'z';
}

function handlerNameEnd(html: string, start: number): number {
  let j = start;
  while (j < html.length) {
    if (isSpace(html[j]) || html[j] === '=' || html[j] === '>') return j;
    if (!letter(html[j])) return -1;
    j += 1;
  }
  return -1;
}

function isHandlerAt(html: string, i: number): boolean {
  if (!isSpace(html[i]) || html.slice(i + 1, i + 3).toLowerCase() !== 'on' || !letter(html[i + 3] ?? '')) return false;
  const end = handlerNameEnd(html, i + 3);
  if (end < 0) return false;
  let j = end;
  while (isSpace(html[j])) j += 1;
  return html[j] === '=';
}

function skipValue(html: string, i: number): number {
  const quote = html[i] === '"' || html[i] === "'" ? html[i] : '';
  let j = quote ? i + 1 : i;
  while (j < html.length && (quote ? html[j] !== quote : !isSpace(html[j]) && html[j] !== '>')) j += 1;
  return quote && html[j] === quote ? j + 1 : j;
}

function stripEventHandlers(html: string): string {
  let out = '';
  let i = 0;
  while (i < html.length) {
    if (!isHandlerAt(html, i)) {
      out += html[i];
      i += 1;
    } else {
      let j = html.indexOf('=', i);
      j += 1;
      while (isSpace(html[j])) j += 1;
      i = skipValue(html, j);
    }
  }
  return out;
}

/**
 * Small allow-list pass over rendered markdown HTML. Pieces may contain raw HTML
 * (callouts, figures, embeds); this strips scripts, event handlers, javascript: URLs
 * and iframes from unknown hosts.
 */
export function sanitizeHtml(html: string): string {
  const stripped = stripEventHandlers(
    html
      .replace(/<(script|style|object|embed|link|meta|form)\b[\s\S]*?(<\/\1>|$)/gi, '')
      .replace(/<iframe\b[^>]*>\s*(<\/iframe>)?/gi, (tag) => {
        const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? '';
        try {
          const u = new URL(src);
          return u.protocol === 'https:' && EMBED_HOSTS.has(u.hostname) ? tag : '';
        } catch {
          return '';
        }
      }),
  );
  return stripped.replace(/\b(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1=$2#$2');
}
