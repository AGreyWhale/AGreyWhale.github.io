/**
 * Assembles the full GitHub Pages site into ../_site:
 *   - the classic hand-written site (repo root files), and
 *   - the built game (game/dist)
 * at the paths chosen in site.config.ts (GAME_PATH).
 *
 *   GAME_PATH=/world/ (default): classic at /, game at /world/
 *   GAME_PATH=/               : game at /, classic at /classic/
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const gameDir = resolve(here, '..');
const repoRoot = resolve(gameDir, '..');
const out = join(repoRoot, '_site');
const dist = join(gameDir, 'dist');

// Mirror of site.config.ts (kept tiny so this script runs with plain node).
const norm = (p) => {
  let s = (p || '/').trim();
  if (!s.startsWith('/')) s = '/' + s;
  if (!s.endsWith('/')) s += '/';
  return s;
};
const GAME_PATH = norm(process.env.GAME_PATH ?? '/world/');
const CLASSIC_PATH = GAME_PATH === '/' ? '/classic/' : '/';

/** Repo-root entries that are NOT part of the classic site. */
const EXCLUDE = new Set(['.git', '.github', '.gitignore', '.vscode', 'game', '_site', 'node_modules', 'README.md']);
const EXCLUDE_NAMES = new Set(['Thumbs.db', '.DS_Store']);

if (!existsSync(join(dist, 'index.html'))) {
  console.error('[assemble] game/dist is missing. Run `npm run build` first.');
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const classicOut = join(out, CLASSIC_PATH);
mkdirSync(classicOut, { recursive: true });
for (const name of readdirSync(repoRoot)) {
  if (EXCLUDE.has(name) || EXCLUDE_NAMES.has(name)) continue;
  cpSync(join(repoRoot, name), join(classicOut, name), {
    recursive: true,
    filter: (src) => !EXCLUDE_NAMES.has(src.split(/[\\/]/).pop()),
  });
}

cpSync(dist, join(out, GAME_PATH), { recursive: true });

// Unknown URLs bounce to the game root; deep links use #/ hashes so they never get here.
writeFileSync(
  join(out, '404.html'),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Lost in town</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="3; url=${GAME_PATH}">
<style>body{font-family:system-ui,sans-serif;background:#fbf3e7;color:#2b2522;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:16px}a{color:#c8483c}</style>
</head><body><main><h1>This path wandered off the map.</h1>
<p>Taking you back to <a href="${GAME_PATH}">the town</a>, or jump to <a href="${CLASSIC_PATH}">the quick version</a>.</p></main></body></html>\n`,
);
writeFileSync(join(out, '.nojekyll'), '');

console.log(`[assemble] _site ready: classic at ${CLASSIC_PATH}, game at ${GAME_PATH}`);
