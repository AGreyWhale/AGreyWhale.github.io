import type { Accessory, CharacterAppearance } from './types';

/**
 * Choices offered in the character creator. EDIT freely: colors are plain hex.
 * Reward accessories live in content/rewards.ts; the wizard hat is Riya's alone.
 */
export const characterOptions = {
  body: [
    { value: 'round', label: 'Round' },
    { value: 'tall', label: 'Tall' },
  ],
  hair: [
    { value: 'short', label: 'Short' },
    { value: 'curly', label: 'Curly' },
    { value: 'pigtails', label: 'Pigtails' },
    { value: 'hijab', label: 'Hijab' },
    { value: 'bun', label: 'Bun' },
    { value: 'long', label: 'Long' },
  ],
  skin: [
    { value: '#fbe6d7', label: 'Porcelain' },
    { value: '#f7dcc8', label: 'Light' },
    { value: '#eec3a2', label: 'Fair' },
    { value: '#d49c74', label: 'Tan' },
    { value: '#b97d55', label: 'Golden' },
    { value: '#a8704c', label: 'Brown' },
    { value: '#74482f', label: 'Deep' },
    { value: '#55331f', label: 'Rich' },
  ],
  // Also used as the hijab color.
  hairColor: [
    { value: '#2e2522', label: 'Black' },
    { value: '#5e3b27', label: 'Brown' },
    { value: '#b47b4a', label: 'Auburn' },
    { value: '#c9573f', label: 'Red' },
    { value: '#e6c48f', label: 'Blond' },
    { value: '#9aa0ad', label: 'Silver' },
    { value: '#eee7dc', label: 'White' },
    { value: '#f2a6c0', label: 'Pink' },
    { value: '#a98bd6', label: 'Lilac' },
    { value: '#7f9ce8', label: 'Blue' },
    { value: '#87b48b', label: 'Sage' },
  ],
  outfit: [
    { value: '#e5735f', label: 'Terracotta' },
    { value: '#87b48b', label: 'Sage' },
    { value: '#5f7139', label: 'Olive' },
    { value: '#8fc7c0', label: 'Mint' },
    { value: '#6ea2d6', label: 'Sky' },
    { value: '#3f5f8a', label: 'Navy' },
    { value: '#9c8ad0', label: 'Lavender' },
    { value: '#c96f8a', label: 'Berry' },
    { value: '#f2a69d', label: 'Peach' },
    { value: '#eec05b', label: 'Mustard' },
    { value: '#d9a066', label: 'Caramel' },
    { value: '#f4efe4', label: 'Cream' },
    { value: '#3c3742', label: 'Charcoal' },
  ],
  outfitStyle: [
    { value: 'plain', label: 'Plain' },
    { value: 'stripes', label: 'Stripes' },
    { value: 'overalls', label: 'Overalls' },
    { value: 'dress', label: 'Dress' },
  ],
  accessories: [
    { value: 'beanie', label: 'Beanie' },
    { value: 'cap', label: 'Cap' },
    { value: 'bow', label: 'Bow' },
    { value: 'flower', label: 'Flower' },
    { value: 'hairClip', label: 'Star clip' },
    { value: 'glasses', label: 'Glasses' },
    { value: 'headphones', label: 'Headphones' },
    { value: 'earrings', label: 'Earrings' },
    { value: 'freckles', label: 'Freckles' },
    { value: 'scarf', label: 'Scarf' },
    { value: 'backpack', label: 'Backpack' },
  ],
} as const;

/** Ready-made characters shown first on the start screen. */
export const characterPresets: Array<{ name: string; appearance: CharacterAppearance }> = [
  { name: 'Mocha', appearance: { body: 'round', hair: 'long', skin: '#d49c74', hairColor: '#2e2522', outfit: '#e5735f', accessories: ['beanie'] } },
  { name: 'Matcha', appearance: { body: 'tall', hair: 'long', skin: '#f7dcc8', hairColor: '#5e3b27', outfit: '#87b48b', accessories: ['bow'] } },
  { name: 'Taro', appearance: { body: 'round', hair: 'short', skin: '#a8704c', hairColor: '#2e2522', outfit: '#9c8ad0', accessories: ['glasses'] } },
  { name: 'Peach', appearance: { body: 'tall', hair: 'bun', skin: '#eec3a2', hairColor: '#b47b4a', outfit: '#f2a69d', accessories: ['headphones'] } },
  { name: 'Blueberry', appearance: { body: 'round', hair: 'short', skin: '#74482f', hairColor: '#2e2522', outfit: '#6ea2d6', accessories: ['cap'] } },
  { name: 'Honey', appearance: { body: 'tall', hair: 'hijab', skin: '#f7dcc8', hairColor: '#e6c48f', outfit: '#eec05b', accessories: ['flower'] } },
];

/** Things worn on top of the head: only one at a time. */
export const HAT_ACCESSORIES: readonly Accessory[] = ['beanie', 'cap', 'crown', 'flowerCrown', 'catEars', 'wizardHat'];
