import { buildings } from '../content/buildings';
import { collectibles } from '../content/collectibles';
import { town, type TownPropDef } from '../content/town';
import type { ActionDef, CharacterAppearance } from '../content/types';
import type { GameContext } from '../core/GameContext';
import { seededRandom } from '../core/random';
import { Bird } from '../entities/Bird';
import { Building } from '../entities/Building';
import { Cat } from '../entities/Cat';
import { Door } from '../entities/Door';
import { Npc } from '../entities/Npc';
import { Player } from '../entities/Player';
import { Prop } from '../entities/Prop';
import { ellipse, type RenderEnv } from '../render/draw';
import { seasonPalette } from '../render/seasons';
import { TownGround } from '../render/TownGround';
import { FootprintTrail } from '../systems/FootprintSystem';
import type { Season } from '../systems/SaveManager';
import { WeatherSystem } from '../systems/WeatherSystem';
import { rectsOverlap, type Rect } from '../systems/CollisionSystem';
import { WorldScene } from './WorldScene';

/**
 * The town square hub: ground, paths, buildings, props and villagers, all
 * built from content/town.ts and content/buildings.ts. Doubles as the
 * animated backdrop of the start screen ("attract" mode).
 */
export class TownScene extends WorldScene {
  private readonly ground: TownGround;
  private attractT = 0;
  private readonly weather = new WeatherSystem();
  private readonly footprints = new FootprintTrail();
  private season: Season | null = null;
  private lastCam = { x: 0, y: 0 };

  constructor(ctx: GameContext, appearance: CharacterAppearance) {
    const world: Rect = { x: 0, y: 0, w: town.width, h: town.height };
    const walk: Rect = { x: 50, y: 110, w: town.width - 100, h: town.height - 160 };
    super(ctx, new Player(town.spawn.x, town.spawn.y, appearance), world, walk);
    this.backdrop = '#7fae6c';
    this.ground = new TownGround({ width: town.width, height: town.height, paths: town.paths, plaza: town.plaza, seed: town.decorSeed });

    const act = (action: ActionDef) => ctx.bus.emit('action', { action });
    this.entities.push(this.player);
    for (const def of buildings) {
      if (def.interior) {
        this.entities.push(new Building(def));
        this.entities.push(new Door(def, this.player, () => act({ type: 'enter', building: def.id })));
      } else if (def.panel) {
        const panel = def.panel;
        this.entities.push(new Building(def, () => act({ type: 'panel', panel })));
      }
    }
    for (const def of town.props) this.entities.push(new Prop(def, (i) => act(i.action)));
    for (const def of town.npcs) this.entities.push(new Npc(def, this.player, (i) => act(i.action)));
    for (const def of town.cats) this.entities.push(new Cat(def, this.collision, (c) => this.petted(c)));
    for (let i = 0; i < town.birds.count; i++) {
      this.entities.push(new Bird(town.birds.spots, this.player, () => this.controllable && ctx.audio.play('chirp'), i));
    }
    for (const def of this.decorTrees()) this.entities.push(new Prop(def, () => undefined));
    this.spawnCollectibles('town');
    this.rebuildSolids();
  }

  private petted(cat: Cat): void {
    this.ctx.bus.emit('cat:petted', { id: cat.def.id, name: cat.def.name });
  }

  setAppearance(a: CharacterAppearance): void {
    this.player.appearance = a;
  }

  /** Start screen mode: hidden player, slow drifting camera. */
  setAttract(on: boolean): void {
    this.controllable = !on;
    this.player.visible = !on;
  }

  /** Puts the player just outside a building's door, facing the street. */
  placeAtDoor(buildingId: string): void {
    const b = buildings.find((d) => d.id === buildingId);
    if (!b) return;
    this.player.pos.set(b.x, b.y + 34);
    this.player.facing = 'down';
    this.ctx.camera.snapTo(this.cameraTarget());
  }

  placeAtSpawn(): void {
    this.player.pos.set(town.spawn.x, town.spawn.y);
    this.player.facing = 'up';
  }

  protected override cameraTarget(): { x: number; y: number } {
    if (this.controllable) return super.cameraTarget();
    const a = this.ctx.env.reducedMotion ? 0.6 : this.attractT * 0.05;
    return { x: town.plaza.x + Math.cos(a) * 140, y: town.plaza.y - 40 + Math.sin(a) * 70 };
  }

  override update(dt: number): void {
    this.attractT += dt;
    const { env, camera, viewport } = this.ctx;
    if (env.season !== this.season) this.applySeason(env.season);
    super.update(dt);

    // Snow footprints follow the player in winter.
    if (env.season === 'winter' && this.controllable) this.footprints.track(this.player.pos.x, this.player.pos.y);
    this.footprints.update(dt);

    // Weather drifts against camera motion so it feels like part of the world.
    const camDx = (camera.pos.x - this.lastCam.x) * camera.zoom;
    const camDy = (camera.pos.y - this.lastCam.y) * camera.zoom;
    this.lastCam = { x: camera.pos.x, y: camera.pos.y };
    const jump = Math.abs(camDx) > 200 || Math.abs(camDy) > 200;
    this.weather.update(dt, viewport.width, viewport.height, env.season, env.night, env.reducedMotion, jump ? 0 : camDx, jump ? 0 : camDy);
  }

  override render(g: CanvasRenderingContext2D): void {
    super.render(g);
    this.weather.render(g, this.ctx.viewport.dpr, this.ctx.env.night);
  }

  /** Recolors the ground and clears season-specific effects. */
  private applySeason(season: Season): void {
    this.season = season;
    const pal = seasonPalette(season);
    this.ground.setStyle(pal.ground);
    this.backdrop = pal.ground.grassDark;
    this.footprints.clear();
  }

  protected computeZoom(w: number, h: number): number {
    return Math.min(1.6, Math.max(0.7, Math.sqrt(w * h) / 760));
  }

  protected drawBackground(g: CanvasRenderingContext2D): void {
    this.ground.draw(g, this.ctx.camera, this.ctx.viewport.dpr);
    for (const p of this.footprints.all) {
      const a = this.footprints.opacity(p) * 0.5;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.angle);
      // Wide ball of the foot in front (direction of travel), small heel behind.
      ellipse(g, 1.6, 0, 3, 2.3, `rgba(120, 140, 165, ${a})`);
      ellipse(g, -3.2, 0, 1.7, 1.6, `rgba(120, 140, 165, ${a})`);
      g.restore();
    }
  }

  /** Slow, soft cloud shadows drifting across town by day. */
  protected override drawForeground(g: CanvasRenderingContext2D, env: RenderEnv): void {
    const alpha = 0.06 * (1 - env.night);
    if (alpha < 0.005) return;
    const span = town.width + 800;
    for (let i = 0; i < 4; i++) {
      const drift = env.reducedMotion ? 0 : env.time * 9;
      const cx = ((drift + i * 560) % span) - 400;
      const cy = 180 + i * 330;
      const c = `rgba(40, 50, 90, ${alpha})`;
      ellipse(g, cx, cy, 170, 70, c);
      ellipse(g, cx + 110, cy + 25, 120, 55, c);
      ellipse(g, cx - 90, cy + 30, 100, 45, c);
    }
  }

  /** Scatters a forest ring around the edge plus a few trees in open meadows. */
  private decorTrees(): TownPropDef[] {
    const rnd = seededRandom(town.decorSeed * 101);
    const W = town.width;
    const H = town.height;
    const keepOut: Rect[] = [
      ...buildings.map((b) => ({ x: b.x - b.width / 2 - 50, y: b.y - b.wallHeight - b.roofHeight - 30, w: b.width + 100, h: b.wallHeight + b.roofHeight + 110 })),
      ...town.props.map((p) => ({ x: p.x - 55, y: p.y - 70, w: 110, h: 110 })),
      ...town.npcs.map((n) => ({ x: n.x - 40, y: n.y - 50, w: 80, h: 80 })),
      ...collectibles.filter((c) => c.where === 'town').map((c) => ({ x: c.x - 30, y: c.y - 30, w: 60, h: 50 })),
      { x: town.spawn.x - 50, y: town.spawn.y - 60, w: 100, h: 100 },
    ];
    const ok = (x: number, y: number) =>
      !this.ground.onPath(x, y, 36) && !keepOut.some((r) => rectsOverlap(r, { x: x - 22, y: y - 20, w: 44, h: 30 }));

    const out: TownPropDef[] = [];
    const add = (x: number, y: number, big = false) => {
      if (!ok(x, y)) return;
      const kind = rnd() < 0.4 ? 'pine' : 'tree';
      out.push({ kind, x: Math.round(x), y: Math.round(y), scale: (big ? 1.05 : 0.9) + rnd() * 0.25, variant: rnd() < 0.5 ? 0 : 1 });
    };

    for (let x = 20; x < W; x += 58 + rnd() * 20) {
      add(x, 60 + rnd() * 20, true);
      add(x + 25, 115 + rnd() * 25);
      add(x, H - 10 - rnd() * 15, true);
      add(x + 25, H - 60 - rnd() * 20);
    }
    for (let y = 150; y < H - 60; y += 58 + rnd() * 20) {
      add(20 + rnd() * 15, y, true);
      add(70 + rnd() * 20, y + 25);
      add(W - 20 - rnd() * 15, y, true);
      add(W - 70 - rnd() * 20, y + 25);
    }
    for (let i = 0; i < 60; i++) add(150 + rnd() * (W - 300), 180 + rnd() * (H - 360));
    return out;
  }
}
