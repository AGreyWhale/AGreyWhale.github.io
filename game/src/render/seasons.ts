import type { Season } from '../systems/SaveManager';
import type { GroundStyle } from './TownGround';

export interface FoliageColors {
  base: string;
  dark: string;
  light: string;
}

/** Everything that changes color with the season. */
export interface SeasonPalette {
  ground: GroundStyle;
  /** Leafy tree variants. */
  trees: FoliageColors[];
  /** Pine tiers, bottom to top. */
  pine: [string, string, string];
  bush: FoliageColors;
  /** Blossom dots on trees (spring). */
  blossom: string | null;
  /** Snow caps on trees, roofs and bushes. */
  snow: boolean;
  /** Flower beds bloom (otherwise they're tucked under snow). */
  flowersBloom: boolean;
  flowerSets: string[][];
}

const SUMMER: SeasonPalette = {
  ground: {
    grass: '#a9d18e',
    grassLight: '#bbdc9f',
    grassDark: '#93c17b',
    path: '#efdfbf',
    pathEdge: '#dcc39b',
    plaza: '#f0e7d9',
    plazaEdge: '#d9cab4',
    wildflowers: true,
  },
  trees: [
    { base: '#7db66b', dark: '#629a57', light: '#a3d083' },
    { base: '#8cc27b', dark: '#6ea862', light: '#b4dc93' },
  ],
  pine: ['#4f8d64', '#5c9d70', '#6aac7c'],
  bush: { base: '#7cb86c', dark: '#6aa75f', light: '#9ccf86' },
  blossom: null,
  snow: false,
  flowersBloom: true,
  flowerSets: [
    ['#f49cb0', '#fde2e7', '#f7c948'],
    ['#f7d36b', '#ffffff', '#f2a65a'],
    ['#b9a3e3', '#f2ecff', '#f49cb0'],
  ],
};

export const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: {
    ...SUMMER,
    ground: { ...SUMMER.ground, grass: '#b4da94', grassLight: '#c8e6ab', grassDark: '#9dc87f' },
    trees: [
      { base: '#8cc47a', dark: '#70aa64', light: '#b2db96' },
      { base: '#f3c4cf', dark: '#e3a3b3', light: '#fbe0e6' },
    ],
    blossom: '#f6c1cf',
  },
  summer: SUMMER,
  autumn: {
    ...SUMMER,
    ground: { ...SUMMER.ground, grass: '#bcc283', grassLight: '#cdcf93', grassDark: '#a5ab6b', wildflowers: false },
    trees: [
      { base: '#e3934a', dark: '#c46f37', light: '#f2b56a' },
      { base: '#d9653f', dark: '#b34c31', light: '#ee9361' },
      { base: '#ecbf4e', dark: '#cf9b37', light: '#f6d77c' },
    ],
    pine: ['#4a7f5a', '#567f5c', '#638d66'],
    bush: { base: '#c98a4a', dark: '#a86e3b', light: '#e0aa66' },
    flowerSets: [
      ['#f2a65a', '#f7d36b', '#d9653f'],
      ['#e3934a', '#fff4e2', '#c46f37'],
    ],
  },
  winter: {
    ...SUMMER,
    ground: {
      grass: '#eef2f5',
      grassLight: '#ffffff',
      grassDark: '#dbe3ea',
      path: '#e6dfd2',
      pathEdge: '#d2c8b6',
      plaza: '#f3f0ea',
      plazaEdge: '#d9d2c6',
      wildflowers: false,
    },
    trees: [
      { base: '#9fb3a6', dark: '#87998d', light: '#b9c9be' },
      { base: '#a9b8ad', dark: '#8f9f94', light: '#c3cfc6' },
    ],
    pine: ['#3f6f55', '#4b7c60', '#58896c'],
    bush: { base: '#a3b5a8', dark: '#8c9e92', light: '#c0cdc3' },
    snow: true,
    flowersBloom: false,
  },
};

export function seasonPalette(season: Season): SeasonPalette {
  return SEASON_PALETTES[season];
}
