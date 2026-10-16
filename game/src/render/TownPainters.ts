import type { TownPropKind } from '../content/town';
import { seededRandom } from '../core/random';
import { circle, ellipse, fillRoundRect, mixColor, shade, shadow, type Ctx, type RenderEnv } from './draw';

export interface PropDrawArgs {
  x: number;
  y: number;
  scale: number;
  variant: number;
  text?: string;
}

type Painter = (g: Ctx, a: PropDrawArgs, env: RenderEnv) => void;

const sway = (env: RenderEnv, x: number, amt = 1.5) => (env.reducedMotion ? 0 : Math.sin(env.time * 0.8 + x * 0.013) * amt);

const TREE_COLORS = [
  { base: '#7db66b', dark: '#629a57', light: '#a3d083' },
  { base: '#8cc27b', dark: '#6ea862', light: '#b4dc93' },
];

const tree: Painter = (g, { x, y, scale: s, variant }, env) => {
  const c = TREE_COLORS[variant % TREE_COLORS.length];
  const w = sway(env, x);
  shadow(g, x + 4, y, 30 * s, 10 * s, 0.17);
  fillRoundRect(g, x - 5 * s, y - 28 * s, 10 * s, 28 * s, 4 * s, '#8c6448');
  circle(g, x + w, y - 52 * s, 30 * s, c.dark);
  circle(g, x - 15 * s + w, y - 50 * s, 21 * s, c.base);
  circle(g, x + 15 * s + w, y - 52 * s, 22 * s, c.base);
  circle(g, x + w * 1.3, y - 66 * s, 24 * s, c.base);
  circle(g, x - 8 * s + w * 1.3, y - 72 * s, 11 * s, c.light);
};

const pine: Painter = (g, { x, y, scale: s }, env) => {
  const w = sway(env, x, 1);
  shadow(g, x + 3, y, 22 * s, 8 * s, 0.17);
  fillRoundRect(g, x - 4 * s, y - 16 * s, 8 * s, 16 * s, 3 * s, '#7d5a43');
  const tiers = [
    { y: -14, hw: 26, h: 34, c: '#4f8d64' },
    { y: -36, hw: 21, h: 30, c: '#5c9d70' },
    { y: -56, hw: 15, h: 26, c: '#6aac7c' },
  ];
  g.save();
  g.lineJoin = 'round';
  g.lineWidth = 6 * s;
  for (const t of tiers) {
    const ox = w * (1 - t.y / 80);
    g.beginPath();
    g.moveTo(x - t.hw * s + ox, y + t.y * s);
    g.lineTo(x + t.hw * s + ox, y + t.y * s);
    g.lineTo(x + ox, y + (t.y - t.h) * s);
    g.closePath();
    g.fillStyle = t.c;
    g.strokeStyle = t.c;
    g.fill();
    g.stroke();
  }
  g.restore();
};

const bush: Painter = (g, { x, y, scale: s }) => {
  shadow(g, x + 2, y, 22 * s, 6 * s, 0.15);
  circle(g, x - 11 * s, y - 10 * s, 11 * s, '#6aa75f');
  circle(g, x + 11 * s, y - 10 * s, 11 * s, '#6aa75f');
  circle(g, x, y - 15 * s, 14 * s, '#7cb86c');
  circle(g, x - 4 * s, y - 20 * s, 6 * s, '#9ccf86');
};

const FLOWER_SETS = [
  ['#f49cb0', '#fde2e7', '#f7c948'],
  ['#f7d36b', '#ffffff', '#f2a65a'],
  ['#b9a3e3', '#f2ecff', '#f49cb0'],
];

const flowers: Painter = (g, { x, y, variant }, env) => {
  const rnd = seededRandom(Math.round(x * 31 + y * 17));
  const set = FLOWER_SETS[variant % FLOWER_SETS.length];
  ellipse(g, x, y - 4, 30, 11, 'rgba(98, 150, 80, 0.35)');
  for (let i = 0; i < 9; i++) {
    const fx = x + (rnd() - 0.5) * 50;
    const fy = y - 4 + (rnd() - 0.5) * 16;
    const bobY = env.reducedMotion ? 0 : Math.sin(env.time * 1.6 + i) * 0.6;
    g.strokeStyle = '#5f9a55';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(fx, fy);
    g.lineTo(fx, fy - 7);
    g.stroke();
    const c = set[i % set.length];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      circle(g, fx + Math.cos(a) * 2.4, fy - 9 + bobY + Math.sin(a) * 2.4, 2.1, c);
    }
    circle(g, fx, fy - 9 + bobY, 1.5, '#f3bd45');
  }
};

const lamp: Painter = (g, { x, y }, env) => {
  shadow(g, x, y, 10, 4, 0.18);
  fillRoundRect(g, x - 6, y - 7, 12, 7, 3, '#4f4a5e');
  fillRoundRect(g, x - 2.5, y - 60, 5, 56, 2.5, '#5a5469');
  fillRoundRect(g, x - 9, y - 76, 18, 18, 6, '#4f4a5e');
  fillRoundRect(g, x - 6, y - 73, 12, 12, 4, mixColor('#f4efe2', '#ffd57e', env.night));
  fillRoundRect(g, x - 11, y - 80, 22, 6, 3, '#4f4a5e');
};

const bench: Painter = (g, { x, y }) => {
  shadow(g, x, y, 30, 6, 0.15);
  fillRoundRect(g, x - 24, y - 10, 4, 10, 2, '#6d4f3e');
  fillRoundRect(g, x + 20, y - 10, 4, 10, 2, '#6d4f3e');
  fillRoundRect(g, x - 28, y - 34, 56, 9, 4, '#c99367');
  fillRoundRect(g, x - 28, y - 24, 56, 4, 2, '#a97754');
  fillRoundRect(g, x - 28, y - 18, 56, 9, 4, '#b9835a');
};

const fountain: Painter = (g, { x, y }, env) => {
  const stone = '#ddd6cd';
  const water = mixColor('#93cfe2', '#5f7fb8', env.night * 0.6);
  shadow(g, x, y - 4, 82, 22, 0.13);
  ellipse(g, x, y - 18, 74, 34, shade(stone, -0.18));
  ellipse(g, x, y - 26, 74, 34, stone);
  ellipse(g, x, y - 28, 62, 26, water);

  // Ripples
  g.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    const t = env.reducedMotion ? (i + 0.5) / 3 : (env.time * 0.35 + i / 3) % 1;
    g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - t)})`;
    g.beginPath();
    g.ellipse(x, y - 28, 14 + t * 44, 6 + t * 18, 0, 0, Math.PI * 2);
    g.stroke();
  }

  fillRoundRect(g, x - 8, y - 66, 16, 40, 6, shade(stone, -0.06));
  ellipse(g, x, y - 66, 24, 9, stone);
  ellipse(g, x, y - 67, 18, 6, water);

  // Water arcs
  const n = 14;
  for (let i = 0; i < n; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const t = env.reducedMotion ? ((i >> 1) + 0.5) / (n / 2) : (env.time * 0.9 + i / n) % 1;
    const px = x + side * (14 + t * 36);
    const py = y - 70 - Math.sin(t * Math.PI) * 14 + t * 40;
    circle(g, px, py, 2.4 - t, `rgba(220, 244, 255, ${0.9 - t * 0.5})`);
  }
};

const noticeBoard: Painter = (g, { x, y }) => {
  shadow(g, x, y, 38, 7, 0.16);
  fillRoundRect(g, x - 30, y - 50, 6, 50, 2, '#7d5a43');
  fillRoundRect(g, x + 24, y - 50, 6, 50, 2, '#7d5a43');
  fillRoundRect(g, x - 36, y - 70, 72, 44, 6, '#b88358');
  fillRoundRect(g, x - 32, y - 66, 64, 36, 4, '#dcb27e');
  const notes: Array<[number, number, number, string]> = [
    [-26, -63, -0.08, '#fffaf0'],
    [-6, -62, 0.06, '#ffe6a8'],
    [12, -64, -0.04, '#cfe8f7'],
    [-14, -48, 0.05, '#fde1e6'],
  ];
  for (const [nx, ny, rot, c] of notes) {
    g.save();
    g.translate(x + nx + 7, y + ny + 8);
    g.rotate(rot);
    fillRoundRect(g, -8, -8, 16, 16, 2, c);
    g.fillStyle = 'rgba(80,60,60,0.35)';
    g.fillRect(-5, -3, 10, 1.2);
    g.fillRect(-5, 0, 8, 1.2);
    g.fillRect(-5, 3, 9, 1.2);
    circle(g, 0, -6, 1.6, '#e0685a');
    g.restore();
  }
  fillRoundRect(g, x - 40, y - 76, 80, 9, 4.5, '#8a5d40');
};

const mailbox: Painter = (g, { x, y }) => {
  shadow(g, x, y, 12, 4, 0.18);
  fillRoundRect(g, x - 3, y - 30, 6, 30, 2, '#6b5a4e');
  fillRoundRect(g, x - 13, y - 50, 26, 22, [11, 11, 3, 3], '#e0685a');
  fillRoundRect(g, x - 13, y - 34, 26, 6, 2, shade('#e0685a', -0.15));
  fillRoundRect(g, x - 7, y - 44, 14, 3, 1.5, shade('#e0685a', -0.3));
  fillRoundRect(g, x + 12, y - 55, 3, 14, 1.5, '#5a4a40');
  fillRoundRect(g, x + 13, y - 55, 9, 6, 2, '#f2c14e');
};

const rock: Painter = (g, { x, y, scale: s }) => {
  shadow(g, x, y, 16 * s, 5 * s, 0.15);
  ellipse(g, x, y - 7 * s, 15 * s, 10 * s, '#b9b3ad');
  ellipse(g, x - 3 * s, y - 10 * s, 8 * s, 5 * s, '#cfc9c2');
};

export const townPainters: Record<TownPropKind, Painter> = {
  tree,
  pine,
  bush,
  flowers,
  lamp,
  bench,
  fountain,
  noticeBoard,
  mailbox,
  rock,
};
