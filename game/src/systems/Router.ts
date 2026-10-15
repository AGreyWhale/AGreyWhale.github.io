/** Where in the game a URL points. */
export type Route = { name: 'town' } | { name: 'building'; id: string };

/** Parses "#/b/<id>" → building, anything else → town. Pure, so it's unit-tested. */
export function parseRoute(hash: string): Route {
  const m = /^#\/b\/([a-z0-9-]+)\/?$/i.exec(hash.trim());
  return m ? { name: 'building', id: m[1].toLowerCase() } : { name: 'town' };
}

export function routeToHash(route: Route): string {
  return route.name === 'building' ? `#/b/${route.id}` : '#/';
}

/**
 * Hash-based routing: deep links like /world/#/b/lab never hit the server, so
 * GitHub Pages can't 404 them. Uses replaceState so walking in and out of
 * buildings doesn't flood the back button.
 */
export class Router {
  private listeners: Array<(r: Route) => void> = [];

  constructor() {
    window.addEventListener('hashchange', () => {
      const r = this.current;
      this.listeners.forEach((fn) => fn(r));
    });
  }

  get current(): Route {
    return parseRoute(location.hash);
  }

  set(route: Route): void {
    const hash = routeToHash(route);
    if (location.hash === hash || (hash === '#/' && location.hash === '')) return;
    history.replaceState(null, '', hash);
  }

  /** Fires when the user edits the hash or navigates with back/forward. */
  onChange(fn: (r: Route) => void): void {
    this.listeners.push(fn);
  }
}
