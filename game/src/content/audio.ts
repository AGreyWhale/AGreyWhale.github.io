/**
 * Music configuration. EDIT HERE.
 *
 * Each season has its own day and night music, and each mini game has its own
 * theme. By default everything is generated live in the browser (no files, no
 * licensing worries). To use real tracks instead:
 *   1. Put properly licensed, short looping files in src/assets/audio/
 *      (aim for < 1 MB each; 64–96 kbps is plenty).
 *   2. Import them below and add them to `musicTracks` under a key:
 *        a specific one ('autumn-night', 'boba', …), or just 'day' / 'night'
 *        to cover every season at that time of day.
 *      e.g.  import cozyDay from '../assets/audio/cozy-day.mp3';
 *            export const musicTracks = { day: cozyDay };
 * Anything without a file falls back to the procedural music.
 */
import type { Season, ThemeMode } from '../systems/SaveManager';

export type MusicKey = `${Season}-${ThemeMode}` | 'boba' | 'bouquet';

export const musicTracks: Partial<Record<MusicKey | ThemeMode, string>> = {};

/** Which music plays: the open mini game's theme, else the season at this time of day. */
export function musicKeyFor(miniGame: 'boba' | 'bouquet' | null, season: Season, mode: ThemeMode): MusicKey {
  return miniGame ?? `${season}-${mode}`;
}

export interface AmbiencePreset {
  bpm: number;
  /** MIDI note numbers, one chord per bar. */
  chords: number[][];
  /** Notes the gentle melody wanders over. */
  melody: number[];
  /** Chance of a melody note on each eighth. */
  pluckChance: number;
  /** Soft kick, brush and hats. */
  beat: boolean;
  /** Overall brightness (low-pass cutoff). */
  filterHz: number;
  padLevel: number;
  pluckLevel: number;
  /** Melody timbre: 'sine' is music-box soft, 'triangle' is warmer. */
  pluckWave?: OscillatorType;
}

// Chords, by name (MIDI).
const C = {
  Cmaj7: [48, 52, 55, 59],
  Am7: [45, 52, 55, 60],
  Dm7: [50, 53, 57, 60],
  G7: [43, 50, 53, 59],
  Fmaj7: [53, 57, 60, 64],
  Em7: [52, 55, 59, 62],
  A7: [45, 52, 55, 61],
  Am7low: [45, 52, 55, 60],
  Fmaj7low: [41, 48, 52, 57],
  Cmaj7hi: [48, 55, 59, 64],
  G: [43, 50, 55, 59],
  Ebmaj7: [51, 55, 58, 62],
  Cm7: [48, 51, 55, 58],
  Abmaj7: [44, 51, 55, 60],
  Bb: [46, 53, 58, 62],
  Cm9: [48, 55, 58, 62],
  Bb6: [46, 53, 55, 58],
  Gmaj7: [43, 50, 54, 59],
  D: [50, 54, 57, 62],
};

// Melody scales (pentatonic, so any note sounds nice over the chords).
const S = {
  cMajHigh: [72, 74, 76, 79, 81, 84],
  aMin: [69, 72, 74, 76, 79, 81],
  aMinLow: [64, 67, 69, 72, 74, 76],
  ebMajBox: [75, 77, 79, 82, 84, 87],
  cMin: [67, 70, 72, 75, 77, 79],
  gMaj: [67, 69, 71, 74, 76, 79],
};

/** Procedural music for every season × time of day, plus each mini game. */
export const ambiencePresets: Record<MusicKey, AmbiencePreset> = {
  // Spring: bright and fresh, a light beat by day; soft and airy at night.
  'spring-day': { bpm: 82, chords: [C.Cmaj7, C.Am7, C.Dm7, C.G7], melody: S.cMajHigh, pluckChance: 0.34, beat: true, filterHz: 2900, padLevel: 0.045, pluckLevel: 0.085 },
  'spring-night': { bpm: 62, chords: [C.Fmaj7, C.Em7, C.Dm7, C.Cmaj7], melody: S.cMajHigh, pluckChance: 0.14, beat: false, filterHz: 1500, padLevel: 0.055, pluckLevel: 0.06, pluckWave: 'sine' },
  // Summer: the original warm lo-fi.
  'summer-day': { bpm: 74, chords: [C.Fmaj7, C.Em7, C.Dm7, C.Cmaj7], melody: [69, 72, 74, 76, 79, 81, 84], pluckChance: 0.32, beat: true, filterHz: 2400, padLevel: 0.05, pluckLevel: 0.09 },
  'summer-night': { bpm: 58, chords: [C.Am7low, C.Fmaj7low, C.Cmaj7hi, C.G], melody: [64, 67, 69, 72, 74, 76], pluckChance: 0.16, beat: false, filterHz: 1300, padLevel: 0.06, pluckLevel: 0.07 },
  // Autumn: mellow and a little jazzy by day; slow and amber at night.
  'autumn-day': { bpm: 70, chords: [C.Dm7, C.G7, C.Cmaj7, C.Am7], melody: S.aMin, pluckChance: 0.28, beat: true, filterHz: 1900, padLevel: 0.055, pluckLevel: 0.085 },
  'autumn-night': { bpm: 56, chords: [C.Am7, C.Dm7, C.Em7, C.Am7], melody: S.aMinLow, pluckChance: 0.13, beat: false, filterHz: 1100, padLevel: 0.06, pluckLevel: 0.065 },
  // Winter: a twinkly music box by day; hushed and sparse at night.
  'winter-day': { bpm: 66, chords: [C.Ebmaj7, C.Cm7, C.Abmaj7, C.Bb], melody: S.ebMajBox, pluckChance: 0.4, beat: false, filterHz: 3200, padLevel: 0.04, pluckLevel: 0.075, pluckWave: 'sine' },
  'winter-night': { bpm: 52, chords: [C.Cm9, C.Abmaj7, C.Ebmaj7, C.Bb6], melody: S.cMin, pluckChance: 0.1, beat: false, filterHz: 1000, padLevel: 0.06, pluckLevel: 0.06, pluckWave: 'sine' },
  // Mini games: Boba Rush is bouncy and busy; Bloom & Arrange is a gentle harp-like stroll.
  boba: { bpm: 100, chords: [C.Cmaj7, C.A7, C.Dm7, C.G7], melody: S.cMajHigh, pluckChance: 0.48, beat: true, filterHz: 3200, padLevel: 0.04, pluckLevel: 0.085 },
  bouquet: { bpm: 68, chords: [C.Gmaj7, C.Cmaj7, C.Em7, C.D], melody: S.gMaj, pluckChance: 0.5, beat: false, filterHz: 2600, padLevel: 0.045, pluckLevel: 0.07, pluckWave: 'sine' },
};
