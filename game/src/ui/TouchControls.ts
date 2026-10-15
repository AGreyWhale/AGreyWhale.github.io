import type { EventBus } from '../core/EventBus';
import type { GameEvents } from '../core/events';
import type { InputManager } from '../systems/InputManager';
import { h, iconSpan, icons } from './dom';

const RADIUS = 48;

/**
 * Floating virtual joystick (press anywhere on the canvas and drag) plus an
 * interact button for touch screens. Mouse drag works too, as a fallback.
 */
export class TouchControls {
  private readonly base: HTMLDivElement;
  private readonly knob: HTMLDivElement;
  private readonly actBtn: HTMLButtonElement;
  private pointerId: number | null = null;
  private ox = 0;
  private oy = 0;
  private enabled = false;

  constructor(
    host: HTMLElement,
    private readonly surface: HTMLElement,
    private readonly input: InputManager,
    bus: EventBus<GameEvents>,
  ) {
    this.knob = h('div', { class: 'joy-knob' });
    this.base = h('div', { class: 'joy-base', 'aria-hidden': 'true', hidden: true }, this.knob);
    this.actBtn = h('button', { type: 'button', class: 'touch-act', 'aria-label': 'Interact' }, iconSpan(icons.hand));
    this.actBtn.addEventListener('click', () => input.queueInteract());
    host.append(this.base, this.actBtn);

    if (window.matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');

    surface.addEventListener('pointerdown', this.onDown);
    surface.addEventListener('pointermove', this.onMove);
    surface.addEventListener('pointerup', this.onUp);
    surface.addEventListener('pointercancel', this.onUp);
    surface.addEventListener('lostpointercapture', this.onUp);
    bus.on('prompt', (p) => this.actBtn.classList.toggle('ready', !!p));
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    document.body.classList.toggle('playing', on);
    if (!on) this.release();
  }

  private onDown = (e: PointerEvent): void => {
    if (!this.enabled || this.pointerId !== null || e.button !== 0) return;
    if (e.pointerType === 'touch') document.body.classList.add('touch');
    this.pointerId = e.pointerId;
    this.surface.setPointerCapture(e.pointerId);
    const r = this.surface.getBoundingClientRect();
    this.ox = e.clientX - r.left;
    this.oy = e.clientY - r.top;
    this.base.style.left = `${this.ox}px`;
    this.base.style.top = `${this.oy}px`;
    this.knob.style.transform = 'translate(-50%, -50%)';
    this.base.hidden = false;
    e.preventDefault();
  };

  private onMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    const r = this.surface.getBoundingClientRect();
    let dx = e.clientX - r.left - this.ox;
    let dy = e.clientY - r.top - this.oy;
    const len = Math.hypot(dx, dy);
    if (len > RADIUS) {
      dx = (dx / len) * RADIUS;
      dy = (dy / len) * RADIUS;
    }
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const mag = Math.min(1, len / RADIUS);
    const dead = mag < 0.18;
    this.input.setTouchVector(dead ? 0 : (dx / RADIUS), dead ? 0 : (dy / RADIUS));
  };

  private onUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    this.release();
  };

  private release(): void {
    if (this.pointerId !== null && this.surface.hasPointerCapture(this.pointerId)) this.surface.releasePointerCapture(this.pointerId);
    this.pointerId = null;
    this.base.hidden = true;
    this.input.setTouchVector(0, 0);
  }
}
