/**
 * Music configuration. EDIT HERE.
 *
 * By default the town plays procedurally generated lo-fi ambience (no files,
 * no licensing worries). To use real tracks instead:
 *   1. Put properly licensed, short looping files in src/assets/audio/
 *      (e.g. day.mp3 and night.mp3; aim for < 1 MB each, 64–96 kbps is plenty).
 *   2. Import them here and set the URLs, e.g.
 *        import dayTrack from '../assets/audio/day.mp3';
 *        export const musicTracks = { day: dayTrack, night: null };
 * A null entry falls back to the procedural ambience for that time of day.
 */
export const musicTracks: { day: string | null; night: string | null } = {
  day: null,
  night: null,
};

/** Procedural ambience presets: chords are MIDI note numbers, one chord per bar. */
export const ambiencePresets = {
  day: {
    bpm: 74,
    chords: [
      [53, 57, 60, 64], // Fmaj7
      [52, 55, 59, 62], // Em7
      [50, 53, 57, 60], // Dm7
      [48, 52, 55, 59], // Cmaj7
    ],
    melody: [69, 72, 74, 76, 79, 81, 84],
    pluckChance: 0.32,
    beat: true,
    filterHz: 2400,
    padLevel: 0.05,
    pluckLevel: 0.09,
  },
  night: {
    bpm: 58,
    chords: [
      [45, 52, 55, 60], // Am7
      [41, 48, 52, 57], // Fmaj7
      [48, 55, 59, 64], // Cmaj7
      [43, 50, 55, 59], // G
    ],
    melody: [64, 67, 69, 72, 74, 76],
    pluckChance: 0.16,
    beat: false,
    filterHz: 1300,
    padLevel: 0.06,
    pluckLevel: 0.07,
  },
};

export type AmbiencePreset = (typeof ambiencePresets)['day'];
