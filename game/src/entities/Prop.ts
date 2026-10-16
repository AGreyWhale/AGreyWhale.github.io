import type { TownPropDef, TownPropKind } from '../content/town';
import type { InteractionDef } from '../content/types';
import type { RenderEnv } from '../render/draw';
import { townPainters } from '../render/TownPainters';
import type { Rect } from '../systems/CollisionSystem';
import type { Interactable } from '../systems/InteractionSystem';
import type { Light } from '../systems/LightingSystem';
import { Entity } from './Entity';

/** Solid footprint per kind, relative to the prop's base point, at scale 1. */
const FOOTPRINTS: Partial<Record<TownPropKind, Rect>> = {
  tree: { x: -9, y: -10, w: 18, h: 12 },
  pine: { x: -8, y: -10, w: 16, h: 12 },
  bush: { x: -20, y: -14, w: 40, h: 14 },
  lamp: { x: -5, y: -7, w: 10, h: 8 },
  bench: { x: -28, y: -16, w: 56, h: 16 },
  fountain: { x: -72, y: -52, w: 144, h: 68 },
  noticeBoard: { x: -34, y: -10, w: 68, h: 12 },
  mailbox: { x: -9, y: -8, w: 18, h: 10 },
  rock: { x: -14, y: -10, w: 28, h: 12 },
};

/** Where you stand to use an interactive prop, relative to its base. */
const INTERACT_OFFSET: Partial<Record<TownPropKind, [number, number, number]>> = {
  fountain: [0, 24, 60],
  noticeBoard: [0, 12, 46],
  mailbox: [0, 12, 40],
};

/**
 * A static decoration or interactive object in town (tree, fountain, notice
 * board, mailbox…). Drawing is delegated to a painter looked up by kind.
 */
export class Prop extends Entity {
  private readonly target: Interactable | null;

  constructor(
    readonly def: TownPropDef,
    onInteract: (i: InteractionDef) => void,
  ) {
    super(def.x, def.y);
    const i = def.interact;
    const [ox, oy, reach] = INTERACT_OFFSET[def.kind] ?? [0, 12, 44];
    this.target = i ? { label: i.label, x: def.x + ox, y: def.y + oy, reach, interact: () => onInteract(i) } : null;
  }

  get scale(): number {
    return this.def.scale ?? 1;
  }

  override collider(): Rect | null {
    const f = FOOTPRINTS[this.def.kind];
    if (!f) return null;
    const s = this.scale;
    return { x: this.pos.x + f.x * s, y: this.pos.y + f.y * s, w: f.w * s, h: f.h * s };
  }

  override interactable(): Interactable | null {
    return this.target;
  }

  override bounds(): Rect {
    const s = this.scale;
    const big = this.def.kind === 'fountain' ? 100 : 70;
    return { x: this.pos.x - big * s, y: this.pos.y - 110 * s, w: big * 2 * s, h: 120 * s };
  }

  override lights(): Light[] {
    if (this.def.kind === 'lamp') return [{ x: this.pos.x, y: this.pos.y - 48, radius: 170, color: [255, 200, 125], intensity: 1 }];
    if (this.def.kind === 'fountain') return [{ x: this.pos.x, y: this.pos.y - 34, radius: 120, color: [150, 210, 255], intensity: 0.3 }];
    return [];
  }

  render(g: CanvasRenderingContext2D, env: RenderEnv): void {
    townPainters[this.def.kind](g, { x: this.pos.x, y: this.pos.y, scale: this.scale, variant: this.def.variant ?? 0, text: this.def.text }, env);
  }
}
