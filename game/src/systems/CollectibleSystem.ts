import { collectibleKinds, collectibles, GALLERY_UNLOCK, type CollectibleDef, type CollectibleKind } from '../content/collectibles';
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { SaveManager } from './SaveManager';

export interface Progress {
  byKind: Record<CollectibleKind, { found: number; total: number }>;
  found: number;
  total: number;
  galleryUnlocked: boolean;
  allFound: boolean;
  /** Ids found so far (only ones that exist in the content). */
  foundIds: ReadonlySet<string>;
}

/** Counts what's been found. Pure, so it's unit-tested. Unknown ids are ignored. */
export function computeProgress(collected: readonly string[], defs: readonly CollectibleDef[] = collectibles, galleryAt = GALLERY_UNLOCK): Progress {
  const have = new Set(collected);
  const byKind = Object.fromEntries(
    (Object.keys(collectibleKinds) as CollectibleKind[]).map((k) => [k, { found: 0, total: 0 }]),
  ) as Progress['byKind'];
  let found = 0;
  const foundIds = new Set<string>();
  for (const d of defs) {
    byKind[d.kind].total++;
    if (have.has(d.id)) {
      byKind[d.kind].found++;
      found++;
      foundIds.add(d.id);
    }
  }
  return {
    byKind,
    found,
    total: defs.length,
    galleryUnlocked: byKind.polaroid.found >= Math.min(galleryAt, byKind.polaroid.total),
    allFound: defs.length > 0 && found === defs.length,
    foundIds,
  };
}

/** Tracks found collectibles (persisted via SaveManager) and announces new finds. */
export class CollectibleSystem {
  constructor(
    private readonly save: SaveManager,
    private readonly bus: EventBus<GameEvents>,
  ) {}

  get progress(): Progress {
    return computeProgress(this.save.data.collected);
  }

  /** Not-yet-found collectibles placed in a scene ("town" or an interior id). */
  remainingIn(where: string): CollectibleDef[] {
    const have = new Set(this.save.data.collected);
    return collectibles.filter((c) => c.where === where && !have.has(c.id));
  }

  collect(def: CollectibleDef): void {
    const before = this.progress;
    if (!this.save.collect(def.id)) return;
    const after = this.progress;
    this.bus.emit('collected', {
      def,
      progress: after,
      galleryJustUnlocked: after.galleryUnlocked && !before.galleryUnlocked,
      allJustFound: after.allFound && !before.allFound,
    });
  }
}
