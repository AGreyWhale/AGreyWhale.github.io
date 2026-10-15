/**
 * Where things live on GitHub Pages.
 *
 * FLIP SWITCH: GAME_PATH decides where the town is served.
 *   "/world/" (default) → classic site at "/",         town at "/world/"
 *   "/"                 → town at "/",                 classic site at "/classic/"
 *
 * You can change the default below, or set the GAME_PATH environment variable
 * (the deploy workflow passes it through, see .github/workflows/deploy.yml).
 */
const DEFAULT_GAME_PATH = '/world/';

function normalizePath(p: string): string {
  let s = p.trim() || '/';
  if (!s.startsWith('/')) s = '/' + s;
  if (!s.endsWith('/')) s += '/';
  return s;
}

export const GAME_PATH = normalizePath(process.env.GAME_PATH ?? DEFAULT_GAME_PATH);

/** The existing hand-written site (also the "quick version" of the portfolio). */
export const CLASSIC_PATH = GAME_PATH === '/' ? '/classic/' : '/';
