/** Pure helpers for the hash router (kept free of React so they are easy to test). */
export interface ParsedHash {
  path: string;
  query: URLSearchParams;
}

export function parseHash(hash: string): ParsedHash {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path: path.startsWith('/') ? path : `/${path}`, query: new URLSearchParams(qs) };
}

/** Matches "/lesson/:id" style patterns. Returns params or null. */
export function matchPath(path: string, pattern: string): Record<string, string> | null {
  const a = path.split('/').filter(Boolean);
  const b = pattern.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < b.length; i++) {
    if (b[i].startsWith(':')) {
      try {
        params[b[i].slice(1)] = decodeURIComponent(a[i]);
      } catch {
        return null;
      }
    } else if (b[i] !== a[i]) return null;
  }
  return params;
}
