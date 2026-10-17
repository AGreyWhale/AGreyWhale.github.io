import type { CollectibleDef } from '../content/collectibles';
import type { RewardDef } from '../content/rewards';
import type { ActionDef } from '../content/types';
import type { Progress } from '../systems/CollectibleSystem';
import type { Season, ThemeMode } from '../systems/SaveManager';

/** Every event on the game's EventBus, with its payload type. */
export interface GameEvents {
  /** Run a content action (open panel, dialogue, enter a building…). */
  action: { action: ActionDef };
  'theme:changed': ThemeMode;
  'season:changed': Season;
  'audio:muted': boolean;
  /** Current interaction prompt, or null when nothing is in reach. */
  prompt: { label: string } | null;
  'ui:blocking': boolean;
  toast: string;
  collected: { def: CollectibleDef; progress: Progress; galleryJustUnlocked: boolean; allJustFound: boolean };
  /** A reward accessory was earned for the first time. */
  'reward:unlocked': RewardDef;
  'cat:petted': { id: string; name: string };
}
