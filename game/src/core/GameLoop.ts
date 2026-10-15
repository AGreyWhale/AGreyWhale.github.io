/**
 * requestAnimationFrame loop with clamped delta time (seconds). Clamping keeps
 * physics sane after a tab switch or a long frame.
 */
export class GameLoop {
  private rafId = 0;
  private last = 0;
  private running = false;

  constructor(
    private readonly update: (dt: number) => void,
    private readonly render: () => void,
    private readonly maxDt = 0.1,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min(Math.max((now - this.last) / 1000, 0), this.maxDt);
    this.last = now;
    this.update(dt);
    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  };
}
