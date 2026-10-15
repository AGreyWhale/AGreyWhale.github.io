/**
 * Shared content types. Content files describe *what* is in the town; classes
 * decide *how* to draw and run it.
 */

/** What happens when the player interacts with something. */
export type ActionDef =
  | { type: 'panel'; panel: string }
  | { type: 'say'; speaker?: string; lines: string[] }
  | { type: 'enter'; building: string }
  | { type: 'exit' };

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
  | { kind: 'links'; items: Array<{ label: string; href: string }> };

export interface PanelDef {
  eyebrow?: string;
  title: string;
  blocks: PanelBlock[];
  /** Small footer line, e.g. where to find more. */
  hint?: string;
}

export interface CharacterAppearance {
  body: 'round' | 'tall';
  hair: 'short' | 'bob' | 'bun' | 'long';
  skin: string;
  hairColor: string;
  outfit: string;
  accessory: 'none' | 'beanie' | 'bow' | 'glasses' | 'headphones' | 'cap' | 'flower';
}
