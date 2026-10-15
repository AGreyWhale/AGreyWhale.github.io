import { Vec2 } from '../core/Vec2';
import type { RenderEnv } from '../render/draw';
import type { Rect } from '../systems/CollisionSystem';
import type { Interactable } from '../systems/InteractionSystem';
import type { Light } from '../systems/LightingSystem';

/**
 * Base for everything placed in a world scene. `pos` is the ground contact
 * point (feet / base), which is also what we y-sort by.
 */
export abstract class Entity {
  readonly pos: Vec2;

  constructor(x: number, y: number) {
    this.pos = new Vec2(x, y);
  }

  /** Draw order key: lower y draws first (further back). */
  get sortY(): number {
    return this.pos.y;
  }

  /** Static solid area in world coordinates, if any. */
  collider(): Rect | null {
    return null;
  }

  interactable(): Interactable | null {
    return null;
  }

  lights(_env: RenderEnv): Light[] {
    return [];
  }

  /** Rough visual bounds, used for culling. */
  bounds(): Rect {
    return { x: this.pos.x - 60, y: this.pos.y - 120, w: 120, h: 130 };
  }

  update(_dt: number, _env: RenderEnv): void {}

  abstract render(g: CanvasRenderingContext2D, env: RenderEnv): void;
}
