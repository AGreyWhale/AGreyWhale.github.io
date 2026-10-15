/** Small 2D vector. Methods return new vectors; `set` is the only mutator. */
export class Vec2 {
  constructor(
    public x = 0,
    public y = 0,
  ) {}

  static from(p: { x: number; y: number }): Vec2 {
    return new Vec2(p.x, p.y);
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  add(o: Vec2): Vec2 {
    return new Vec2(this.x + o.x, this.y + o.y);
  }

  sub(o: Vec2): Vec2 {
    return new Vec2(this.x - o.x, this.y - o.y);
  }

  scale(s: number): Vec2 {
    return new Vec2(this.x * s, this.y * s);
  }

  length(): number {
    return Math.hypot(this.x, this.y);
  }

  normalized(): Vec2 {
    const l = this.length();
    return l > 1e-6 ? new Vec2(this.x / l, this.y / l) : new Vec2();
  }

  distanceTo(o: { x: number; y: number }): number {
    return Math.hypot(this.x - o.x, this.y - o.y);
  }

  lerp(o: Vec2, t: number): Vec2 {
    return new Vec2(this.x + (o.x - this.x) * t, this.y + (o.y - this.y) * t);
  }
}
