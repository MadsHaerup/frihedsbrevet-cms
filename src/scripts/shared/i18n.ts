// Strings come from the server (see src/i18n) so the UI follows the active locale.


const T: Record<string, string> = (() => {
  try {
    return JSON.parse(document.getElementById('i18n')?.textContent ?? '{}');
  } catch {
    return {};
  }
})();
export const tr = (k: string) => T[k] ?? k;
export const LANG = document.documentElement.lang || 'da';
export const collectionLabel = (type: string) => tr(`coll.${type}`);
