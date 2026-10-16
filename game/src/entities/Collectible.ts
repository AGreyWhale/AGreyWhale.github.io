import type { CollectibleDef } from '../content/collectibles';
import { circle, ellipse, fillRoundRect, shadow, type Ctx, type RenderEnv } from '../render/draw';
import type { Rect } from '../systems/CollisionSystem';
import type { Light } from '../systems/LightingSystem';
import { Entity } from './Entity';

/** A small hidden item that's picked up by walking over it. */
export class Collectible extends Entity {
  static readonly PICKUP_RADIUS = 24;
  private readonly phase: number;

  constructor(readonly def: CollectibleDef) {
    super(def.x, def.y);
    this.phase = (def.x * 13 + def.y * 7) % 10;
  }

  override bounds(): Rect {
    return { x: this.pos.x - 20, y: this.pos.y - 40, w: 40, h: 46 };
  }

  override lights(): Light[] {
    return [{ x: this.pos.x, y: this.pos.y - 12, radius: 46, color: [255, 236, 170], intensity: 0.7 }];
  }

  render(g: CanvasRenderingContext2D, env: RenderEnv): void {
    const t = env.time + this.phase;
    const bob = env.reducedMotion ? 0 : Math.sin(t * 2.4) * 2.5;
    const { x, y } = this.pos;
    shadow(g, x, y, 9 - bob * 0.4, 3, 0.18);
    const cy = y - 14 + bob;
    PAINTERS[this.def.kind](g, x, cy);
    // Twinkle
    const tw = env.reducedMotion ? 0.6 : (Math.sin(t * 3.1) + 1) / 2;
    g.fillStyle = `rgba(255, 255, 255, ${0.35 + 0.6 * tw})`;
    const sx = x + 9;
    const sy = cy - 10;
    const r = 2 + tw * 2;
    g.beginPath();
    g.moveTo(sx, sy - r);
    g.lineTo(sx + r * 0.3, sy - r * 0.3);
    g.lineTo(sx + r, sy);
    g.lineTo(sx + r * 0.3, sy + r * 0.3);
    g.lineTo(sx, sy + r);
    g.lineTo(sx - r * 0.3, sy + r * 0.3);
    g.lineTo(sx - r, sy);
    g.lineTo(sx - r * 0.3, sy - r * 0.3);
    g.fill();
  }
}

const PAINTERS: Record<CollectibleDef['kind'], (g: Ctx, x: number, y: number) => void> = {
  coffee(g, x, y) {
    fillRoundRect(g, x - 6, y - 6, 12, 13, [2, 2, 5, 5], '#fff7ec');
    fillRoundRect(g, x - 6, y - 1, 12, 4, 0, '#c98a5e');
    g.strokeStyle = '#fff7ec';
    g.lineWidth = 2.2;
    g.beginPath();
    g.arc(x + 7, y + 1, 3, -Math.PI / 2, Math.PI / 2);
    g.stroke();
    ellipse(g, x, y - 6, 6, 1.8, '#7a4e3a');
  },
  polaroid(g, x, y) {
    g.save();
    g.translate(x, y);
    g.rotate(-0.12);
    fillRoundRect(g, -8, -9, 16, 19, 1.5, '#fffdf8');
    fillRoundRect(g, -6, -7, 12, 11, 1, '#9fc8e4');
    ellipse(g, -1, 2, 6, 2.5, '#9ccf86');
    circle(g, 3, -3, 2, '#f6d66b');
    g.restore();
  },
  pearl(g, x, y) {
    circle(g, x, y, 7, '#3a2b30');
    circle(g, x - 2.2, y - 2.4, 2.2, 'rgba(255,255,255,0.55)');
  },
  flower(g, x, y) {
    g.strokeStyle = '#5f9a55';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x, y + 2);
    g.lineTo(x, y + 12);
    g.stroke();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      circle(g, x + Math.cos(a) * 4.2, y + Math.sin(a) * 4.2, 3.4, '#f49cb0');
    }
    circle(g, x, y, 2.6, '#f7c948');
  },
};
