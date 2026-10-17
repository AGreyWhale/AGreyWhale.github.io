import { describe, expect, it } from 'vitest';
import { ambiencePresets, musicKeyFor, type MusicKey } from '../src/content/audio';
import { SEASONS } from '../src/systems/SeasonManager';

describe('music', () => {
  it('has a distinct preset for every season by day and by night, and for each mini game', () => {
    const keys: MusicKey[] = [...SEASONS.flatMap((s) => [`${s}-day`, `${s}-night`] as MusicKey[]), 'boba', 'bouquet'];
    for (const k of keys) {
      const p = ambiencePresets[k];
      expect(p, k).toBeDefined();
      expect(p.chords.length, k).toBeGreaterThan(0);
      expect(p.melody.length, k).toBeGreaterThan(0);
    }
    // No two pieces are identical.
    const fingerprints = keys.map((k) => JSON.stringify(ambiencePresets[k]));
    expect(new Set(fingerprints).size).toBe(keys.length);
  });

  it('nights are calmer than days', () => {
    for (const s of SEASONS) {
      expect(ambiencePresets[`${s}-night`].bpm).toBeLessThan(ambiencePresets[`${s}-day`].bpm);
    }
  });

  it('plays the mini game theme while a game is open, otherwise the season', () => {
    expect(musicKeyFor('boba', 'winter', 'night')).toBe('boba');
    expect(musicKeyFor('bouquet', 'spring', 'day')).toBe('bouquet');
    expect(musicKeyFor(null, 'autumn', 'night')).toBe('autumn-night');
  });
});
