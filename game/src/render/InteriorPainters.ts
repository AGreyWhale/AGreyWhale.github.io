import type { InteriorPropKind } from '../content/interiors';
import { circle, ellipse, fillRoundRect, mixColor, shade, shadow, UI_FONT, type Ctx, type RenderEnv } from './draw';

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

// ── Boba Shop ────────────────────────────────────────────────────
const counterBase = (g: Ctx, x: number, y: number, w: number, front: string) => {
  shadow(g, x, y, w / 2 + 4, 7);
  fillRoundRect(g, x - w / 2, y - 40, w, 40, 4, front);
  fillRoundRect(g, x - w / 2 - 4, y - 46, w + 8, 10, 4, '#fff7ec');
  for (let i = 0; i < Math.floor(w / 28); i++) fillRoundRect(g, x - w / 2 + 6 + i * 28, y - 32, 20, 24, 3, shade(front, 0.1));
};

const teaStation: Painter = (g, { x, y }) => {
  counterBase(g, x, y, 164, '#c88a5c');
  // Tea dispensers
  const teas = ['#c98a4e', '#d9b48f', '#c9dc8f'];
  teas.forEach((c, i) => {
    const tx = x - 58 + i * 28;
    fillRoundRect(g, tx - 10, y - 92, 20, 46, 6, 'rgba(255,255,255,0.75)');
    fillRoundRect(g, tx - 8, y - 78, 16, 30, 4, c);
    fillRoundRect(g, tx - 3, y - 50, 6, 5, 1, '#5a5469');
  });
  // Cup sealer
  fillRoundRect(g, x + 24, y - 84, 44, 38, 6, '#e58aa2');
  fillRoundRect(g, x + 30, y - 76, 32, 8, 3, '#fff7ec');
  fillRoundRect(g, x + 38, y - 64, 16, 14, 3, '#5a5469');
};

const register: Painter = (g, { x, y }, env) => {
  counterBase(g, x, y, 164, '#c88a5c');
  // POS terminal
  fillRoundRect(g, x - 34, y - 54, 10, 10, 2, '#5a5469');
  g.save();
  g.translate(x - 30, y - 60);
  g.rotate(-0.12);
  fillRoundRect(g, -26, -30, 52, 34, 4, '#3a3645');
  fillRoundRect(g, -22, -26, 44, 26, 2, mixColor('#e9f4ff', '#a7c8ff', env.night * 0.5));
  for (let i = 0; i < 3; i++) fillRoundRect(g, -18 + i * 13, -22, 10, 8, 2, ['#e58aa2', '#f2c14e', '#87b48b'][i]);
  fillRoundRect(g, -18, -10, 36, 5, 2, '#c7d1db');
  g.restore();
  // Stack of cups + tip jar
  for (let i = 0; i < 4; i++) fillRoundRect(g, x + 20, y - 58 - i * 5, 18, 6, 2, i % 2 ? '#fff7ec' : '#f4ece0');
  fillRoundRect(g, x + 48, y - 62, 18, 18, 5, 'rgba(255,255,255,0.7)');
  circle(g, x + 54, y - 50, 2.5, '#f2c14e');
  circle(g, x + 60, y - 52, 2.5, '#87b48b');
};

const menuBoard: Painter = (g, { x, y }) => {
  fillRoundRect(g, x - 92, y - 40, 184, 82, 8, '#8a5d40');
  fillRoundRect(g, x - 86, y - 34, 172, 70, 5, '#2f3b37');
  g.fillStyle = '#fdf6ea';
  g.font = `700 13px ${UI_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('BOBA RUSH', x, y - 20);
  g.fillStyle = 'rgba(253, 246, 234, 0.6)';
  for (let i = 0; i < 3; i++) {
    g.fillRect(x - 70, y - 4 + i * 11, 54, 2.5);
    g.fillRect(x + 16, y - 4 + i * 11, 54, 2.5);
  }
  // Chalk cup doodles
  for (const cx of [x - 78, x + 78]) {
    g.strokeStyle = '#f49cb0';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(cx - 6, y - 26);
    g.lineTo(cx + 6, y - 26);
    g.lineTo(cx + 4, y - 10);
    g.lineTo(cx - 4, y - 10);
    g.closePath();
    g.stroke();
  }
};

const cafeTable: Painter = (g, { x, y, variant }) => {
  shadow(g, x, y, 26, 6);
  fillRoundRect(g, x - 3, y - 22, 6, 22, 2, '#7d5a43');
  ellipse(g, x, y - 24, 28, 10, variant ? '#f2c4b3' : '#cfe3d6');
  ellipse(g, x, y - 26, 26, 8.5, variant ? '#f8d6c8' : '#e1efe6');
  fillRoundRect(g, x - 10, y - 38, 9, 13, [1, 1, 3, 3], '#d9b48f');
  fillRoundRect(g, x + 4, y - 36, 9, 11, [1, 1, 3, 3], '#b9a3e3');
};

const stool: Painter = (g, { x, y }) => {
  shadow(g, x, y, 11, 4);
  fillRoundRect(g, x - 2, y - 14, 4, 14, 2, '#5a5469');
  ellipse(g, x, y - 15, 11, 5, '#e58aa2');
};

// ── Schoolhouse ──────────────────────────────────────────────────
const chalkboard: Painter = (g, { x, y }) => {
  fillRoundRect(g, x - 116, y - 42, 232, 86, 6, '#a0774f');
  fillRoundRect(g, x - 110, y - 36, 220, 74, 4, '#3d5a4c');
  g.strokeStyle = 'rgba(253, 246, 234, 0.85)';
  g.lineWidth = 1.8;
  g.lineCap = 'round';
  // An AND gate and a little datapath doodle
  const gx = x - 80;
  g.beginPath();
  g.moveTo(gx - 10, y - 18);
  g.lineTo(gx, y - 18);
  g.arc(gx, y - 8, 10, -Math.PI / 2, Math.PI / 2);
  g.lineTo(gx - 10, y + 2);
  g.closePath();
  g.moveTo(gx - 20, y - 14);
  g.lineTo(gx - 10, y - 14);
  g.moveTo(gx - 20, y - 2);
  g.lineTo(gx - 10, y - 2);
  g.moveTo(gx + 10, y - 8);
  g.lineTo(gx + 26, y - 8);
  g.stroke();
  for (let i = 0; i < 3; i++) g.strokeRect(x - 34 + i * 34, y - 18, 24, 18);
  g.beginPath();
  g.moveTo(x - 10, y - 9);
  g.lineTo(x, y - 9);
  g.moveTo(x + 24, y - 9);
  g.lineTo(x + 34, y - 9);
  g.stroke();
  g.fillStyle = 'rgba(253, 246, 234, 0.9)';
  g.font = `600 12px ${UI_FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('RISC-V', x + 74, y - 10);
  g.fillText('lab 1 → 8', x + 74, y + 8);
  g.fillText('IF  ID  EX', x, y + 18);
  fillRoundRect(g, x - 40, y + 40, 80, 5, 2, '#a0774f');
  fillRoundRect(g, x - 26, y + 37, 14, 4, 1, '#fdf6ea');
};

const teacherDesk: Painter = (g, { x, y }) => {
  shadow(g, x, y, 64, 7);
  fillRoundRect(g, x - 62, y - 40, 124, 40, 4, '#a0774f');
  fillRoundRect(g, x - 66, y - 46, 132, 10, 4, '#b98c62');
  fillRoundRect(g, x - 52, y - 32, 40, 26, 3, shade('#a0774f', 0.1));
  // Apple + books
  circle(g, x + 40, y - 52, 6, '#e0685a');
  fillRoundRect(g, x + 39, y - 62, 2, 5, 1, '#6b4a35');
  ['#6ea2d6', '#f2c14e', '#87b48b'].forEach((c, i) => fillRoundRect(g, x - 20, y - 52 - i * 6, 34 - i * 4, 6, 1.5, c));
};

const schoolDesk: Painter = (g, { x, y }) => {
  shadow(g, x, y, 34, 6);
  // Desk
  fillRoundRect(g, x - 30, y - 30, 4, 18, 1, '#7d5a43');
  fillRoundRect(g, x + 26, y - 30, 4, 18, 1, '#7d5a43');
  fillRoundRect(g, x - 34, y - 38, 68, 10, 3, '#c99a6b');
  fillRoundRect(g, x - 12, y - 42, 20, 7, 1, '#fffaf2');
  fillRoundRect(g, x + 12, y - 41, 12, 3, 1, '#f2c14e');
  // Chair
  fillRoundRect(g, x - 14, y - 12, 28, 8, 3, '#6e5a7e');
  fillRoundRect(g, x - 12, y - 4, 3, 4, 1, '#4a3f55');
  fillRoundRect(g, x + 9, y - 4, 3, 4, 1, '#4a3f55');
};

const terminal: Painter = (g, { x, y }, env) => {
  shadow(g, x, y, 32, 6);
  fillRoundRect(g, x - 30, y - 24, 60, 24, 3, '#8a96a6');
  fillRoundRect(g, x - 28, y - 70, 56, 46, 8, '#e9e0cf');
  fillRoundRect(g, x - 22, y - 64, 44, 32, 4, '#1f2a24');
  g.fillStyle = '#7be0a5';
  for (let i = 0; i < 4; i++) g.fillRect(x - 18, y - 59 + i * 6, 14 + ((i * 9) % 18), 2.5);
  if (env.reducedMotion || Math.floor(env.time * 2) % 2 === 0) g.fillRect(x - 18, y - 35, 5, 3);
  fillRoundRect(g, x - 24, y - 20, 48, 8, 2, '#d7cdb9');
};

const globe: Painter = (g, { x, y }) => {
  shadow(g, x, y, 14, 4);
  fillRoundRect(g, x - 10, y - 6, 20, 6, 3, '#7d5a43');
  fillRoundRect(g, x - 1.5, y - 16, 3, 12, 1, '#7d5a43');
  circle(g, x, y - 30, 15, '#7fb7e0');
  ellipse(g, x - 5, y - 34, 6, 4, '#87b48b');
  ellipse(g, x + 6, y - 24, 5, 3.5, '#87b48b');
  g.strokeStyle = '#c9a24d';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(x, y - 30, 18, Math.PI * 0.6, Math.PI * 1.9);
  g.stroke();
};

// ── Greenhouse ───────────────────────────────────────────────────
const plantTable: Painter = (g, { x, y, variant }, env) => {
  shadow(g, x, y, 58, 6);
  fillRoundRect(g, x - 52, y - 26, 6, 26, 2, '#8c6448');
  fillRoundRect(g, x + 46, y - 26, 6, 26, 2, '#8c6448');
  fillRoundRect(g, x - 56, y - 32, 112, 10, 3, '#b98c62');
  const petals = variant ? ['#f7d36b', '#b9a3e3', '#f49cb0'] : ['#f49cb0', '#ffffff', '#f2a65a'];
  for (let i = 0; i < 3; i++) {
    const px = x - 34 + i * 34;
    const sway = env.reducedMotion ? 0 : Math.sin(env.time * 1.3 + i + x) * 1.2;
    fillRoundRect(g, px - 10, y - 50, 20, 18, [2, 2, 6, 6], '#d7826a');
    circle(g, px - 6 + sway, y - 56, 7, '#6aa75f');
    circle(g, px + 6 + sway, y - 57, 7, '#7cb86c');
    for (let k = 0; k < 3; k++) circle(g, px - 6 + k * 6 + sway, y - 64 - (k % 2) * 4, 3.6, petals[(i + k) % 3]);
  }
};

const easel: Painter = (g, { x, y }) => {
  shadow(g, x, y, 30, 6);
  g.strokeStyle = '#8c6448';
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - 22, y);
  g.lineTo(x - 6, y - 88);
  g.moveTo(x + 22, y);
  g.lineTo(x + 6, y - 88);
  g.moveTo(x, y - 6);
  g.lineTo(x, y - 80);
  g.stroke();
  fillRoundRect(g, x - 30, y - 34, 60, 5, 2, '#a97754');
  // Framed photo of an arrangement
  fillRoundRect(g, x - 30, y - 92, 60, 58, 3, '#fffdf8');
  fillRoundRect(g, x - 25, y - 87, 50, 44, 2, '#f6e3e8');
  fillRoundRect(g, x - 6, y - 58, 12, 14, [2, 2, 4, 4], '#9fc8e4');
  for (const [px, py, c] of [
    [-8, -64, '#f49cb0'],
    [0, -70, '#f7d36b'],
    [8, -64, '#b9a3e3'],
    [-3, -76, '#e0685a'],
    [5, -77, '#ffffff'],
  ] as const) {
    circle(g, x + px, y + py, 5, c);
  }
  // Slide dots
  for (let i = 0; i < 4; i++) circle(g, x - 9 + i * 6, y - 38, 1.6, i === 0 ? '#e0685a' : '#d9cfc2');
};

const wateringCan: Painter = (g, { x, y }) => {
  shadow(g, x, y, 15, 4);
  fillRoundRect(g, x - 11, y - 20, 22, 20, 5, '#87b48b');
  g.strokeStyle = '#87b48b';
  g.lineWidth = 3.5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x + 9, y - 12);
  g.lineTo(x + 20, y - 24);
  g.moveTo(x - 6, y - 20);
  g.quadraticCurveTo(x, y - 30, x + 6, y - 20);
  g.stroke();
  ellipse(g, x + 21, y - 25, 3, 2, '#6aa75f');
};

// ── Post Office ──────────────────────────────────────────────────
const postCounter: Painter = (g, { x, y }) => {
  shadow(g, x, y, 108, 8);
  fillRoundRect(g, x - 104, y - 40, 208, 40, 4, '#5f7fa8');
  fillRoundRect(g, x - 108, y - 46, 216, 10, 4, '#fffaf2');
  for (let i = 0; i < 6; i++) fillRoundRect(g, x - 96 + i * 33, y - 32, 26, 24, 3, shade('#5f7fa8', 0.12));
  // Bell, scale, stamps, letter tray
  ellipse(g, x - 70, y - 48, 10, 3, '#8a96a6');
  g.fillStyle = '#f2c14e';
  g.beginPath();
  g.arc(x - 70, y - 50, 8, Math.PI, 0);
  g.fill();
  circle(g, x - 70, y - 59, 2, '#f2c14e');
  fillRoundRect(g, x - 18, y - 52, 36, 8, 2, '#c7d1db');
  fillRoundRect(g, x - 12, y - 62, 24, 10, 2, '#e9eef2');
  fillRoundRect(g, x + 40, y - 58, 44, 12, 3, '#c99367');
  for (let i = 0; i < 3; i++) fillRoundRect(g, x + 44 + i * 13, y - 64, 10, 8, 1, ['#fffaf2', '#fde1e6', '#cfe8f7'][i]);
};

const mailSlots: Painter = (g, { x, y }) => {
  fillRoundRect(g, x - 76, y - 40, 152, 82, 5, '#a0774f');
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const cx = x - 70 + c * 28.5;
      const cy = y - 34 + r * 25.5;
      fillRoundRect(g, cx, cy, 25, 22, 2, '#6b4a35');
      if ((r * 5 + c) % 3 !== 1) fillRoundRect(g, cx + 4, cy + 4, 17, 12, 1, ['#fffaf2', '#fde1e6', '#cfe8f7', '#ffe6a8'][(r + c) % 4]);
    }
  }
};

const letterDesk: Painter = (g, { x, y }) => {
  shadow(g, x, y, 58, 6);
  fillRoundRect(g, x - 52, y - 26, 6, 26, 2, '#7d5a43');
  fillRoundRect(g, x + 46, y - 26, 6, 26, 2, '#7d5a43');
  fillRoundRect(g, x - 56, y - 34, 112, 12, 3, '#b98c62');
  // Open envelope + letter
  fillRoundRect(g, x - 34, y - 46, 40, 16, 2, '#fffaf2');
  g.fillStyle = '#f1e6d6';
  g.beginPath();
  g.moveTo(x - 34, y - 46);
  g.lineTo(x - 14, y - 36);
  g.lineTo(x + 6, y - 46);
  g.fill();
  circle(g, x - 14, y - 38, 3.5, '#d85770');
  g.save();
  g.translate(x + 26, y - 42);
  g.rotate(0.12);
  fillRoundRect(g, -14, -12, 28, 22, 1.5, '#ffffff');
  g.fillStyle = 'rgba(80, 80, 100, 0.4)';
  for (let i = 0; i < 4; i++) g.fillRect(-10, -8 + i * 5, 20 - (i % 2) * 6, 1.5);
  g.restore();
  // Pen
  g.strokeStyle = '#3f5f8a';
  g.lineWidth = 2.5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - 46, y - 36);
  g.lineTo(x - 38, y - 48);
  g.stroke();
};

const parcels: Painter = (g, { x, y }) => {
  shadow(g, x, y, 32, 6);
  const box = (bx: number, by: number, w: number, h: number) => {
    fillRoundRect(g, bx, by, w, h, 3, '#c99367');
    g.fillStyle = '#e9d4b0';
    g.fillRect(bx + w / 2 - 2, by, 4, h);
    g.fillRect(bx, by + h / 2 - 2, w, 4);
  };
  box(x - 30, y - 30, 34, 30);
  box(x + 2, y - 24, 28, 24);
  box(x - 22, y - 52, 26, 22);
};

export const interiorPainters: Record<InteriorPropKind, Painter> = {
  teaStation,
  register,
  menuBoard,
  cafeTable,
  stool,
  chalkboard,
  teacherDesk,
  schoolDesk,
  terminal,
  globe,
  plantTable,
  easel,
  wateringCan,
  postCounter,
  mailSlots,
  letterDesk,
  parcels,
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
export const WALL_PROPS: ReadonlySet<InteriorPropKind> = new Set([
  'window',
  'painting',
  'whiteboard',
  'certificate',
  'pegboard',
  'menuBoard',
  'chalkboard',
  'mailSlots',
]);

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
  teaStation: { x: -82, y: -34, w: 164, h: 34 },
  register: { x: -82, y: -34, w: 164, h: 34 },
  cafeTable: { x: -26, y: -14, w: 52, h: 14 },
  stool: { x: -10, y: -6, w: 20, h: 8 },
  teacherDesk: { x: -64, y: -30, w: 128, h: 30 },
  schoolDesk: { x: -34, y: -26, w: 68, h: 26 },
  terminal: { x: -30, y: -24, w: 60, h: 24 },
  globe: { x: -14, y: -8, w: 28, h: 10 },
  plantTable: { x: -56, y: -28, w: 112, h: 28 },
  easel: { x: -30, y: -12, w: 60, h: 12 },
  wateringCan: { x: -14, y: -8, w: 28, h: 10 },
  postCounter: { x: -106, y: -34, w: 212, h: 34 },
  letterDesk: { x: -56, y: -28, w: 112, h: 28 },
  parcels: { x: -32, y: -18, w: 64, h: 18 },
};

