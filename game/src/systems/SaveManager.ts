import type { CharacterAppearance } from '../content/types';

export type ThemeMode = 'day' | 'night';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SaveData {
  version: 1;
  character: CharacterAppearance | null;
  muted: boolean;
  /** null = follow the system light/dark preference. */
  themeOverride: ThemeMode | null;
  /** null = follow the real date. */
  seasonOverride: Season | null;
  /** Ids of collectibles found so far. */
  collected: string[];
}

/** The subset of the Web Storage API we use, so tests can pass a fake. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_SAVE: Readonly<SaveData> = Object.freeze({
  version: 1,
  character: null,
  muted: false,
  themeOverride: null,
  seasonOverride: null,
  collected: [],
});

const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];

/** Best-effort access to localStorage; returns null when blocked (private mode, sandboxed iframes…). */
export function browserStorage(): StorageLike | null {
  try {
    const s = globalThis.localStorage;
    if (!s) return null;
    const probe = '__gauri_town_probe__';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/** Validates untrusted parsed JSON field by field, falling back to defaults. */
export function sanitizeSave(input: unknown): SaveData {
  const d: SaveData = { ...DEFAULT_SAVE, collected: [] };
  if (!input || typeof input !== 'object') return d;
  const o = input as Record<string, unknown>;
  if (o.character && typeof o.character === 'object') d.character = o.character as CharacterAppearance;
  if (typeof o.muted === 'boolean') d.muted = o.muted;
  if (o.themeOverride === 'day' || o.themeOverride === 'night') d.themeOverride = o.themeOverride;
  if (typeof o.seasonOverride === 'string' && (SEASONS as string[]).includes(o.seasonOverride)) {
    d.seasonOverride = o.seasonOverride as Season;
  }
  if (Array.isArray(o.collected)) d.collected = [...new Set(o.collected.filter((x): x is string => typeof x === 'string'))];
  return d;
}

/**
 * Persists player progress and preferences as one JSON blob in localStorage.
 * Works without storage too: data then lives in memory for the session.
 */
export class SaveManager {
  private state: SaveData;
  private readonly storage: StorageLike | null;

  constructor(
    storage: StorageLike | null = browserStorage(),
    private readonly key = 'gauri-town-save-v1',
  ) {
    this.storage = storage;
    this.state = this.load();
  }

  /** False when progress can't be saved between visits. */
  get persistent(): boolean {
    return this.storage !== null;
  }

  get data(): Readonly<SaveData> {
    return this.state;
  }

  update(patch: Partial<Omit<SaveData, 'version'>>): void {
    this.state = { ...this.state, ...patch };
    this.write();
  }

  /** Adds a collectible id; returns true if it was new. */
  collect(id: string): boolean {
    if (this.state.collected.includes(id)) return false;
    this.update({ collected: [...this.state.collected, id] });
    return true;
  }

  reset(): void {
    this.state = { ...DEFAULT_SAVE, collected: [] };
    try {
      this.storage?.removeItem(this.key);
    } catch {
      /* ignore */
    }
  }

  private load(): SaveData {
    try {
      const raw = this.storage?.getItem(this.key);
      return raw ? sanitizeSave(JSON.parse(raw)) : sanitizeSave(null);
    } catch {
      return sanitizeSave(null);
    }
  }

  private write(): void {
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.state));
    } catch {
      /* quota or permission error: keep playing in memory */
    }
  }
}
