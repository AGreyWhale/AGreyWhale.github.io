import type { Scene } from '../scenes/Scene';

type SceneFactory = () => Scene | Promise<Scene>;

/**
 * Runs the active scene and handles transitions: fade to a soft dusk color,
 * build (or lazy-load) the next scene, then fade back in.
 */
export class SceneManager {
  current: Scene | null = null;
  private fade = 0;
  private phase: 'idle' | 'out' | 'loading' | 'in' = 'idle';
  private pending: SceneFactory | null = null;
  private onDone: (() => void) | null = null;

  constructor(private readonly reducedMotion: () => boolean) {}

  get transitioning(): boolean {
    return this.phase !== 'idle';
  }

  /** Swaps scenes. `then` runs after the new scene has entered. */
  switchTo(factory: SceneFactory, opts: { instant?: boolean; then?: () => void } = {}): void {
    if (this.phase === 'out' || this.phase === 'loading') return; // ignore double-triggers
    this.pending = factory;
    this.onDone = opts.then ?? null;
    if (opts.instant || !this.current) {
      this.fade = this.current ? 1 : 0;
      this.load();
    } else {
      this.phase = 'out';
    }
  }

  update(dt: number): void {
    const speed = this.reducedMotion() ? 12 : 3.6;
    if (this.phase === 'out') {
      this.fade = Math.min(1, this.fade + dt * speed);
      if (this.fade >= 1) this.load();
    } else if (this.phase === 'in') {
      this.fade = Math.max(0, this.fade - dt * speed);
      if (this.fade <= 0) this.phase = 'idle';
    }
    this.current?.update(dt);
  }

  render(g: CanvasRenderingContext2D): void {
    this.current?.render(g);
    if (this.fade > 0) {
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = this.fade;
      g.fillStyle = '#2a2236';
      g.fillRect(0, 0, g.canvas.width, g.canvas.height);
      g.restore();
    }
  }

  resize(): void {
    this.current?.resize();
  }

  private load(): void {
    const factory = this.pending;
    if (!factory) return;
    this.pending = null;
    this.phase = 'loading';
    Promise.resolve(factory())
      .then((next) => {
        this.current?.exit();
        this.current = next;
        next.enter();
        next.resize();
        this.phase = 'in';
        this.onDone?.();
        this.onDone = null;
      })
      .catch((err) => {
        console.error('Scene failed to load', err);
        this.phase = 'in';
      });
  }
}
