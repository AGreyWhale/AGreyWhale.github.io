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
  if (b.style === 'pavilion') return [];
  const ww = b.style === 'lab' ? 46 : b.style === 'boba' ? 44 : 36;
  const wh = b.style === 'lab' ? 36 : b.style === 'school' ? 38 : 30;
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
  if (b.style === 'pavilion' || b.style === 'greenhouse') {
    if (b.style === 'pavilion') drawPavilion(g, b, env);
    else drawGreenhouse(g, b, env);
    if (env.season === 'winter') drawRoofSnow(g, b);
    return;
  }

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
    case 'school':
      drawSchoolRoof(g, b);
      break;
    case 'boba':
      drawBobaShop(g, b, env);
      break;
    case 'postOffice':
      drawPostOffice(g, b, env);
      break;
  }

  if (env.season === 'winter') drawRoofSnow(g, b);
  drawPlaque(g, x, y - DOOR_H - 18, b.name, p);
}

/** A soft blanket of snow along each roof's top edge (winter only). */
function drawRoofSnow(g: Ctx, b: BuildingDef): void {
  const { x, y, width: w, wallHeight: wh, roofHeight: rh } = b;
  const snow = '#ffffff';
  const drips = (x0: number, x1: number, yy: number) => {
    for (let px = x0 + 8; px < x1 - 6; px += 17) ellipse(g, px, yy + 4, 4, 5, snow);
  };
  switch (b.style) {
    case 'cottage':
    case 'school':
    case 'postOffice': {
      const inset = b.style === 'postOffice' ? 30 : 26;
      const top = y - wh - rh;
      fillRoundRect(g, x - w / 2 + inset - 10, top - 8, w - inset * 2 + 20, 14, 7, snow);
      drips(x - w / 2 + inset - 10, x + w / 2 - inset + 10, top);
      // A dusting along the eave too.
      fillRoundRect(g, x - w / 2 - 18, y - wh + 2, w + 36, 6, 3, 'rgba(255,255,255,0.85)');
      break;
    }
    case 'lab': {
      const top = y - wh - rh * 0.45;
      fillRoundRect(g, x - w / 2 - 12, top - 6, w + 24, 11, 5, snow);
      drips(x - w / 2 - 12, x + w / 2 + 12, top - 2);
      g.beginPath();
      g.arc(x - w * 0.24, top, 34, Math.PI * 1.15, Math.PI * 1.85);
      g.lineWidth = 7;
      g.strokeStyle = snow;
      g.lineCap = 'round';
      g.stroke();
      break;
    }
    case 'workshop':
      fillRoundRect(g, x - w / 2 - 18, y - wh - 4, w + 36, 9, 4, snow);
      drips(x - w / 2 - 18, x + w / 2 + 18, y - wh - 4);
      break;
    case 'boba':
      fillRoundRect(g, x - w / 2 - 10, y - wh - 19, w + 20, 10, 5, snow);
      drips(x - w / 2 - 10, x + w / 2 + 10, y - wh - 19);
      break;
    case 'greenhouse':
    case 'pavilion': {
      const top = y - wh - rh;
      // Greenhouse peaks at a point; the pavilion has a short flat ridge.
      const half = b.style === 'greenhouse' ? 12 : 30;
      fillRoundRect(g, x - half, top - 4, half * 2, 11, 6, snow);
      g.strokeStyle = 'rgba(255,255,255,0.9)';
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(x - half, top + 2);
      g.lineTo(x - w / 2 - 6, y - wh + 2);
      g.moveTo(x + half, top + 2);
      g.lineTo(x + w / 2 + 6, y - wh + 2);
      g.stroke();
      break;
    }
  }
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

/** A rounded gable roof shared by several styles. Returns its base and ridge y. */
function gable(g: Ctx, b: BuildingDef, color: string, overhang = 14, inset = 26): { base: number; top: number } {
  const { x, y, width: w, wallHeight: wh, roofHeight: rh } = b;
  const base = y - wh + 8;
  const top = y - wh - rh;
  g.save();
  g.lineJoin = 'round';
  g.lineWidth = 12;
  g.beginPath();
  g.moveTo(x - w / 2 - overhang, base);
  g.lineTo(x - w / 2 + inset, top);
  g.lineTo(x + w / 2 - inset, top);
  g.lineTo(x + w / 2 + overhang, base);
  g.closePath();
  g.fillStyle = color;
  g.strokeStyle = color;
  g.fill();
  g.stroke();
  g.restore();
  fillRoundRect(g, x - w / 2 - overhang - 6, base - 2, w + overhang * 2 + 12, 9, 5, shade(color, -0.2));
  return { base, top };
}

function drawSchoolRoof(g: Ctx, b: BuildingDef): void {
  const { x, palette: p } = b;
  const top = b.y - b.wallHeight - b.roofHeight;
  // Bell tower first, so the roof overlaps its base.
  fillRoundRect(g, x - 17, top - 36, 34, 44, 3, p.wall);
  fillRoundRect(g, x - 9, top - 28, 18, 22, [9, 9, 0, 0], shade(p.wall, -0.45));
  circle(g, x, top - 14, 6, p.accent);
  g.fillStyle = p.roof;
  g.beginPath();
  g.moveTo(x - 24, top - 34);
  g.lineTo(x, top - 58);
  g.lineTo(x + 24, top - 34);
  g.closePath();
  g.fill();

  const r = gable(g, b, p.roof);
  g.strokeStyle = shade(p.roof, 0.14);
  g.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    const yy = r.top + ((r.base - r.top) * i) / 4;
    g.beginPath();
    g.moveTo(x - b.width / 2 + 30 - i * 9, yy);
    g.lineTo(x + b.width / 2 - 30 + i * 9, yy);
    g.stroke();
  }
  // Apple on the gable
  circle(g, x, r.top + 34, 9, '#e0685a');
  fillRoundRect(g, x - 1, r.top + 21, 2, 6, 1, '#6b4a35');
  ellipse(g, x + 4, r.top + 23, 4, 2, '#87b48b');
}

function drawBobaShop(g: Ctx, b: BuildingDef, env: RenderEnv): void {
  const { x, y, width: w, wallHeight: wh, palette: p } = b;
  const top = y - wh;
  // Flat roof + parapet
  fillRoundRect(g, x - w / 2 - 8, top - 14, w + 16, 20, 6, p.roof);
  fillRoundRect(g, x - w / 2 - 8, top + 2, w + 16, 6, 3, shade(p.roof, -0.2));
  // Striped, scalloped awning
  const ay = top + 10;
  const stripes = 10;
  const sw = (w + 20) / stripes;
  for (let i = 0; i < stripes; i++) {
    const sx = x - w / 2 - 10 + i * sw;
    g.fillStyle = i % 2 ? p.trim : p.accent;
    g.fillRect(sx, ay, sw + 0.5, 16);
    g.beginPath();
    g.arc(sx + sw / 2, ay + 16, sw / 2, 0, Math.PI);
    g.fill();
  }
  // Giant boba cup sign on the roof
  const sway = env.reducedMotion ? 0 : Math.sin(env.time * 1.5) * 0.04;
  g.save();
  g.translate(x + w * 0.3, top - 14);
  g.rotate(sway);
  const cup = (topY: number, color: string) => {
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(-15 + (topY + 44) * 0.09, topY);
    g.lineTo(15 - (topY + 44) * 0.09, topY);
    g.lineTo(11, 0);
    g.lineTo(-11, 0);
    g.closePath();
    g.fill();
  };
  cup(-44, 'rgba(255,255,255,0.92)');
  cup(-34, '#d9b48f');
  for (const [px, py] of [
    [-6, -6],
    [0, -4],
    [6, -7],
    [-3, -11],
    [4, -12],
  ]) {
    circle(g, px, py, 3, '#3a2b30');
  }
  ellipse(g, 0, -44, 16, 5, p.accent);
  fillRoundRect(g, 3, -66, 5, 26, 2, '#e0685a');
  g.restore();
}

function drawPostOffice(g: Ctx, b: BuildingDef, env: RenderEnv): void {
  const { x, y, width: w, wallHeight: wh, palette: p } = b;
  // Flagpole beside the building, with a gently waving flag
  const fx = x - w / 2 - 26;
  fillRoundRect(g, fx - 2, y - wh - 70, 4, wh + 70, 2, '#8a96a6');
  circle(g, fx, y - wh - 72, 3.5, p.accent);
  const wave = env.reducedMotion ? 0 : env.time * 3;
  g.fillStyle = '#e0685a';
  g.beginPath();
  for (let i = 0; i <= 8; i++) g.lineTo(fx + 2 + i * 4.5, y - wh - 66 + Math.sin(wave + i * 0.7) * 2);
  for (let i = 8; i >= 0; i--) g.lineTo(fx + 2 + i * 4.5, y - wh - 46 + Math.sin(wave + i * 0.7) * 2);
  g.closePath();
  g.fill();
  fillRoundRect(g, fx + 8, y - wh - 61 + Math.sin(wave + 1.4) * 2, 12, 9, 1, '#ffffff');

  const r = gable(g, b, p.roof, 12, 30);
  // Envelope emblem on the gable
  const ey = r.top + (r.base - r.top) * 0.5;
  fillRoundRect(g, x - 18, ey - 12, 36, 24, 3, '#fffaf2');
  g.strokeStyle = p.door;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x - 18, ey - 11);
  g.lineTo(x, ey + 2);
  g.lineTo(x + 18, ey - 11);
  g.stroke();
  circle(g, x, ey + 3, 3.5, '#e0685a');
}

function drawGreenhouse(g: Ctx, b: BuildingDef, env: RenderEnv): void {
  const { x, y, width: w, wallHeight: wh, roofHeight: rh, palette: p } = b;
  const left = x - w / 2;
  fillRoundRect(g, left - 3, y - 20, w + 6, 20, 4, '#c98a6b');

  // Plants visible behind the glass
  const leaf = ['#6aa75f', '#7cb86c', '#5f9a55'];
  for (let i = 0; i < 9; i++) {
    const px = left + 14 + i * ((w - 28) / 8);
    if (Math.abs(px - x) < 26) continue;
    circle(g, px, y - 34 - (i % 3) * 8, 13, leaf[i % 3]);
    if (i % 2 === 0) circle(g, px + 4, y - 44 - (i % 3) * 8, 3, p.accent);
  }

  // Glass walls glow warm at night
  g.fillStyle = env.night > 0.5 ? `rgba(255, 226, 160, ${0.25 + 0.3 * env.night})` : 'rgba(214, 240, 232, 0.55)';
  g.fillRect(left, y - wh, w, wh - 20);
  g.fillStyle = 'rgba(214, 240, 232, 0.78)';
  g.beginPath();
  g.moveTo(left - 8, y - wh + 2);
  g.lineTo(x, y - wh - rh);
  g.lineTo(left + w + 8, y - wh + 2);
  g.closePath();
  g.fill();

  // White frame
  g.strokeStyle = p.trim;
  g.lineWidth = 3;
  g.lineJoin = 'round';
  g.strokeRect(left, y - wh, w, wh - 20);
  g.beginPath();
  for (let i = 1; i < 6; i++) {
    const fx = left + (w * i) / 6;
    g.moveTo(fx, y - wh);
    g.lineTo(fx, y - 20);
  }
  g.moveTo(left, y - wh * 0.55);
  g.lineTo(left + w, y - wh * 0.55);
  g.moveTo(left - 8, y - wh + 2);
  g.lineTo(x, y - wh - rh);
  g.lineTo(left + w + 8, y - wh + 2);
  g.closePath();
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    const lx = left - 8 + (x - left + 8) * t;
    const rx = left + w + 8 - (left + w + 8 - x) * t;
    g.moveTo(lx, y - wh + 2 - rh * t);
    g.lineTo(lx, y - wh + 2);
    g.moveTo(rx, y - wh + 2 - rh * t);
    g.lineTo(rx, y - wh + 2);
  }
  g.stroke();

  g.fillStyle = `rgba(255,255,255,${0.35 * (1 - env.night)})`;
  g.beginPath();
  g.moveTo(left + 20, y - 24);
  g.lineTo(left + 50, y - wh + 4);
  g.lineTo(left + 62, y - wh + 4);
  g.lineTo(left + 32, y - 24);
  g.fill();

  ellipse(g, x, y + 5, DOOR_W / 2 + 10, 6, '#b9a993');
  ellipse(g, x, y + 3.5, DOOR_W / 2 + 8, 5, '#e8e0d4');
  drawPlaque(g, x, y - DOOR_H - 16, b.name, p);
}

function drawPavilion(g: Ctx, b: BuildingDef, env: RenderEnv): void {
  const { x, y, width: w, wallHeight: wh, roofHeight: rh, palette: p } = b;
  const left = x - w / 2;

  // Wooden deck
  fillRoundRect(g, left - 6, y - 62, w + 12, 66, 10, shade(p.door, 0.35));
  fillRoundRect(g, left - 6, y - 8, w + 12, 12, [0, 0, 10, 10], shade(p.door, 0.1));
  g.strokeStyle = shade(p.door, 0.2);
  g.lineWidth = 1.5;
  g.beginPath();
  for (let yy = y - 52; yy < y - 8; yy += 11) {
    g.moveTo(left, yy);
    g.lineTo(left + w, yy);
  }
  g.stroke();

  // Donation crates of produce
  const crate = (cx: number, fruit: string) => {
    fillRoundRect(g, cx - 16, y - 40, 32, 20, 3, '#c99367');
    for (let i = 0; i < 4; i++) circle(g, cx - 10 + i * 7, y - 42, 4, fruit);
  };
  crate(x - 48, '#e0685a');
  crate(x - 14, '#f2c14e');
  crate(x + 46, '#87b48b');

  for (const px of [left + 6, left + w - 6]) fillRoundRect(g, px - 4, y - wh - 6, 8, wh, 3, p.trim);

  // Hip roof
  g.save();
  g.lineJoin = 'round';
  g.lineWidth = 10;
  g.fillStyle = p.roof;
  g.strokeStyle = p.roof;
  g.beginPath();
  g.moveTo(left - 18, y - wh);
  g.lineTo(x - 24, y - wh - rh);
  g.lineTo(x + 24, y - wh - rh);
  g.lineTo(left + w + 18, y - wh);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();

  // Scalloped trim
  const n = 9;
  const sw = (w + 32) / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? p.trim : p.accent;
    g.beginPath();
    g.arc(left - 16 + i * sw + sw / 2, y - wh + 4, sw / 2, 0, Math.PI);
    g.fill();
  }

  // String lights
  g.strokeStyle = 'rgba(80, 70, 60, 0.6)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(left + 6, y - wh + 12);
  g.quadraticCurveTo(x, y - wh + 28, left + w - 6, y - wh + 12);
  g.stroke();
  for (let i = 1; i < 8; i++) {
    const t = i / 8;
    const lx = left + 6 + (w - 12) * t;
    const ly = y - wh + 12 + 32 * t * (1 - t);
    circle(g, lx, ly + 2, 2.6, env.night > 0.3 ? '#ffe08a' : ['#f49cb0', '#f7d36b', '#9fd3c7'][i % 3]);
  }

  // Heart emblem
  const hy = y - wh - rh * 0.45;
  g.fillStyle = '#e0685a';
  g.beginPath();
  g.moveTo(x, hy + 9);
  g.bezierCurveTo(x - 16, hy - 2, x - 8, hy - 14, x, hy - 5);
  g.bezierCurveTo(x + 8, hy - 14, x + 16, hy - 2, x, hy + 9);
  g.fill();
  drawPlaque(g, x, y - wh + 40, b.name, p);
}
