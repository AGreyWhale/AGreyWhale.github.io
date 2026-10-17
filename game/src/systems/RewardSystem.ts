import { interiors } from '../content/interiors';
import { rewards, type RewardDef } from '../content/rewards';
import { town } from '../content/town';
import type { Accessory } from '../content/types';
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import { computeProgress, type Progress } from './CollectibleSystem';
import type { SaveManager } from './SaveManager';

/** Every cat id in town and indoors. */
export function allCatIds(): string[] {
  return [...town.cats.map((c) => c.id), ...Object.values(interiors).flatMap((r) => (r.cats ?? []).map((c) => c.id))];
}

/** Whether one reward's goal is met. Pure, so it's unit-tested. */
export function isEarned(r: RewardDef, progress: Progress, petted: readonly string[], catIds: readonly string[]): boolean {
  switch (r.goal.type) {
    case 'collect': {
      const k = progress.byKind[r.goal.kind];
      return k.total > 0 && k.found >= k.total;
    }
    case 'pets':
      return catIds.length > 0 && catIds.every((id) => petted.includes(id));
    case 'everything':
      return progress.allFound;
  }
}

/** Which reward accessories are unlocked. Pure, so it's unit-tested. */
export function unlockedRewards(progress: Progress, petted: readonly string[], catIds: readonly string[], defs: readonly RewardDef[] = rewards): Accessory[] {
  return defs.filter((r) => isEarned(r, progress, petted, catIds)).map((r) => r.accessory);
}

/**
 * Tracks petted cats and announces each reward accessory the first time it's
 * earned (remembered in the save, so it's celebrated once).
 */
export class RewardSystem {
  private readonly catIds = allCatIds();

  constructor(
    private readonly save: SaveManager,
    private readonly bus: EventBus<GameEvents>,
  ) {}

  get pets(): { petted: number; total: number } {
    return { petted: this.catIds.filter((id) => this.save.data.petted.includes(id)).length, total: this.catIds.length };
  }

  unlocked(): Accessory[] {
    return unlockedRewards(computeProgress(this.save.data.collected), this.save.data.petted, this.catIds);
  }

  recordPet(catId: string): void {
    if (!this.save.data.petted.includes(catId)) this.save.update({ petted: [...this.save.data.petted, catId] });
    this.check();
  }

  /** Announces anything newly earned. Call after collecting or petting. */
  check(): void {
    const seen = new Set(this.save.data.rewardsSeen);
    const fresh = rewards.filter((r) => this.unlocked().includes(r.accessory) && !seen.has(r.accessory));
    if (!fresh.length) return;
    this.save.update({ rewardsSeen: [...seen, ...fresh.map((r) => r.accessory)] });
    for (const r of fresh) this.bus.emit('reward:unlocked', r);
  }
}
