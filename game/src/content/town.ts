import type { InteractionDef, NpcDef } from './types';

export type { NpcDef };

/** Decorative and interactive things placed around town. */
export type TownPropKind =
  | 'tree'
  | 'pine'
  | 'bush'
  | 'flowers'
  | 'lamp'
  | 'bench'
  | 'fountain'
  | 'noticeBoard'
  | 'mailbox'
  | 'rock';

export interface TownPropDef {
  kind: TownPropKind;
  x: number;
  y: number;
  scale?: number;
  /** Visual variant / color index; meaning depends on kind. */
  variant?: number;
  /** Text drawn on signs. */
  text?: string;
  interact?: InteractionDef;
}

const plaza = { x: 900, y: 700, r: 160 };

/** Lamps evenly spaced around the plaza. */
const plazaLamps: TownPropDef[] = [30, 150, 210, 330].map((deg) => ({
  kind: 'lamp',
  x: Math.round(plaza.x + Math.cos((deg * Math.PI) / 180) * (plaza.r + 34)),
  y: Math.round(plaza.y + Math.sin((deg * Math.PI) / 180) * (plaza.r + 34)),
}));

export const town = {
  width: 1800,
  height: 1400,
  spawn: { x: 900, y: 905 },
  plaza,

  /** Dirt paths, as polylines from the plaza. */
  paths: [
    [[900, 700], [640, 688], [430, 668]],
    [[900, 700], [900, 396]],
    [[900, 700], [1160, 688], [1370, 668]],
    [[900, 700], [700, 900], [440, 1080]],
    [[900, 700], [1100, 900], [1360, 1080]],
    [[900, 700], [900, 1190]],
    [[900, 396], [700, 330], [440, 300]],
    [[900, 396], [1100, 330], [1340, 300]],
  ] as Array<Array<[number, number]>>,

  props: [
    {
      kind: 'fountain',
      x: plaza.x,
      y: plaza.y + 26,
      interact: {
        label: 'Make a wish',
        action: { type: 'say', lines: ['You toss a coin into the fountain. Somewhere, a bug quietly fixes itself.'] }, // flavor
      },
    },
    {
      kind: 'noticeBoard',
      x: 735,
      y: 560,
      interact: { label: 'Read the notice board', action: { type: 'panel', panel: 'notice' } },
    },
    {
      kind: 'mailbox',
      x: 1085,
      y: 862,
      interact: {
        label: 'Send me a letter',
        action: { type: 'panel', panel: 'mail' },
      },
    },
    ...plazaLamps,
    { kind: 'lamp', x: 520, y: 690 },
    { kind: 'lamp', x: 1280, y: 690 },
    { kind: 'lamp', x: 820, y: 420 },
    { kind: 'bench', x: 770, y: 862 },
    { kind: 'bench', x: 1030, y: 545 },
    { kind: 'flowers', x: 330, y: 690, variant: 0 },
    { kind: 'flowers', x: 545, y: 700, variant: 1 },
    { kind: 'flowers', x: 1010, y: 410, variant: 2 },
    { kind: 'flowers', x: 790, y: 410, variant: 0 },
    { kind: 'flowers', x: 1480, y: 700, variant: 1 },
    { kind: 'bush', x: 300, y: 655 },
    { kind: 'bush', x: 560, y: 655, scale: 0.85 },
    { kind: 'bush', x: 750, y: 380 },
    { kind: 'bush', x: 1050, y: 380, scale: 0.9 },
    { kind: 'bush', x: 1245, y: 655 },
    { kind: 'bush', x: 1500, y: 655, scale: 0.85 },
    { kind: 'tree', x: 620, y: 560, scale: 1.05 },
    { kind: 'tree', x: 1180, y: 560 },
    { kind: 'tree', x: 680, y: 1000, variant: 1 },
    { kind: 'tree', x: 1130, y: 990, variant: 1, scale: 0.95 },
    { kind: 'pine', x: 260, y: 520 },
    { kind: 'pine', x: 1560, y: 520, scale: 1.1 },
    { kind: 'rock', x: 1040, y: 950 },
    { kind: 'rock', x: 610, y: 780, scale: 0.8 },
  ] as TownPropDef[],

  npcs: [
    {
      id: 'greeter',
      name: 'Gauri',
      x: 1010,
      y: 780,
      appearance: { body: 'round', hair: 'long', skin: '#d49c74', hairColor: '#0c0906', outfit: '#982040', accessories: ['glasses'] },
      interact: {
        label: 'Talk to Gauri',
        action: {
          type: 'say',
          speaker: 'Gauri',
          lines: [
            "Oh, hi! Welcome to town. This is my little corner of the internet!",
            'Walk up to a door and press E (or tap the hand button) to go inside.',
            'The notice board by the fountain says what is currently being worked on.',
            'In a hurry? The "quick version" link at the top has everything on one page.',
          ],
        },
      },
    },
    {
      id: 'wizard',
      name: 'Riya',
      x: 1500,
      y: 200,
      appearance: { body: 'tall', hair: 'short', skin: '#d49c74', hairColor: '#0c0906', outfit: '#1b0a61', accessories: ['flower'] },
      interact: {
        label: 'Talk to Riya',
        action: {
          type: 'say',
          speaker: 'Riya',
          lines: [
            "Hey! I'm Gauri's roomate Riya! Been so for the past 4 years!",
            'I\'m not entirely sure what I\'m doing here but I REALLY wanted to be in the game',
            '...I may be a couple of bucks short.',
          ],
        },
      },
    }
  ] as NpcDef[],

  /** Seed for the decorative tree ring and grass detail. */
  decorSeed: 7,
};
