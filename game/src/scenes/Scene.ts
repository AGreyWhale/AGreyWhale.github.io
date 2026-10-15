import type { GameContext } from '../core/GameContext';

/** A screen of the game (start, town, an interior). The SceneManager runs exactly one at a time. */
export abstract class Scene {
  constructor(protected readonly ctx: GameContext) {}

  /** Called when the scene becomes active (after the fade-out). */
  enter(): void {}

  /** Called before another scene replaces this one. */
  exit(): void {}

  /** Called when the canvas size changes. */
  resize(): void {}

  abstract update(dt: number): void;

  abstract render(g: CanvasRenderingContext2D): void;
}
