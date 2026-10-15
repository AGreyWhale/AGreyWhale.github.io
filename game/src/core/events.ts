import type { ActionDef } from '../content/types';
import type { ThemeMode } from '../systems/SaveManager';

/** Every event on the game's EventBus, with its payload type. */
export interface GameEvents {
  /** Run a content action (open panel, dialogue, enter a building…). */
  action: { action: ActionDef };
  'theme:changed': ThemeMode;
  'audio:muted': boolean;
  /** Current interaction prompt, or null when nothing is in reach. */
  prompt: { label: string } | null;
  'ui:blocking': boolean;
  toast: string;
}
