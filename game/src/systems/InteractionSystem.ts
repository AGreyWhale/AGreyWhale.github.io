import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';

/** Anything the player can press E on. */
export interface Interactable {
  readonly label: string;
  /** World point the player must be near. */
  readonly x: number;
  readonly y: number;
  readonly reach: number;
  interact(): void;
}

/** Picks the closest interactable within reach of a point, or null. */
export function pickNearest<T extends Interactable>(px: number, py: number, items: Iterable<T>): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const it of items) {
    const d = Math.hypot(it.x - px, it.y - py);
    if (d <= it.reach && d < bestD) {
      best = it;
      bestD = d;
    }
  }
  return best;
}

/**
 * Tracks which interactable the player is facing and publishes prompt changes.
 * Probes slightly ahead of the player so you interact with what you face.
 */
export class InteractionSystem {
  current: Interactable | null = null;

  constructor(private readonly bus: EventBus<GameEvents>) {}

  update(px: number, py: number, facingX: number, facingY: number, items: Iterable<Interactable>): void {
    const next = pickNearest(px + facingX * 12, py + facingY * 12, items);
    if (next === this.current) return;
    this.current = next;
    this.bus.emit('prompt', next ? { label: next.label } : null);
  }

  /** Forgets the current target and always tells the HUD (used when a scene starts). */
  reset(): void {
    this.current = null;
    this.bus.emit('prompt', null);
  }

  clear(): void {
    if (!this.current) return;
    this.current = null;
    this.bus.emit('prompt', null);
  }

  trigger(): boolean {
    if (!this.current) return false;
    this.current.interact();
    return true;
  }
}
