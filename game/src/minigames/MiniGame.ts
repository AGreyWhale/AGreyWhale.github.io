import './minigame.css';
import type { AudioManager } from '../systems/AudioManager';
import type { SaveManager } from '../systems/SaveManager';
import { h, iconSpan, icons } from '../ui/dom';

export interface MiniGameServices {
  audio: AudioManager;
  save: SaveManager;
  reducedMotion: boolean;
}

const FOCUSABLE = 'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])';

/**
 * Base for self-contained mini games shown in an accessible modal: owns the
 * dialog shell, focus trap, Escape-to-close and its own rAF loop. Subclasses
 * build their UI and per-frame logic.
 */
export abstract class MiniGame {
  protected readonly body: HTMLDivElement;
  private readonly root: HTMLDivElement;
  private rafId = 0;
  private last = 0;
  private lastFocus: HTMLElement | null = null;

  protected constructor(
    private readonly host: HTMLElement,
    protected readonly services: MiniGameServices,
    private readonly onClose: () => void,
    title: string,
  ) {
    const closeBtn = h('button', { type: 'button', class: 'icon-btn', 'aria-label': `Close ${title}` }, iconSpan(icons.close));
    closeBtn.addEventListener('click', () => this.close());
    this.body = h('div', { class: 'minigame-body' });
    this.root = h(
      'div',
      { class: 'minigame-backdrop' },
      h(
        'div',
        { class: 'minigame', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'minigame-title' },
        h('header', { class: 'minigame-header' }, h('h2', { id: 'minigame-title', tabindex: '-1' }, title), closeBtn),
        this.body,
      ),
    );
    this.root.addEventListener('keydown', this.handleKey);
  }

  open(): void {
    this.lastFocus = document.activeElement as HTMLElement | null;
    this.host.append(this.root);
    this.build(this.body);
    requestAnimationFrame(() => (this.root.querySelector<HTMLElement>('[data-autofocus]') ?? this.root.querySelector<HTMLElement>('h2'))?.focus());
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  close(): void {
    cancelAnimationFrame(this.rafId);
    this.root.remove();
    this.onClose();
    if (this.lastFocus?.isConnected) this.lastFocus.focus({ preventScroll: true });
  }

  protected abstract build(body: HTMLElement): void;

  /** Called every frame while open. */
  protected update(_dt: number): void {}

  /** Return true if the key was handled. */
  protected onKey(_e: KeyboardEvent): boolean {
    return false;
  }

  private tick = (now: number): void => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private handleKey = (e: KeyboardEvent): void => {
    e.stopPropagation(); // never leak keys to the town
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key === 'Tab') {
      const items = [...this.root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    // Letter/number shortcuts never fire while typing in a text field.
    if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (this.onKey(e)) e.preventDefault();
  };
}
