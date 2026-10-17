import { describe, expect, it } from 'vitest';
import type { BouquetRequest } from '../src/content/bouquet';
import { luckyWish, WIZARD_HAT_CHANCE, wishes } from '../src/content/wishes';
import { pickRequests, scoreBouquet } from '../src/minigames/bouquetLogic';
import { makeWish } from '../src/systems/wish';

const warm: BouquetRequest = { client: 'Sam', text: 'warm please', palette: 'warm' };
const cool: BouquetRequest = { client: 'Mina', text: 'cool please', palette: 'cool' };

describe('scoreBouquet', () => {
  it('gives 3 stars for a warm, structured, odd-numbered bouquet', () => {
    const s = scoreBouquet(['sunflower', 'red-rose', 'solidago', 'babys-breath', 'eucalyptus'], warm);
    expect(s.stars).toBe(3);
    expect(s.notes).toHaveLength(3);
  });

  it('loses the palette star when a flower clashes, and names it', () => {
    const s = scoreBouquet(['sunflower', 'iris', 'solidago', 'babys-breath', 'fern'], warm);
    expect(s.stars).toBe(2);
    expect(s.notes[0]).toContain('Iris');
  });

  it('needs a focal flower and greenery for the structure star', () => {
    expect(scoreBouquet(['lavender', 'lavender', 'babys-breath', 'lavender', 'babys-breath'], cool).stars).toBe(2);
    expect(scoreBouquet(['iris', 'hydrangea', 'lavender', 'babys-breath', 'lavender'], cool).stars).toBe(2);
  });

  it('follows the rule of odds and wants a full vase', () => {
    expect(scoreBouquet(['iris', 'hydrangea', 'lavender', 'fern'], cool).stars).toBe(2); // even
    expect(scoreBouquet(['iris', 'fern', 'lavender'], cool).stars).toBe(2); // sparse
  });

  it('accepts any colors for an "any" request', () => {
    const any: BouquetRequest = { client: 'Leo', text: 'surprise me', palette: 'any' };
    expect(scoreBouquet(['sunflower', 'iris', 'waxflower', 'lavender', 'fern'], any).stars).toBe(3);
  });

  it('greenery alone earns no palette star', () => {
    expect(scoreBouquet(['fern', 'eucalyptus', 'fern'], warm).notes[0]).toContain('add some flowers');
  });
});

describe('pickRequests', () => {
  it('picks distinct requests', () => {
    const picked = pickRequests([1, 2, 3, 4, 5, 6, 7], 5, Math.random);
    expect(new Set(picked).size).toBe(5);
  });
});

describe('makeWish', () => {
  const seq = (...vals: number[]) => {
    let i = 0;
    return () => vals[i++ % vals.length];
  };

  it('grants the wizard hat under the lucky threshold', () => {
    expect(makeWish(seq(WIZARD_HAT_CHANCE / 2), false)).toEqual({ line: luckyWish, lucky: true });
  });

  it('otherwise makes one of the regular wishes', () => {
    const w = makeWish(seq(0.5, 0.99), false);
    expect(w.lucky).toBe(false);
    expect(wishes).toContain(w.line);
  });

  it('never grants the hat twice', () => {
    expect(makeWish(seq(0.001), true).lucky).toBe(false);
  });

  it('has 7 wishes and roughly a 5% chance', () => {
    expect(wishes).toHaveLength(7);
    expect(WIZARD_HAT_CHANCE).toBeCloseTo(0.05);
    let seed = 3;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let lucky = 0;
    for (let i = 0; i < 20000; i++) if (makeWish(rand, false).lucky) lucky++;
    expect(lucky / 20000).toBeGreaterThan(0.04);
    expect(lucky / 20000).toBeLessThan(0.06);
  });
});
