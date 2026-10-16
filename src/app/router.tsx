import { AnchorHTMLAttributes, ReactNode, useEffect, useState } from 'react';
import { matchPath, parseHash } from '../utils/route';

/** Tiny hash router (#/path?query). Works on any static host with no server rewrite rules. */
export interface Route {
  path: string;
  query: URLSearchParams;
}

function read(): Route {
  return parseHash(window.location.hash);
}

export function navigate(to: string, opts: { replace?: boolean } = {}): void {
  const target = `#${to.startsWith('/') ? to : `/${to}`}`;
  if (opts.replace) window.location.replace(target);
  else window.location.hash = target;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

/** Matches "/lesson/:id" style patterns. Returns params or null. */
export const match = matchPath;

export function Link({ to, children, ...rest }: { to: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  return (
    <a href={`#${to}`} {...rest}>
      {children}
    </a>
  );
}
