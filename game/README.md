# Gauri's Town (the game version of the site)

A cozy top-down town you can walk around to explore the portfolio. TypeScript +
Canvas 2D (drawn in code, no sprites) + DOM overlays, built with Vite.

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
| Town layout, notice board, villagers in town | `src/content/town.ts` |
| Cats (names, coats, how far they roam) and bird landing spots | `src/content/town.ts` (`cats`, `birds`); indoor cats in `src/content/interiors.ts` |
| Buildings (position, colors, room or panel) | `src/content/buildings.ts` |
| Room furniture and villagers inside rooms | `src/content/interiors.ts` |
| Character options and presets (colors, hair, outfit styles, free accessories) | `src/content/characters.ts` |
| Wardrobe rewards (what unlocks them, what they say) | `src/content/rewards.ts` |
| Projects shown in town but not on the classic site yet (e.g. Karura) | `src/content/projects.ts` |
| Hidden collectibles and coffee-cup fun facts | `src/content/collectibles.ts` |
| Photography gallery photos | `src/content/gallery.ts` (+ files in `src/assets/photos/`) |
| Boba Rush menu, round length, customer names | `src/content/boba.ts` |
| Bloom & Arrange flowers and customer requests (Greenhouse game) | `src/content/bouquet.ts` |
| Fountain wishes and the wizard hat's 5% chance | `src/content/wishes.ts` |
| How "Send a letter" delivers mail | `src/content/contact.ts` |
| Old TAMU site link, quick-version link | `src/content/links.ts` |
| Music: one piece per season × day/night, plus each mini game (procedural by default) | `src/content/audio.ts` |

## Adding a villager (NPC)

Add an entry to `npcs` in `src/content/town.ts` (outdoors) or to a room's
`npcs` array in `src/content/interiors.ts` (indoors, see Ada in the
Schoolhouse). Each needs an `id`, `name`, position, `appearance` (same options
as the character creator; `accessories` is a list) and `interact` with the
lines they say. `npm test` checks every NPC's action points at something real.

## Photos

Coursework photos and images are compressed to WebP at build time
(`public/generated/`, git-ignored). For the gallery, drop photos into
`src/assets/photos/` and list their file names in `src/content/gallery.ts`.

## Music

Music is generated live with WebAudio (no files, nothing copyrighted).
