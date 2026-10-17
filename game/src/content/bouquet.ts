/**
 * Bloom & Arrange (the Greenhouse mini game). EDIT freely.
 * Its rules come from floral design basics: a color palette, a focal flower
 * with filler and greenery, and the "rule of odds".
 */
export type StemRole = 'focal' | 'filler' | 'greenery';
export type Palette = 'warm' | 'cool' | 'pastel' | 'any';

export interface StemDef {
  id: string;
  label: string;
  role: StemRole;
  color: string;
  /** Which palettes this stem fits. Greenery fits everything. */
  fits: Palette[];
}

export const stems: StemDef[] = [
  // Focal flowers: the big blooms that draw the eye.
  { id: 'sunflower', label: 'Sunflower', role: 'focal', color: '#f2c14e', fits: ['warm'] },
  { id: 'red-rose', label: 'Red rose', role: 'focal', color: '#d9474f', fits: ['warm'] },
  { id: 'peony', label: 'Peony', role: 'focal', color: '#f4b6c2', fits: ['pastel', 'warm'] },
  { id: 'hydrangea', label: 'Hydrangea', role: 'focal', color: '#7fa6dc', fits: ['cool'] },
  { id: 'iris', label: 'Iris', role: 'focal', color: '#8d6bc4', fits: ['cool'] },
  { id: 'white-rose', label: 'White rose', role: 'focal', color: '#fbf5ec', fits: ['warm', 'cool', 'pastel'] },
  // Fillers: small flowers that fill gaps and add texture.
  { id: 'babys-breath', label: "Baby's breath", role: 'filler', color: '#ffffff', fits: ['warm', 'cool', 'pastel'] },
  { id: 'lavender', label: 'Lavender', role: 'filler', color: '#a98bd6', fits: ['cool', 'pastel'] },
  { id: 'waxflower', label: 'Waxflower', role: 'filler', color: '#f6cfe0', fits: ['pastel'] },
  { id: 'solidago', label: 'Solidago', role: 'filler', color: '#f2d15b', fits: ['warm'] },
  { id: 'spray-rose', label: 'Spray rose', role: 'filler', color: '#f2994a', fits: ['warm'] },
  // Greenery: frames the arrangement.
  { id: 'eucalyptus', label: 'Eucalyptus', role: 'greenery', color: '#9cb5a2', fits: ['warm', 'cool', 'pastel'] },
  { id: 'fern', label: 'Fern', role: 'greenery', color: '#6aa75f', fits: ['warm', 'cool', 'pastel'] },
];

export interface BouquetRequest {
  client: string;
  text: string;
  palette: Palette;
}

/** Customer requests (five are picked at random each round). Flavor text: edit freely. */
export const bouquetRequests: BouquetRequest[] = [
  { client: 'Sam', text: "Something warm and sunny for my mom's birthday!", palette: 'warm' },
  { client: 'Mina', text: 'A calm bouquet for my desk. Cool colors, please.', palette: 'cool' },
  { client: 'Jules', text: 'Soft and pastel, for a baby shower.', palette: 'pastel' },
  { client: 'Leo', text: 'Surprise me! Any colors, just make it feel balanced.', palette: 'any' },
  { client: 'Priya', text: 'Autumn vibes: warm, cozy, a little golden.', palette: 'warm' },
  { client: 'Noor', text: 'Something soothing, in blues and purples.', palette: 'cool' },
  { client: 'Theo', text: 'Gentle pinks and creams for a first date.', palette: 'pastel' },
];

export const bouquetRules = {
  requestsPerRound: 5,
  maxStems: 9,
  /** A bouquet looks full (not sparse or crowded) within this range. */
  minFull: 5,
  maxFull: 9,
};
