import type { CatCoat } from '../content/types';
import { circle, ellipse, shadow, type Ctx } from './draw';

const INK = '#3a2b30';

const COATS: Record<CatCoat, { body: string; dark: string; belly: string; patch?: string }> = {
  orange: { body: '#eaa25a', dark: '#c97b3a', belly: '#fbe3c4' },
  grey: { body: '#a9abb6', dark: '#878a97', belly: '#ecebf0' },
  tuxedo: { body: '#3c3742', dark: '#2a2630', belly: '#f4f1ec' },
  calico: { body: '#fbf3e8', dark: '#e3d6c4', belly: '#fffaf2', patch: '#e9a35a' },
};

export type CatPose = 'sit' | 'walk' | 'loaf' | 'petted';

export interface CatDrawState {
  pose: CatPose;
  /** -1 facing left, 1 facing right. */
  dir: number;
  /** Walk cycle, radians. */
  walk: number;
  time: number;
}

function ear(g: Ctx, x: number, y: number, tilt: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x - 3, y + 1);
  g.lineTo(x + tilt, y - 6);
  g.lineTo(x + 3, y + 1);
  g.closePath();
  g.fill();
}

function closedEyes(g: Ctx, x: number, y: number, gap: number): void {
  g.strokeStyle = INK;
  g.lineWidth = 1.1;
  g.lineCap = 'round';
  for (const ex of [x - gap, x + gap]) {
    g.beginPath();
    g.arc(ex, y, 1.5, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
  }
}

/** A small round cat with its feet at (x, y). */
export function drawCat(g: Ctx, x: number, y: number, coat: CatCoat, s: CatDrawState): void {
  const c = COATS[coat];
  const d = s.dir;
  shadow(g, x, y, s.pose === 'walk' || s.pose === 'loaf' ? 13 : 10, 3.5, 0.18);

  if (s.pose === 'walk') {
    // Side view: legs, long body, tail up, head forward.
    const step = Math.sin(s.walk);
    for (const [lx, ph] of [
      [-7, 0],
      [-3, Math.PI],
      [4, Math.PI],
      [8, 0],
    ] as const) {
      const lift = Math.max(0, Math.sin(s.walk + ph)) * 2;
      ellipse(g, x + lx * d, y - 2 - lift, 2, 2.6, c.dark);
    }
    g.strokeStyle = c.dark;
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x - 10 * d, y - 9);
    g.quadraticCurveTo(x - 17 * d, y - 14 + step, x - 14 * d, y - 22 + step);
    g.stroke();
    ellipse(g, x, y - 8, 12, 6.5, c.body);
    ellipse(g, x + 1 * d, y - 6, 8, 3.5, c.belly);
    if (c.patch) ellipse(g, x - 4 * d, y - 10, 5, 3.5, c.patch);
    if (coat === 'orange' || coat === 'grey') {
      g.strokeStyle = c.dark;
      g.lineWidth = 1.5;
      for (const sx of [-5, 0, 5]) {
        g.beginPath();
        g.moveTo(x + sx * d, y - 14);
        g.lineTo(x + (sx + 1) * d, y - 10);
        g.stroke();
      }
    }
    const hx = x + 11 * d;
    const hy = y - 14 + Math.abs(step) * 0.6;
    ear(g, hx - 3.5, hy - 4, -1 * d, c.body);
    ear(g, hx + 3, hy - 4, 1 * d, c.body);
    circle(g, hx, hy, 6.5, c.body);
    circle(g, hx + 3 * d, hy + 1, 1.2, INK);
    ellipse(g, hx + 5.5 * d, hy + 2.5, 1.1, 0.8, '#e58aa2');
    return;
  }

  if (s.pose === 'loaf') {
    // Curled up asleep, tail wrapped round, a sleepy "z".
    ellipse(g, x, y - 6, 12, 6.5, c.body);
    if (c.patch) ellipse(g, x - 3, y - 8, 5, 3.2, c.patch);
    g.strokeStyle = c.dark;
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(x, y - 4, 11, 0.2 * Math.PI, 0.8 * Math.PI);
    g.stroke();
    const hx = x + 7 * d;
    ear(g, hx - 3, y - 13, -1, c.body);
    ear(g, hx + 3, y - 13, 1, c.body);
    circle(g, hx, y - 9, 6, c.body);
    closedEyes(g, hx, y - 9, 2.4);
    const zt = (s.time * 0.5) % 1;
    g.fillStyle = `rgba(90, 100, 80, ${0.7 * (1 - zt)})`;
    g.font = '600 8px "Space Grotesk", sans-serif';
    g.fillText('z', hx + 6 * d, y - 18 - zt * 10);
    return;
  }

  // Sitting (also while being petted): 3/4 view.
  const purr = s.pose === 'petted' ? Math.sin(s.time * 30) * 0.4 : 0;
  g.strokeStyle = c.dark;
  g.lineWidth = 3;
  g.lineCap = 'round';
  const sway = Math.sin(s.time * 1.8) * 2;
  g.beginPath();
  g.moveTo(x - 6 * d, y - 3);
  g.quadraticCurveTo(x - 15 * d, y - 4, x - 13 * d, y - 14 + sway);
  g.stroke();
  ellipse(g, x, y - 8, 9, 8.5, c.body);
  ellipse(g, x + 1 * d, y - 6, 5.5, 5.5, c.belly);
  if (c.patch) ellipse(g, x - 4 * d, y - 11, 4.5, 3.5, c.patch);
  ellipse(g, x - 3, y - 1, 2.6, 1.8, c.belly);
  ellipse(g, x + 3, y - 1, 2.6, 1.8, c.belly);
  const hx = x + 2 * d + purr;
  const hy = y - 19;
  ear(g, hx - 4, hy - 4, -1, c.body);
  ear(g, hx + 4, hy - 4, 1, c.body);
  ellipse(g, hx - 4, hy - 5, 1.2, 1.6, '#f3b3bf');
  ellipse(g, hx + 4, hy - 5, 1.2, 1.6, '#f3b3bf');
  circle(g, hx, hy, 7, c.body);
  if (c.patch) ellipse(g, hx + 3, hy - 3, 3, 2.4, '#3c3742');
  if (s.pose === 'petted') closedEyes(g, hx, hy, 2.6);
  else {
    const blink = s.time % 3.7 > 3.55;
    ellipse(g, hx - 2.6, hy, 1.2, blink ? 0.3 : 1.6, INK);
    ellipse(g, hx + 2.6, hy, 1.2, blink ? 0.3 : 1.6, INK);
  }
  ellipse(g, hx, hy + 2.2, 1.2, 0.8, '#e58aa2');
  g.strokeStyle = 'rgba(58, 43, 48, 0.4)';
  g.lineWidth = 0.7;
  g.beginPath();
  for (const side of [-1, 1]) {
    g.moveTo(hx + side * 2.5, hy + 2.6);
    g.lineTo(hx + side * 7.5, hy + 2);
    g.moveTo(hx + side * 2.5, hy + 3.2);
    g.lineTo(hx + side * 7.5, hy + 4);
  }
  g.stroke();
}

/** A heart, for petting. */
export function drawHeart(g: Ctx, x: number, y: number, size: number, alpha: number): void {
  g.fillStyle = `rgba(229, 110, 140, ${alpha})`;
  g.beginPath();
  g.moveTo(x, y + size * 0.9);
  g.bezierCurveTo(x - size * 1.6, y - size * 0.2, x - size * 0.7, y - size * 1.3, x, y - size * 0.4);
  g.bezierCurveTo(x + size * 0.7, y - size * 1.3, x + size * 1.6, y - size * 0.2, x, y + size * 0.9);
  g.fill();
}

export const BIRD_COLORS = [
  { body: '#a07a5a', belly: '#efe0cc', wing: '#7d5e45' }, // sparrow
  { body: '#6ea2d6', belly: '#f3d2b3', wing: '#4f80b3' }, // bluebird
  { body: '#7a6a60', belly: '#e9805a', wing: '#5c4f47' }, // robin
];

/**
 * A little bird. (x, y) is its spot on the ground; `z` is height above it, so
 * flying birds get a shadow below them.
 */
export function drawBird(g: Ctx, x: number, y: number, z: number, dir: number, flap: number, peck: number, colorIdx: number): void {
  const c = BIRD_COLORS[colorIdx % BIRD_COLORS.length];
  const flying = z > 0.5;
  shadow(g, x, y, flying ? Math.max(2, 5 - z * 0.02) : 5, 1.8, flying ? Math.max(0.04, 0.16 - z * 0.001) : 0.18);
  const by = y - 5 - z;
  if (!flying) {
    g.strokeStyle = '#d98a4e';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x - 1.5, y);
    g.lineTo(x - 1, by + 2);
    g.moveTo(x + 1.5, y);
    g.lineTo(x + 1, by + 2);
    g.stroke();
  }
  // Tail
  g.fillStyle = c.wing;
  g.beginPath();
  g.moveTo(x - 4 * dir, by);
  g.lineTo(x - 9 * dir, by - 2);
  g.lineTo(x - 8.5 * dir, by + 1.5);
  g.closePath();
  g.fill();
  ellipse(g, x, by, 5.5, 4, c.body);
  ellipse(g, x + 1 * dir, by + 1.4, 3.6, 2.4, c.belly);
  // Wing: folded on the ground, flapping in the air.
  if (flying) {
    const up = Math.sin(flap) * 6;
    g.fillStyle = c.wing;
    g.beginPath();
    g.ellipse(x - 1 * dir, by - 2 - up * 0.5, 5, 2.2, -0.4 * dir - up * 0.08 * dir, 0, Math.PI * 2);
    g.fill();
  } else {
    ellipse(g, x - 1 * dir, by - 0.5, 3.6, 2.4, c.wing);
  }
  const hx = x + 4.5 * dir;
  const hy = by - 3 + peck * 4;
  circle(g, hx, hy, 2.8, c.body);
  circle(g, hx + 1 * dir, hy - 0.5, 0.8, INK);
  g.fillStyle = '#f2b24c';
  g.beginPath();
  g.moveTo(hx + 2.4 * dir, hy - 0.6);
  g.lineTo(hx + 5 * dir, hy + 0.2);
  g.lineTo(hx + 2.4 * dir, hy + 1);
  g.closePath();
  g.fill();
}
