import { bouquetRules, stems, type BouquetRequest, type Palette, type StemDef } from '../content/bouquet';

export interface BouquetScore {
  /** 0..3 */
  stars: number;
  /** One friendly line per design principle. */
  notes: string[];
}

const PALETTE_NAMES: Record<Palette, string> = { warm: 'warm', cool: 'cool', pastel: 'pastel', any: 'any' };

const byId = (id: string): StemDef | undefined => stems.find((s) => s.id === id);

/**
 * Scores a bouquet on three floral design basics, one star each:
 * palette (every flower fits the request), structure (a focal flower plus
 * greenery), and balance (a full bouquet with an odd number of stems).
 * Pure, so it's unit-tested.
 */
export function scoreBouquet(stemIds: readonly string[], request: BouquetRequest): BouquetScore {
  const picked = stemIds.map(byId).filter((s): s is StemDef => !!s);
  const notes: string[] = [];
  let stars = 0;

  const flowers = picked.filter((s) => s.role !== 'greenery');
  const off = request.palette === 'any' ? [] : flowers.filter((s) => !s.fits.includes(request.palette));
  if (flowers.length > 0 && off.length === 0) {
    stars++;
    notes.push(request.palette === 'any' ? 'Palette: anything goes, and it works!' : `Palette: every bloom fits a ${PALETTE_NAMES[request.palette]} palette.`);
  } else if (!flowers.length) {
    notes.push('Palette: add some flowers, not just greenery.');
  } else {
    const names = [...new Set(off.map((s) => s.label))].join(', ');
    notes.push(`Palette: ${names} ${off.length === 1 ? "doesn't" : "don't"} quite fit a ${PALETTE_NAMES[request.palette]} palette.`);
  }

  const hasFocal = picked.some((s) => s.role === 'focal');
  const hasGreen = picked.some((s) => s.role === 'greenery');
  if (hasFocal && hasGreen) {
    stars++;
    notes.push('Structure: a focal bloom framed by greenery. Lovely.');
  } else {
    notes.push(`Structure: try adding ${!hasFocal ? 'a big focal flower' : 'some greenery to frame it'}.`);
  }

  const n = picked.length;
  const full = n >= bouquetRules.minFull && n <= bouquetRules.maxFull;
  if (full && n % 2 === 1) {
    stars++;
    notes.push(`Balance: ${n} stems, an odd number, looks natural (the rule of odds).`);
  } else if (!full) {
    notes.push(`Balance: ${n < bouquetRules.minFull ? 'a little sparse' : 'a bit crowded'}; ${bouquetRules.minFull}–${bouquetRules.maxFull} stems feels full.`);
  } else {
    notes.push(`Balance: ${n} stems is even; odd numbers look more natural (the rule of odds).`);
  }

  return { stars, notes };
}

/** Picks `count` distinct requests in random order. */
export function pickRequests<T>(all: readonly T[], count: number, rand: () => number): T[] {
  const pool = [...all];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}
