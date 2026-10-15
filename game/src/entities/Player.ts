import type { CharacterAppearance } from '../content/types';
import { Vec2 } from '../core/Vec2';
import { drawCharacter, type Facing } from '../render/CharacterPainter';
import type { RenderEnv } from '../render/draw';
import type { CollisionSystem, Rect } from '../systems/CollisionSystem';
import type { Light } from '../systems/LightingSystem';
import { Entity } from './Entity';

const FACING_VEC: Record<Facing, Vec2> = {
  down: new Vec2(0, 1),
  up: new Vec2(0, -1),
  left: new Vec2(-1, 0),
  right: new Vec2(1, 0),
};

/** The visitor's character: eased movement, walk cycle, facing, wall sliding. */
export class Player extends Entity {
  static readonly SPEED = 165;
  facing: Facing = 'up';
  visible = true;
  private vel = new Vec2();
  private walk = 0;
  private moving = false;
  private time = 0;

  constructor(
    x: number,
    y: number,
    public appearance: CharacterAppearance,
  ) {
    super(x, y);
  }

  get facingVec(): Vec2 {
    return FACING_VEC[this.facing];
  }

  /** Small box at the feet: what actually collides. */
  feetBox(): Rect {
    return { x: this.pos.x - 8, y: this.pos.y - 6, w: 16, h: 8 };
  }

  get isMoving(): boolean {
    return this.moving;
  }

  /** Moves according to an input direction (length ≤ 1). */
  step(input: Vec2, dt: number, collision: CollisionSystem): void {
    this.time += dt;
    const target = input.scale(Player.SPEED);
    const k = 1 - Math.exp(-dt * 16);
    this.vel = this.vel.lerp(target, k);
    if (input.length() < 0.05 && this.vel.length() < 4) this.vel.set(0, 0);

    const box = this.feetBox();
    const r = collision.move(box, this.vel.x * dt, this.vel.y * dt);
    this.pos.set(r.x + 8, r.y + 6);
    if (r.blockedX) this.vel.x = 0;
    if (r.blockedY) this.vel.y = 0;

    this.moving = input.length() > 0.1;
    if (this.moving) {
      this.facing = Math.abs(input.x) > Math.abs(input.y) ? (input.x > 0 ? 'right' : 'left') : input.y > 0 ? 'down' : 'up';
      this.walk += dt * 11 * Math.max(0.4, this.vel.length() / Player.SPEED);
    } else {
      this.walk = 0;
    }
  }

  /** Ticks idle animation when the player isn't being driven (e.g. during dialogs). */
  idle(dt: number): void {
    this.time += dt;
    this.moving = false;
    this.vel.set(0, 0);
  }

  override bounds(): Rect {
    return { x: this.pos.x - 20, y: this.pos.y - 60, w: 40, h: 64 };
  }

  override lights(): Light[] {
    return [{ x: this.pos.x, y: this.pos.y - 18, radius: 80, color: [255, 236, 200], intensity: 0.35 }];
  }

  render(g: CanvasRenderingContext2D, _env: RenderEnv): void {
    if (!this.visible) return;
    drawCharacter(g, this.pos.x, this.pos.y, this.appearance, {
      facing: this.facing,
      walk: this.walk,
      moving: this.moving,
      time: this.time,
    });
  }
}
