import type { InteriorPropKind } from '../content/interiors';
import { circle, ellipse, fillRoundRect, mixColor, shade, shadow, type Ctx, type RenderEnv } from './draw';

export interface InteriorDrawArgs {
  x: number;
  y: number;
  variant: number;
}

type Painter = (g: Ctx, a: InteriorDrawArgs, env: RenderEnv) => void;

const WOOD = '#b88259';
const WOOD_DARK = '#946446';

const rug: Painter = (g, { x, y }) => {
  ellipse(g, x, y - 20, 150, 62, '#e7a593');
  ellipse(g, x, y - 20, 132, 50, '#f3c5b3');
  g.strokeStyle = '#e7a593';
  g.lineWidth = 3;
  g.setLineDash([8, 7]);
  g.beginPath();
  g.ellipse(x, y - 20, 112, 40, 0, 0, Math.PI * 2);
  g.stroke();
  g.setLineDash([]);
};

const bookshelf: Painter = (g, { x, y }) => {
  shadow(g, x, y, 50, 7);
  fillRoundRect(g, x - 46, y - 112, 92, 112, 6, WOOD_DARK);
  fillRoundRect(g, x - 41, y - 106, 82, 100, 4, '#7d523a');
  const colors = ['#e5735f', '#87b48b', '#f2c14e', '#9c8ad0', '#6ea2d6', '#f2a69d', '#fff4e3'];
  for (let shelf = 0; shelf < 3; shelf++) {
    const sy = y - 104 + shelf * 33;
    let bx = x - 38;
    let i = shelf * 3;
    while (bx < x + 34) {
      const bw = 7 + ((i * 5) % 6);
      const bh = 22 + ((i * 7) % 7);
      fillRoundRect(g, bx, sy + 28 - bh, bw, bh, 1.5, colors[i % colors.length]);
      bx += bw + 1.5;
      i++;
    }
    fillRoundRect(g, x - 41, sy + 28, 82, 4, 1, WOOD);
  }
};

const coffeeCorner: Painter = (g, { x, y }, env) => {
  shadow(g, x, y, 54, 7);
  fillRoundRect(g, x - 52, y - 40, 104, 40, 5, '#9d6b4c');
  fillRoundRect(g, x - 56, y - 46, 112, 10, 4, '#e9dccb');
  fillRoundRect(g, x - 44, y - 30, 40, 22, 3, shade('#9d6b4c', 0.1));
  fillRoundRect(g, x + 4, y - 30, 40, 22, 3, shade('#9d6b4c', 0.1));
  // Espresso machine
  fillRoundRect(g, x - 40, y - 80, 38, 36, 6, '#d55f4f');
  fillRoundRect(g, x - 36, y - 74, 30, 8, 3, '#f1e6da');
  fillRoundRect(g, x - 26, y - 62, 10, 6, 2, '#4a3a3a');
  // Mugs + steam
  const mug = (mx: number, c: string) => {
    fillRoundRect(g, mx - 6, y - 58, 12, 12, [2, 2, 4, 4], c);
    g.strokeStyle = c;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(mx + 7, y - 52, 3, -Math.PI / 2, Math.PI / 2);
    g.stroke();
  };
  mug(x + 14, '#fff7ec');
  mug(x + 34, '#87b48b');
  if (!env.reducedMotion) {
    for (let i = 0; i < 2; i++) {
      const t = (env.time * 0.5 + i * 0.5) % 1;
      circle(g, x + 14 + Math.sin(t * 6) * 2, y - 62 - t * 18, 2.5 + t * 2, `rgba(255,255,255,${0.5 * (1 - t)})`);
    }
  }
  // Jar of beans
  fillRoundRect(g, x + 26, y - 82, 18, 22, 5, 'rgba(255,255,255,0.6)');
  fillRoundRect(g, x + 28, y - 74, 14, 12, 3, '#6b4434');
};

const cameraTripod: Painter = (g, { x, y }) => {
  shadow(g, x, y, 18, 5);
  g.strokeStyle = '#5a5469';
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x, y - 34);
  g.lineTo(x - 13, y);
  g.moveTo(x, y - 34);
  g.lineTo(x + 13, y);
  g.moveTo(x, y - 34);
  g.lineTo(x, y - 2);
  g.stroke();
  fillRoundRect(g, x - 16, y - 54, 32, 21, 5, '#3f3b4b');
  fillRoundRect(g, x - 12, y - 58, 10, 6, 2, '#3f3b4b');
  circle(g, x + 2, y - 43, 7.5, '#d9d4cf');
  circle(g, x + 2, y - 43, 5, '#5c6f8f');
  circle(g, x + 0.5, y - 44.5, 1.6, '#ffffff');
  circle(g, x + 11, y - 50, 1.8, '#e0685a');
};

const tvConsole: Painter = (g, { x, y }, env) => {
  shadow(g, x, y, 56, 7);
  fillRoundRect(g, x - 52, y - 28, 104, 28, 5, WOOD);
  fillRoundRect(g, x - 46, y - 22, 44, 16, 3, shade(WOOD, 0.12));
  fillRoundRect(g, x + 2, y - 22, 44, 16, 3, shade(WOOD, 0.12));
  // TV
  fillRoundRect(g, x - 40, y - 84, 80, 52, 6, '#3a3645');
  const screen = mixColor('#7fc4d8', '#5b7fd6', 0.5 + 0.5 * Math.sin(env.reducedMotion ? 0 : env.time * 0.7));
  fillRoundRect(g, x - 35, y - 79, 70, 42, 4, screen);
  // A little pixel-free "game": rolling hills and a sun
  ellipse(g, x - 12, y - 40, 28, 10, '#8fd18a');
  ellipse(g, x + 18, y - 40, 22, 8, '#7cc27a');
  circle(g, x + 20, y - 66, 6, '#ffe28a');
  fillRoundRect(g, x - 4, y - 32, 8, 4, 1, '#3a3645');
  // Console + controller
  fillRoundRect(g, x + 22, y - 36, 22, 8, 3, '#f1ece6');
  fillRoundRect(g, x - 44, y - 36, 18, 8, 4, '#e5735f');
};

const sofa: Painter = (g, { x, y }) => {
  shadow(g, x, y, 62, 8);
  const c = '#8fb4a5';
  fillRoundRect(g, x - 58, y - 44, 116, 40, 12, shade(c, -0.08));
  fillRoundRect(g, x - 62, y - 36, 18, 34, 8, c);
  fillRoundRect(g, x + 44, y - 36, 18, 34, 8, c);
  fillRoundRect(g, x - 46, y - 52, 92, 24, 10, c);
  fillRoundRect(g, x - 34, y - 58, 26, 18, 7, '#f2c14e');
};

const plant: Painter = (g, { x, y, variant }, env) => {
  shadow(g, x, y, 16, 5);
  fillRoundRect(g, x - 12, y - 22, 24, 22, [3, 3, 8, 8], variant ? '#e9e2d8' : '#d7826a');
  const sw = env.reducedMotion ? 0 : Math.sin(env.time * 1.2 + x) * 1.5;
  const leaf = (ang: number, len: number, c: string) => {
    g.save();
    g.translate(x, y - 22);
    g.rotate(ang + sw * 0.02);
    ellipse(g, 0, -len / 2, 6, len / 2, c);
    g.restore();
  };
  leaf(-0.7, 30, '#6aa75f');
  leaf(0.7, 30, '#6aa75f');
  leaf(-0.25, 38, '#7cb86c');
  leaf(0.25, 36, '#86c276');
  leaf(0, 44, '#7cb86c');
};

const floorLamp: Painter = (g, { x, y }, env) => {
  shadow(g, x, y, 12, 4);
  ellipse(g, x, y - 3, 10, 4, '#4f4a5e');
  fillRoundRect(g, x - 2, y - 70, 4, 68, 2, '#4f4a5e');
  g.fillStyle = mixColor('#f4e2c4', '#ffd48a', env.night);
  g.beginPath();
  g.moveTo(x - 10, y - 92);
  g.lineTo(x + 10, y - 92);
  g.lineTo(x + 18, y - 68);
  g.lineTo(x - 18, y - 68);
  g.closePath();
  g.fill();
};

const windowPainter: Painter = (g, { x, y }, env) => {
  fillRoundRect(g, x - 38, y - 34, 76, 68, 8, '#fff7ec');
  const sky = mixColor('#bfe3f2', '#2d3767', env.night);
  fillRoundRect(g, x - 32, y - 28, 64, 56, 5, sky);
  if (env.night > 0.5) {
    circle(g, x + 14, y - 14, 5, `rgba(255, 244, 214, ${env.night})`);
    circle(g, x - 18, y + 8, 1.2, '#fff');
    circle(g, x - 6, y - 18, 1, '#fff');
  } else {
    ellipse(g, x - 8, y + 16, 22, 8, 'rgba(255,255,255,0.8)');
  }
  g.fillStyle = '#fff7ec';
  g.fillRect(x - 1.5, y - 28, 3, 56);
  g.fillRect(x - 32, y - 1.5, 64, 3);
  fillRoundRect(g, x - 42, y + 32, 84, 6, 3, '#e4d3bf');
};

const painting: Painter = (g, { x, y }) => {
  fillRoundRect(g, x - 34, y - 26, 68, 52, 4, '#c79a6b');
  fillRoundRect(g, x - 29, y - 21, 58, 42, 2, '#fdf6ea');
  ellipse(g, x - 6, y + 14, 26, 9, '#a9d18e');
  ellipse(g, x + 14, y + 16, 18, 7, '#93c17b');
  circle(g, x + 12, y - 8, 6, '#f6c86b');
};

const whiteboard: Painter = (g, { x, y }) => {
  fillRoundRect(g, x - 74, y - 38, 148, 80, 6, '#c7d1db');
  fillRoundRect(g, x - 70, y - 34, 140, 72, 4, '#fbfdff');
  g.lineWidth = 2;
  g.lineCap = 'round';
  // A scribbled graph + notes
  g.strokeStyle = '#5c86c4';
  g.beginPath();
  g.moveTo(x - 58, y + 24);
  g.lineTo(x - 58, y - 22);
  g.moveTo(x - 58, y + 24);
  g.lineTo(x - 10, y + 24);
  g.stroke();
  g.strokeStyle = '#e0685a';
  g.beginPath();
  g.moveTo(x - 56, y + 18);
  g.bezierCurveTo(x - 40, y + 16, x - 32, y - 18, x - 14, y - 16);
  g.stroke();
  g.strokeStyle = '#7a8796';
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.moveTo(x + 6, y - 20 + i * 12);
    g.lineTo(x + 56 - (i % 2) * 14, y - 20 + i * 12);
    g.stroke();
  }
  fillRoundRect(g, x - 30, y + 42, 60, 5, 2, '#9aa7b5');
};

const certificate: Painter = (g, { x, y, variant }) => {
  const frame = variant ? '#3f4c63' : '#c9a24d';
  fillRoundRect(g, x - 26, y - 20, 52, 40, 3, frame);
  fillRoundRect(g, x - 22, y - 16, 44, 32, 2, '#fffdf6');
  g.fillStyle = 'rgba(80, 80, 100, 0.45)';
  g.fillRect(x - 15, y - 10, 30, 2.5);
  g.fillRect(x - 12, y - 4, 24, 1.5);
  g.fillRect(x - 14, y, 28, 1.5);
  circle(g, x + 10, y + 9, 4.5, variant ? '#6ea2d6' : '#e0685a');
  g.fillStyle = variant ? '#6ea2d6' : '#e0685a';
  g.fillRect(x + 7, y + 11, 2, 6);
  g.fillRect(x + 11, y + 11, 2, 6);
};

const computerDesk: Painter = (g, { x, y }, env) => {
  shadow(g, x, y, 66, 7);
  fillRoundRect(g, x - 62, y - 36, 124, 10, 4, '#d9dfe6');
  fillRoundRect(g, x - 58, y - 28, 6, 28, 2, '#9aa7b5');
  fillRoundRect(g, x + 52, y - 28, 6, 28, 2, '#9aa7b5');
  // Two monitors with plots
  for (const [mx, w] of [
    [-24, 52],
    [30, 40],
  ] as const) {
    fillRoundRect(g, x + mx - w / 2, y - 80, w, 36, 4, '#3a3f4f');
    fillRoundRect(g, x + mx - w / 2 + 3, y - 77, w - 6, 30, 2, mixColor('#e9f4ff', '#a7c8ff', env.night * 0.6));
    fillRoundRect(g, x + mx - 3, y - 44, 6, 8, 1, '#3a3f4f');
  }
  // Scatter plot of "particles"
  const cs = ['#e0685a', '#5c86c4', '#87b48b'];
  for (let i = 0; i < 12; i++) {
    const px = x - 44 + ((i * 37) % 40);
    const py = y - 72 + ((i * 23) % 22);
    circle(g, px, py, 1.6, cs[i % 3]);
  }
  g.strokeStyle = '#e0685a';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(x + 14, y - 52);
  g.lineTo(x + 22, y - 62);
  g.lineTo(x + 30, y - 56);
  g.lineTo(x + 38, y - 70);
  g.lineTo(x + 46, y - 66);
  g.stroke();
  fillRoundRect(g, x - 20, y - 40, 40, 4, 2, '#7e8796');
  ellipse(g, x + 30, y - 38, 5, 3, '#7e8796');
};

const capsuleModel: Painter = (g, { x, y }, env) => {
  shadow(g, x, y, 40, 7);
  fillRoundRect(g, x - 36, y - 24, 72, 24, 5, '#c7d1db');
  fillRoundRect(g, x - 4, y - 46, 8, 24, 2, '#9aa7b5');
  // Flow lines around the capsule
  g.strokeStyle = 'rgba(92, 134, 196, 0.6)';
  g.lineWidth = 1.5;
  const t = env.reducedMotion ? 0 : (env.time * 20) % 20;
  for (let i = -2; i <= 2; i++) {
    g.setLineDash([6, 6]);
    g.lineDashOffset = -t;
    g.beginPath();
    g.moveTo(x - 40, y - 90 + i * 9);
    g.quadraticCurveTo(x, y - 74 + i * 20 + (i === 0 ? 0 : Math.sign(i) * 8), x + 40, y - 90 + i * 9);
    g.stroke();
  }
  g.setLineDash([]);
  // Capsule: blunt heat shield + cone
  g.fillStyle = '#e8ecf1';
  g.beginPath();
  g.moveTo(x - 20, y - 74);
  g.lineTo(x + 20, y - 74);
  g.lineTo(x + 9, y - 104);
  g.lineTo(x - 9, y - 104);
  g.closePath();
  g.fill();
  ellipse(g, x, y - 72, 24, 6, '#d36b4f');
  circle(g, x, y - 90, 3.5, '#6ea2d6');
};

const serverRack: Painter = (g, { x, y }, env) => {
  shadow(g, x, y, 30, 6);
  fillRoundRect(g, x - 26, y - 96, 52, 96, 5, '#3f4556');
  for (let i = 0; i < 6; i++) {
    const ry = y - 90 + i * 15;
    fillRoundRect(g, x - 21, ry, 42, 11, 2, '#525a6e');
    const on = env.reducedMotion ? i % 2 === 0 : Math.sin(env.time * (2 + i) + i) > 0;
    circle(g, x + 14, ry + 5.5, 1.8, on ? '#7be0a5' : '#2f6a4c');
    circle(g, x + 8, ry + 5.5, 1.8, i === 2 ? '#f2c14e' : '#2f6a4c');
  }
};

const workbench: Painter = (g, { x, y }) => {
  shadow(g, x, y, 76, 7);
  fillRoundRect(g, x - 72, y - 40, 144, 12, 3, WOOD);
  fillRoundRect(g, x - 66, y - 28, 8, 28, 2, WOOD_DARK);
  fillRoundRect(g, x + 58, y - 28, 8, 28, 2, WOOD_DARK);
  fillRoundRect(g, x - 60, y - 14, 120, 5, 2, WOOD_DARK);
  // Laptop showing PaperTrail-ish document cards
  fillRoundRect(g, x - 34, y - 78, 60, 38, 4, '#3a3645');
  fillRoundRect(g, x - 31, y - 75, 54, 32, 2, '#fffaf2');
  for (let i = 0; i < 3; i++) {
    fillRoundRect(g, x - 27, y - 71 + i * 9, 30, 6, 2, ['#f2c14e', '#87b48b', '#6ea2d6'][i]);
    fillRoundRect(g, x + 6, y - 71 + i * 9, 13, 6, 2, '#e9dccb');
  }
  fillRoundRect(g, x - 40, y - 44, 72, 5, 2, '#5a5469');
  // Stack of papers
  for (let i = 0; i < 4; i++) fillRoundRect(g, x + 38 + (i % 2), y - 46 - i * 3, 26, 5, 1, i % 2 ? '#fdf6ea' : '#efe6d6');
};

const pegboard: Painter = (g, { x, y }) => {
  fillRoundRect(g, x - 66, y - 36, 132, 76, 5, '#d9b88e');
  g.fillStyle = 'rgba(120, 85, 50, 0.35)';
  for (let px = x - 58; px < x + 62; px += 12) for (let py = y - 28; py < y + 36; py += 12) g.fillRect(px, py, 2, 2);
  // Tools
  fillRoundRect(g, x - 50, y - 26, 6, 44, 3, '#8c6448');
  fillRoundRect(g, x - 56, y - 30, 18, 10, 2, '#7b8798');
  fillRoundRect(g, x - 26, y - 22, 5, 36, 2, '#e0685a');
  fillRoundRect(g, x - 27, y + 12, 7, 12, 2, '#5a5469');
  g.strokeStyle = '#7b8798';
  g.lineWidth = 4;
  g.beginPath();
  g.arc(x + 6, y - 6, 12, 0, Math.PI * 2);
  g.stroke();
  fillRoundRect(g, x + 28, y - 26, 8, 40, 3, '#f2c14e');
  fillRoundRect(g, x + 44, y - 20, 14, 30, 4, '#6ea2d6');
};

const circuitTable: Painter = (g, { x, y }, env) => {
  shadow(g, x, y, 60, 7);
  fillRoundRect(g, x - 56, y - 34, 112, 10, 3, WOOD);
  fillRoundRect(g, x - 50, y - 24, 6, 24, 2, WOOD_DARK);
  fillRoundRect(g, x + 44, y - 24, 6, 24, 2, WOOD_DARK);
  // Green PCB with a "CPU" and traces
  fillRoundRect(g, x - 44, y - 66, 88, 34, 4, '#3f8f68');
  g.strokeStyle = '#a7e0b8';
  g.lineWidth = 1.2;
  g.beginPath();
  for (let i = 0; i < 5; i++) {
    g.moveTo(x - 40, y - 60 + i * 6);
    g.lineTo(x - 18, y - 60 + i * 6);
    g.moveTo(x + 18, y - 60 + i * 6);
    g.lineTo(x + 40, y - 60 + i * 6);
  }
  g.stroke();
  fillRoundRect(g, x - 14, y - 62, 28, 26, 3, '#2f3442');
  fillRoundRect(g, x - 9, y - 57, 18, 16, 2, '#4b5163');
  const pulse = env.reducedMotion ? 1 : (Math.sin(env.time * 4) + 1) / 2;
  circle(g, x + 36, y - 40, 2.2, `rgba(255, 120, 100, ${0.4 + 0.6 * pulse})`);
  // Probe wires
  g.strokeStyle = '#e0685a';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x + 44, y - 50);
  g.quadraticCurveTo(x + 60, y - 30, x + 52, y - 28);
  g.stroke();
};

const toolbox: Painter = (g, { x, y }) => {
  shadow(g, x, y, 26, 5);
  fillRoundRect(g, x - 24, y - 22, 48, 22, 4, '#e0685a');
  fillRoundRect(g, x - 24, y - 22, 48, 6, [4, 4, 0, 0], shade('#e0685a', -0.15));
  g.strokeStyle = '#5a5469';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(x, y - 22, 9, Math.PI, 0);
  g.stroke();
};

const crate: Painter = (g, { x, y }) => {
  shadow(g, x, y, 24, 5);
  fillRoundRect(g, x - 22, y - 36, 44, 36, 3, '#c99367');
  g.strokeStyle = '#a97754';
  g.lineWidth = 3;
  g.strokeRect(x - 19, y - 33, 38, 30);
  g.beginPath();
  g.moveTo(x - 19, y - 33);
  g.lineTo(x + 19, y - 3);
  g.stroke();
};

export const interiorPainters: Record<InteriorPropKind, Painter> = {
  rug,
  bookshelf,
  coffeeCorner,
  cameraTripod,
  tvConsole,
  sofa,
  plant,
  floorLamp,
  window: windowPainter,
  painting,
  whiteboard,
  certificate,
  computerDesk,
  capsuleModel,
  serverRack,
  workbench,
  pegboard,
  circuitTable,
  toolbox,
  crate,
};

/** Props that hang on the back wall (no floor footprint, interact from below). */
export const WALL_PROPS: ReadonlySet<InteriorPropKind> = new Set(['window', 'painting', 'whiteboard', 'certificate', 'pegboard']);

/** Props that lie flat on the floor (drawn under everything). */
export const FLAT_PROPS: ReadonlySet<InteriorPropKind> = new Set(['rug']);

/** Solid footprint relative to the prop's base point. */
export const INTERIOR_FOOTPRINTS: Partial<Record<InteriorPropKind, { x: number; y: number; w: number; h: number }>> = {
  bookshelf: { x: -46, y: -30, w: 92, h: 30 },
  coffeeCorner: { x: -54, y: -36, w: 108, h: 36 },
  cameraTripod: { x: -10, y: -8, w: 20, h: 8 },
  tvConsole: { x: -52, y: -26, w: 104, h: 26 },
  sofa: { x: -60, y: -34, w: 120, h: 34 },
  plant: { x: -13, y: -10, w: 26, h: 10 },
  floorLamp: { x: -8, y: -6, w: 16, h: 8 },
  computerDesk: { x: -62, y: -30, w: 124, h: 30 },
  capsuleModel: { x: -36, y: -24, w: 72, h: 24 },
  serverRack: { x: -26, y: -30, w: 52, h: 30 },
  workbench: { x: -72, y: -30, w: 144, h: 30 },
  circuitTable: { x: -56, y: -30, w: 112, h: 30 },
  toolbox: { x: -24, y: -14, w: 48, h: 14 },
  crate: { x: -22, y: -18, w: 44, h: 18 },
};

