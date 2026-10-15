import type { InteriorPropDef } from '../content/interiors';
import type { InteractionDef } from '../content/types';
import type { RenderEnv } from '../render/draw';
import { FLAT_PROPS, INTERIOR_FOOTPRINTS, interiorPainters, WALL_PROPS } from '../render/InteriorPainters';
import type { Rect } from '../systems/CollisionSystem';
import type { Interactable } from '../systems/InteractionSystem';
import type { Light } from '../systems/LightingSystem';
import { Entity } from './Entity';

/** A piece of furniture or wall decoration inside a building. */
export class InteriorProp extends Entity {
  private readonly target: Interactable | null;
  readonly onWall: boolean;

  constructor(
    readonly def: InteriorPropDef,
    wallHeight: number,
    onInteract: (i: InteractionDef) => void,
  ) {
    super(def.x, def.y);
    this.onWall = WALL_PROPS.has(def.kind);
    const i = def.interact;
    const point = this.onWall ? { x: def.x, y: wallHeight + 14 } : { x: def.x, y: def.y + 16 };
    this.target = i ? { label: i.label, ...point, reach: this.onWall ? 50 : 52, interact: () => onInteract(i) } : null;
  }

  override get sortY(): number {
    return FLAT_PROPS.has(this.def.kind) ? -1e6 : this.pos.y;
  }

  override collider(): Rect | null {
    const f = INTERIOR_FOOTPRINTS[this.def.kind];
    return f ? { x: this.pos.x + f.x, y: this.pos.y + f.y, w: f.w, h: f.h } : null;
  }

  override interactable(): Interactable | null {
    return this.target;
  }

  override bounds(): Rect {
    return { x: this.pos.x - 160, y: this.pos.y - 130, w: 320, h: 200 };
  }

  override lights(): Light[] {
    const { kind } = this.def;
    const { x, y } = this.pos;
    if (kind === 'floorLamp') return [{ x, y: y - 70, radius: 190, color: [255, 205, 140], intensity: 1 }];
    if (kind === 'tvConsole') return [{ x, y: y - 50, radius: 90, color: [140, 190, 255], intensity: 0.6 }];
    if (kind === 'computerDesk') return [{ x, y: y - 55, radius: 110, color: [170, 205, 255], intensity: 0.7 }];
    if (kind === 'serverRack') return [{ x, y: y - 50, radius: 70, color: [120, 230, 170], intensity: 0.5 }];
    if (kind === 'coffeeCorner') return [{ x, y: y - 60, radius: 110, color: [255, 200, 140], intensity: 0.6 }];
    return [];
  }

  render(g: CanvasRenderingContext2D, env: RenderEnv): void {
    interiorPainters[this.def.kind](g, { x: this.pos.x, y: this.pos.y, variant: this.def.variant ?? 0 }, env);
  }
}
