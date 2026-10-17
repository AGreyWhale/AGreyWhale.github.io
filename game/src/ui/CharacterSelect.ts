import { characterOptions, characterPresets, HAT_ACCESSORIES } from '../content/characters';
import { rewards } from '../content/rewards';
import { links } from '../content/links';
import type { Accessory, CharacterAppearance } from '../content/types';
import { drawCharacter } from '../render/CharacterPainter';
import { h, iconSpan, icons } from './dom';

type OptionKey = keyof typeof characterOptions;

const OPTION_LABELS: Record<OptionKey, string> = {
  body: 'Body',
  hair: 'Hair',
  skin: 'Skin tone',
  hairColor: 'Hair / hijab color',
  outfit: 'Outfit color',
  outfitStyle: 'Outfit style',
  accessories: 'Accessories (mix and match)',
};

const COLOR_KEYS: ReadonlySet<OptionKey> = new Set(['skin', 'hairColor', 'outfit']);

/** Same look, ignoring accessory order. */
function sameLook(a: CharacterAppearance, b: CharacterAppearance): boolean {
  const norm = (c: CharacterAppearance) => JSON.stringify({ ...c, outfitStyle: c.outfitStyle ?? 'plain', accessories: [...c.accessories].sort() });
  return norm(a) === norm(b);
}

/** Draws a character centered in a small canvas at the device pixel ratio. */
function paintPortrait(c: HTMLCanvasElement, a: CharacterAppearance, time: number, walking: boolean): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const size = c.clientWidth || Number(c.dataset.size) || 64;
  if (c.width !== Math.round(size * dpr)) {
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * dpr);
  }
  const g = c.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, c.width, c.height);
  const s = (size / 64) * dpr;
  g.setTransform(s, 0, 0, s, c.width / 2, c.height * 0.86);
  drawCharacter(g, 0, 0, a, { facing: 'down', walk: time * 9, moving: walking, time });
}

/**
 * Start screen: title, villager presets, optional customization, the Start
 * button (the user gesture that unlocks audio) and a prominent skip link.
 * Built from native radio inputs so it's keyboard- and screen-reader-friendly.
 */
export class CharacterSelect {
  private readonly root: HTMLElement;
  private readonly preview: HTMLCanvasElement;
  private readonly previewName: HTMLParagraphElement;
  private readonly startBtn: HTMLButtonElement;
  private appearance: CharacterAppearance;
  private name: string;
  private readonly title: HTMLHeadingElement;
  private readonly eyebrow: HTMLParagraphElement;
  private readonly customDetails: HTMLDetailsElement;
  /** Set while the wardrobe (in-game outfit change) is open. */
  private onWardrobeDone: ((a: CharacterAppearance) => void) | null = null;
  private startLabel = '';

  constructor(
    host: HTMLElement,
    saved: CharacterAppearance | null,
    private readonly onStart: (a: CharacterAppearance) => void,
    /** Reward accessories the player has earned (e.g. the crown). */
    private readonly unlocked: () => Accessory[],
  ) {
    this.appearance = { ...(saved ?? characterPresets[0].appearance) };
    const presetIdx = characterPresets.findIndex((p) => sameLook(p.appearance, this.appearance));
    this.name = presetIdx >= 0 ? characterPresets[presetIdx].name : 'You';

    this.preview = h('canvas', { class: 'preview-canvas', 'aria-hidden': 'true', 'data-size': '150' });
    this.previewName = h('p', { class: 'preview-name' }, this.name);

    const presets = h(
      'fieldset',
      { class: 'presets' },
      h('legend', null, 'Pick a villager'),
      h(
        'div',
        { class: 'preset-grid' },
        ...characterPresets.map((p, i) => {
          const c = h('canvas', { class: 'preset-canvas', 'aria-hidden': 'true', 'data-size': '56' });
          const input = h('input', { type: 'radio', name: 'preset', value: String(i), class: 'sr-only', checked: i === presetIdx });
          input.addEventListener('change', () => {
            this.appearance = { ...p.appearance, accessories: [...p.appearance.accessories] };
            this.name = p.name;
            this.syncCustomInputs();
            this.previewName.textContent = this.name;
          });
          requestAnimationFrame(() => paintPortrait(c, p.appearance, 0, false));
          return h('label', { class: 'preset' }, input, c, h('span', null, p.name));
        }),
      ),
    );

    const custom = (this.customDetails = h(
      'details',
      { class: 'customize' },
      h('summary', null, 'Customize'),
      ...(Object.keys(characterOptions) as OptionKey[]).map((key) => this.optionGroup(key)),
    ));

    this.startBtn = h('button', { type: 'button', class: 'btn btn-primary start-btn' }, saved ? 'Continue exploring' : 'Start exploring');
    this.startLabel = this.startBtn.textContent ?? '';
    this.startBtn.addEventListener('click', () => {
      const a = { ...this.appearance, accessories: [...this.appearance.accessories] };
      if (this.onWardrobeDone) this.onWardrobeDone(a);
      else this.onStart(a);
    });
    this.eyebrow = h('p', { class: 'eyebrow' }, 'Welcome to');
    this.title = h('h1', { id: 'start-title' }, "Gauri's Town");

    const skip = h('a', { class: 'skip-big', href: links.quickVersion }, 'Skip to the quick version', iconSpan(icons.arrow));

    this.root = h(
      'section',
      { class: 'start-screen', 'aria-labelledby': 'start-title' },
      h(
        'div',
        { class: 'start-card' },
        this.eyebrow,
        this.title,
        h('p', { class: 'start-sub' }, 'A cozy little portfolio you can walk around. Pick a villager, wander into the buildings, and see what I have been building.'),
        h(
          'div',
          { class: 'creator' },
          h('div', { class: 'preview' }, this.preview, this.previewName),
          h('div', { class: 'creator-options' }, presets, custom),
        ),
        h('div', { class: 'start-actions' }, this.startBtn, skip),
        h('p', { class: 'start-note' }, 'Music starts when you press Start, and you can mute it any time (top right).'),
        h(
          'p',
          { class: 'controls-hint' },
          h('span', { class: 'hint-keys' }, 'Move: WASD or arrow keys · Interact: E or Enter · Close: Esc'),
          h('span', { class: 'hint-touch' }, 'Drag anywhere to walk · tap the hand to interact'),
        ),
        links.oldSchoolSite ? h('p', { class: 'old-site' }, h('a', { href: links.oldSchoolSite.href }, links.oldSchoolSite.label)) : null,
      ),
    );
    host.append(this.root);
    this.syncCustomInputs();
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.onWardrobeDone) {
        e.stopPropagation();
        this.startBtn.click();
      }
    });
  }

  /**
   * Reopens the creator mid-game as a wardrobe, so earned rewards can be worn
   * right away. `onDone` receives the new look.
   */
  showWardrobe(current: CharacterAppearance, onDone: (a: CharacterAppearance) => void): void {
    this.onWardrobeDone = (a) => {
      this.closeWardrobe();
      onDone(a);
    };
    this.appearance = { ...current, accessories: [...current.accessories] };
    this.customize({});
    this.syncCustomInputs();
    this.root.dataset.mode = 'wardrobe';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.eyebrow.textContent = 'Your';
    this.title.textContent = 'Wardrobe';
    this.startBtn.textContent = 'Back to town';
    this.customDetails.open = true;
    this.show();
  }

  private closeWardrobe(): void {
    this.onWardrobeDone = null;
    delete this.root.dataset.mode;
    this.root.removeAttribute('role');
    this.root.removeAttribute('aria-modal');
    this.eyebrow.textContent = 'Welcome to';
    this.title.textContent = "Gauri's Town";
    this.startBtn.textContent = this.startLabel;
    this.hide();
  }

  show(): void {
    this.refreshRewards();
    this.root.hidden = false;
    requestAnimationFrame(() => this.startBtn.focus({ preventScroll: true }));
  }

  hide(): void {
    this.root.hidden = true;
  }

  /** Animates the big preview (called from the game loop while visible). */
  tick(time: number, reducedMotion: boolean): void {
    if (this.root.hidden) return;
    paintPortrait(this.preview, this.appearance, time, !reducedMotion);
  }

  private optionGroup(key: OptionKey): HTMLFieldSetElement {
    if (key === 'accessories') return this.accessoryGroup();
    const isColor = COLOR_KEYS.has(key);
    const opts = characterOptions[key] as ReadonlyArray<{ value: string; label: string }>;
    return h(
      'fieldset',
      { class: `option-group ${isColor ? 'swatches' : 'pills'}` },
      h('legend', null, OPTION_LABELS[key]),
      ...opts.map((o) => {
        const input = h('input', { type: 'radio', name: `opt-${key}`, value: o.value, class: 'sr-only' });
        input.addEventListener('change', () => this.customize({ [key]: o.value }));
        const face = isColor ? h('span', { class: 'swatch', style: `--swatch:${o.value}` }) : h('span', { class: 'pill' }, o.label);
        return h('label', { class: 'option', title: o.label }, input, face, isColor ? h('span', { class: 'sr-only' }, o.label) : null);
      }),
    );
  }

  /** Checkboxes: wear any combination, but only one hat at a time. */
  private accessoryGroup(): HTMLFieldSetElement {
    const group = h('fieldset', { class: 'option-group pills accessories' }, h('legend', null, OPTION_LABELS.accessories));
    const opts = [...characterOptions.accessories, ...rewards.map((r) => ({ value: r.accessory, label: r.label }))];
    for (const o of opts) {
      const value = o.value as Accessory;
      const input = h('input', { type: 'checkbox', name: 'opt-accessories', value, class: 'sr-only' });
      input.addEventListener('change', () => {
        let next = this.appearance.accessories.filter((a) => a !== value);
        if (input.checked) {
          if (HAT_ACCESSORIES.includes(value)) next = next.filter((a) => !HAT_ACCESSORIES.includes(a));
          next.push(value);
        }
        this.customize({ accessories: next });
        this.syncCustomInputs();
      });
      const isReward = rewards.some((r) => r.accessory === value);
      group.append(h('label', { class: isReward ? 'option reward' : 'option', 'data-value': value }, input, h('span', { class: 'pill' }, o.label)));
    }
    return group;
  }

  /** Shows earned reward accessories (hidden until unlocked). */
  private refreshRewards(): void {
    const have = new Set(this.unlocked());
    this.root.querySelectorAll<HTMLElement>('.option.reward').forEach((el) => (el.hidden = !have.has(el.dataset.value as Accessory)));
  }

  private customize(patch: Partial<CharacterAppearance>): void {
    this.appearance = { ...this.appearance, ...patch };
    const preset = characterPresets.find((p) => sameLook(p.appearance, this.appearance));
    this.name = preset?.name ?? 'You';
    this.previewName.textContent = this.name;
    this.root.querySelectorAll<HTMLInputElement>('input[name="preset"]').forEach((p) => (p.checked = characterPresets[Number(p.value)] === preset));
  }

  private syncCustomInputs(): void {
    for (const key of Object.keys(characterOptions) as OptionKey[]) {
      const value = key === 'outfitStyle' ? (this.appearance.outfitStyle ?? 'plain') : this.appearance[key];
      this.root.querySelectorAll<HTMLInputElement>(`input[name="opt-${key}"]`).forEach((i) => {
        i.checked = Array.isArray(value) ? value.includes(i.value as Accessory) : i.value === value;
      });
    }
  }
}
