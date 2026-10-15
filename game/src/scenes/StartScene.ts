import type { GameContext } from '../core/GameContext';
import type { CharacterSelect } from '../ui/CharacterSelect';
import { Scene } from './Scene';
import type { TownScene } from './TownScene';

/**
 * Start screen: the town drifts by in the background while the DOM character
 * creator sits on top. The Start button lives in CharacterSelect.
 */
export class StartScene extends Scene {
  constructor(
    ctx: GameContext,
    private readonly town: TownScene,
    private readonly select: CharacterSelect,
  ) {
    super(ctx);
  }

  override enter(): void {
    this.town.setAttract(true);
    this.town.enter();
    this.select.show();
  }

  override exit(): void {
    this.town.exit();
    this.select.hide();
  }

  override resize(): void {
    this.town.resize();
  }

  update(dt: number): void {
    this.town.update(dt);
    this.select.tick(this.ctx.env.time, this.ctx.env.reducedMotion);
  }

  render(g: CanvasRenderingContext2D): void {
    this.town.render(g);
  }
}
