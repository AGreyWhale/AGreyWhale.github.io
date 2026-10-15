import type { BuildingDef } from '../content/buildings';
import { circle, ellipse, fillRoundRect, shade, shadow, UI_FONT, windowColor, type Ctx, type RenderEnv } from './draw';

export interface WindowSpot {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Window rectangles for a building (used for drawing and for night lights). */
export function windowSpots(b: BuildingDef): WindowSpot[] {
  const ww = b.style === 'lab' ? 46 : 36;
  const wh = b.style === 'lab' ? 36 : 30;
  const cy = b.y - b.wallHeight * 0.56;
  return [-0.29, 0.29].map((k) => ({ x: b.x + b.width * k - ww / 2, y: cy - wh / 2, w: ww, h: wh }));
}

export const DOOR_W = 34;
export const DOOR_H = 50;

/**
 * Draws a building's walls, windows, roof and name plaque. The door is a
 * separate entity (it animates), drawn on top.
 */
export function drawBuilding(g: Ctx, b: BuildingDef, env: RenderEnv): void {
  const { x, y, width: w, wallHeight: wh, palette: p } = b;
  const left = x - w / 2;

  shadow(g, x + 8, y + 2, w / 2 + 18, 14, 0.14);

  // Walls with a little side shading for depth.
  fillRoundRect(g, left, y - wh, w, wh, [4, 4, 6, 6], p.wall);
  fillRoundRect(g, left + w - 12, y - wh, 12, wh, [0, 4, 6, 0], shade(p.wall, -0.07));
  fillRoundRect(g, left - 3, y - 10, w + 6, 10, 4, shade(p.wall, -0.22));

  if (b.style === 'workshop') drawPlanks(g, left, y - wh, w, wh - 10, p.wall);

  for (const win of windowSpots(b)) drawWindow(g, win, b, env);

  // Little stone step in front of the door.
  ellipse(g, x, y + 5, DOOR_W / 2 + 10, 6, shade(p.wall, -0.32));
  ellipse(g, x, y + 3.5, DOOR_W / 2 + 8, 5, '#e8e0d4');

  switch (b.style) {
    case 'cottage':
      drawCottageRoof(g, b, env);
      break;
    case 'lab':
      drawLabRoof(g, b, env);
      break;
    case 'workshop':
      drawWorkshopRoof(g, b);
      break;
  }

  drawPlaque(g, x, y - DOOR_H - 18, b.name, p);
}

function drawPlanks(g: Ctx, x: number, y: number, w: number, h: number, base: string): void {
  g.strokeStyle = shade(base, -0.1);
  g.lineWidth = 1.2;
  g.beginPath();
  for (let yy = y + 14; yy < y + h; yy += 14) {
    g.moveTo(x + 4, yy);
    g.lineTo(x + w - 4, yy);
  }
  g.stroke();
}

function drawWindow(g: Ctx, win: WindowSpot, b: BuildingDef, env: RenderEnv): void {
  const { x, y, w, h } = win;
  const p = b.palette;
  fillRoundRect(g, x - 4, y - 4, w + 8, h + 8, 7, p.trim);
  fillRoundRect(g, x, y, w, h, 4, windowColor(env.night));
  // Glass shine by day.
  g.fillStyle = `rgba(255,255,255,${0.45 * (1 - env.night)})`;
  g.beginPath();
  g.moveTo(x + 4, y + h - 6);
  g.lineTo(x + w * 0.45, y + 3);
  g.lineTo(x + w * 0.6, y + 3);
  g.lineTo(x + 10, y + h - 6);
  g.fill();
  g.fillStyle = p.trim;
  g.fillRect(x + w / 2 - 1.5, y, 3, h);
  g.fillRect(x, y + h / 2 - 1.5, w, 3);
  if (b.style === 'cottage') {
    // Flower box
    fillRoundRect(g, x - 4, y + h + 3, w + 8, 8, 3, shade(p.door, 0.15));
    const colors = ['#f48fa0', '#f7d36b', '#ffffff', '#f48fa0'];
    colors.forEach((c, i) => circle(g, x + 3 + i * ((w - 6) / 3), y + h + 2, 3.2, c));
  } else {
    fillRoundRect(g, x - 5, y + h + 3, w + 10, 4, 2, shade(p.trim, -0.1));
  }
}

function drawCottageRoof(g: Ctx, b: BuildingDef, env: RenderEnv): void {
  const { x, y, width: w, wallHeight: wh, roofHeight: rh, palette: p } = b;
  const base = y - wh + 8;
  const top = y - wh - rh;

  // Chimney (behind the roof) with gentle smoke.
  fillRoundRect(g, x + w * 0.22, top - 6, 22, rh * 0.6, 4, shade(p.roof, -0.25));
  fillRoundRect(g, x + w * 0.22 - 3, top - 10, 28, 8, 3, shade(p.roof, -0.35));
  if (!env.reducedMotion) {
    for (let i = 0; i < 3; i++) {
      const t = (env.time * 0.35 + i / 3) % 1;
      circle(g, x + w * 0.22 + 11 + Math.sin(t * 5 + i) * 4 + t * 10, top - 16 - t * 40, 5 + t * 7, `rgba(255,255,255,${0.35 * (1 - t)})`);
    }
  }

  g.save();
  g.lineJoin = 'round';
  g.lineWidth = 12;
  g.beginPath();
  g.moveTo(x - w / 2 - 14, base);
  g.lineTo(x - w / 2 + 26, top);
  g.lineTo(x + w / 2 - 26, top);
  g.lineTo(x + w / 2 + 14, base);
  g.closePath();
  g.fillStyle = p.roof;
  g.strokeStyle = p.roof;
  g.fill();
  g.stroke();
  g.restore();

  // Shingle rows
  g.strokeStyle = shade(p.roof, 0.14);
  g.lineWidth = 2;
  g.lineCap = 'round';
  for (let i = 1; i < 4; i++) {
    const yy = top + (rh * i) / 4;
    const inset = 26 - (40 * i) / 4;
    g.beginPath();
    g.moveTo(x - w / 2 + inset + 4, yy);
    g.lineTo(x + w / 2 - inset - 4, yy);
    g.stroke();
  }
  fillRoundRect(g, x - w / 2 - 20, base - 2, w + 40, 9, 5, shade(p.roof, -0.18));

  // Round attic window
  circle(g, x, top + rh * 0.45, 13, p.trim);
  circle(g, x, top + rh * 0.45, 9.5, windowColor(env.night));
}

function drawLabRoof(g: Ctx, b: BuildingDef, env: RenderEnv): void {
  const { x, y, width: w, wallHeight: wh, roofHeight: rh, palette: p } = b;
  const top = y - wh;

  // Observatory dome
  const dx = x - w * 0.24;
  g.beginPath();
  g.arc(dx, top - rh * 0.45, 34, Math.PI, 0);
  g.closePath();
  g.fillStyle = shade(p.trim, -0.06);
  g.fill();
  g.save();
  g.beginPath();
  g.arc(dx, top - rh * 0.45, 34, Math.PI, 0);
  g.clip();
  g.fillStyle = shade(p.roof, -0.2);
  g.fillRect(dx - 5, top - rh * 0.45 - 34, 10, 34);
  g.restore();

  // Satellite dish
  const sx = x + w * 0.28;
  fillRoundRect(g, sx - 2, top - rh * 0.45 - 20, 4, 22, 2, '#8a96a6');
  g.beginPath();
  g.ellipse(sx, top - rh * 0.45 - 24, 16, 9, -0.5, Math.PI * 0.05, Math.PI * 1.05);
  g.fillStyle = '#f2f5f8';
  g.fill();
  const blink = env.reducedMotion ? 1 : (Math.sin(env.time * 3) + 1) / 2;
  circle(g, sx + 6, top - rh * 0.45 - 30, 2.4, `rgba(255, 99, 99, ${0.4 + 0.6 * blink})`);

  // Flat roof slab + accent stripe
  fillRoundRect(g, x - w / 2 - 10, top - rh * 0.45, w + 20, rh * 0.45 + 10, 8, p.roof);
  fillRoundRect(g, x - w / 2 - 10, top + 2, w + 20, 8, 4, shade(p.roof, -0.2));
  fillRoundRect(g, x - w / 2, top + 14, w, 6, 3, p.accent);
}

function drawWorkshopRoof(g: Ctx, b: BuildingDef): void {
  const { x, y, width: w, wallHeight: wh, roofHeight: rh, palette: p } = b;
  const base = y - wh + 6;
  const teeth = 3;
  const tw = (w + 24) / teeth;
  const left = x - w / 2 - 12;
  for (let i = 0; i < teeth; i++) {
    const tx = left + i * tw;
    g.save();
    g.lineJoin = 'round';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(tx, base);
    g.lineTo(tx + tw, base);
    g.lineTo(tx + tw, base - rh);
    g.closePath();
    g.fillStyle = p.roof;
    g.strokeStyle = p.roof;
    g.fill();
    g.stroke();
    g.restore();
    // Skylight glass on the vertical face
    fillRoundRect(g, tx + tw - 9, base - rh + 10, 6, rh - 16, 2, '#cfe3ec');
  }
  fillRoundRect(g, x - w / 2 - 16, base - 4, w + 32, 9, 4, shade(p.roof, -0.2));

  // Gear sign
  const gx = x + w * 0.3;
  const gy = y - wh - rh * 0.35;
  g.save();
  g.translate(gx, gy);
  g.fillStyle = p.accent;
  for (let i = 0; i < 8; i++) {
    g.rotate(Math.PI / 4);
    g.fillRect(-3, -15, 6, 6);
  }
  circle(g, 0, 0, 11, p.accent);
  circle(g, 0, 0, 4.5, shade(p.roof, -0.1));
  g.restore();
}

function drawPlaque(g: Ctx, x: number, y: number, text: string, p: BuildingDef['palette']): void {
  g.font = `600 11px ${UI_FONT}`;
  const tw = g.measureText(text).width;
  fillRoundRect(g, x - tw / 2 - 9, y - 9, tw + 18, 18, 9, shade(p.door, -0.1));
  fillRoundRect(g, x - tw / 2 - 7, y - 7.5, tw + 14, 15, 7.5, p.trim);
  g.fillStyle = '#3d2f2c';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, x, y + 0.5);
}

/** Door with a hinge-swing animation (`open` 0..1). */
export function drawDoor(g: Ctx, b: BuildingDef, open: number): void {
  const x = b.x - DOOR_W / 2;
  const y = b.y - DOOR_H - 2;
  fillRoundRect(g, x - 3, y - 3, DOOR_W + 6, DOOR_H + 3, [DOOR_W / 2 + 3, DOOR_W / 2 + 3, 2, 2], b.palette.trim);
  fillRoundRect(g, x, y, DOOR_W, DOOR_H, [DOOR_W / 2, DOOR_W / 2, 1, 1], '#3b2b33');
  const visible = DOOR_W * (1 - open * 0.75);
  fillRoundRect(g, x, y, visible, DOOR_H, [Math.min(DOOR_W / 2, visible / 2), DOOR_W / 2, 1, 1], b.palette.door);
  if (open < 0.6) circle(g, x + visible - 6, y + DOOR_H * 0.55, 2.4, b.palette.accent);
  // Warm light spilling out when open
  if (open > 0.05) {
    g.fillStyle = `rgba(255, 214, 140, ${0.35 * open})`;
    g.beginPath();
    g.moveTo(x + visible, y + DOOR_H);
    g.lineTo(x + DOOR_W, y + DOOR_H);
    g.lineTo(x + DOOR_W + 6, y + DOOR_H + 10);
    g.lineTo(x + visible - 4, y + DOOR_H + 10);
    g.fill();
  }
}
