import './bouquet.css';
import { bouquetRequests, bouquetRules, stems, type BouquetRequest, type StemDef, type StemRole } from '../content/bouquet';
import { circle, ellipse, fillRoundRect, shade } from '../render/draw';
import { h } from '../ui/dom';
import { pickRequests, scoreBouquet, type BouquetScore } from './bouquetLogic';
import { MiniGame, type MiniGameServices } from './MiniGame';

const ROLE_LABELS: Record<StemRole, string> = {
  focal: 'Focal flowers',
  filler: 'Fillers',
  greenery: 'Greenery',
};

const stars = (n: number, of = 3) => '★'.repeat(n) + '☆'.repeat(Math.max(0, of - n));

/**
 * Bloom & Arrange: customers ask for a bouquet; you pick stems from the stall
 * and present it. Scored with one star each for palette, structure and balance,
 * the basics from the floral design course. No timer: it's meant to be calm.
 */
export class BouquetGame extends MiniGame {
  private requests: BouquetRequest[] = [];
  private index = 0;
  private picked: string[] = [];
  private total = 0;
  private time = 0;
  private phase: 'intro' | 'arranging' | 'result' | 'over' = 'intro';
  private vase!: HTMLCanvasElement;
  private countEl!: HTMLParagraphElement;
  private arrangeEl!: HTMLOListElement;
  private presentBtn!: HTMLButtonElement;

  constructor(host: HTMLElement, services: MiniGameServices, onClose: () => void) {
    super(host, services, onClose, 'Bloom & Arrange');
  }

  protected build(body: HTMLElement): void {
    const start = h('button', { type: 'button', class: 'btn btn-primary', 'data-autofocus': true }, 'Open the flower stall');
    start.addEventListener('click', () => this.startRound());
    body.replaceChildren(
      h(
        'div',
        { class: 'bq-intro' },
        h('p', { class: 'lead' }, 'Customers stop by with a bouquet request. Pick stems from the stall, then present your arrangement.'),
        h(
          'ul',
          { class: 'bq-rules' },
          h('li', null, h('strong', null, 'Palette: '), 'every flower should fit the colors they ask for.'),
          h('li', null, h('strong', null, 'Structure: '), 'include a big focal flower and some greenery to frame it.'),
          h('li', null, h('strong', null, 'Balance: '), `${bouquetRules.minFull}–${bouquetRules.maxFull} stems, and an odd number looks most natural.`),
        ),
        h('p', { class: 'bq-best' }, `Best: ${this.services.save.data.bouquetBest} / ${bouquetRules.requestsPerRound * 3} stars`),
        start,
      ),
    );
  }

  private startRound(): void {
    this.requests = pickRequests(bouquetRequests, bouquetRules.requestsPerRound, Math.random);
    this.index = 0;
    this.total = 0;
    this.showRequest();
  }

  private showRequest(): void {
    this.phase = 'arranging';
    this.picked = [];
    const req = this.requests[this.index];
    this.vase = h('canvas', { class: 'bq-vase', width: '200', height: '240', 'aria-hidden': 'true' });
    this.countEl = h('p', { class: 'bq-count', 'aria-live': 'polite' });
    this.presentBtn = h('button', { type: 'button', class: 'btn btn-primary' }, 'Present bouquet');
    this.presentBtn.addEventListener('click', () => this.present());
    this.arrangeEl = h('ol', { class: 'bq-arrangement', 'aria-label': 'In the vase, left to right' });
    const clear = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Start over');
    clear.addEventListener('click', () => {
      this.picked = [];
      this.sync();
    });

    const group = (role: StemRole) =>
      h(
        'fieldset',
        { class: 'bq-group' },
        h('legend', null, ROLE_LABELS[role]),
        ...stems
          .filter((s) => s.role === role)
          .map((s) => {
            const b = h('button', { type: 'button', class: 'bq-stem', style: `--stem:${s.color}` }, h('span', { class: 'bq-dot', 'aria-hidden': 'true' }), s.label);
            b.addEventListener('click', () => this.add(s));
            return b;
          }),
      );

    const first = h('div', { class: 'bq-stall' }, group('focal'), group('filler'), group('greenery'));
    this.body.replaceChildren(
      h(
        'div',
        { class: 'bq-play' },
        h('p', { class: 'bq-progress' }, `Request ${this.index + 1} of ${this.requests.length} · ${this.total} ★ so far`),
        h('blockquote', { class: 'bq-request' }, h('strong', null, `${req.client}: `), `“${req.text}”`),
        h('div', { class: 'bq-table' }, h('div', { class: 'bq-vase-wrap' }, this.vase, this.countEl), first),
        h('div', { class: 'bq-arrange-wrap' }, h('p', { class: 'bq-arrange-label' }, 'In the vase (left to right): move stems around or take one out'), this.arrangeEl),
        h('div', { class: 'bq-actions' }, this.presentBtn, clear),
      ),
    );
    first.querySelector('button')?.focus();
    this.sync();
  }

  private add(s: StemDef): void {
    if (this.picked.length >= bouquetRules.maxStems) {
      this.countEl.textContent = `The vase holds ${bouquetRules.maxStems} stems at most.`;
      return;
    }
    this.picked.push(s.id);
    this.services.audio.play('blip');
    this.sync();
  }

  private removeLast(): void {
    this.picked.pop();
    this.sync();
  }

  /** Moves the stem at `i` by `d` places (rearranging without emptying the vase). */
  private move(i: number, d: number): void {
    const j = i + d;
    if (j < 0 || j >= this.picked.length) return;
    [this.picked[i], this.picked[j]] = [this.picked[j], this.picked[i]];
    this.sync();
    // Keep focus on the same stem's button so keyboard users can keep nudging it.
    this.arrangeEl.querySelector<HTMLButtonElement>(`[data-i="${j}"][data-act="${d < 0 ? 'left' : 'right'}"]`)?.focus();
  }

  private removeAt(i: number): void {
    this.picked.splice(i, 1);
    this.sync();
    const items = this.arrangeEl.querySelectorAll<HTMLButtonElement>('[data-act="remove"]');
    (items[Math.min(i, items.length - 1)] ?? this.presentBtn)?.focus();
  }

  private renderArrangement(): void {
    const label = (id: string) => stems.find((s) => s.id === id)?.label ?? id;
    const btn = (text: string, aria: string, i: number, act: string, disabled: boolean, onClick: () => void) => {
      const b = h('button', { type: 'button', class: 'bq-mini', 'aria-label': aria, 'data-i': String(i), 'data-act': act, disabled }, text);
      b.addEventListener('click', onClick);
      return b;
    };
    this.arrangeEl.replaceChildren(
      ...this.picked.map((id, i) => {
        const s = stems.find((x) => x.id === id);
        const name = label(id);
        return h(
          'li',
          { class: 'bq-chip', style: `--stem:${s?.color ?? '#ccc'}` },
          btn('‹', `Move ${name} left`, i, 'left', i === 0, () => this.move(i, -1)),
          h('span', { class: 'bq-dot', 'aria-hidden': 'true' }),
          h('span', { class: 'bq-chip-name' }, name),
          btn('›', `Move ${name} right`, i, 'right', i === this.picked.length - 1, () => this.move(i, 1)),
          btn('×', `Take out ${name}`, i, 'remove', false, () => this.removeAt(i)),
        );
      }),
    );
  }

  private sync(): void {
    const names = this.picked.map((id) => stems.find((s) => s.id === id)?.label ?? id);
    this.countEl.textContent = this.picked.length ? `${this.picked.length} stem${this.picked.length === 1 ? '' : 's'}` : 'The vase is empty.';
    this.countEl.setAttribute('aria-label', this.picked.length ? `${this.picked.length} stems: ${names.join(', ')}` : 'The vase is empty.');
    this.renderArrangement();
    this.presentBtn.disabled = this.picked.length === 0;
  }

  private present(): void {
    if (this.phase !== 'arranging' || !this.picked.length) return;
    const score = scoreBouquet(this.picked, this.requests[this.index]);
    this.total += score.stars;
    this.services.audio.play(score.stars === 3 ? 'success' : score.stars === 0 ? 'fail' : 'collect');
    this.showResult(score);
  }

  private showResult(score: BouquetScore): void {
    this.phase = 'result';
    const req = this.requests[this.index];
    const last = this.index >= this.requests.length - 1;
    const next = h('button', { type: 'button', class: 'btn btn-primary' }, last ? 'See how you did' : 'Next customer');
    next.addEventListener('click', () => {
      if (last) this.showOver();
      else {
        this.index++;
        this.showRequest();
      }
    });
    const reactions = ['Hmm, not quite what I pictured…', 'Oh, that’s nice!', 'I love it!', 'It’s perfect. Thank you!'];
    const keep = this.vase;
    this.body.replaceChildren(
      h(
        'div',
        { class: 'bq-result' },
        h('div', { class: 'bq-vase-wrap' }, keep),
        h(
          'div',
          null,
          h('p', { class: 'bq-stars', 'aria-label': `${score.stars} of 3 stars` }, stars(score.stars)),
          h('p', { class: 'bq-reaction' }, `${req.client}: “${reactions[score.stars]}”`),
          h('ul', { class: 'bq-notes' }, ...score.notes.map((n) => h('li', null, n))),
          next,
        ),
      ),
    );
    requestAnimationFrame(() => next.focus());
  }

  private showOver(): void {
    this.phase = 'over';
    const max = this.requests.length * 3;
    const best = this.services.save.data.bouquetBest;
    const isBest = this.total > best;
    if (isBest) this.services.save.update({ bouquetBest: this.total });
    const again = h('button', { type: 'button', class: 'btn btn-primary' }, 'Arrange more');
    again.addEventListener('click', () => this.startRound());
    const leave = h('button', { type: 'button', class: 'btn btn-quiet' }, 'Back to the greenhouse');
    leave.addEventListener('click', () => this.close());
    this.body.replaceChildren(
      h(
        'div',
        { class: 'bq-over' },
        h('p', { class: 'bq-stars big' }, `${this.total} / ${max} ★`),
        h('p', null, isBest ? 'A new personal best! 🌸' : `Best: ${best} / ${max} stars`),
        h('div', { class: 'bq-actions' }, again, leave),
      ),
    );
    requestAnimationFrame(() => again.focus());
    this.services.audio.play(isBest ? 'collect' : 'open');
  }

  protected override onKey(e: KeyboardEvent): boolean {
    if (this.phase !== 'arranging') return false;
    const onButton = e.target instanceof HTMLElement && !!e.target.closest('button');
    if (e.key === 'Enter' && !onButton) {
      this.present();
      return true;
    }
    if (e.key === 'Backspace') {
      this.removeLast();
      return true;
    }
    return false;
  }

  protected override update(dt: number): void {
    this.time += dt;
    if (this.vase?.isConnected) this.drawVase();
  }

  /** Draws the arrangement: stems fanned out of a glass vase. */
  private drawVase(): void {
    const c = this.vase;
    const g = c.getContext('2d');
    if (!g) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 200;
    const H = 240;
    if (c.width !== W * dpr) {
      c.width = W * dpr;
      c.height = H * dpr;
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const cx = W / 2;
    const mouth = 168;
    const sway = this.services.reducedMotion ? 0 : Math.sin(this.time * 1.2) * 0.02;
    const list = this.picked.map((id) => stems.find((s) => s.id === id)!).filter(Boolean);
    // Greenery behind, then fillers, then focal flowers in front.
    const order: StemRole[] = ['greenery', 'filler', 'focal'];
    const placed = list.map((s, i) => {
      const n = list.length;
      const t = n === 1 ? 0.5 : i / (n - 1);
      // Fewer stems stay gathered; a full vase fans out wider.
      const spread = Math.min(0.85, 0.22 + 0.075 * n);
      return { s, angle: -spread + 2 * spread * t + sway * (i % 2 ? 1 : -1) };
    });
    placed.sort((a, b) => order.indexOf(a.s.role) - order.indexOf(b.s.role));

    ellipse(g, cx, 232, 46, 6, 'rgba(60, 50, 40, 0.15)');
    for (const { s, angle } of placed) {
      const len = s.role === 'greenery' ? 110 : s.role === 'filler' ? 98 : 84;
      const tx = cx + Math.sin(angle) * len;
      const ty = mouth - Math.cos(angle) * len;
      g.strokeStyle = s.role === 'greenery' ? s.color : '#6a9a55';
      g.lineWidth = 2.2;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(cx + angle * 8, mouth + 30);
      g.quadraticCurveTo(cx + Math.sin(angle) * len * 0.5, mouth - Math.cos(angle) * len * 0.5 + 6, tx, ty);
      g.stroke();
      if (s.role === 'greenery') {
        for (let k = 1; k <= 4; k++) {
          const f = k / 5;
          const lx = cx + Math.sin(angle) * len * f;
          const ly = mouth - Math.cos(angle) * len * f;
          g.save();
          g.translate(lx, ly);
          g.rotate(angle + (k % 2 ? 0.9 : -0.9));
          ellipse(g, 0, -7, 4.6, 9, s.color);
          g.restore();
        }
      } else if (s.role === 'filler') {
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2;
          circle(g, tx + Math.cos(a) * 7, ty + Math.sin(a) * 5.5, 3.6, s.color);
        }
        circle(g, tx, ty, 3.4, shade(s.color, -0.1));
      } else {
        const petal = s.id === 'sunflower' ? 11.5 : 10.5;
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + angle;
          circle(g, tx + Math.cos(a) * 9.5, ty + Math.sin(a) * 9.5, petal, s.color);
        }
        g.strokeStyle = 'rgba(60, 40, 40, 0.12)';
        g.lineWidth = 1;
        g.beginPath();
        g.arc(tx, ty, 13, 0, Math.PI * 2);
        g.stroke();
        circle(g, tx, ty, 7.5, s.id === 'sunflower' ? '#7a4e2e' : shade(s.color, -0.18));
      }
    }
    // Glass vase with water
    g.fillStyle = 'rgba(207, 227, 236, 0.55)';
    g.beginPath();
    g.moveTo(cx - 30, mouth);
    g.quadraticCurveTo(cx - 44, 205, cx - 30, 230);
    g.lineTo(cx + 30, 230);
    g.quadraticCurveTo(cx + 44, 205, cx + 30, mouth);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(120, 150, 170, 0.6)';
    g.lineWidth = 2;
    g.stroke();
    fillRoundRect(g, cx - 34, mouth - 4, 68, 7, 3.5, 'rgba(207, 227, 236, 0.9)');
    g.fillStyle = 'rgba(150, 200, 225, 0.35)';
    g.fillRect(cx - 34, 196, 68, 32);
  }
}
