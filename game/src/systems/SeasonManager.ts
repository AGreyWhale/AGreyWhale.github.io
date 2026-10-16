import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { SaveManager, Season } from './SaveManager';

export const SEASONS: readonly Season[] = ['spring', 'summer', 'autumn', 'winter'];

/**
 * Meteorological seasons: Mar–May spring, Jun–Aug summer, Sep–Nov autumn,
 * Dec–Feb winter (flipped for the southern hemisphere). Pure, so it's unit-tested.
 */
export function seasonFromDate(date: Date, hemisphere: 'north' | 'south' = 'north'): Season {
  const m = date.getMonth(); // 0 = Jan
  const north: Season = m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter';
  if (hemisphere === 'north') return north;
  return SEASONS[(SEASONS.indexOf(north) + 2) % 4];
}

/** Next step when the HUD button is pressed: auto → spring → summer → autumn → winter → auto. */
export function nextOverride(current: Season | null): Season | null {
  if (current === null) return 'spring';
  const i = SEASONS.indexOf(current);
  return i === SEASONS.length - 1 ? null : SEASONS[i + 1];
}

/** Which season the town shows: the real date by default, or the player's pick. */
export class SeasonManager {
  constructor(
    private readonly save: SaveManager,
    private readonly bus: EventBus<GameEvents>,
    private readonly now: () => Date = () => new Date(),
  ) {}

  get auto(): Season {
    return seasonFromDate(this.now());
  }

  get isAuto(): boolean {
    return this.save.data.seasonOverride === null;
  }

  get season(): Season {
    return this.save.data.seasonOverride ?? this.auto;
  }

  cycle(): void {
    this.save.update({ seasonOverride: nextOverride(this.save.data.seasonOverride) });
    this.bus.emit('season:changed', this.season);
  }
}
