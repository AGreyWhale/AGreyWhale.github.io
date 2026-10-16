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
      { kind: 'note', text: 'Polaroids are hidden around town. Find enough of them to unlock the photo gallery.' }, // flavor
      { kind: 'button', label: 'Open the photo gallery', action: { type: 'panel', panel: 'gallery' } },
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
    blocks: [
      { kind: 'project', match: 'x86' },
      { kind: 'image', src: 'images/cs312/MainCircuit.png', alt: 'Logisim circuit diagram of the CPU datapath', caption: 'The main circuit in Logisim' },
    ],
  },
  'workshop.skills': {
    eyebrow: 'Workshop · pegboard',
    title: 'Tools of the trade',
    blocks: [{ kind: 'skills' }],
  },

  // ── Schoolhouse (coursework + teaching) ───────────────────────
  'school.coursework': {
    eyebrow: 'Schoolhouse · coursework terminal',
    title: 'Coursework',
    blocks: [{ kind: 'coursework' }],
    hint: 'Files marked ✦ open up for details.',
  },
  'school.csce312': {
    eyebrow: 'Schoolhouse · chalkboard',
    title: 'CSCE 312 curriculum',
    blocks: [{ kind: 'research', match: 'CSCE 312' }],
  },

  // ── Greenhouse (floral design) ────────────────────────────────
  'greenhouse.floral': {
    eyebrow: 'Greenhouse · photo easel',
    title: 'Floral design',
    blocks: [
      { kind: 'courseEntry', match: 'floral' },
      { kind: 'slideshow', set: 'floral', label: 'Arrangements from the course' },
    ],
  },

  // ── Boba Shop ─────────────────────────────────────────────────
  'boba.pos': {
    eyebrow: 'Boba Shop · register',
    title: 'Boba point-of-sale system',
    blocks: [{ kind: 'project', match: 'Boba' }],
  },
  'boba.menu': {
    eyebrow: 'Boba Shop · menu board',
    title: 'Boba Rush',
    blocks: [
      { kind: 'note', text: 'Orders are piling up! Build each drink to match the ticket before the customer gives up.' }, // flavor
      { kind: 'button', label: 'Play Boba Rush', action: { type: 'minigame', id: 'boba' } },
      { kind: 'heading', text: 'The real shop software' },
      { kind: 'project', match: 'Boba', compact: true },
    ],
  },

  // ── Post Office (resume + contact) ────────────────────────────
  'post.resume': {
    eyebrow: 'Post Office · a letter for you',
    title: 'My resume',
    blocks: [{ kind: 'resume' }],
  },
  'post.contact': {
    eyebrow: 'Post Office · counter',
    title: 'Send me a letter',
    blocks: [{ kind: 'contact' }, { kind: 'socialLinks' }],
  },
  'post.links': {
    eyebrow: 'Post Office · mail slots',
    title: 'Find me online',
    blocks: [{ kind: 'socialLinks' }],
  },
  mail: {
    eyebrow: 'Town square · mailbox',
    title: 'Send me a letter',
    blocks: [{ kind: 'contact' }],
    hint: 'My resume is waiting at the Post Office.',
  },

  // ── Community corner (service) ────────────────────────────────
  community: {
    eyebrow: 'Community corner',
    title: 'Giving back',
    blocks: [{ kind: 'service' }],
  },

  // ── Collectibles ──────────────────────────────────────────────
  collection: {
    eyebrow: 'Your satchel',
    title: 'Collection',
    blocks: [{ kind: 'collection' }],
  },
  gallery: {
    eyebrow: 'Cottage · camera roll',
    title: 'Photo gallery',
    blocks: [{ kind: 'gallery' }],
  },
};
