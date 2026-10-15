import { Vec2 } from '../core/Vec2';

const MOVE: Record<string, [number, number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

/**
 * Unifies keyboard (WASD/arrows, E/Enter/Space) and touch-joystick input into a
 * single movement vector plus a one-shot "interact" flag.
 */
export class InputManager {
  private enabled = false;
  private readonly down = new Set<string>();
  private interactQueued = false;
  private readonly touch = new Vec2();

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => this.down.clear());
  }

  /** Disabled while overlays are open, so typing/tabbing never moves the player. */
  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      this.down.clear();
      this.touch.set(0, 0);
      this.interactQueued = false;
    }
  }

  /** Direction with length ≤ 1. */
  get move(): Vec2 {
    if (!this.enabled) return new Vec2();
    if (this.touch.x !== 0 || this.touch.y !== 0) return this.touch.clone();
    let x = 0;
    let y = 0;
    for (const code of this.down) {
      const d = MOVE[code];
      if (d) {
        x += d[0];
        y += d[1];
      }
    }
    return new Vec2(Math.sign(x), Math.sign(y)).normalized();
  }

  /** Set by the on-screen joystick; magnitude 0..1. */
  setTouchVector(x: number, y: number): void {
    this.touch.set(x, y);
  }

  /** For on-screen buttons. */
  queueInteract(): void {
    if (this.enabled) this.interactQueued = true;
  }

  /** Returns true once per interact press. */
  consumeInteract(): boolean {
    const q = this.interactQueued;
    this.interactQueued = false;
    return q && this.enabled;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.enabled || e.ctrlKey || e.metaKey || e.altKey) return;
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('input, select, textarea, [contenteditable="true"]')) return;

    if (e.code in MOVE) {
      this.down.add(e.code);
      e.preventDefault();
      return;
    }
    const isE = e.code === 'KeyE';
    const isConfirm = e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space';
    // Enter/Space on a focused button or link should activate it, not the game.
    if (isConfirm && target?.closest('button, a, [role="button"]')) return;
    if (isE || isConfirm) {
      if (!e.repeat) this.interactQueued = true;
      e.preventDefault();
    }
  };
}
