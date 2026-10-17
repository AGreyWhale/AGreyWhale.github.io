/**
 * Shared content types. Content files describe *what* is in the town; classes
 * decide *how* to draw and run it.
 */

/** What happens when the player interacts with something. */
export type ActionDef =
  | { type: 'panel'; panel: string }
  | { type: 'say'; speaker?: string; lines: string[] }
  | { type: 'enter'; building: string }
  | { type: 'exit' }
  | { type: 'minigame'; id: 'boba' | 'bouquet' }
  /** Make a wish at the fountain (random; very rarely unlocks the wizard hat). */
  | { type: 'wish' }
  | { type: 'wardrobe' };

export interface InteractionDef {
  /** Shown in the prompt, e.g. "Read the notice board". */
  label: string;
  action: ActionDef;
}

/**
 * Building blocks for DOM content panels. Blocks that reference the classic site
 * (research, projects, about…) are resolved from the extracted site.json by a
 * case-insensitive `match` against the title.
 */
export type PanelBlock =
  | { kind: 'aboutIntro' }
  | { kind: 'aboutParagraphs'; contains?: string[] }
  | { kind: 'facts'; labels?: string[] }
  | { kind: 'research'; match: string; compact?: boolean }
  | { kind: 'researchBullet'; match: string; contains: string }
  | { kind: 'project'; match: string; compact?: boolean }
  | { kind: 'skills'; groups?: string[] }
  | { kind: 'service' }
  | { kind: 'heading'; text: string }
  | { kind: 'note'; text: string }
  | { kind: 'links'; items: Array<{ label: string; href: string }> }
  /** The coursework file tree from courses.html; `open` expands an entry by name (e.g. "floral_design"). */
  | { kind: 'coursework'; open?: string }
  /** One coursework entry's description, matched by file name (e.g. "floral"). */
  | { kind: 'courseEntry'; match: string }
  /** An image from the classic site (path as in its HTML, e.g. "images/cs312/MainCircuit.png"). */
  | { kind: 'image'; src: string; alt: string; caption?: string }
  /** A slideshow from courses.html by set name ("floral", "graphics", …). */
  | { kind: 'slideshow'; set: string; label: string }
  | { kind: 'resume' }
  | { kind: 'contact' }
  | { kind: 'socialLinks' }
  | { kind: 'gallery' }
  | { kind: 'collection' }
  /** Every building, with a button to go straight there (quick travel). */
  | { kind: 'directory' }
  | { kind: 'button'; label: string; action: ActionDef };

export interface PanelDef {
  eyebrow?: string;
  title: string;
  blocks: PanelBlock[];
  /** Small footer line, e.g. where to find more. */
  hint?: string;
}

export type Accessory =
  // Free (in the creator)
  | 'beanie'
  | 'bow'
  | 'glasses'
  | 'headphones'
  | 'cap'
  | 'flower'
  | 'scarf'
  | 'freckles'
  | 'earrings'
  | 'hairClip'
  | 'backpack'
  // Rewards (unlocked by playing; see content/rewards.ts)
  | 'crown'
  | 'camera'
  | 'flowerCrown'
  | 'catEars'
  | 'coffeeCup'
  // Riya's; players can only win it with a lucky wish
  | 'wizardHat';

export type OutfitStyle = 'plain' | 'stripes' | 'overalls' | 'dress';

export interface CharacterAppearance {
  body: 'round' | 'tall';
  hair: 'short' | 'curly' | 'pigtails' | 'hijab' | 'bun' | 'long';
  skin: string;
  /** Hair color, or the hijab's color. */
  hairColor: string;
  outfit: string;
  /** Defaults to 'plain'. */
  outfitStyle?: OutfitStyle;
  /** Any combination; hats (see HAT_ACCESSORIES) are one-at-a-time. */
  accessories: Accessory[];
}

export type CatCoat = 'orange' | 'grey' | 'tuxedo' | 'calico';

/** A wandering cat you can pet. Used in town and inside buildings. */
export interface CatDef {
  id: string;
  name: string;
  /** Home spot it wanders around. */
  x: number;
  y: number;
  coat: CatCoat;
  /** How far from home it roams. 0 = stays put (a sleepy house cat). */
  roam: number;
}

/** A villager. Used in town (content/town.ts) and inside buildings (content/interiors.ts). */
export interface NpcDef {
  id: string;
  name: string;
  x: number;
  y: number;
  appearance: CharacterAppearance;
  interact: InteractionDef;
}
