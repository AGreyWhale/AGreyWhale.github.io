import { interiors, type InteriorDef } from '../content/interiors';
import type { ActionDef, CharacterAppearance } from '../content/types';
import type { GameContext } from '../core/GameContext';
import { Entity } from '../entities/Entity';
import { InteriorProp } from '../entities/InteriorProp';
import { Npc } from '../entities/Npc';
import { Player } from '../entities/Player';
import { fillRoundRect, shade, type RenderEnv } from '../render/draw';
import type { Interactable } from '../systems/InteractionSystem';
import { WorldScene } from './WorldScene';

const MAT_W = 68;

/** Doormat at the bottom of a room; stepping down onto it (or pressing E) leaves. */
class ExitMat extends Entity {
  private readonly target: Interactable;

  constructor(x: number, y: number, onExit: () => void) {
    super(x, y);
    this.target = { label: 'Head back outside', x, y: y - 6, reach: 28, interact: onExit };
  }

  override get sortY(): number {
    return -1e6 + 1;
  }

  override interactable(): Interactable {
    return this.target;
  }

  render(g: CanvasRenderingContext2D): void {
    const { x, y } = this.pos;
    fillRoundRect(g, x - MAT_W / 2, y - 22, MAT_W, 22, 6, '#c96f5a');
    fillRoundRect(g, x - MAT_W / 2 + 6, y - 16, MAT_W - 12, 10, 4, '#e39a7f');
  }
}

/**
 * Inside a building: a cozy room drawn from content/interiors.ts. Furniture
 * opens content panels. Lazy-loaded (with its painters) on first entry.
 */
export class InteriorScene extends WorldScene {
  readonly def: InteriorDef;
  private exiting = false;

  constructor(
    ctx: GameContext,
    interiorId: string,
    appearance: CharacterAppearance,
    private readonly onExit: () => void,
  ) {
    const def = interiors[interiorId];
    if (!def) throw new Error(`Unknown interior "${interiorId}"`);
    const { width: W, height: H, wallHeight: WH } = def;
    super(ctx, new Player(W / 2, H - 22, appearance), { x: -40, y: -30, w: W + 80, h: H + 70 }, { x: 14, y: WH - 2, w: W - 28, h: H - WH - 4 });
    this.def = def;
    this.player.facing = 'up';
    this.nightAmbient = [128, 112, 168];

    const act = (action: ActionDef) => ctx.bus.emit('action', { action });
    this.entities.push(this.player, new ExitMat(W / 2, H + 2, () => this.leave()));
    for (const p of def.props) this.entities.push(new InteriorProp(p, WH, (i) => act(i.action)));
    for (const n of def.npcs ?? []) this.entities.push(new Npc(n, this.player, (i) => act(i.action)));
    this.spawnCollectibles(def.id);
    this.rebuildSolids();
  }

  override enter(): void {
    super.enter();
    this.ctx.bus.emit('toast', this.def.welcome);
  }

  private leave(): void {
    if (this.exiting) return;
    this.exiting = true;
    this.onExit();
  }

  protected override afterUpdate(): void {
    const { width: W, height: H } = this.def;
    const onMat = Math.abs(this.player.pos.x - W / 2) < MAT_W / 2 - 6 && this.player.pos.y >= H - 10;
    if (onMat && this.ctx.input.move.y > 0.5) this.leave();
  }

  protected override nightAmount(env: RenderEnv): number {
    return env.night * 0.72;
  }

  protected computeZoom(w: number, h: number): number {
    // Fit the whole room when possible; on narrow phones zoom in and let the camera follow.
    const fit = Math.max(Math.min(w / (this.def.width + 70), h / (this.def.height + 110)), Math.min(0.9, Math.min(w, h) / 470));
    return Math.min(2.1, Math.max(0.55, fit));
  }

  protected drawBackground(g: CanvasRenderingContext2D, env: RenderEnv): void {
    const { width: W, height: H, wallHeight: WH, wall, wallTrim, floor, floorColors } = this.def;

    // Outer walls (thickness around the room)
    const frame = shade(wall, -0.35);
    fillRoundRect(g, -14, -14, W + 28, H + 30, 14, frame);

    // Floor (clipped so planks/tiles never spill past the walls)
    g.save();
    g.beginPath();
    g.rect(0, WH, W, H - WH);
    g.clip();
    g.fillStyle = floorColors[0];
    g.fillRect(0, WH, W, H - WH);
    if (floor === 'wood') {
      const row = 24;
      for (let y = WH, r = 0; y < H; y += row, r++) {
        g.fillStyle = r % 2 ? floorColors[1] : floorColors[0];
        g.fillRect(0, y, W, row);
        g.fillStyle = shade(floorColors[0], -0.1);
        g.fillRect(0, y + row - 1.5, W, 1.5);
        for (let x = (r % 3) * 50 + 30; x < W; x += 150) g.fillRect(x, y, 1.5, row);
      }
    } else {
      const s = 44;
      for (let y = WH, r = 0; y < H; y += s, r++) {
        for (let x = 0, c = 0; x < W; x += s, c++) {
          g.fillStyle = (r + c) % 2 ? floorColors[1] : floorColors[0];
          g.fillRect(x, y, s, s);
        }
      }
    }

    g.restore();

    // Back wall: crown, wainscot, trim, baseboard
    g.fillStyle = wall;
    g.fillRect(0, 0, W, WH);
    g.fillStyle = shade(wall, -0.05);
    g.fillRect(0, WH - 36, W, 36);
    g.fillStyle = wallTrim;
    g.fillRect(0, WH - 38, W, 4);
    g.fillRect(0, WH - 7, W, 7);
    g.fillStyle = shade(wall, 0.15);
    g.fillRect(0, 0, W, 6);

    // Soft shadow where the wall meets the floor.
    const grad = g.createLinearGradient(0, WH, 0, WH + 34);
    grad.addColorStop(0, 'rgba(60, 40, 50, 0.16)');
    grad.addColorStop(1, 'rgba(60, 40, 50, 0)');
    g.fillStyle = grad;
    g.fillRect(0, WH, W, 34);

    // Doorway gap in the front wall
    g.fillStyle = floorColors[0];
    g.fillRect(W / 2 - MAT_W / 2 - 6, H, MAT_W + 12, 16);

    // Sunbeams from windows by day
    const sun = 0.13 * (1 - env.night);
    if (sun > 0.01) {
      g.fillStyle = `rgba(255, 244, 210, ${sun})`;
      for (const p of this.def.props) {
        if (p.kind !== 'window') continue;
        g.beginPath();
        g.moveTo(p.x - 30, WH);
        g.lineTo(p.x + 30, WH);
        g.lineTo(p.x + 90, WH + 150);
        g.lineTo(p.x + 10, WH + 150);
        g.closePath();
        g.fill();
      }
    }
  }
}
