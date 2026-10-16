import { describe, expect, it } from 'vitest';
import { bobaMenu } from '../src/content/boba';
import type { CollectibleDef } from '../src/content/collectibles';
import { describe as describeDrink, makeOrder, matches, patienceAt, serveScore, type Order } from '../src/minigames/bobaLogic';
import { computeProgress } from '../src/systems/CollectibleSystem';
import { buildMailto } from '../src/systems/contact/ContactHandler';
import { sanitizeCharacter, sanitizeSave } from '../src/systems/SaveManager';

const order = (o: Partial<Order> = {}): Order => ({
  id: 1,
  customer: 'Sam',
  base: 'milk',
  flavor: 'taro',
  toppings: ['pearls', 'pudding'],
  patience: 10,
  maxPatience: 20,
  ...o,
});

describe('Boba logic', () => {
  it('matches exact drinks regardless of topping order', () => {
    expect(matches({ base: 'milk', flavor: 'taro', toppings: ['pudding', 'pearls'] }, order())).toBe(true);
  });

  it('rejects wrong base, flavor, or toppings', () => {
    expect(matches({ base: 'green', flavor: 'taro', toppings: ['pearls', 'pudding'] }, order())).toBe(false);
    expect(matches({ base: 'milk', flavor: 'mango', toppings: ['pearls', 'pudding'] }, order())).toBe(false);
    expect(matches({ base: 'milk', flavor: 'taro', toppings: ['pearls'] }, order())).toBe(false);
    expect(matches({ base: 'milk', flavor: 'taro', toppings: ['pearls', 'foam'] }, order())).toBe(false);
  });

  it('scores 100 plus a speed tip of up to 50', () => {
    expect(serveScore(order({ patience: 20 }))).toBe(150);
    expect(serveScore(order({ patience: 10 }))).toBe(125);
    expect(serveScore(order({ patience: 0 }))).toBe(100);
  });

  it('makes valid orders with unique toppings', () => {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 50; i++) {
      const o = makeOrder(bobaMenu, rand, i, 'x', 20, 2);
      expect(bobaMenu.bases.some((b) => b.id === o.base)).toBe(true);
      expect(bobaMenu.flavors.some((f) => f.id === o.flavor)).toBe(true);
      expect(o.toppings.length).toBeLessThanOrEqual(2);
      expect(new Set(o.toppings).size).toBe(o.toppings.length);
    }
  });

  it('shrinks patience over the round', () => {
    expect(patienceAt(0, 26, 14)).toBe(26);
    expect(patienceAt(1, 26, 14)).toBe(14);
    expect(patienceAt(2, 26, 14)).toBe(14);
  });

  it('describes drinks readably', () => {
    expect(describeDrink({ base: 'milk', flavor: 'taro', toppings: [] }, bobaMenu)).toBe('Milk tea · Taro · no toppings');
  });
});

describe('computeProgress', () => {
  const defs: CollectibleDef[] = [
    { id: 'c1', kind: 'coffee', where: 'town', x: 0, y: 0 },
    { id: 'p1', kind: 'polaroid', where: 'town', x: 0, y: 0 },
    { id: 'p2', kind: 'polaroid', where: 'town', x: 0, y: 0 },
    { id: 'p3', kind: 'polaroid', where: 'town', x: 0, y: 0 },
  ];

  it('counts per kind and ignores unknown ids', () => {
    const p = computeProgress(['c1', 'p1', 'nope'], defs, 2);
    expect(p.found).toBe(2);
    expect(p.total).toBe(4);
    expect(p.byKind.polaroid).toEqual({ found: 1, total: 3 });
    expect(p.foundIds.has('nope')).toBe(false);
  });

  it('unlocks the gallery at the threshold', () => {
    expect(computeProgress(['p1'], defs, 2).galleryUnlocked).toBe(false);
    expect(computeProgress(['p1', 'p2'], defs, 2).galleryUnlocked).toBe(true);
  });

  it('detects when everything is found', () => {
    expect(computeProgress(['c1', 'p1', 'p2', 'p3'], defs, 2).allFound).toBe(true);
    expect(computeProgress([], [], 2).allFound).toBe(false);
  });
});

describe('buildMailto', () => {
  it('encodes subject and body, signing with name and reply address', () => {
    const url = buildMailto('a@b.co', 'Hi there', { name: 'Sam', replyTo: 'sam@x.io', message: 'Hello & bye?' });
    expect(url.startsWith('mailto:a@b.co?subject=Hi%20there&body=')).toBe(true);
    const body = decodeURIComponent(url.split('body=')[1]);
    expect(body).toBe('Hello & bye?\n\n—\nSam\nsam@x.io');
  });

  it('falls back to a friendly signature', () => {
    const body = decodeURIComponent(buildMailto('a@b.co', 's', { name: ' ', replyTo: '', message: 'Hi' }).split('body=')[1]);
    expect(body).toBe('Hi\n\n—\nA visitor from the town');
  });
});

describe('character save migration', () => {
  const base = { body: 'round', skin: '#ffffff', hairColor: '#000000', outfit: '#123456' };

  it('turns a single accessory into a list', () => {
    expect(sanitizeCharacter({ ...base, hair: 'short', accessory: 'cap' })?.accessories).toEqual(['cap']);
    expect(sanitizeCharacter({ ...base, hair: 'short', accessory: 'none' })?.accessories).toEqual([]);
  });

  it('maps the retired "bob" hair to hijab and drops unknown accessories', () => {
    const c = sanitizeCharacter({ ...base, hair: 'bob', accessories: ['glasses', 'jetpack', 'glasses'] });
    expect(c?.hair).toBe('hijab');
    expect(c?.accessories).toEqual(['glasses']);
  });

  it('rejects characters with invalid colors', () => {
    expect(sanitizeCharacter({ ...base, skin: 'red', hair: 'short' })).toBeNull();
  });

  it('keeps boba best score and reward flag', () => {
    const d = sanitizeSave({ bobaBest: 420.7, rewardClaimed: true });
    expect(d.bobaBest).toBe(420);
    expect(d.rewardClaimed).toBe(true);
    expect(sanitizeSave({ bobaBest: -5 }).bobaBest).toBe(0);
  });
});
