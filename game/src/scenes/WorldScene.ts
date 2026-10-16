import type { GameContext } from '../core/GameContext';
import { Collectible } from '../entities/Collectible';
import type { Entity } from '../entities/Entity';
import { Player } from '../entities/Player';
import type { RenderEnv } from '../render/draw';
import { CollisionSystem, rectsOverlap, type Rect } from '../systems/CollisionSystem';
import { InteractionSystem, type Interactable } from '../systems/InteractionSystem';
import { Scene } from './Scene';

/**
 * Shared behavior for walkable scenes (town and interiors): player movement
 * with collisions, y-sorted entity rendering, camera follow, interaction
 * prompts and night lighting. Subclasses supply the world and its backdrop.
 */
export abstract class WorldScene extends Scene {
  protected entities: Entity[] = [];
  protected readonly interaction: InteractionSystem;
  protected collision: CollisionSystem;
  /** When false, the player stands still (e.g. on the start screen). */
  protected controllable = true;

  protected constructor(
    ctx: GameContext,
    readonly player: Player,
    protected readonly worldBounds: Rect,
    walkBounds: Rect,
  ) {
    super(ctx);
    this.interaction = new InteractionSystem(ctx.bus);
    this.collision = new CollisionSystem(walkBounds);
  }

  /** Zoom for the current screen size. */
  protected abstract computeZoom(w: number, h: number): number;

  /** Draws everything under the entities (in world coordinates). */
  protected abstract drawBackground(g: CanvasRenderingContext2D, env: RenderEnv): void;

  /** Optional layer over the entities but under the lighting. */
  protected drawForeground(_g: CanvasRenderingContext2D, _env: RenderEnv): void {}

  /** Color outside the world. */
  protected backdrop = '#1f261b';

  /** How dark the scene gets at night (interiors stay cozier). */
  protected nightAmount(env: RenderEnv): number {
    return env.night;
  }

  protected nightAmbient: [number, number, number] = [74, 84, 150];

  /** Places this scene's not-yet-found collectibles ("town" or an interior id). */
  protected spawnCollectibles(where: string): void {
    for (const def of this.ctx.collectibles.remainingIn(where)) this.entities.push(new Collectible(def));
  }

  /** Walking over a collectible picks it up. */
  private pickUpCollectibles(): void {
    const { x, y } = this.player.pos;
    for (const e of this.entities) {
      if (!(e instanceof Collectible) || Math.hypot(e.pos.x - x, e.pos.y - y) > Collectible.PICKUP_RADIUS) continue;
      this.entities = this.entities.filter((o) => o !== e);
      this.ctx.audio.play('collect');
      this.ctx.collectibles.collect(e.def);
      return;
    }
  }

  /** Recomputes solids from entity colliders; call after adding/removing entities. */
  protected rebuildSolids(extra: Rect[] = []): void {
    const solids: Rect[] = [...extra];
    for (const e of this.entities) {
      if (e === this.player) continue;
      const c = e.collider();
      if (c) solids.push(c);
    }
    this.collision.setSolids(solids);
  }

  override enter(): void {
    this.interaction.reset();
    this.ctx.camera.bounds = this.worldBounds;
    this.resize();
    this.ctx.camera.snapTo(this.cameraTarget());
  }

  override exit(): void {
    this.interaction.clear();
  }

  override resize(): void {
    const { viewport, camera } = this.ctx;
    camera.bounds = this.worldBounds;
    camera.setView(viewport.width, viewport.height, this.computeZoom(viewport.width, viewport.height));
  }

  protected cameraTarget(): { x: number; y: number } {
    return { x: this.player.pos.x, y: this.player.pos.y - 24 };
  }

  update(dt: number): void {
    const { input, env, camera } = this.ctx;
    if (this.controllable) this.player.step(input.move, dt, this.collision);
    else this.player.idle(dt);
    for (const e of this.entities) if (e !== this.player) e.update(dt, env);
    camera.follow(this.cameraTarget(), dt, true);

    if (this.controllable) {
      this.pickUpCollectibles();
      const items: Interactable[] = [];
      for (const e of this.entities) {
        const it = e.interactable();
        if (it) items.push(it);
      }
      const f = this.player.facingVec;
      this.interaction.update(this.player.pos.x, this.player.pos.y, f.x, f.y, items);
      if (input.consumeInteract() && this.interaction.trigger()) this.ctx.audio.play('blip');
    } else {
      this.interaction.clear();
    }
    this.afterUpdate(dt);
  }

  /** Hook for subclasses (exit zones, etc.). */
  protected afterUpdate(_dt: number): void {}

  render(g: CanvasRenderingContext2D): void {
    const { viewport, camera, env, lighting } = this.ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = this.backdrop;
    g.fillRect(0, 0, g.canvas.width, g.canvas.height);

    camera.apply(g, viewport.dpr);
    this.drawBackground(g, env);

    const view = camera.visibleRect(60);
    const visible = this.entities.filter((e) => rectsOverlap(e.bounds(), view));
    visible.sort((a, b) => a.sortY - b.sortY);
    for (const e of visible) e.render(g, env);

    this.drawForeground(g, env);

    const night = this.nightAmount(env);
    if (night > 0.005) {
      const lights = this.entities.flatMap((e) => e.lights(env));
      lighting.render(g, camera, viewport.dpr, lights, night, this.nightAmbient);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
}
