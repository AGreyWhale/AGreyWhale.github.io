import type { RenderEnv } from '../render/draw';
import type { AudioManager } from '../systems/AudioManager';
import type { InputManager } from '../systems/InputManager';
import type { LightingSystem } from '../systems/LightingSystem';
import type { SaveManager } from '../systems/SaveManager';
import type { ThemeManager } from '../systems/ThemeManager';
import type { Camera } from './Camera';
import type { EventBus } from './EventBus';
import type { GameEvents } from './events';
import type { Viewport } from './Viewport';

/** The shared services a scene can use. Implemented by `Game`. */
export interface GameContext {
  readonly bus: EventBus<GameEvents>;
  readonly input: InputManager;
  readonly camera: Camera;
  readonly viewport: Viewport;
  readonly save: SaveManager;
  readonly theme: ThemeManager;
  readonly audio: AudioManager;
  readonly lighting: LightingSystem;
  /** Per-frame values shared by all painters. */
  readonly env: RenderEnv;
}
