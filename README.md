# AGreyWhale.github.io

Gauri Agrawal's personal site, in two flavors, both served by GitHub Pages:

| | What | Where it lives | URL (default) |
| --- | --- | --- | --- |
| **Classic site** | The fast, hand-written portfolio (also the game's "quick version") | repo root: `index.html`, `courses.html`, `style.css`, … | `https://agreywhale.github.io/` |
| **Gauri's Town** | A cozy walkable town version of the portfolio | `game/` (TypeScript + Vite + Canvas 2D) | `https://agreywhale.github.io/world/` |

The town **reads its content from the classic site at build time**
(`game/scripts/extract-content.mjs` parses `index.html` and `courses.html`), so
you only ever edit your text in one place.

---

## Local development

Requires Node 20.19+ (Node 24 recommended).

```bash
cd game
npm install
npm run dev           # live-reloading town at http://localhost:5173/world/
                      # (the classic site is served at http://localhost:5173/ too)
npm test              # unit tests (also re-extracts content first)
```

To edit the classic site, just edit the HTML/CSS at the repo root and open
`index.html` in a browser, as before.

## Production preview (exactly what Pages will serve)

```bash
cd game
npm run preview:site  # builds the town, assembles _site/, serves http://localhost:4173/
```

`_site/` holds the classic site at `/` and the town at `/world/`, plus a
`404.html`. It is git-ignored.

## Deploying to GitHub Pages

Deployment is automated by `.github/workflows/deploy.yml`: on every push to
`main` it installs, runs the tests, builds the town, assembles `_site/`, and
publishes it with the official `configure-pages`, `upload-pages-artifact` and
`deploy-pages` actions.


## Making the town the homepage (flip root ↔ /world/)

One setting controls it: `GAME_PATH`.

| `GAME_PATH` | Town | Classic site |
| --- | --- | --- |
| `/world/` (default) | `/world/` | `/` |
| `/` | `/` | `/classic/` |

To flip: in `.github/workflows/deploy.yml`, change `GAME_PATH: /world/` to
`GAME_PATH: /`, then push to `main`. (For local builds, also change
`DEFAULT_GAME_PATH` in `game/site.config.ts`, or run e.g.
`GAME_PATH=/ npm run preview:site`.) All "Skip to the quick version" links
update automatically. Flip back the same way.

Deep links inside the town use hashes (e.g. `/world/#/b/lab`), so they never
404 on GitHub Pages.



## Music

The town's music is generated live in the browser with WebAudio (calm lo-fi
by day, softer at night), so there are no audio files and no licensing
concerns. Nothing plays until the visitor presses Start, and the mute
choice is remembered.




## Project layout

```
index.html, courses.html, style.css, script.js, images/, *.pdf   classic site (unchanged)
.github/workflows/deploy.yml                                     build + deploy to Pages
game/
  site.config.ts        GAME_PATH switch
  scripts/              extract-content (build-time content), assemble (_site), serve-site
  src/core/             Game, SceneManager, GameLoop, Camera, Vec2, EventBus, Viewport
  src/scenes/           Scene, WorldScene, StartScene, TownScene, InteriorScene
  src/entities/         Entity, Player, Building, Door, Prop, Npc, Collectible, InteriorProp
  src/systems/          Input, Collision, Interaction, Audio, Save, Theme, Season, Weather,
                        Footprints, Lighting, Collectibles, Router, contact/
  src/minigames/        MiniGame (base), BobaGame
  src/ui/               DialogOverlay, Hud, CharacterSelect, TouchControls, panels…
  src/render/           Canvas painters (characters, buildings, props, seasons)
  src/content/          All text and layout data
  tests/                Vitest unit tests
```
