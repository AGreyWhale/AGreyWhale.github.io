import type { Season } from './SaveManager';

export type ParticleKind = 'snow' | 'leaf' | 'petal' | 'firefly';

/** Hard caps per kind, so weather never costs much even on phones. */
export const PARTICLE_CAPS: Record<ParticleKind, number> = { snow: 70, leaf: 26, petal: 22, firefly: 20 };

/**
 * Which particles a season shows. Pure, so it's unit-tested.
 * Fireflies only come out on summer nights.
 */
export function weatherFor(season: Season, night: number, reducedMotion: boolean): Partial<Record<ParticleKind, number>> {
  if (reducedMotion) return {};
  switch (season) {
    case 'winter':
      return { snow: PARTICLE_CAPS.snow };
    case 'autumn':
      return { leaf: PARTICLE_CAPS.leaf };
    case 'spring':
      return { petal: PARTICLE_CAPS.petal };
    case 'summer':
      return night > 0.4 ? { firefly: Math.round(PARTICLE_CAPS.firefly * night) } : {};
  }
}

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  spin: number;
  phase: number;
  color: string;
}

const LEAF_COLORS = ['#e3934a', '#d9653f', '#ecbf4e', '#c46f37'];
const PETAL_COLORS = ['#f6c1cf', '#fbe0e6', '#f3b3bf'];

/**
 * Screen-space weather: falling snow, blowing leaves, drifting petals and
 * fireflies. Particles drift opposite the camera (a little) so they feel
 * like they're in the world rather than stuck to the glass.
 */
export class WeatherSystem {
  private particles: Particle[] = [];

  get count(): number {
    return this.particles.length;
  }

  update(dt: number, w: number, h: number, season: Season, night: number, reducedMotion: boolean, camDx = 0, camDy = 0): void {
    const want = weatherFor(season, night, reducedMotion);
    // Drop kinds that no longer belong, and trim over-target kinds.
    this.particles = this.particles.filter((p) => (want[p.kind] ?? 0) > 0);
    for (const kind of Object.keys(want) as ParticleKind[]) {
      const target = want[kind] ?? 0;
      const have = this.particles.filter((p) => p.kind === kind).length;
      // Ease in a few per frame so the weather fades in instead of popping.
      for (let i = have; i < Math.min(target, have + 3); i++) this.particles.push(this.spawn(kind, w, h, true));
      if (have > target) {
        let extra = have - target;
        this.particles = this.particles.filter((p) => !(p.kind === kind && extra-- > 0));
      }
    }

    for (const p of this.particles) {
      p.phase += dt;
      p.x += (p.vx + Math.sin(p.phase * 1.3) * (p.kind === 'snow' ? 10 : 18)) * dt - camDx * 0.6;
      p.y += p.vy * dt - camDy * 0.6;
      p.rot += p.spin * dt;
      if (p.kind === 'firefly') {
        p.vx += (Math.random() - 0.5) * 30 * dt;
        p.vy += (Math.random() - 0.5) * 30 * dt;
        p.vx = Math.max(-18, Math.min(18, p.vx));
        p.vy = Math.max(-14, Math.min(14, p.vy));
      }
      // Wrap around the screen edges with a margin.
      const m = 30;
      if (p.y > h + m) Object.assign(p, this.spawn(p.kind, w, h, false), { y: -m });
      else if (p.y < -m * 2 && p.kind !== 'firefly') p.y = h + m;
      else if (p.y < -m) p.y = h + m;
      if (p.x > w + m) p.x = -m;
      else if (p.x < -m) p.x = w + m;
    }
  }

  /** Draws in CSS-pixel screen space on top of the scene. */
  render(g: CanvasRenderingContext2D, dpr: number, night: number): void {
    if (!this.particles.length) return;
    g.save();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const p of this.particles) {
      switch (p.kind) {
        case 'snow': {
          const shade = Math.round(255 - 70 * night);
          g.fillStyle = `rgba(${shade}, ${shade}, ${Math.min(255, shade + 20)}, 0.9)`;
          g.beginPath();
          g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          g.fill();
          break;
        }
        case 'leaf':
        case 'petal': {
          g.save();
          g.translate(p.x, p.y);
          g.rotate(p.rot);
          g.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.phase * 2)));
          g.globalAlpha = 1 - night * 0.35;
          g.fillStyle = p.color;
          g.beginPath();
          g.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
          g.fill();
          if (p.kind === 'leaf') {
            g.strokeStyle = 'rgba(90, 50, 20, 0.35)';
            g.lineWidth = 0.8;
            g.beginPath();
            g.moveTo(-p.size, 0);
            g.lineTo(p.size, 0);
            g.stroke();
          }
          g.restore();
          break;
        }
        case 'firefly': {
          const glow = (0.55 + 0.45 * Math.sin(p.phase * 2.4)) * night;
          g.globalCompositeOperation = 'lighter';
          const grad = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10);
          grad.addColorStop(0, `rgba(255, 240, 150, ${0.9 * glow})`);
          grad.addColorStop(1, 'rgba(255, 240, 150, 0)');
          g.fillStyle = grad;
          g.fillRect(p.x - 10, p.y - 10, 20, 20);
          g.globalCompositeOperation = 'source-over';
          break;
        }
      }
    }
    g.restore();
  }

  clear(): void {
    this.particles = [];
  }

  private spawn(kind: ParticleKind, w: number, h: number, anywhere: boolean): Particle {
    const r = Math.random;
    const base = { kind, x: r() * w, y: anywhere ? r() * h : -20, rot: r() * Math.PI * 2, phase: r() * 10, spin: 0, color: '#fff' };
    switch (kind) {
      case 'snow':
        return { ...base, vx: -6 + r() * 12, vy: 26 + r() * 34, size: 1.4 + r() * 2.2 };
      case 'leaf':
        return {
          ...base,
          x: anywhere ? base.x : -20 - r() * w * 0.3,
          y: anywhere ? base.y : r() * h * 0.6,
          vx: 45 + r() * 45,
          vy: 14 + r() * 22,
          size: 4.5 + r() * 2.5,
          spin: (r() - 0.5) * 4,
          color: LEAF_COLORS[Math.floor(r() * LEAF_COLORS.length)],
        };
      case 'petal':
        return { ...base, vx: 14 + r() * 20, vy: 16 + r() * 18, size: 3 + r() * 1.6, spin: (r() - 0.5) * 3, color: PETAL_COLORS[Math.floor(r() * PETAL_COLORS.length)] };
      case 'firefly':
        return { ...base, y: anywhere ? base.y : r() * h, vx: (r() - 0.5) * 16, vy: (r() - 0.5) * 12, size: 2 };
    }
  }
}
