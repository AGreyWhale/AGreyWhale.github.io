import type { Rect } from '../systems/CollisionSystem';
import { Vec2 } from './Vec2';

/**
 * World → screen transform. Follows a target smoothly, clamps to world bounds,
 * and centers the world when it is smaller than the screen.
 */
export class Camera {
  /** World point at the center of the screen. */
  pos = new Vec2();
  zoom = 1;
  /** Screen size in CSS pixels. */
  viewW = 1;
  viewH = 1;
  bounds: Rect | null = null;

  setView(w: number, h: number, zoom: number): void {
    this.viewW = w;
    this.viewH = h;
    this.zoom = zoom;
    this.clamp();
  }

  snapTo(target: { x: number; y: number }): void {
    this.pos.set(target.x, target.y);
    this.clamp();
  }

  follow(target: { x: number; y: number }, dt: number, smooth: boolean): void {
    if (!smooth) return this.snapTo(target);
    const k = 1 - Math.exp(-dt * 5);
    this.pos.set(this.pos.x + (target.x - this.pos.x) * k, this.pos.y + (target.y - this.pos.y) * k);
    this.clamp();
  }

  /** Applies the world transform to a context whose canvas is sized at `dpr`. */
  apply(g: CanvasRenderingContext2D, dpr: number): void {
    const s = this.zoom * dpr;
    g.setTransform(s, 0, 0, s, (this.viewW / 2 - this.pos.x * this.zoom) * dpr, (this.viewH / 2 - this.pos.y * this.zoom) * dpr);
  }

  worldToScreen(x: number, y: number): Vec2 {
    return new Vec2((x - this.pos.x) * this.zoom + this.viewW / 2, (y - this.pos.y) * this.zoom + this.viewH / 2);
  }

  /** Visible world rectangle (with optional margin), for culling. */
  visibleRect(margin = 0): Rect {
    const w = this.viewW / this.zoom;
    const h = this.viewH / this.zoom;
    return { x: this.pos.x - w / 2 - margin, y: this.pos.y - h / 2 - margin, w: w + margin * 2, h: h + margin * 2 };
  }

  private clamp(): void {
    const b = this.bounds;
    if (!b) return;
    const halfW = this.viewW / this.zoom / 2;
    const halfH = this.viewH / this.zoom / 2;
    this.pos.x = b.w <= halfW * 2 ? b.x + b.w / 2 : Math.min(Math.max(this.pos.x, b.x + halfW), b.x + b.w - halfW);
    this.pos.y = b.h <= halfH * 2 ? b.y + b.h / 2 : Math.min(Math.max(this.pos.y, b.y + halfH), b.y + b.h - halfH);
  }
}
