import { describe, expect, it } from 'vitest';
import { DEFAULT_SAVE, SaveManager, sanitizeSave, type StorageLike } from '../src/systems/SaveManager';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}

class ThrowingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('SecurityError');
  }
  setItem(): void {
    throw new Error('QuotaExceededError');
  }
  removeItem(): void {
    throw new Error('SecurityError');
  }
}

const KEY = 'test-save';

describe('SaveManager', () => {
  it('starts with defaults', () => {
    const s = new SaveManager(new MemoryStorage(), KEY);
    expect(s.data).toEqual(DEFAULT_SAVE);
    expect(s.persistent).toBe(true);
  });

  it('persists and reloads', () => {
    const store = new MemoryStorage();
    const a = new SaveManager(store, KEY);
    a.update({ muted: true, themeOverride: 'night' });
    a.collect('cup-1');
    const b = new SaveManager(store, KEY);
    expect(b.data.muted).toBe(true);
    expect(b.data.themeOverride).toBe('night');
    expect(b.data.collected).toEqual(['cup-1']);
  });

  it('collect() reports only new items', () => {
    const s = new SaveManager(new MemoryStorage(), KEY);
    expect(s.collect('x')).toBe(true);
    expect(s.collect('x')).toBe(false);
    expect(s.data.collected).toEqual(['x']);
  });

  it('survives corrupt JSON', () => {
    const store = new MemoryStorage();
    store.setItem(KEY, '{not json');
    expect(new SaveManager(store, KEY).data).toEqual(DEFAULT_SAVE);
  });

  it('works in memory when storage throws', () => {
    const s = new SaveManager(new ThrowingStorage(), KEY);
    expect(() => s.update({ muted: true })).not.toThrow();
    expect(s.data.muted).toBe(true);
  });

  it('works with no storage at all', () => {
    const s = new SaveManager(null, KEY);
    expect(s.persistent).toBe(false);
    s.update({ muted: true });
    expect(s.data.muted).toBe(true);
  });

  it('reset() clears everything', () => {
    const store = new MemoryStorage();
    const s = new SaveManager(store, KEY);
    s.update({ muted: true });
    s.reset();
    expect(s.data).toEqual(DEFAULT_SAVE);
    expect(store.getItem(KEY)).toBeNull();
  });
});

describe('sanitizeSave', () => {
  it('drops invalid fields and keeps valid ones', () => {
    const d = sanitizeSave({ muted: 'yes', themeOverride: 'purple', seasonOverride: 'winter', collected: ['a', 3, 'a', 'b'] });
    expect(d.muted).toBe(false);
    expect(d.themeOverride).toBeNull();
    expect(d.seasonOverride).toBe('winter');
    expect(d.collected).toEqual(['a', 'b']);
  });

  it('handles non-objects', () => {
    expect(sanitizeSave(42)).toEqual(DEFAULT_SAVE);
    expect(sanitizeSave(null)).toEqual(DEFAULT_SAVE);
  });
});
