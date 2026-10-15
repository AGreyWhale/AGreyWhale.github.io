import type { BuildingDef } from '../content/buildings';
import { drawBuilding, windowSpots } from '../render/BuildingPainter';
import type { RenderEnv } from '../render/draw';
import type { Rect } from '../systems/CollisionSystem';
import type { Light } from '../systems/LightingSystem';
import { Entity } from './Entity';

/** A town building drawn from its content definition. Its door is a separate `Door` entity. */
export class Building extends Entity {
  /** How deep the solid footprint is behind the front wall. */
  static readonly DEPTH = 64;

  constructor(readonly def: BuildingDef) {
    super(def.x, def.y);
  }

  override collider(): Rect {
    const d = this.def;
    return { x: d.x - d.width / 2, y: d.y - Building.DEPTH, w: d.width, h: Building.DEPTH };
  }

  override bounds(): Rect {
    const d = this.def;
    const h = d.wallHeight + d.roofHeight + 60;
    return { x: d.x - d.width / 2 - 40, y: d.y - h, w: d.width + 80, h: h + 20 };
  }

  override lights(): Light[] {
    const lights: Light[] = windowSpots(this.def).map((w) => ({
      x: w.x + w.w / 2,
      y: w.y + w.h / 2 + 20,
      radius: 95,
      color: [255, 196, 120],
      intensity: 0.9,
    }));
    lights.push({ x: this.def.x, y: this.def.y + 6, radius: 70, color: [255, 210, 150], intensity: 0.6 });
    return lights;
  }

  render(g: CanvasRenderingContext2D, env: RenderEnv): void {
    drawBuilding(g, this.def, env);
  }
}
