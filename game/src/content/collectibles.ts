/**
 * Hidden collectibles. EDIT the fun facts below: they're placeholders.
 *
 * `where` is "town" or an interior id from content/interiors.ts.
 * Coordinates are in that scene's space.
 */
export type CollectibleKind = 'coffee' | 'polaroid' | 'pearl' | 'flower';

export interface CollectibleDef {
  id: string;
  kind: CollectibleKind;
  where: string;
  x: number;
  y: number;
}

export const collectibleKinds: Record<CollectibleKind, { label: string; singular: string; icon: string }> = {
  coffee: { label: 'Coffee cups', singular: 'coffee cup', icon: '☕' },
  polaroid: { label: 'Polaroids', singular: 'polaroid', icon: '📷' },
  pearl: { label: 'Boba pearls', singular: 'boba pearl', icon: '🧋' },
  flower: { label: 'Flowers', singular: 'flower', icon: '🌸' },
};

/** Each coffee cup reveals one fun fact.*/
export const funFacts: Record<string, string> = {
  'cup-1': 'Fun fact #1: I love to listen to live music! I\'ve been to over 10 concerts so far!',
  'cup-2': 'Fun fact #2: I have a slowly growing vinyl collection. I only started 2 years ago, but I currently have 11 well loved records.',
  'cup-3': 'Fun fact #3: BIG fan of video games, if you couldn\'t tell. One game I could play forever would definitely be Celeste.',
  'cup-4': 'Fun fact #4: I\'m always trying to learn a new instrument. I can really only play the bass clarinet well, but I can get by with guitar, trumpet, bass, and piano.',
  'cup-5': 'Fun fact #5: I\'ve actually lived in Texas my entire life! I\'ve visited plenty of the states, but I think it would be neat to live somewhere else one day.',
};

/** Polaroids needed to unlock the photography gallery. */
export const GALLERY_UNLOCK = 4;

export const collectibles: CollectibleDef[] = [
  // Coffee cups: tucked behind buildings and in quiet corners.
  { id: 'cup-1', kind: 'coffee', where: 'town', x: 330, y: 556 },
  { id: 'cup-2', kind: 'coffee', where: 'town', x: 1590, y: 250 },
  { id: 'cup-3', kind: 'coffee', where: 'lab', x: 90, y: 270 },
  { id: 'cup-4', kind: 'coffee', where: 'school', x: 640, y: 300 },
  { id: 'cup-5', kind: 'coffee', where: 'town', x: 1010, y: 1110 },

  // Polaroids: unlock the gallery in the Cottage.
  { id: 'polaroid-1', kind: 'polaroid', where: 'town', x: 1000, y: 296 },
  { id: 'polaroid-2', kind: 'polaroid', where: 'town', x: 190, y: 880 },
  { id: 'polaroid-3', kind: 'polaroid', where: 'town', x: 1640, y: 880 },
  { id: 'polaroid-4', kind: 'polaroid', where: 'cottage', x: 560, y: 300 },
  { id: 'polaroid-5', kind: 'polaroid', where: 'workshop', x: 580, y: 260 },
  { id: 'polaroid-6', kind: 'polaroid', where: 'post', x: 600, y: 230 },

  // Boba pearls: mostly around the Boba Shop.
  { id: 'pearl-1', kind: 'pearl', where: 'boba', x: 90, y: 230 },
  { id: 'pearl-2', kind: 'pearl', where: 'boba', x: 560, y: 240 },
  { id: 'pearl-3', kind: 'pearl', where: 'boba', x: 320, y: 390 },
  { id: 'pearl-4', kind: 'pearl', where: 'town', x: 600, y: 960 },
  { id: 'pearl-5', kind: 'pearl', where: 'town', x: 300, y: 1150 },
  { id: 'pearl-6', kind: 'pearl', where: 'town', x: 820, y: 640 },
  { id: 'pearl-7', kind: 'pearl', where: 'workshop', x: 300, y: 390 },
  { id: 'pearl-8', kind: 'pearl', where: 'town', x: 1250, y: 1180 },

  // Flowers: all in the Greenhouse.
  { id: 'flower-1', kind: 'flower', where: 'greenhouse', x: 60, y: 260 },
  { id: 'flower-2', kind: 'flower', where: 'greenhouse', x: 230, y: 280 },
  { id: 'flower-3', kind: 'flower', where: 'greenhouse', x: 420, y: 280 },
  { id: 'flower-4', kind: 'flower', where: 'greenhouse', x: 590, y: 270 },
  { id: 'flower-5', kind: 'flower', where: 'greenhouse', x: 320, y: 300 },
];
