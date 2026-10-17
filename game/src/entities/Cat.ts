import type { CatDef } from '../content/types';
import { drawCat, drawHeart, type CatPose } from '../render/AnimalPainters';
import type { RenderEnv } from '../render/draw';
import type { CollisionSystem, Rect } from '../systems/CollisionSystem';
import type { Interactable } from '../systems/InteractionSystem';
import { Entity } from './Entity';

/** A random point within `roam` of home. Pure, so it's unit-tested. */
export function pickWanderTarget(homeX: number, homeY: number, roam: number, rand: () => number): { x: number; y: number } {
  const a = rand() * Math.PI * 2;
  const r = Math.sqrt(rand()) * roam;
  return { x: homeX + Math.cos(a) * r, y: homeY + Math.sin(a) * r * 0.7 };
}

/**
 * A cat that wanders around its home spot, sits, naps (more often at night),
 * and purrs with little hearts when you pet it. Not solid: you can walk past.
 */
export class Cat extends Entity {
  static readonly SPEED = 38;
  private pose: CatPose = 'sit';
  private timer = 1 + Math.random() * 3;
  private goal: { x: number; y: number } | null = null;
  private dir = Math.random() < 0.5 ? -1 : 1;
  private walk = 0;
  private time = Math.random() * 10;
  private hearts: Array<{ x: number; age: number }> = [];

  constructor(
    readonly def: CatDef,
    private readonly collision: CollisionSystem,
    private readonly onPet: (cat: Cat) => void,
    private readonly rand: () => number = Math.random,
  ) {
    super(def.x, def.y);
    if (def.roam === 0) {
      this.pose = 'loaf';
      this.timer = 8;
    }
  }

  /** One stable prompt object (so the HUD doesn't re-announce every frame) that follows the cat. */
  private readonly prompt = ((cat: Cat): Interactable => ({
    get label() {
      return `Pet ${cat.def.name}`;
    },
    get x() {
      return cat.pos.x;
    },
    get y() {
      return cat.pos.y + 4;
    },
    reach: 44,
    interact: () => cat.pet(),
  }))(this);

  override interactable(): Interactable {
    return this.prompt;
  }

  override bounds(): Rect {
    return { x: this.pos.x - 24, y: this.pos.y - 50, w: 48, h: 56 };
  }

  pet(): void {
    this.pose = 'petted';
    this.timer = 2.4;
    this.goal = null;
    for (let i = 0; i < 3; i++) this.hearts.push({ x: (i - 1) * 7, age: -i * 0.18 });
    this.onPet(this);
  }

  override update(dt: number, env: RenderEnv): void {
    this.time += dt;
    for (const h of this.hearts) h.age += dt;
    this.hearts = this.hearts.filter((h) => h.age < 1.4);

    if (this.pose === 'walk' && this.goal) {
      const dx = this.goal.x - this.pos.x;
      const dy = this.goal.y - this.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) return this.settle(env);
      const step = Math.min(dist, Cat.SPEED * dt);
      const box = { x: this.pos.x - 6, y: this.pos.y - 4, w: 12, h: 6 };
      const r = this.collision.move(box, (dx / dist) * step, (dy / dist) * step);
      this.pos.set(r.x + 6, r.y + 4);
      if (Math.abs(dx) > 1) this.dir = dx > 0 ? 1 : -1;
      this.walk += dt * 10;
      if (r.blockedX && r.blockedY) this.settle(env);
      return;
    }

    this.timer -= dt;
    if (this.timer > 0) return;
    if (this.def.roam === 0) {
      // House cats mostly nap, sometimes sit up for a look around.
      this.pose = this.pose === 'loaf' ? 'sit' : 'loaf';
      this.timer = this.pose === 'loaf' ? 10 + this.rand() * 8 : 4 + this.rand() * 3;
      return;
    }
    const sleepy = env.night > 0.5 ? 0.5 : 0.15;
    const roll = this.rand();
    if (roll < sleepy) {
      this.pose = 'loaf';
      this.timer = 6 + this.rand() * 6;
    } else if (roll < sleepy + 0.25) {
      this.pose = 'sit';
      this.timer = 2 + this.rand() * 3;
    } else {
      this.pose = 'walk';
      this.goal = pickWanderTarget(this.def.x, this.def.y, this.def.roam, this.rand);
    }
  }

  private settle(env: RenderEnv): void {
    this.goal = null;
    this.pose = env.night > 0.5 && this.rand() < 0.5 ? 'loaf' : 'sit';
    this.timer = 2 + this.rand() * 4;
  }

  render(g: CanvasRenderingContext2D, env: RenderEnv): void {
    drawCat(g, this.pos.x, this.pos.y, this.def.coat, { pose: this.pose, dir: this.dir, walk: this.walk, time: this.time });
    for (const h of this.hearts) {
      if (h.age < 0) continue;
      const rise = env.reducedMotion ? 10 : h.age * 22;
      drawHeart(g, this.pos.x + h.x, this.pos.y - 32 - rise, 3.2, Math.max(0, 1 - h.age / 1.4));
    }
  }
}
