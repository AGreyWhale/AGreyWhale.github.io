import './boba.css';
import { bobaCustomers, bobaMenu, bobaRules, type BobaOption } from '../content/boba';
import { characterOptions } from '../content/characters';
import type { CharacterAppearance } from '../content/types';
import { drawCharacter } from '../render/CharacterPainter';
import { circle, ellipse, fillRoundRect, mixColor } from '../render/draw';
import { h } from '../ui/dom';
import { describe, makeOrder, matches, patienceAt, serveScore, type Drink, type Order } from './bobaLogic';
import { MiniGame, type MiniGameServices } from './MiniGame';

const BASE_KEYS = ['1', '2', '3', '4', '5', '6'];
const FLAVOR_KEYS = ['q', 'w', 'e', 'r', 't', 'y'];
const TOPPING_KEYS = ['a', 's', 'd', 'f', 'g', 'h'];

type Phase = 'intro' | 'playing' | 'over';

/**
 * Boba Rush: tickets arrive, you assemble each drink (base, flavor, up to two
 * toppings) and serve it before the customer runs out of patience. Three
 * walk-outs or the clock running out ends the round. Best score is saved.
 */
export class BobaGame extends MiniGame {
  private phase: Phase = 'intro';
  private drink: Drink = { base: null, flavor: null, toppings: [] };
  private orders: Order[] = [];
  private score = 0;
  private streak = 0;
  private strikes = 0;
  private elapsed = 0;
  private spawnIn = 0;
  private nextId = 1;
  private time = 0;
  private serveAnim = 0;

  private cup!: HTMLCanvasElement;
  private ticketList!: HTMLUListElement;
  private stats!: HTMLParagraphElement;
  private feedback!: HTMLParagraphElement;
  private summary!: HTMLParagraphElement;
  private optionButtons = new Map<string, HTMLButtonElement>();

  constructor(host: HTMLElement, services: MiniGameServices, onClose: () => void) {
    super(host, services, onClose, 'Boba Rush');
  }

  protected build(body: HTMLElement): void {
    this.showIntro(body);
  }

  // ── Screens ──────────────────────────────────────────────────
  private showIntro(body: HTMLElement): void {
    this.phase = 'intro';
    const start = h('button', { type: 'button', class: 'btn btn-primary', 'data-autofocus': true }, 'Open the shop');
    start.addEventListener('click', () => this.startRound());
    body.replaceChildren(
      h(
        'div',
        { class: 'boba-intro' },
        h('p', { class: 'lead' }, 'Orders come in on tickets. Build each drink to match, then serve it before the customer gives up.'),
        h(
          'ul',
          { class: 'boba-rules' },
          h('li', null, 'Pick a base, a flavor, and up to two toppings.'),
          h('li', null, 'Faster service earns bigger tips.'),
          h('li', null, `Three walk-outs and the shop closes early. A round lasts ${bobaRules.roundSeconds} seconds.`),
          h('li', { class: 'hint-keys' }, 'Keys: 1–4 base · Q–T flavor · A–F toppings · Enter to serve · Backspace to start over.'),
        ),
        h('p', { class: 'boba-best' }, `Best score: ${this.services.save.data.bobaBest}`),
        start,
      ),
    );
  }

  private startRound(): void {
    this.phase = 'playing';
    this.drink = { base: null, flavor: null, toppings: [] };
    this.orders = [];
    this.score = 0;
    this.streak = 0;
    this.strikes = 0;
    this.elapsed = 0;
    this.spawnIn = 0;
    this.buildPlayUi();
    this.spawnOrder();
    this.spawnIn = 3;
  }

  private buildPlayUi(): void {
    this.optionButtons.clear();
    this.stats = h('p', { class: 'boba-stats' });
    this.ticketList = h('ul', { class: 'boba-tickets', 'aria-label': 'Orders' });
    this.feedback = h('p', { class: 'boba-feedback', role: 'status' });
    this.summary = h('p', { class: 'boba-summary', 'aria-live': 'polite' });
    this.cup = h('canvas', { class: 'boba-cup', 'aria-hidden': 'true', width: '180', height: '220' });

    const group = (title: string, list: BobaOption[], keys: string[], onPick: (id: string) => void, toggle = false) =>
      h(
        'fieldset',
        { class: 'boba-group' },
        h('legend', null, title),
        ...list.map((o, i) => {
          const b = h(
            'button',
            { type: 'button', class: 'boba-opt', 'aria-pressed': 'false', style: `--opt:${o.color}` },
            h('span', { class: 'boba-dot', 'aria-hidden': 'true' }),
            o.label,
            keys[i] ? h('kbd', { 'aria-hidden': 'true' }, keys[i].toUpperCase()) : null,
          );
          b.addEventListener('click', () => onPick(o.id));
          this.optionButtons.set(`${toggle ? 'top' : title}:${o.id}`, b);
          return b;
        }),
      );

    const serve = h('button', { type: 'button', class: 'btn btn-primary' }, 'Serve', h('kbd', { 'aria-hidden': 'true' }, 'Enter'));
    serve.addEventListener('click', () => this.serve());
    const reset = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Start over');
    reset.addEventListener('click', () => this.resetDrink());

    this.body.replaceChildren(
      h(
        'div',
        { class: 'boba-play' },
        this.stats,
        this.ticketList,
        h(
          'div',
          { class: 'boba-station' },
          h('div', { class: 'boba-cup-wrap' }, this.cup, this.summary),
          h(
            'div',
            { class: 'boba-controls' },
            group('Base', bobaMenu.bases, BASE_KEYS, (id) => this.setBase(id)),
            group('Flavor', bobaMenu.flavors, FLAVOR_KEYS, (id) => this.setFlavor(id)),
            group('Toppings', bobaMenu.toppings, TOPPING_KEYS, (id) => this.toggleTopping(id), true),
            h('div', { class: 'boba-actions' }, serve, reset),
          ),
        ),
        this.feedback,
      ),
    );
    this.optionButtons.values().next().value?.setAttribute('data-autofocus', '');
    this.optionButtons.values().next().value?.focus();
    this.syncDrinkUi();
  }

  private showOver(reason: string): void {
    this.phase = 'over';
    const best = this.services.save.data.bobaBest;
    const isBest = this.score > best;
    if (isBest) this.services.save.update({ bobaBest: this.score });
    const again = h('button', { type: 'button', class: 'btn btn-primary' }, 'Play again');
    again.addEventListener('click', () => this.startRound());
    const leave = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Back to the shop');
    leave.addEventListener('click', () => this.close());
    this.body.replaceChildren(
      h(
        'div',
        { class: 'boba-over' },
        h('p', { class: 'boba-reason' }, reason),
        h('p', { class: 'boba-final' }, `Score: ${this.score}`),
        h('p', null, isBest ? 'New best score! 🎉' : `Best score: ${best}`),
        h('div', { class: 'boba-actions' }, again, leave),
      ),
    );
    requestAnimationFrame(() => again.focus());
    this.services.audio.play(isBest ? 'collect' : 'open');
  }

  // ── Drink assembly ───────────────────────────────────────────
  private setBase(id: string): void {
    this.drink = { ...this.drink, base: this.drink.base === id ? null : id };
    this.services.audio.play('blip');
    this.syncDrinkUi();
  }

  private setFlavor(id: string): void {
    this.drink = { ...this.drink, flavor: this.drink.flavor === id ? null : id };
    this.services.audio.play('blip');
    this.syncDrinkUi();
  }

  private toggleTopping(id: string): void {
    const has = this.drink.toppings.includes(id);
    if (!has && this.drink.toppings.length >= bobaRules.maxToppings) {
      this.say(`Only ${bobaRules.maxToppings} toppings fit in one cup.`);
      return;
    }
    const toppings = has ? this.drink.toppings.filter((t) => t !== id) : [...this.drink.toppings, id];
    // Keep menu order so labels read consistently.
    this.drink = { ...this.drink, toppings: bobaMenu.toppings.map((t) => t.id).filter((t) => toppings.includes(t)) };
    this.services.audio.play('blip');
    this.syncDrinkUi();
  }

  private resetDrink(): void {
    this.drink = { base: null, flavor: null, toppings: [] };
    this.syncDrinkUi();
  }

  private serve(): void {
    if (this.phase !== 'playing') return;
    if (!this.drink.base || !this.drink.flavor) {
      this.say('Pick a base and a flavor first.');
      return;
    }
    const order = this.orders.find((o) => matches(this.drink, o));
    if (!order) {
      this.streak = 0;
      this.score = Math.max(0, this.score - 20);
      this.services.audio.play('fail');
      this.say("Hmm, nobody ordered that. Check the tickets! (−20)");
      return;
    }
    this.streak++;
    const bonus = this.streak >= 3 ? 25 : 0;
    const pts = serveScore(order) + bonus;
    this.score += pts;
    this.orders = this.orders.filter((o) => o !== order);
    this.services.audio.play('success');
    this.say(`Order up for ${order.customer}! +${pts}${bonus ? ' (streak bonus!)' : ''}`);
    this.serveAnim = 1;
    this.resetDrink();
    this.renderTickets();
    if (this.orders.length === 0) this.spawnIn = Math.min(this.spawnIn, 0.8);
  }

  private say(msg: string): void {
    this.feedback.textContent = msg;
  }

  private syncDrinkUi(): void {
    for (const [key, btn] of this.optionButtons) {
      const [group, id] = key.split(':');
      const on = group === 'Base' ? this.drink.base === id : group === 'Flavor' ? this.drink.flavor === id : this.drink.toppings.includes(id);
      btn.setAttribute('aria-pressed', String(on));
    }
    this.summary.textContent = this.drink.base || this.drink.flavor ? `Your cup: ${describe(this.drink, bobaMenu)}` : 'Your cup is empty.';
  }

  // ── Orders ───────────────────────────────────────────────────
  private spawnOrder(): void {
    const frac = this.elapsed / bobaRules.roundSeconds;
    const patience = patienceAt(frac, bobaRules.patienceStart, bobaRules.patienceEnd);
    const customer = bobaCustomers[Math.floor(Math.random() * bobaCustomers.length)];
    this.orders.push(makeOrder(bobaMenu, Math.random, this.nextId++, customer, patience, bobaRules.maxToppings));
    this.renderTickets();
  }

  private renderTickets(): void {
    this.ticketList.replaceChildren(
      ...this.orders.map((o) => {
        const avatar = h('canvas', { class: 'boba-avatar', width: '72', height: '72', 'aria-hidden': 'true' });
        paintAvatar(avatar, o.id);
        return h(
          'li',
          { class: 'boba-ticket', 'data-id': String(o.id) },
          avatar,
          h('div', null, h('p', { class: 'boba-name' }, o.customer), h('p', { class: 'boba-want' }, describe(o, bobaMenu))),
          h('div', { class: 'boba-patience', role: 'presentation' }, h('span')),
        );
      }),
    );
    this.updatePatienceBars();
  }

  private updatePatienceBars(): void {
    for (const o of this.orders) {
      const bar = this.ticketList.querySelector<HTMLElement>(`[data-id="${o.id}"] .boba-patience span`);
      if (bar) {
        const p = Math.max(0, o.patience / o.maxPatience);
        bar.style.width = `${p * 100}%`;
        bar.classList.toggle('low', p < 0.3);
      }
    }
  }

  // ── Loop ─────────────────────────────────────────────────────
  protected override update(dt: number): void {
    this.time += dt;
    if (this.phase !== 'playing') return;
    this.elapsed += dt;

    let walked: Order | null = null;
    for (const o of this.orders) o.patience -= dt;
    for (const o of this.orders) if (o.patience <= 0) walked = o;
    if (walked) {
      const w = walked;
      this.orders = this.orders.filter((o) => o !== w);
      this.strikes++;
      this.streak = 0;
      this.services.audio.play('fail');
      this.say(`${w.customer} got tired of waiting and left.`);
      this.renderTickets();
      if (this.strikes >= bobaRules.strikes) return this.showOver('Three customers walked out, so the shop closed early.');
    }

    this.spawnIn -= dt;
    if (this.spawnIn <= 0 && this.orders.length < 3) {
      this.spawnOrder();
      const frac = this.elapsed / bobaRules.roundSeconds;
      this.spawnIn = 7 - 3 * frac + Math.random() * 1.5;
    }

    const left = Math.max(0, bobaRules.roundSeconds - this.elapsed);
    this.stats.textContent = `Score ${this.score} · ${Math.ceil(left)}s left · ${'♥'.repeat(bobaRules.strikes - this.strikes)}${'♡'.repeat(this.strikes)}`;
    this.updatePatienceBars();
    this.serveAnim = Math.max(0, this.serveAnim - dt * 2.5);
    this.drawCup();
    if (left <= 0) this.showOver("That's closing time!");
  }

  protected override onKey(e: KeyboardEvent): boolean {
    if (this.phase !== 'playing' || e.ctrlKey || e.metaKey || e.altKey) return false;
    const onButton = e.target instanceof HTMLElement && !!e.target.closest('button');
    const k = e.key.toLowerCase();
    if ((e.key === 'Enter' || e.key === ' ') && !onButton) {
      this.serve();
      return true;
    }
    if (e.key === 'Backspace') {
      this.resetDrink();
      return true;
    }
    const bi = BASE_KEYS.indexOf(k);
    if (bi >= 0 && bi < bobaMenu.bases.length) return this.setBase(bobaMenu.bases[bi].id), true;
    const fi = FLAVOR_KEYS.indexOf(k);
    if (fi >= 0 && fi < bobaMenu.flavors.length) return this.setFlavor(bobaMenu.flavors[fi].id), true;
    const ti = TOPPING_KEYS.indexOf(k);
    if (ti >= 0 && ti < bobaMenu.toppings.length) return this.toggleTopping(bobaMenu.toppings[ti].id), true;
    return false;
  }

  // ── Drawing ──────────────────────────────────────────────────
  private drawCup(): void {
    const c = this.cup;
    const g = c.getContext('2d');
    if (!g) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 180;
    const H = 220;
    if (c.width !== W * dpr) {
      c.width = W * dpr;
      c.height = H * dpr;
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const lift = this.serveAnim * 18;
    g.translate(0, -lift);
    const motion = !this.services.reducedMotion;

    const cx = W / 2;
    const top = 46;
    const bottom = 206;
    const tw = 56;
    const bw = 42;
    const cupPath = () => {
      g.beginPath();
      g.moveTo(cx - tw, top);
      g.lineTo(cx + tw, top);
      g.lineTo(cx + bw, bottom);
      g.quadraticCurveTo(cx, bottom + 6, cx - bw, bottom);
      g.closePath();
    };

    ellipse(g, cx, bottom + 6, 50, 7, 'rgba(60, 40, 50, 0.15)');
    g.save();
    cupPath();
    g.clip();
    g.fillStyle = 'rgba(255, 255, 255, 0.55)';
    g.fillRect(0, 0, W, H);

    const d = this.drink;
    const color = (list: BobaOption[], id: string | null) => list.find((o) => o.id === id)?.color;
    const base = color(bobaMenu.bases, d.base);
    const flavor = color(bobaMenu.flavors, d.flavor);
    if (base || flavor) {
      const liquid = base && flavor ? mixColor(base, flavor, 0.45) : (base ?? flavor)!;
      const level = 78;
      g.fillStyle = liquid;
      g.beginPath();
      g.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) g.lineTo(x, level + (motion ? Math.sin(x / 18 + this.time * 3) * 2.5 : 0));
      g.lineTo(W, H);
      g.closePath();
      g.fill();
    }
    if (d.toppings.includes('pudding')) {
      g.fillStyle = '#f2c14e';
      g.fillRect(0, bottom - 26, W, 30);
    }
    if (d.toppings.includes('pearls')) {
      for (let i = 0; i < 16; i++) circle(g, cx - 34 + (i % 6) * 13 + (Math.floor(i / 6) % 2) * 6, bottom - 8 - Math.floor(i / 6) * 11, 6, '#3a2b30');
    }
    if (d.toppings.includes('lychee')) {
      for (let i = 0; i < 6; i++) {
        g.save();
        g.translate(cx - 30 + i * 12, 130 + (i % 3) * 14 + (motion ? Math.sin(this.time * 2 + i) * 2 : 0));
        g.rotate(i * 0.6);
        fillRoundRect(g, -5, -5, 10, 10, 2, 'rgba(248, 246, 236, 0.85)');
        g.restore();
      }
    }
    if (d.toppings.includes('foam')) {
      g.fillStyle = '#fff8ee';
      g.fillRect(0, 62, W, 24);
    }
    g.restore();

    // Cup outline, sealed lid and straw
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(90, 70, 80, 0.55)';
    cupPath();
    g.stroke();
    if (d.base) {
      ellipse(g, cx, top, tw + 2, 7, 'rgba(255,255,255,0.9)');
      fillRoundRect(g, cx + 10, 4, 10, 70, 4, '#e58aa2');
    } else {
      g.setLineDash([5, 6]);
      g.beginPath();
      g.ellipse(cx, top, tw, 7, 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
    }
  }
}

/** Deterministic little customer portrait for a ticket. */
function paintAvatar(c: HTMLCanvasElement, seed: number): void {
  const g = c.getContext('2d');
  if (!g) return;
  const pick = <T>(list: readonly T[], n: number) => list[(seed * 7 + n * 13) % list.length];
  const a: CharacterAppearance = {
    body: pick(['round', 'tall'] as const, 1),
    hair: pick(characterOptions.hair, 2).value,
    skin: pick(characterOptions.skin, 3).value,
    hairColor: pick(characterOptions.hairColor, 4).value,
    outfit: pick(characterOptions.outfit, 5).value,
    accessories: seed % 3 === 0 ? [] : [pick(characterOptions.accessories, 6).value],
  };
  g.setTransform(1.4, 0, 0, 1.4, 36, 92);
  drawCharacter(g, 0, 0, a, { facing: 'down', walk: 0, moving: false, time: 0 });
}
