/**
 * Owns the canvas element and keeps its backing store matched to CSS size ×
 * devicePixelRatio (capped at 2 to keep fill-rate reasonable on phones).
 */
export class Viewport {
  readonly ctx: CanvasRenderingContext2D;
  /** CSS pixels. */
  width = 1;
  height = 1;
  dpr = 1;
  private listeners: Array<() => void> = [];

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is not supported in this browser.');
    this.ctx = ctx;
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas);
    window.addEventListener('resize', () => this.resize());
  }

  onResize(fn: () => void): void {
    this.listeners.push(fn);
  }

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    if (w === this.width && h === this.height && dpr === this.dpr) return;
    this.width = w;
    this.height = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.listeners.forEach((fn) => fn());
  }
}
