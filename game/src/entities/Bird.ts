import { drawBird } from '../render/AnimalPainters';
import type { RenderEnv } from '../render/draw';
import type { Rect } from '../systems/CollisionSystem';
import { Entity } from './Entity';

/** Birds startle when you come this close. */
export const BIRD_SCARE_DISTANCE = 85;

/** Whether a landed bird should take off. Pure, so it's unit-tested. */
export function birdShouldLeave(playerDistance: number, night: number, restLeft: number): boolean {
  return playerDistance < BIRD_SCARE_DISTANCE || night > 0.6 || restLeft <= 0;
}

type BirdState = 'away' | 'flyIn' | 'ground' | 'flyOff';

/**
 * A small bird that flies in, hops and pecks on the ground, and flutters away
 * when you get close (or when night falls). Purely decorative.
 */
export class Bird extends Entity {
  private state: BirdState = 'away';
  private timer: number;
  private z = 0;
  private dir = 1;
  private flap = 0;
  private peck = 0;
  private from = { x: 0, y: 0, z: 0 };
  private to = { x: 0, y: 0 };
  private t = 0;
  private flightTime = 1;
  private readonly color: number;

  constructor(
    private readonly spots: ReadonlyArray<[number, number]>,
    private readonly watch: { pos: { x: number; y: number } },
    private readonly onStartle: () => void,
    index: number,
    private readonly rand: () => number = Math.random,
  ) {
    super(-9999, -9999);
    this.color = index;
    this.timer = 1 + index * 2.2 + rand() * 3;
  }

  /** Flying birds draw on top of everything. */
  override get sortY(): number {
    return this.state === 'ground' ? this.pos.y : this.pos.y + 5000;
  }

  override bounds(): Rect {
    return { x: this.pos.x - 15, y: this.pos.y - this.z - 20, w: 30, h: this.z + 26 };
  }

  override update(dt: number, env: RenderEnv): void {
    this.flap += dt * 22;
    switch (this.state) {
      case 'away':
        this.timer -= dt;
        if (this.timer <= 0 && env.night < 0.5) this.takeFlight('in');
        break;
      case 'flyIn':
      case 'flyOff': {
        this.t = Math.min(1, this.t + dt / this.flightTime);
        const e = this.state === 'flyIn' ? 1 - (1 - this.t) ** 2 : this.t * this.t;
        this.pos.set(this.from.x + (this.to.x - this.from.x) * e, this.from.y + (this.to.y - this.from.y) * e);
        this.z = this.state === 'flyIn' ? this.from.z * (1 - e) : 140 * e;
        if (this.t >= 1) {
          if (this.state === 'flyIn') {
            this.state = 'ground';
            this.z = 0;
            this.timer = 8 + this.rand() * 10;
          } else {
            this.state = 'away';
            this.pos.set(-9999, -9999);
            this.timer = 6 + this.rand() * 14;
          }
        }
        break;
      }
      case 'ground': {
        this.timer -= dt;
        // Peck now and then; hop a little.
        this.peck = Math.max(0, Math.sin(this.flap * 0.18) * (Math.sin(this.flap * 0.03) > 0.3 ? 1 : 0));
        if (this.rand() < dt * 0.5) {
          const hop = (this.rand() - 0.5) * 16;
          this.pos.set(this.pos.x + hop, this.pos.y + (this.rand() - 0.5) * 6);
          if (hop !== 0) this.dir = hop > 0 ? 1 : -1;
        }
        const d = Math.hypot(this.watch.pos.x - this.pos.x, this.watch.pos.y - this.pos.y);
        if (birdShouldLeave(d, env.night, this.timer)) {
          if (d < BIRD_SCARE_DISTANCE) this.onStartle();
          this.takeFlight('off');
        }
        break;
      }
    }
  }

  private takeFlight(kind: 'in' | 'off'): void {
    this.t = 0;
    if (kind === 'in') {
      const [sx, sy] = this.spots[Math.floor(this.rand() * this.spots.length)];
      this.to = { x: sx + (this.rand() - 0.5) * 30, y: sy + (this.rand() - 0.5) * 20 };
      const ang = -Math.PI / 2 + (this.rand() - 0.5) * 2;
      this.from = { x: this.to.x + Math.cos(ang) * 320, y: this.to.y + Math.sin(ang) * 120, z: 160 };
      this.flightTime = 2.2;
      this.state = 'flyIn';
    } else {
      // Fly away from the player.
      const ang = Math.atan2(this.pos.y - this.watch.pos.y, this.pos.x - this.watch.pos.x) + (this.rand() - 0.5) * 0.8;
      this.from = { x: this.pos.x, y: this.pos.y, z: 0 };
      this.to = { x: this.pos.x + Math.cos(ang) * 420, y: this.pos.y + Math.sin(ang) * 260 - 80 };
      this.flightTime = 1.8;
      this.state = 'flyOff';
    }
    this.dir = this.to.x >= this.pos.x ? 1 : -1;
  }

  render(g: CanvasRenderingContext2D, env: RenderEnv): void {
    if (this.state === 'away') return;
    const flap = env.reducedMotion ? 1 : this.flap;
    drawBird(g, this.pos.x, this.pos.y, this.z, this.dir, flap, this.state === 'ground' ? this.peck : 0, this.color);
  }
}
