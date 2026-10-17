import type { CollectibleKind } from './collectibles';
import type { Accessory } from './types';

/** What you have to do to earn a reward. */
export type RewardGoal =
  | { type: 'collect'; kind: CollectibleKind }
  | { type: 'pets' }
  /** Won by chance (the lucky fountain wish). */
  | { type: 'luck' }
  | { type: 'everything' };

export interface RewardDef {
  accessory: Accessory;
  label: string;
  goal: RewardGoal;
  /** Shown in the satchel while it's still locked. */
  hint: string;
  /** Said when it unlocks. */
  message: string;
}

/** Wearable rewards. EDIT the wording freely. */
export const rewards: RewardDef[] = [
  {
    accessory: 'camera',
    label: 'Camera',
    goal: { type: 'collect', kind: 'polaroid' },
    hint: 'Find every polaroid',
    message: 'You found every polaroid! A little camera of your own is waiting in your wardrobe.',
  },
  {
    accessory: 'flowerCrown',
    label: 'Flower crown',
    goal: { type: 'collect', kind: 'flower' },
    hint: 'Find every flower in the Greenhouse',
    message: 'Every flower, gathered! They have been woven into a flower crown for you.',
  },
  {
    accessory: 'coffeeCup',
    label: 'Coffee to go',
    goal: { type: 'collect', kind: 'coffee' },
    hint: 'Find every coffee cup',
    message: 'All the coffee cups, found! Take a warm coffee to go, on the house.',
  },
  {
    accessory: 'catEars',
    label: 'Cat ears',
    goal: { type: 'pets' },
    hint: 'Pet every cat (one lives indoors)',
    message: 'Every cat in town has been petted! They made you honorary cat ears.',
  },
  {
    accessory: 'wizardHat',
    label: 'Wizard hat',
    goal: { type: 'luck' },
    hint: 'A very lucky wish…',
    message: 'The fountain granted a rare wish: Riya’s wizard hat is yours to wear!',
  },
  {
    accessory: 'crown',
    label: 'Crown',
    goal: { type: 'everything' },
    hint: 'Find all the hidden things',
    message: 'Every cup, polaroid, pearl and flower. Thank you so much for exploring my little town! A golden crown is yours.',
  },
];
