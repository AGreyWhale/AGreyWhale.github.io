import type { CharacterAppearance } from './types';

/** Choices offered in the character creator. EDIT freely: colors are plain hex. */
export const characterOptions = {
  body: [
    { value: 'round', label: 'Round' },
    { value: 'tall', label: 'Tall' },
  ],
  hair: [
    { value: 'short', label: 'Short' },
    { value: 'bob', label: 'Bob' },
    { value: 'bun', label: 'Bun' },
    { value: 'long', label: 'Long' },
  ],
  skin: [
    { value: '#f7dcc8', label: 'Light' },
    { value: '#eec3a2', label: 'Fair' },
    { value: '#d49c74', label: 'Tan' },
    { value: '#a8704c', label: 'Brown' },
    { value: '#74482f', label: 'Deep' },
  ],
  hairColor: [
    { value: '#2e2522', label: 'Black' },
    { value: '#5e3b27', label: 'Brown' },
    { value: '#b47b4a', label: 'Auburn' },
    { value: '#e6c48f', label: 'Blond' },
    { value: '#9aa0ad', label: 'Silver' },
  ],
  outfit: [
    { value: '#e5735f', label: 'Terracotta' },
    { value: '#87b48b', label: 'Sage' },
    { value: '#9c8ad0', label: 'Lavender' },
    { value: '#f2a69d', label: 'Peach' },
    { value: '#6ea2d6', label: 'Sky' },
    { value: '#eec05b', label: 'Mustard' },
  ],
  accessory: [
    { value: 'none', label: 'None' },
    { value: 'beanie', label: 'Beanie' },
    { value: 'bow', label: 'Bow' },
    { value: 'glasses', label: 'Glasses' },
    { value: 'headphones', label: 'Headphones' },
    { value: 'cap', label: 'Cap' },
    { value: 'flower', label: 'Flower' },
  ],
} as const;

/** Ready-made characters shown first on the start screen. */
export const characterPresets: Array<{ name: string; appearance: CharacterAppearance }> = [
  { name: 'Mocha', appearance: { body: 'round', hair: 'bob', skin: '#d49c74', hairColor: '#2e2522', outfit: '#e5735f', accessory: 'beanie' } },
  { name: 'Matcha', appearance: { body: 'tall', hair: 'long', skin: '#f7dcc8', hairColor: '#5e3b27', outfit: '#87b48b', accessory: 'bow' } },
  { name: 'Taro', appearance: { body: 'round', hair: 'short', skin: '#a8704c', hairColor: '#2e2522', outfit: '#9c8ad0', accessory: 'glasses' } },
  { name: 'Peach', appearance: { body: 'tall', hair: 'bun', skin: '#eec3a2', hairColor: '#b47b4a', outfit: '#f2a69d', accessory: 'headphones' } },
  { name: 'Blueberry', appearance: { body: 'round', hair: 'short', skin: '#74482f', hairColor: '#2e2522', outfit: '#6ea2d6', accessory: 'cap' } },
  { name: 'Honey', appearance: { body: 'tall', hair: 'bob', skin: '#f7dcc8', hairColor: '#e6c48f', outfit: '#eec05b', accessory: 'flower' } },
];
