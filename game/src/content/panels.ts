import type { PanelDef } from './types';

/**
 * Content panels, by id. Blocks like `research`/`project` pull the real text
 * from index.html via site.json, so only the framing (titles, short notes) lives here.
 * Notes marked "flavor" are game-only lines you can rewrite freely.
 */
export const panels: Record<string, PanelDef> = {
  // ── Town square ───────────────────────────────────────────────
  notice: {
    eyebrow: 'Town square · notice board',
    title: "What I'm working on now",
    blocks: [
      { kind: 'project', match: 'PaperTrail', compact: true },
      { kind: 'research', match: 'Particle Collision', compact: true },
      { kind: 'research', match: 'Mars', compact: true },
      { kind: 'research', match: 'CSCE 312', compact: true },
    ],
    hint: 'Visit the Workshop and the DIVE Lab for the full stories.',
  },

  // ── Cottage (About) ───────────────────────────────────────────
  about: {
    eyebrow: 'Cottage · bookshelf',
    title: 'About me',
    blocks: [{ kind: 'aboutIntro' }, { kind: 'aboutParagraphs' }, { kind: 'facts' }],
  },
  'cottage.coffee': {
    eyebrow: 'Cottage · coffee corner',
    title: 'The coffee corner',
    blocks: [
      { kind: 'note', text: 'A warm mug, a comfy corner, and a good idea brewing.' }, // flavor
      { kind: 'aboutParagraphs', contains: ['coffee'] },
    ],
  },
  'cottage.camera': {
    eyebrow: 'Cottage · camera',
    title: 'Behind the lens',
    blocks: [
      { kind: 'aboutParagraphs', contains: ['photos'] },
      { kind: 'note', text: 'Polaroids are hidden around town. Find enough of them to unlock a photo gallery (coming soon).' }, // flavor
    ],
  },
  'cottage.console': {
    eyebrow: 'Cottage · game console',
    title: 'Player two has entered',
    blocks: [
      { kind: 'facts', labels: ['Studying'] },
      { kind: 'note', text: 'This whole town is a small game-dev side project. Thanks for playing!' }, // flavor
    ],
  },

  // ── DIVE Lab (research) ───────────────────────────────────────
  'lab.particles': {
    eyebrow: 'DIVE Lab · research station',
    title: 'Particle collision prediction',
    blocks: [
      { kind: 'research', match: 'Particle Collision' },
      { kind: 'heading', text: 'Project deep dive' },
      { kind: 'project', match: 'Particle Collision' },
    ],
  },
  'lab.mars': {
    eyebrow: 'DIVE Lab · reentry capsule model',
    title: 'Mars reentry flow prediction',
    blocks: [{ kind: 'research', match: 'Mars' }],
  },
  'lab.past': {
    eyebrow: 'DIVE Lab · whiteboard',
    title: 'Past research',
    blocks: [
      { kind: 'research', match: 'Stroke' },
      { kind: 'research', match: 'Social Media' },
    ],
  },
  'lab.cert.srw': {
    eyebrow: 'DIVE Lab · certificate',
    title: 'Student Research Week 2025',
    blocks: [
      { kind: 'researchBullet', match: 'Stroke', contains: 'Student Research Week' },
      { kind: 'research', match: 'Stroke', compact: true },
    ],
  },
  'lab.cert.ecsm': {
    eyebrow: 'DIVE Lab · certificate',
    title: 'ECSM 2025 publication',
    blocks: [
      { kind: 'researchBullet', match: 'Social Media', contains: 'ECSM' },
      { kind: 'research', match: 'Social Media', compact: true },
    ],
  },

  // ── Workshop (projects) ───────────────────────────────────────
  'workshop.papertrail': {
    eyebrow: 'Workshop · workbench',
    title: 'PaperTrail',
    blocks: [{ kind: 'project', match: 'PaperTrail' }],
  },
  'workshop.cpu': {
    eyebrow: 'Workshop · circuit table',
    title: '64-bit x86 CPU',
    blocks: [{ kind: 'project', match: 'x86' }],
  },
  'workshop.skills': {
    eyebrow: 'Workshop · pegboard',
    title: 'Tools of the trade',
    blocks: [{ kind: 'skills' }],
  },
};
