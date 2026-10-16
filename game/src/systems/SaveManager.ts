import type { Accessory, CharacterAppearance } from '../content/types';

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
  /** Best Boba Rush score. */
  bobaBest: number;
  /** True once the 'found everything' reward has been shown. */
  rewardClaimed: boolean;
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
  bobaBest: 0,
  rewardClaimed: false,
});

const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];
const ACCESSORIES: readonly Accessory[] = ['beanie', 'bow', 'glasses', 'headphones', 'cap', 'flower', 'crown'];
const HAIR = ['short', 'hijab', 'bun', 'long'] as const;
const isColor = (v: unknown): v is string => typeof v === 'string' && /^#[0-9a-f]{3,8}$/i.test(v);

/**
 * Validates a saved character, migrating older shapes (a single `accessory`,
 * the retired "bob" hair). Returns null if it's unusable.
 */
export function sanitizeCharacter(input: unknown): CharacterAppearance | null {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  if (!isColor(o.skin) || !isColor(o.hairColor) || !isColor(o.outfit)) return null;
  const rawAcc = Array.isArray(o.accessories) ? o.accessories : typeof o.accessory === 'string' ? [o.accessory] : [];
  const hair = o.hair === 'bob' ? 'hijab' : (HAIR as readonly unknown[]).includes(o.hair) ? (o.hair as CharacterAppearance['hair']) : 'short';
  return {
    body: o.body === 'tall' ? 'tall' : 'round',
    hair,
    skin: o.skin,
    hairColor: o.hairColor,
    outfit: o.outfit,
    accessories: [...new Set(rawAcc.filter((a): a is Accessory => (ACCESSORIES as readonly unknown[]).includes(a)))],
  };
}

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
  d.character = sanitizeCharacter(o.character);
  if (typeof o.muted === 'boolean') d.muted = o.muted;
  if (o.themeOverride === 'day' || o.themeOverride === 'night') d.themeOverride = o.themeOverride;
  if (typeof o.seasonOverride === 'string' && (SEASONS as string[]).includes(o.seasonOverride)) {
    d.seasonOverride = o.seasonOverride as Season;
  }
  if (typeof o.bobaBest === 'number' && Number.isFinite(o.bobaBest) && o.bobaBest >= 0) d.bobaBest = Math.floor(o.bobaBest);
  if (typeof o.rewardClaimed === 'boolean') d.rewardClaimed = o.rewardClaimed;
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
