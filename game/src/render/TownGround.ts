import type { Camera } from '../core/Camera';
import { seededRandom } from '../core/random';
import { ellipse } from './draw';

/** Colors for the ground layer (seasons will swap these in Phase 3). */
export interface GroundStyle {
  grass: string;
  grassLight: string;
  grassDark: string;
  path: string;
  pathEdge: string;
  plaza: string;
  plazaEdge: string;
}

export const DEFAULT_GROUND: GroundStyle = {
  grass: '#a9d18e',
  grassLight: '#bbdc9f',
  grassDark: '#93c17b',
  path: '#efdfbf',
  pathEdge: '#dcc39b',
  plaza: '#f0e7d9',
  plazaEdge: '#d9cab4',
};

export interface GroundLayout {
  width: number;
  height: number;
  paths: Array<Array<[number, number]>>;
  plaza: { x: number; y: number; r: number };
  seed: number;
}

/** Distance from point to segment, for keeping grass tufts off the paths. */
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/**
 * Pre-renders the static ground (grass, paths, plaza) into an offscreen canvas
 * once, then blits only the visible part each frame. Rebuilt when the resolution
 * or style changes.
 */
export class TownGround {
  private cache: HTMLCanvasElement | null = null;
  private scale = 0;
  private style: GroundStyle = DEFAULT_GROUND;

  constructor(private readonly layout: GroundLayout) {}

  /** Whether a world point is on a path or the plaza (with margin). */
  onPath(x: number, y: number, margin = 0): boolean {
    const { plaza, paths } = this.layout;
    if (Math.hypot(x - plaza.x, y - plaza.y) < plaza.r + margin) return true;
    for (const line of paths) {
      for (let i = 0; i < line.length - 1; i++) {
        if (distToSegment(x, y, line[i][0], line[i][1], line[i + 1][0], line[i + 1][1]) < 24 + margin) return true;
      }
    }
    return false;
  }

  setStyle(style: GroundStyle): void {
    if (style === this.style) return;
    this.style = style;
    this.cache = null;
  }

  draw(g: CanvasRenderingContext2D, camera: Camera, dpr: number): void {
    const scale = Math.min(1.25, Math.max(0.5, camera.zoom * dpr));
    if (!this.cache || Math.abs(scale - this.scale) > 0.15) this.build(scale);
    const L = this.layout;
    const v = camera.visibleRect(4);
    const sx = Math.max(0, v.x);
    const sy = Math.max(0, v.y);
    const sw = Math.min(L.width, v.x + v.w) - sx;
    const sh = Math.min(L.height, v.y + v.h) - sy;
    if (sw <= 0 || sh <= 0) return;
    g.drawImage(this.cache!, sx * this.scale, sy * this.scale, sw * this.scale, sh * this.scale, sx, sy, sw, sh);
  }

  private build(scale: number): void {
    const L = this.layout;
    const s = this.style;
    const c = document.createElement('canvas');
    c.width = Math.ceil(L.width * scale);
    c.height = Math.ceil(L.height * scale);
    const g = c.getContext('2d')!;
    g.scale(scale, scale);
    const rnd = seededRandom(L.seed);

    g.fillStyle = s.grass;
    g.fillRect(0, 0, L.width, L.height);

    // Soft light/dark patches give the grass gentle variation.
    for (let i = 0; i < 70; i++) {
      const x = rnd() * L.width;
      const y = rnd() * L.height;
      g.globalAlpha = 0.45;
      ellipse(g, x, y, 60 + rnd() * 120, 30 + rnd() * 60, rnd() < 0.5 ? s.grassLight : s.grassDark);
    }
    g.globalAlpha = 1;

    // Paths: edge stroke, then fill stroke.
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (const [width, color] of [
      [52, s.pathEdge],
      [44, s.path],
    ] as const) {
      g.lineWidth = width;
      g.strokeStyle = color;
      for (const line of L.paths) {
        g.beginPath();
        line.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.stroke();
      }
    }

    // Plaza with subtle rings.
    const p = L.plaza;
    ellipse(g, p.x, p.y, p.r + 6, p.r + 6, s.plazaEdge);
    ellipse(g, p.x, p.y, p.r, p.r, s.plaza);
    g.strokeStyle = s.plazaEdge;
    g.globalAlpha = 0.5;
    g.lineWidth = 2;
    for (const r of [p.r * 0.72, p.r * 0.45]) {
      g.beginPath();
      g.arc(p.x, p.y, r, 0, Math.PI * 2);
      g.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      g.beginPath();
      g.moveTo(p.x + Math.cos(a) * p.r * 0.72, p.y + Math.sin(a) * p.r * 0.72);
      g.lineTo(p.x + Math.cos(a) * p.r, p.y + Math.sin(a) * p.r);
      g.stroke();
    }
    g.globalAlpha = 1;

    // Pebbles along paths.
    for (let i = 0; i < 260; i++) {
      const x = rnd() * L.width;
      const y = rnd() * L.height;
      if (!this.onPath(x, y, -4)) continue;
      ellipse(g, x, y, 2 + rnd() * 2, 1.5 + rnd(), s.pathEdge);
    }

    // Grass tufts and tiny wildflowers, kept off the paths.
    g.strokeStyle = s.grassDark;
    g.lineWidth = 1.6;
    g.lineCap = 'round';
    for (let i = 0; i < 1400; i++) {
      const x = rnd() * L.width;
      const y = rnd() * L.height;
      if (this.onPath(x, y, 6)) continue;
      if (rnd() < 0.08) {
        ellipse(g, x, y, 1.8, 1.8, rnd() < 0.5 ? '#fffaf0' : '#f6d66b');
        continue;
      }
      g.beginPath();
      g.moveTo(x - 3, y - 4);
      g.lineTo(x, y);
      g.lineTo(x + 3, y - 4);
      g.moveTo(x, y);
      g.lineTo(x, y - 5);
      g.stroke();
    }

    this.cache = c;
    this.scale = scale;
  }
}
