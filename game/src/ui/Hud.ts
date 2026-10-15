import { links } from '../content/links';
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { ThemeMode } from '../systems/SaveManager';
import { h, iconSpan, icons } from './dom';

export interface HudActions {
  toggleTheme(): void;
  toggleMute(): void;
  interact(): void;
}

/**
 * Always-on DOM layer over the canvas: place name, skip link, day/night toggle,
 * a prominent mute button, the interaction prompt, toasts and a screen-reader
 * announcer.
 */
export class Hud {
  private readonly bar: HTMLElement;
  private readonly place: HTMLSpanElement;
  private readonly themeBtn: HTMLButtonElement;
  private readonly muteBtn: HTMLButtonElement;
  private readonly prompt: HTMLButtonElement;
  private readonly promptText: HTMLSpanElement;
  private readonly toastEl: HTMLDivElement;
  private readonly announcer: HTMLDivElement;
  private toastTimer = 0;
  private blocking = false;
  private promptLabel: string | null = null;

  constructor(host: HTMLElement, bus: EventBus<GameEvents>, actions: HudActions) {
    this.place = h('span', { class: 'hud-place' }, "Gauri's Town");
    const skip = h('a', { class: 'hud-skip', href: links.quickVersion }, 'Skip to the quick version');

    this.themeBtn = h('button', { type: 'button', class: 'hud-btn' });
    this.themeBtn.addEventListener('click', () => actions.toggleTheme());
    this.muteBtn = h('button', { type: 'button', class: 'hud-btn hud-mute' });
    this.muteBtn.addEventListener('click', () => actions.toggleMute());

    this.bar = h(
      'header',
      { class: 'hud', 'data-mode': 'start' },
      h('div', { class: 'hud-left' }, this.place, skip),
      h('div', { class: 'hud-right' }, this.themeBtn, this.muteBtn),
    );

    this.promptText = h('span', null);
    this.prompt = h('button', { type: 'button', class: 'prompt', hidden: true }, h('kbd', { 'aria-hidden': 'true' }, 'E'), this.promptText);
    this.prompt.addEventListener('click', () => actions.interact());

    this.toastEl = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
    this.announcer = h('div', { class: 'sr-only', 'aria-live': 'polite' });
    host.append(this.bar, this.prompt, this.toastEl, this.announcer);

    bus.on('prompt', (p) => {
      this.promptLabel = p?.label ?? null;
      this.renderPrompt();
      if (p) this.announce(`${p.label}. Press E.`);
    });
    bus.on('ui:blocking', (b) => {
      this.blocking = b;
      this.renderPrompt();
    });
    bus.on('toast', (msg) => this.toast(msg));
  }

  /** "start" hides the in-game skip link (the start screen has its own). */
  setMode(mode: 'start' | 'play'): void {
    this.bar.dataset.mode = mode;
  }

  setPlace(name: string): void {
    this.place.textContent = name;
  }

  setTheme(mode: ThemeMode): void {
    const night = mode === 'night';
    this.themeBtn.replaceChildren(iconSpan(night ? icons.moon : icons.sun), h('span', { class: 'hud-btn-label' }, night ? 'Night' : 'Day'));
    this.themeBtn.setAttribute('aria-label', night ? 'Switch to day' : 'Switch to night');
  }

  setMuted(muted: boolean): void {
    this.muteBtn.replaceChildren(iconSpan(muted ? icons.mute : icons.music), h('span', { class: 'hud-btn-label' }, muted ? 'Music off' : 'Music on'));
    this.muteBtn.setAttribute('aria-pressed', String(muted));
    this.muteBtn.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
    this.muteBtn.classList.toggle('is-muted', muted);
  }

  toast(msg: string): void {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), 3200);
  }

  announce(msg: string): void {
    this.announcer.textContent = msg;
  }

  private renderPrompt(): void {
    const show = !!this.promptLabel && !this.blocking;
    this.prompt.hidden = !show;
    if (show) this.promptText.textContent = this.promptLabel!;
  }
}
