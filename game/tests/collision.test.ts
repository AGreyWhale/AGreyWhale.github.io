import { describe, expect, it } from 'vitest';
import { moveAndCollide, pointInRect, rectsOverlap, type Rect } from '../src/systems/CollisionSystem';

const box: Rect = { x: 0, y: 0, w: 10, h: 10 };

describe('rectsOverlap', () => {
  it('detects overlap and ignores touching edges', () => {
    expect(rectsOverlap(box, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(rectsOverlap(box, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
    expect(rectsOverlap(box, { x: 0, y: 20, w: 5, h: 5 })).toBe(false);
  });

  it('pointInRect includes edges', () => {
    expect(pointInRect(10, 10, box)).toBe(true);
    expect(pointInRect(11, 10, box)).toBe(false);
  });
});

describe('moveAndCollide', () => {
  const wall: Rect = { x: 20, y: -100, w: 10, h: 200 };

  it('moves freely when nothing is in the way', () => {
    expect(moveAndCollide(box, 5, 3, [wall])).toEqual({ x: 5, y: 3, blockedX: false, blockedY: false });
  });

  it('stops flush against a wall', () => {
    const r = moveAndCollide(box, 15, 0, [wall]);
    expect(r.x).toBe(10);
    expect(r.blockedX).toBe(true);
  });

  it('slides along a wall: blocked on x, still moves on y', () => {
    const r = moveAndCollide(box, 15, 7, [wall]);
    expect(r).toEqual({ x: 10, y: 7, blockedX: true, blockedY: false });
  });

  it('blocks from the other side too', () => {
    const r = moveAndCollide({ x: 40, y: 0, w: 10, h: 10 }, -15, 0, [wall]);
    expect(r.x).toBe(30);
  });

  it('blocks vertical movement against a floor', () => {
    const floor: Rect = { x: -100, y: 20, w: 300, h: 10 };
    const r = moveAndCollide(box, 0, 25, [floor]);
    expect(r.y).toBe(10);
    expect(r.blockedY).toBe(true);
  });

  it('clamps inside bounds', () => {
    const bounds: Rect = { x: 0, y: 0, w: 50, h: 50 };
    const r = moveAndCollide({ x: 45, y: 45, w: 10, h: 10 }, 10, 10, [], bounds);
    expect(r).toEqual({ x: 40, y: 40, blockedX: true, blockedY: true });
  });

  it('does not mutate its inputs', () => {
    const b = { ...box };
    moveAndCollide(b, 15, 0, [wall]);
    expect(b).toEqual(box);
  });
});
