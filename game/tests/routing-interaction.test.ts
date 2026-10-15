import { describe, expect, it } from 'vitest';
import { pickNearest, type Interactable } from '../src/systems/InteractionSystem';
import { parseRoute, routeToHash } from '../src/systems/Router';

describe('parseRoute', () => {
  it('parses building deep links', () => {
    expect(parseRoute('#/b/lab')).toEqual({ name: 'building', id: 'lab' });
    expect(parseRoute('#/b/Cottage/')).toEqual({ name: 'building', id: 'cottage' });
  });

  it('falls back to town for anything else', () => {
    expect(parseRoute('')).toEqual({ name: 'town' });
    expect(parseRoute('#/')).toEqual({ name: 'town' });
    expect(parseRoute('#/b/')).toEqual({ name: 'town' });
    expect(parseRoute('#about')).toEqual({ name: 'town' });
    expect(parseRoute('#/b/<script>')).toEqual({ name: 'town' });
  });

  it('round-trips', () => {
    expect(parseRoute(routeToHash({ name: 'building', id: 'workshop' }))).toEqual({ name: 'building', id: 'workshop' });
  });
});

describe('pickNearest', () => {
  const mk = (label: string, x: number, y: number, reach = 10): Interactable => ({ label, x, y, reach, interact: () => {} });

  it('returns the closest item within reach', () => {
    const items = [mk('far', 8, 0), mk('near', 3, 0), mk('out', 50, 0)];
    expect(pickNearest(0, 0, items)?.label).toBe('near');
  });

  it('returns null when nothing is in reach', () => {
    expect(pickNearest(0, 0, [mk('a', 30, 0)])).toBeNull();
  });
});
