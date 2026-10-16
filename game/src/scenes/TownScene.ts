import { buildings } from '../content/buildings';
import { collectibles } from '../content/collectibles';
import { town, type TownPropDef } from '../content/town';
import type { ActionDef, CharacterAppearance } from '../content/types';
import type { GameContext } from '../core/GameContext';
import { seededRandom } from '../core/random';
import { Building } from '../entities/Building';
import { Door } from '../entities/Door';
import { Npc } from '../entities/Npc';
import { Player } from '../entities/Player';
import { Prop } from '../entities/Prop';
import { ellipse, type RenderEnv } from '../render/draw';
import { TownGround } from '../render/TownGround';
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
    for (const def of this.decorTrees()) this.entities.push(new Prop(def, () => undefined));
    this.spawnCollectibles('town');
    this.rebuildSolids();
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
    super.update(dt);
  }

  protected computeZoom(w: number, h: number): number {
    return Math.min(1.6, Math.max(0.7, Math.sqrt(w * h) / 760));
  }

  protected drawBackground(g: CanvasRenderingContext2D): void {
    this.ground.draw(g, this.ctx.camera, this.ctx.viewport.dpr);
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
