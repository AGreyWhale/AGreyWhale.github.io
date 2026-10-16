import { describe, expect, it } from 'vitest';
import { SEASON_PALETTES } from '../src/render/seasons';
import { FootprintTrail } from '../src/systems/FootprintSystem';
import { nextOverride, seasonFromDate, SEASONS } from '../src/systems/SeasonManager';
import { PARTICLE_CAPS, weatherFor } from '../src/systems/WeatherSystem';

const d = (month: number, day = 15) => new Date(2026, month - 1, day);

describe('seasonFromDate', () => {
  it('uses meteorological seasons in the north', () => {
    expect(seasonFromDate(d(1))).toBe('winter');
    expect(seasonFromDate(d(2, 28))).toBe('winter');
    expect(seasonFromDate(d(3, 1))).toBe('spring');
    expect(seasonFromDate(d(5, 31))).toBe('spring');
    expect(seasonFromDate(d(6, 1))).toBe('summer');
    expect(seasonFromDate(d(8, 31))).toBe('summer');
    expect(seasonFromDate(d(9, 1))).toBe('autumn');
    expect(seasonFromDate(d(10, 16))).toBe('autumn');
    expect(seasonFromDate(d(11, 30))).toBe('autumn');
    expect(seasonFromDate(d(12, 1))).toBe('winter');
  });

  it('flips for the southern hemisphere', () => {
    expect(seasonFromDate(d(1), 'south')).toBe('summer');
    expect(seasonFromDate(d(7), 'south')).toBe('winter');
    expect(seasonFromDate(d(10), 'south')).toBe('spring');
  });
});

describe('nextOverride', () => {
  it('cycles auto → spring → summer → autumn → winter → auto', () => {
    const seen: Array<string | null> = [];
    let s: (typeof SEASONS)[number] | null = null;
    for (let i = 0; i < 5; i++) {
      s = nextOverride(s);
      seen.push(s);
    }
    expect(seen).toEqual(['spring', 'summer', 'autumn', 'winter', null]);
  });
});

describe('season palettes', () => {
  it('exist for every season, and only winter has snow', () => {
    for (const s of SEASONS) expect(SEASON_PALETTES[s].trees.length).toBeGreaterThan(0);
    expect(SEASONS.filter((s) => SEASON_PALETTES[s].snow)).toEqual(['winter']);
  });
});

describe('weatherFor', () => {
  it('picks particles by season and respects caps', () => {
    expect(weatherFor('winter', 0, false)).toEqual({ snow: PARTICLE_CAPS.snow });
    expect(weatherFor('autumn', 0, false)).toEqual({ leaf: PARTICLE_CAPS.leaf });
    expect(weatherFor('spring', 1, false)).toEqual({ petal: PARTICLE_CAPS.petal });
  });

  it('only shows fireflies on summer nights', () => {
    expect(weatherFor('summer', 0, false)).toEqual({});
    expect(weatherFor('summer', 1, false).firefly).toBe(PARTICLE_CAPS.firefly);
  });

  it('turns off entirely for reduced motion', () => {
    for (const s of SEASONS) expect(weatherFor(s, 1, true)).toEqual({});
  });
});

describe('FootprintTrail', () => {
  it('drops a print every stride, alternating feet', () => {
    const t = new FootprintTrail(100, 5, 10);
    for (let x = 0; x <= 50; x += 2) t.track(x, 0);
    expect(t.all.length).toBe(5);
    // Alternating sides of the walking line.
    expect(Math.sign(t.all[0].y)).toBe(-Math.sign(t.all[1].y));
  });

  it("doesn't print while standing still or after a teleport", () => {
    const t = new FootprintTrail(100, 5, 10);
    t.track(0, 0);
    for (let i = 0; i < 20; i++) t.track(0, 0);
    t.track(500, 500);
    expect(t.all.length).toBe(0);
  });

  it('fades prints out and removes them after their life', () => {
    const t = new FootprintTrail(100, 4, 10);
    for (let x = 0; x <= 30; x += 2) t.track(x, 0);
    const p = t.all[0];
    t.update(2);
    expect(t.opacity(p)).toBeCloseTo(0.5);
    t.update(2.1);
    expect(t.all.length).toBe(0);
  });

  it('caps the number of prints', () => {
    const t = new FootprintTrail(8, 100, 5);
    for (let x = 0; x <= 400; x += 2) t.track(x, 0);
    expect(t.all.length).toBe(8);
  });
});
