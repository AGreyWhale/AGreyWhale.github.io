import type { PanelDef } from '../content/types';
import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import { h, iconSpan, icons } from './dom';
import { renderPanel } from './PanelRenderer';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal for content panels and villager dialogue: role="dialog",
 * aria-modal, focus moved in and trapped, Escape/E to close, focus restored after.
 */
export class DialogOverlay {
  private readonly root: HTMLDivElement;
  private readonly box: HTMLDivElement;
  private readonly eyebrow: HTMLParagraphElement;
  private readonly title: HTMLHeadingElement;
  private readonly body: HTMLDivElement;
  private readonly footer: HTMLDivElement;
  private lastFocus: HTMLElement | null = null;
  private lines: string[] = [];
  private lineIndex = 0;
  private mode: 'panel' | 'speech' | null = null;
  private onClosed: (() => void) | null = null;

  constructor(
    host: HTMLElement,
    private readonly bus: EventBus<GameEvents>,
  ) {
    this.eyebrow = h('p', { class: 'dialog-eyebrow' });
    this.title = h('h2', { id: 'dialog-title', class: 'dialog-title', tabindex: '-1' });
    const closeBtn = h('button', { type: 'button', class: 'icon-btn dialog-close', 'aria-label': 'Close' }, iconSpan(icons.close));
    closeBtn.addEventListener('click', () => this.close());
    this.body = h('div', { class: 'dialog-body' });
    this.footer = h('div', { class: 'dialog-footer' });
    this.box = h(
      'div',
      { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'dialog-title' },
      h('header', { class: 'dialog-header' }, h('div', null, this.eyebrow, this.title), closeBtn),
      this.body,
      this.footer,
    );
    this.root = h('div', { class: 'dialog-backdrop', hidden: true }, this.box);
    this.root.addEventListener('mousedown', (e) => {
      if (e.target === this.root) this.close();
    });
    this.root.addEventListener('keydown', this.onKey);
    host.append(this.root);
  }

  get isOpen(): boolean {
    return this.mode !== null;
  }

  openPanel(def: PanelDef, onClosed?: () => void): void {
    this.mode = 'panel';
    this.onClosed = onClosed ?? null;
    this.box.className = 'dialog dialog-panel';
    this.eyebrow.textContent = def.eyebrow ?? '';
    this.eyebrow.hidden = !def.eyebrow;
    this.title.textContent = def.title;
    this.body.replaceChildren(renderPanel(def));
    this.body.scrollTop = 0;
    this.footer.replaceChildren(this.button('Close', () => this.close(), 'btn btn-quiet'));
    this.show(this.title);
  }

  openSpeech(speaker: string | undefined, lines: string[]): void {
    this.mode = 'speech';
    this.onClosed = null;
    this.lines = lines;
    this.lineIndex = 0;
    this.box.className = 'dialog dialog-speech';
    this.eyebrow.hidden = true;
    this.title.textContent = speaker ?? 'Hmm…';
    this.renderLine();
    this.show(this.footer.querySelector('button') ?? this.title);
  }

  close(): void {
    if (!this.mode) return;
    this.mode = null;
    this.root.hidden = true;
    document.body.classList.remove('dialog-open');
    this.bus.emit('ui:blocking', false);
    const cb = this.onClosed;
    this.onClosed = null;
    cb?.();
    if (this.lastFocus?.isConnected) this.lastFocus.focus({ preventScroll: true });
  }

  private renderLine(): void {
    const last = this.lineIndex >= this.lines.length - 1;
    this.body.replaceChildren(h('p', { class: 'speech-line', 'aria-live': 'polite' }, this.lines[this.lineIndex] ?? ''));
    const btn = last ? this.button('Close', () => this.close(), 'btn') : this.button('Next', () => this.advance(), 'btn');
    if (this.lines.length > 1) btn.prepend(h('span', { class: 'speech-count' }, `${this.lineIndex + 1}/${this.lines.length}`));
    this.footer.replaceChildren(btn);
  }

  private advance(): void {
    if (this.lineIndex >= this.lines.length - 1) return this.close();
    this.lineIndex++;
    this.renderLine();
    this.footer.querySelector('button')?.focus();
  }

  private button(label: string, onClick: () => void, cls: string): HTMLButtonElement {
    const b = h('button', { type: 'button', class: cls }, label);
    b.addEventListener('click', onClick);
    return b;
  }

  private show(focusTarget: HTMLElement): void {
    if (this.root.hidden) this.lastFocus = document.activeElement as HTMLElement | null;
    this.root.hidden = false;
    document.body.classList.add('dialog-open');
    this.bus.emit('ui:blocking', true);
    requestAnimationFrame(() => focusTarget.focus({ preventScroll: true }));
  }

  private onKey = (e: KeyboardEvent): void => {
    // stopPropagation: the key that closes the dialog must not reach the game and reopen it.
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.close();
      return;
    }
    if (e.code === 'KeyE' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      if (e.repeat) return;
      if (this.mode === 'speech') this.advance();
      else this.close();
      return;
    }
    if (e.key === 'Tab') {
      const items = [...this.box.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hasAttribute('hidden'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === this.title)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
}
