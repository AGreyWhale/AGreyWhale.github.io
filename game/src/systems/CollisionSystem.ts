/** Axis-aligned rectangle in world units. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MoveResult {
  x: number;
  y: number;
  blockedX: boolean;
  blockedY: boolean;
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/**
 * Moves `box` by (dx, dy), resolving each axis separately against static
 * `solids` so the mover slides along walls instead of sticking. Optional
 * `bounds` keeps the box inside the world.
 *
 * Pure function: returns the new top-left position, never mutates inputs.
 */
export function moveAndCollide(box: Rect, dx: number, dy: number, solids: readonly Rect[], bounds?: Rect): MoveResult {
  let x = box.x + dx;
  let blockedX = false;
  for (const s of solids) {
    if (!rectsOverlap({ x, y: box.y, w: box.w, h: box.h }, s)) continue;
    x = dx > 0 ? s.x - box.w : dx < 0 ? s.x + s.w : x;
    blockedX = true;
  }

  let y = box.y + dy;
  let blockedY = false;
  for (const s of solids) {
    if (!rectsOverlap({ x, y, w: box.w, h: box.h }, s)) continue;
    y = dy > 0 ? s.y - box.h : dy < 0 ? s.y + s.h : y;
    blockedY = true;
  }

  if (bounds) {
    const cx = Math.min(Math.max(x, bounds.x), bounds.x + bounds.w - box.w);
    const cy = Math.min(Math.max(y, bounds.y), bounds.y + bounds.h - box.h);
    if (cx !== x) blockedX = true;
    if (cy !== y) blockedY = true;
    x = cx;
    y = cy;
  }

  return { x, y, blockedX, blockedY };
}

/**
 * Holds the static solids for the current scene and moves boxes through them.
 * Thin wrapper over the pure functions above, which are what the tests cover.
 */
export class CollisionSystem {
  private solids: Rect[] = [];

  constructor(public bounds: Rect) {}

  setSolids(solids: Rect[]): void {
    this.solids = solids;
  }

  addSolid(r: Rect): void {
    this.solids.push(r);
  }

  move(box: Rect, dx: number, dy: number): MoveResult {
    return moveAndCollide(box, dx, dy, this.solids, this.bounds);
  }

  /** True if the box overlaps any solid (used to keep decor out of the way). */
  blocked(box: Rect): boolean {
    return this.solids.some((s) => rectsOverlap(box, s));
  }
}
