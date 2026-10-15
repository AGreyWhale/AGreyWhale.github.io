import type { BuildingDef } from '../content/buildings';
import { drawDoor } from '../render/BuildingPainter';
import type { RenderEnv } from '../render/draw';
import type { Interactable } from '../systems/InteractionSystem';
import { Entity } from './Entity';

/** A building's front door: swings open as you approach; interacting enters the building. */
export class Door extends Entity {
  private open = 0;
  private readonly target: Interactable;

  constructor(
    readonly def: BuildingDef,
    private readonly watch: { pos: { x: number; y: number } },
    onEnter: () => void,
  ) {
    super(def.x, def.y + 0.5);
    this.target = { label: `Enter the ${def.name}`, x: def.x, y: def.y + 16, reach: 46, interact: onEnter };
  }

  override interactable(): Interactable {
    return this.target;
  }

  override update(dt: number, env: RenderEnv): void {
    const near = Math.hypot(this.watch.pos.x - this.def.x, this.watch.pos.y - (this.def.y + 16)) < 70;
    const goal = near ? 1 : 0;
    this.open = env.reducedMotion ? goal : this.open + (goal - this.open) * Math.min(1, dt * 8);
  }

  render(g: CanvasRenderingContext2D): void {
    drawDoor(g, this.def, this.open);
  }
}
