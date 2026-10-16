import type { InteractionDef, NpcDef } from '../content/types';
import { drawCharacter, type Facing } from '../render/CharacterPainter';
import type { RenderEnv } from '../render/draw';
import type { Rect } from '../systems/CollisionSystem';
import type { Interactable } from '../systems/InteractionSystem';
import { Entity } from './Entity';

/** A friendly villager: idles, turns toward you, and waves when you come close. No AI. */
export class Npc extends Entity {
  private time = Math.random() * 10;
  private wave = 0;
  private waveTimer = 0;
  private wasNear = false;
  private facing: Facing = 'down';
  private readonly target: Interactable;

  constructor(
    readonly def: NpcDef,
    private readonly watch: { pos: { x: number; y: number } },
    onInteract: (i: InteractionDef) => void,
  ) {
    super(def.x, def.y);
    this.target = { label: def.interact.label, x: def.x, y: def.y + 4, reach: 48, interact: () => onInteract(def.interact) };
  }

  override collider(): Rect {
    return { x: this.pos.x - 9, y: this.pos.y - 7, w: 18, h: 9 };
  }

  override interactable(): Interactable {
    return this.target;
  }

  override update(dt: number, env: RenderEnv): void {
    this.time += dt;
    const dx = this.watch.pos.x - this.pos.x;
    const dy = this.watch.pos.y - this.pos.y;
    const near = Math.hypot(dx, dy) < 130;
    if (near && !this.wasNear) this.waveTimer = 1.6;
    this.wasNear = near;
    if (near) this.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    else this.facing = 'down';
    this.waveTimer = Math.max(0, this.waveTimer - dt);
    const goal = this.waveTimer > 0 && this.facing === 'down' ? 1 : 0;
    this.wave = env.reducedMotion ? goal : this.wave + (goal - this.wave) * Math.min(1, dt * 10);
  }

  render(g: CanvasRenderingContext2D): void {
    drawCharacter(g, this.pos.x, this.pos.y, this.def.appearance, {
      facing: this.facing,
      walk: 0,
      moving: false,
      time: this.time,
      wave: this.wave,
    });
  }
}
