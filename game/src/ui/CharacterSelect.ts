import { characterOptions, characterPresets } from '../content/characters';
import { links } from '../content/links';
import type { CharacterAppearance } from '../content/types';
import { drawCharacter } from '../render/CharacterPainter';
import { h, iconSpan, icons } from './dom';

type OptionKey = keyof typeof characterOptions;

const OPTION_LABELS: Record<OptionKey, string> = {
  body: 'Body',
  hair: 'Hair',
  skin: 'Skin tone',
  hairColor: 'Hair color',
  outfit: 'Outfit',
  accessory: 'Accessory',
};

const COLOR_KEYS: ReadonlySet<OptionKey> = new Set(['skin', 'hairColor', 'outfit']);

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

  constructor(
    host: HTMLElement,
    saved: CharacterAppearance | null,
    private readonly onStart: (a: CharacterAppearance) => void,
  ) {
    this.appearance = { ...(saved ?? characterPresets[0].appearance) };
    const presetIdx = characterPresets.findIndex((p) => JSON.stringify(p.appearance) === JSON.stringify(this.appearance));
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
            this.appearance = { ...p.appearance };
            this.name = p.name;
            this.syncCustomInputs();
            this.previewName.textContent = this.name;
          });
          requestAnimationFrame(() => paintPortrait(c, p.appearance, 0, false));
          return h('label', { class: 'preset' }, input, c, h('span', null, p.name));
        }),
      ),
    );

    const custom = h(
      'details',
      { class: 'customize' },
      h('summary', null, 'Customize'),
      ...(Object.keys(characterOptions) as OptionKey[]).map((key) => this.optionGroup(key)),
    );

    this.startBtn = h('button', { type: 'button', class: 'btn btn-primary start-btn' }, saved ? 'Continue exploring' : 'Start exploring');
    this.startBtn.addEventListener('click', () => this.onStart({ ...this.appearance }));

    const skip = h('a', { class: 'skip-big', href: links.quickVersion }, 'Skip to the quick version', iconSpan(icons.arrow));

    this.root = h(
      'section',
      { class: 'start-screen', 'aria-labelledby': 'start-title' },
      h(
        'div',
        { class: 'start-card' },
        h('p', { class: 'eyebrow' }, 'Welcome to'),
        h('h1', { id: 'start-title' }, "Gauri's Town"),
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
  }

  show(): void {
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
    const isColor = COLOR_KEYS.has(key);
    const opts = characterOptions[key] as ReadonlyArray<{ value: string; label: string }>;
    return h(
      'fieldset',
      { class: `option-group ${isColor ? 'swatches' : 'pills'}` },
      h('legend', null, OPTION_LABELS[key]),
      ...opts.map((o) => {
        const input = h('input', { type: 'radio', name: `opt-${key}`, value: o.value, class: 'sr-only' });
        input.addEventListener('change', () => {
          this.appearance = { ...this.appearance, [key]: o.value } as CharacterAppearance;
          this.name = 'You';
          this.previewName.textContent = this.name;
          this.root.querySelectorAll<HTMLInputElement>('input[name="preset"]').forEach((p) => (p.checked = false));
        });
        const face = isColor ? h('span', { class: 'swatch', style: `--swatch:${o.value}` }) : h('span', { class: 'pill' }, o.label);
        return h('label', { class: 'option', title: o.label }, input, face, isColor ? h('span', { class: 'sr-only' }, o.label) : null);
      }),
    );
  }

  private syncCustomInputs(): void {
    for (const key of Object.keys(characterOptions) as OptionKey[]) {
      const value = this.appearance[key];
      this.root.querySelectorAll<HTMLInputElement>(`input[name="opt-${key}"]`).forEach((i) => (i.checked = i.value === value));
    }
  }
}
