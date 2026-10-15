import type { Camera } from '../core/Camera';

/** A warm point light in world space. */
export interface Light {
  x: number;
  y: number;
  radius: number;
  /** "r,g,b" components 0..255. */
  color: [number, number, number];
  intensity: number;
}

/**
 * Night lighting via a light map: fill a low-res buffer with the night ambient
 * color, add each light as a radial gradient, then multiply the buffer over the
 * scene. A soft additive bloom on top makes lamps and windows glow.
 */
export class LightingSystem {
  private readonly buf = document.createElement('canvas');
  private readonly bctx = this.buf.getContext('2d')!;
  private static readonly SCALE = 0.5;

  /**
   * @param night 0..1 darkness
   * @param ambient ambient color at full night
   */
  render(
    g: CanvasRenderingContext2D,
    camera: Camera,
    dpr: number,
    lights: readonly Light[],
    night: number,
    ambient: [number, number, number] = [74, 84, 150],
  ): void {
    if (night <= 0.005) return;
    const S = LightingSystem.SCALE;
    const w = Math.ceil(camera.viewW * S);
    const h = Math.ceil(camera.viewH * S);
    if (this.buf.width !== w || this.buf.height !== h) {
      this.buf.width = w;
      this.buf.height = h;
    }
    const b = this.bctx;
    const mix = (c: number) => Math.round(255 + (c - 255) * night);
    b.globalCompositeOperation = 'source-over';
    b.fillStyle = `rgb(${mix(ambient[0])},${mix(ambient[1])},${mix(ambient[2])})`;
    b.fillRect(0, 0, w, h);

    b.globalCompositeOperation = 'lighter';
    const view = camera.visibleRect(200);
    for (const L of lights) {
      if (L.x < view.x || L.x > view.x + view.w || L.y < view.y || L.y > view.y + view.h) continue;
      const p = camera.worldToScreen(L.x, L.y);
      const r = L.radius * camera.zoom * S;
      const k = L.intensity * night;
      const grad = b.createRadialGradient(p.x * S, p.y * S, 0, p.x * S, p.y * S, r);
      const [cr, cg, cb] = L.color;
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${k})`);
      grad.addColorStop(0.45, `rgba(${cr},${cg},${cb},${k * 0.45})`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      b.fillStyle = grad;
      b.fillRect(p.x * S - r, p.y * S - r, r * 2, r * 2);
    }

    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'multiply';
    g.drawImage(this.buf, 0, 0, g.canvas.width, g.canvas.height);

    // Bloom: small additive halos at each light core.
    g.globalCompositeOperation = 'lighter';
    for (const L of lights) {
      if (L.x < view.x || L.x > view.x + view.w || L.y < view.y || L.y > view.y + view.h) continue;
      const p = camera.worldToScreen(L.x, L.y);
      const r = L.radius * 0.35 * camera.zoom * dpr;
      const grad = g.createRadialGradient(p.x * dpr, p.y * dpr, 0, p.x * dpr, p.y * dpr, r);
      const [cr, cg, cb] = L.color;
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${0.22 * night * L.intensity})`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      g.fillStyle = grad;
      g.fillRect(p.x * dpr - r, p.y * dpr - r, r * 2, r * 2);
    }
    g.restore();
  }
}
