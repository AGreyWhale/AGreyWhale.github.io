/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { CLASSIC_PATH, GAME_PATH } from './site.config.ts';

const REPO_ROOT = resolve(import.meta.dirname, '..');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

/**
 * Dev only: serves the classic site (repo root) next to the game, so links like
 * "Skip to the quick version" and the resume PDF work under `npm run dev`.
 */
function classicSiteDevServer(): Plugin {
  return {
    name: 'classic-site-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
        if (!url.startsWith(CLASSIC_PATH)) return next();
        if (GAME_PATH !== '/' && url.startsWith(GAME_PATH)) return next();
        let rel = url.slice(CLASSIC_PATH.length);
        if (rel === '' || rel.endsWith('/')) rel += 'index.html';
        const file = normalize(join(REPO_ROOT, rel));
        if (!file.startsWith(REPO_ROOT) || file.startsWith(join(REPO_ROOT, 'game'))) return next();
        if (!existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader('Content-Type', MIME[extname(file).toLowerCase()] ?? 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
  };
}

/** Replaces %CLASSIC_URL% in index.html so no-JS fallbacks point at the right place. */
function htmlPaths(): Plugin {
  return {
    name: 'html-paths',
    transformIndexHtml: (html) => html.replaceAll('%CLASSIC_URL%', CLASSIC_PATH),
  };
}

export default defineConfig({
  base: GAME_PATH,
  define: {
    __CLASSIC_URL__: JSON.stringify(CLASSIC_PATH),
    __GAME_URL__: JSON.stringify(GAME_PATH),
  },
  plugins: [classicSiteDevServer(), htmlPaths()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 2048,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
