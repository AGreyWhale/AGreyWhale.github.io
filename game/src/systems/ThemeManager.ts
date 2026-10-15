import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { SaveManager, ThemeMode } from './SaveManager';

/**
 * Day/night works like light/dark mode: follows the OS preference unless the
 * player toggles it. Sets `data-theme` on <html> so every DOM overlay matches,
 * and exposes an eased `night` amount (0..1) for canvas lighting.
 */
export class ThemeManager {
  private readonly mq = window.matchMedia('(prefers-color-scheme: dark)');
  /** Eased 0 (day) → 1 (night), for smooth canvas transitions. */
  night = 0;

  constructor(
    private readonly save: SaveManager,
    private readonly bus: EventBus<GameEvents>,
  ) {
    this.mq.addEventListener('change', () => this.apply());
    this.apply();
    this.night = this.mode === 'night' ? 1 : 0;
  }

  get system(): ThemeMode {
    return this.mq.matches ? 'night' : 'day';
  }

  get mode(): ThemeMode {
    return this.save.data.themeOverride ?? this.system;
  }

  /**
   * Flips day/night. If the result matches the system preference the override
   * is cleared, so the page goes back to following the OS.
   */
  toggle(): void {
    const next: ThemeMode = this.mode === 'day' ? 'night' : 'day';
    this.save.update({ themeOverride: next === this.system ? null : next });
    this.apply();
  }

  update(dt: number, reducedMotion: boolean): void {
    const target = this.mode === 'night' ? 1 : 0;
    if (reducedMotion) {
      this.night = target;
      return;
    }
    const step = dt / 1.4;
    this.night = this.night < target ? Math.min(target, this.night + step) : Math.max(target, this.night - step);
  }

  private apply(): void {
    const mode = this.mode;
    document.documentElement.dataset.theme = mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'night' ? '#1b1f36' : '#fbf3e7');
    this.bus.emit('theme:changed', mode);
  }
}
