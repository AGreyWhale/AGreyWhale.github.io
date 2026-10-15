# Gauri's Town (the game version of the site)

A cozy top-down town you can walk around to explore the portfolio. TypeScript +
Canvas 2D (drawn in code, no sprites) + DOM overlays, built with Vite.

The classic site at the repo root is untouched. Its text is **read at build
time** (`scripts/extract-content.mjs` parses `../index.html`), so editing
`index.html` updates the town on the next build.

## Run it

```bash
cd game
npm install
npm run dev            # http://localhost:5173/world/  (classic site also served at /)
npm test               # unit tests
npm run preview:site   # production build of BOTH sites, served at http://localhost:4173/
```

## Where to edit things

| What | File |
| --- | --- |
| Panel titles, which research/project each object shows | `src/content/panels.ts` |
| Town layout, notice board, villager lines | `src/content/town.ts` |
| Buildings (position, colors) | `src/content/buildings.ts` |
| Room furniture | `src/content/interiors.ts` |
| Character options | `src/content/characters.ts` |
| Old TAMU site link, quick-version link | `src/content/links.ts` |
| Music (procedural by default) | `src/content/audio.ts` |

## Music

Music is generated live with WebAudio (no files, nothing copyrighted). To use
real tracks, drop **properly licensed**, short looping files in
`src/assets/audio/` and follow the instructions at the top of
`src/content/audio.ts`.

## Root vs /world/

`GAME_PATH` (in `site.config.ts`, and the env in `.github/workflows/deploy.yml`)
controls where the town lives. `/world/` = classic at `/`, town at `/world/`.
`/` = town at `/`, classic at `/classic/`.
