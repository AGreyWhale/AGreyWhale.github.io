import { luckyWish, WIZARD_HAT_CHANCE, wishes } from '../content/wishes';

/**
 * Makes a wish at the fountain: usually one of the regular wishes, with a small
 * chance of the lucky wizard-hat wish (only until it has been won).
 * Pure (randomness is passed in), so it's unit-tested.
 */
export function makeWish(rand: () => number, alreadyWon: boolean): { line: string; lucky: boolean } {
  if (!alreadyWon && rand() < WIZARD_HAT_CHANCE) return { line: luckyWish, lucky: true };
  return { line: wishes[Math.floor(rand() * wishes.length) % wishes.length], lucky: false };
}
