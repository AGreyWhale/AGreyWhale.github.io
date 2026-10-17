import { describe, expect, it } from 'vitest';
import { characterOptions, HAT_ACCESSORIES } from '../src/content/characters';
import { interiors } from '../src/content/interiors';
import { town } from '../src/content/town';
import { BIRD_SCARE_DISTANCE, birdShouldLeave } from '../src/entities/Bird';
import { pickWanderTarget } from '../src/entities/Cat';
import { sanitizeCharacter } from '../src/systems/SaveManager';

describe('cats', () => {
  it('wander within their roam radius of home', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 200; i++) {
      const t = pickWanderTarget(500, 400, 120, rand);
      expect(Math.hypot(t.x - 500, t.y - 400)).toBeLessThanOrEqual(120.0001);
    }
  });

  it('stay home when roam is 0', () => {
    expect(pickWanderTarget(10, 20, 0, Math.random)).toEqual({ x: 10, y: 20 });
  });

  it('are placed inside the town and their rooms', () => {
    for (const c of town.cats) {
      expect(c.x > 50 && c.x < town.width - 50 && c.y > 110 && c.y < town.height - 50, c.id).toBe(true);
    }
    for (const room of Object.values(interiors)) {
      for (const c of room.cats ?? []) {
        expect(c.x > 14 && c.x < room.width - 14 && c.y > room.wallHeight && c.y < room.height, c.id).toBe(true);
      }
    }
  });
});

describe('birds', () => {
  it('leave when the player is close, at night, or when rested enough', () => {
    expect(birdShouldLeave(BIRD_SCARE_DISTANCE - 1, 0, 5)).toBe(true);
    expect(birdShouldLeave(500, 0.8, 5)).toBe(true);
    expect(birdShouldLeave(500, 0, 0)).toBe(true);
    expect(birdShouldLeave(500, 0, 5)).toBe(false);
  });

  it('have landing spots inside town', () => {
    expect(town.birds.spots.length).toBeGreaterThan(0);
    for (const [x, y] of town.birds.spots) expect(x > 0 && x < town.width && y > 0 && y < town.height).toBe(true);
  });
});

describe('new character options', () => {
  it('offers curly hair, but never the wizard hat as a free option', () => {
    expect(characterOptions.hair.some((h) => h.value === 'curly')).toBe(true);
    expect(characterOptions.accessories.map((a) => a.value as string)).not.toContain('wizardHat');
    expect(HAT_ACCESSORIES).toContain('wizardHat');
    expect(town.npcs.find((n) => n.name === 'Riya')?.appearance.accessories).toContain('wizardHat');
  });

  it('saves curly hair (and a wizard hat, once it has been won)', () => {
    const c = sanitizeCharacter({ body: 'tall', hair: 'curly', skin: '#ffffff', hairColor: '#000000', outfit: '#123456', accessories: ['wizardHat', 'glasses'] });
    expect(c?.hair).toBe('curly');
    expect(c?.accessories).toEqual(['wizardHat', 'glasses']);
  });
});
