export interface Footprint {
  x: number;
  y: number;
  /** Direction of travel, radians. */
  angle: number;
  /** Seconds since it was made. */
  age: number;
}

/**
 * Footprints in the snow: drops a print every `stride` units walked,
 * alternating left/right feet, and lets them fade out over `life` seconds.
 * Capped so a long walk can't grow it forever. Pure logic, so it's unit-tested.
 */
export class FootprintTrail {
  private prints: Footprint[] = [];
  private lastX: number | null = null;
  private lastY = 0;
  private walked = 0;
  private left = true;

  constructor(
    readonly maxPrints = 140,
    readonly life = 9,
    readonly stride = 13,
  ) {}

  get all(): readonly Footprint[] {
    return this.prints;
  }

  /** Call every frame with the walker's position. */
  track(x: number, y: number): void {
    if (this.lastX === null) {
      this.lastX = x;
      this.lastY = y;
      return;
    }
    const dx = x - this.lastX;
    const dy = y - this.lastY;
    const d = Math.hypot(dx, dy);
    if (d > 60) {
      // Teleported (entered/left a building): don't draw a line of prints.
      this.lastX = x;
      this.lastY = y;
      this.walked = 0;
      return;
    }
    this.walked += d;
    this.lastX = x;
    this.lastY = y;
    if (this.walked < this.stride || d === 0) return;
    this.walked = 0;
    const angle = Math.atan2(dy, dx);
    const side = this.left ? -1 : 1;
    this.left = !this.left;
    // Offset perpendicular to travel so the two feet sit side by side.
    this.prints.push({ x: x + Math.cos(angle + Math.PI / 2) * 3.5 * side, y: y + Math.sin(angle + Math.PI / 2) * 3.5 * side, angle, age: 0 });
    if (this.prints.length > this.maxPrints) this.prints.splice(0, this.prints.length - this.maxPrints);
  }

  update(dt: number): void {
    for (const p of this.prints) p.age += dt;
    if (this.prints.length && this.prints[0].age >= this.life) this.prints = this.prints.filter((p) => p.age < this.life);
  }

  /** 1 when fresh, fading to 0 at the end of its life. */
  opacity(p: Footprint): number {
    return Math.max(0, 1 - p.age / this.life);
  }

  clear(): void {
    this.prints = [];
    this.lastX = null;
    this.walked = 0;
  }
}
