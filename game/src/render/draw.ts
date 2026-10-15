/** Small drawing helpers shared by all painters: rounded shapes, shadows, color math. */

export type Ctx = CanvasRenderingContext2D;

/** Everything a painter may need to know about the current frame. */
export interface RenderEnv {
  /** Seconds since start. */
  time: number;
  /** 0 = day, 1 = night. */
  night: number;
  reducedMotion: boolean;
}

export function roundRect(g: Ctx, x: number, y: number, w: number, h: number, r: number | number[]): void {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

export function fillRoundRect(g: Ctx, x: number, y: number, w: number, h: number, r: number | number[], color: string): void {
  roundRect(g, x, y, w, h, r);
  g.fillStyle = color;
  g.fill();
}

export function ellipse(g: Ctx, x: number, y: number, rx: number, ry: number, color: string): void {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = color;
  g.fill();
}

export function circle(g: Ctx, x: number, y: number, r: number, color: string): void {
  ellipse(g, x, y, r, r, color);
}

/** Soft contact shadow under an object. */
export function shadow(g: Ctx, x: number, y: number, rx: number, ry = rx * 0.32, alpha = 0.16): void {
  ellipse(g, x, y, rx, ry, `rgba(52, 38, 60, ${alpha})`);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');

/** Linear blend between two hex colors. */
export function mixColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Lighten (amt > 0) or darken (amt < 0) a hex color by mixing with white/black. */
export function shade(hex: string, amt: number): string {
  return amt >= 0 ? mixColor(hex, '#ffffff', amt) : mixColor(hex, '#1c1626', -amt);
}

export function withAlpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Window glass: pale blue by day, warm glow at night. */
export function windowColor(night: number): string {
  return mixColor('#cfe3ec', '#ffd27a', night);
}

export const UI_FONT = '"Space Grotesk", system-ui, sans-serif';
