import type { InteractionDef, NpcDef } from './types';

/** Furniture the InteriorPainters know how to draw. */
export type InteriorPropKind =
  | 'rug'
  | 'bookshelf'
  | 'coffeeCorner'
  | 'cameraTripod'
  | 'tvConsole'
  | 'sofa'
  | 'plant'
  | 'floorLamp'
  | 'window'
  | 'painting'
  | 'whiteboard'
  | 'certificate'
  | 'computerDesk'
  | 'capsuleModel'
  | 'serverRack'
  | 'workbench'
  | 'pegboard'
  | 'circuitTable'
  | 'toolbox'
  | 'crate'
  | 'menuBoard'
  | 'teaStation'
  | 'register'
  | 'cafeTable'
  | 'stool'
  | 'chalkboard'
  | 'teacherDesk'
  | 'schoolDesk'
  | 'terminal'
  | 'globe'
  | 'plantTable'
  | 'easel'
  | 'wateringCan'
  | 'postCounter'
  | 'mailSlots'
  | 'letterDesk'
  | 'parcels';

export interface InteriorPropDef {
  kind: InteriorPropKind;
  /** Floor props: bottom-center on the floor. Wall props: center on the back wall. */
  x: number;
  y: number;
  variant?: number;
  interact?: InteractionDef;
}

export interface InteriorDef {
  id: string;
  title: string;
  /** Toast shown on entering. */
  welcome: string;
  width: number;
  height: number;
  /** Height of the back wall band at the top of the room. */
  wallHeight: number;
  wall: string;
  wallTrim: string;
  floor: 'wood' | 'tile';
  floorColors: [string, string];
  props: InteriorPropDef[];
  /** Villagers inside this room (same shape as town NPCs). */
  npcs?: NpcDef[];
}

const panel = (label: string, id: string): InteractionDef => ({ label, action: { type: 'panel', panel: id } });

export const interiors: Record<string, InteriorDef> = {
  cottage: {
    id: 'cottage',
    title: 'Cottage',
    welcome: 'The Cottage: all about me. Have a look around!',
    width: 620,
    height: 420,
    wallHeight: 120,
    wall: '#f4dfc6',
    wallTrim: '#d8b48d',
    floor: 'wood',
    floorColors: ['#cf9f70', '#c39264'],
    props: [
      { kind: 'window', x: 175, y: 56 },
      { kind: 'painting', x: 310, y: 52 },
      { kind: 'window', x: 445, y: 56 },
      { kind: 'rug', x: 310, y: 300 },
      { kind: 'bookshelf', x: 80, y: 178, interact: panel('Browse the bookshelf', 'about') },
      { kind: 'tvConsole', x: 310, y: 170, interact: panel('Check the game console', 'cottage.console') },
      { kind: 'coffeeCorner', x: 535, y: 178, interact: panel('Visit the coffee corner', 'cottage.coffee') },
      { kind: 'sofa', x: 310, y: 300 },
      { kind: 'cameraTripod', x: 470, y: 330, interact: panel('Look at the camera', 'cottage.camera') },
      { kind: 'floorLamp', x: 200, y: 182 },
      { kind: 'plant', x: 40, y: 395 },
      { kind: 'plant', x: 585, y: 395, variant: 1 },
    ],
  },

  lab: {
    id: 'lab',
    title: 'Research Lab',
    welcome: 'The Research Lab: Different research projects I\'ve been involved with.',
    width: 700,
    height: 440,
    wallHeight: 120,
    wall: '#e1e9ef',
    wallTrim: '#b8c7d4',
    floor: 'tile',
    floorColors: ['#edf1f4', '#e1e7ec'],
    props: [
      { kind: 'whiteboard', x: 175, y: 60, interact: panel('Read the whiteboard', 'lab.past') },
      { kind: 'certificate', x: 395, y: 52, interact: panel('Read the certificate', 'lab.cert.srw') },
      { kind: 'certificate', x: 470, y: 52, variant: 1, interact: panel('Read the certificate', 'lab.cert.ecsm') },
      { kind: 'window', x: 600, y: 56 },
      { kind: 'computerDesk', x: 175, y: 200, interact: panel('Use the research station', 'lab.particles') },
      { kind: 'serverRack', x: 650, y: 196 },
      { kind: 'capsuleModel', x: 450, y: 300, interact: panel('Inspect the capsule model', 'lab.mars') },
      { kind: 'plant', x: 40, y: 415 },
      { kind: 'plant', x: 660, y: 415, variant: 1 },
    ],
  },

  workshop: {
    id: 'workshop',
    title: 'Workshop',
    welcome: 'The Workshop: things I have built.',
    width: 640,
    height: 420,
    wallHeight: 120,
    wall: '#ead7bf',
    wallTrim: '#c7a17b',
    floor: 'wood',
    floorColors: ['#ab8059', '#a07550'],
    props: [
      { kind: 'pegboard', x: 150, y: 58, interact: panel('Look at the pegboard', 'workshop.skills') },
      { kind: 'window', x: 330, y: 56 },
      { kind: 'window', x: 500, y: 56 },
      { kind: 'workbench', x: 160, y: 205, interact: panel('Look at the workbench', 'workshop.papertrail') },
      { kind: 'circuitTable', x: 455, y: 225, interact: panel('Inspect the circuit board', 'workshop.cpu') },
      { kind: 'floorLamp', x: 600, y: 182 },
      { kind: 'toolbox', x: 300, y: 340 },
      { kind: 'crate', x: 585, y: 395 },
      { kind: 'plant', x: 40, y: 395 },
    ],
  },

  school: {
    id: 'school',
    title: 'Schoolhouse',
    welcome: 'The Schoolhouse: coursework and the CSCE 312 curriculum.',
    width: 680,
    height: 440,
    wallHeight: 120,
    wall: '#f3e6c9',
    wallTrim: '#c9a46f',
    floor: 'wood',
    floorColors: ['#c8996b', '#bd8e60'],
    props: [
      { kind: 'window', x: 105, y: 56 },
      { kind: 'chalkboard', x: 340, y: 58, interact: panel('Read the chalkboard', 'school.csce312') },
      { kind: 'window', x: 575, y: 56 },
      { kind: 'bookshelf', x: 60, y: 178, interact: panel('Browse the course catalog', 'school.coursework') },
      { kind: 'teacherDesk', x: 340, y: 205 },
      { kind: 'terminal', x: 625, y: 190, interact: panel('Open the coursework terminal', 'school.coursework') },
      { kind: 'schoolDesk', x: 200, y: 310 },
      { kind: 'schoolDesk', x: 340, y: 310 },
      { kind: 'schoolDesk', x: 480, y: 310 },
      { kind: 'globe', x: 600, y: 405 },
      { kind: 'plant', x: 40, y: 415 },
    ],
    npcs: [
      {
        id: 'librarian',
        name: 'Ada',
        x: 250,
        y: 196,
        appearance: { body: 'tall', hair: 'bun', skin: '#eec3a2', hairColor: '#9aa0ad', outfit: '#6e5a7e', accessories: ['glasses'] },
        interact: {
          label: 'Talk to Ada',
          action: {
            type: 'say',
            speaker: 'Ada',
            lines: [
              'Welcome to the Schoolhouse! Mind the chalk dust.', // flavor
              'The terminal in the corner lists every course Gauri has taken. Click a file to open it.',
              'The chalkboard is the CSCE 312 lab curriculum: students build a working RISC-V CPU from the gate level up.',
            ],
          },
        },
      },
    ],
  },

  greenhouse: {
    id: 'greenhouse',
    title: 'Greenhouse',
    welcome: 'The Greenhouse: floral design. Mind the flowers!',
    width: 640,
    height: 420,
    wallHeight: 120,
    wall: '#e3f3ec',
    wallTrim: '#a9cfc0',
    floor: 'tile',
    floorColors: ['#e9efe2', '#dee7d6'],
    props: [
      { kind: 'window', x: 110, y: 56 },
      { kind: 'window', x: 320, y: 56 },
      { kind: 'window', x: 530, y: 56 },
      { kind: 'plantTable', x: 130, y: 210 },
      { kind: 'easel', x: 320, y: 215, interact: panel('Look at the photo easel', 'greenhouse.floral') },
      { kind: 'plantTable', x: 510, y: 210, variant: 1 },
      { kind: 'plantTable', x: 140, y: 345, variant: 1 },
      { kind: 'plantTable', x: 500, y: 345 },
      { kind: 'wateringCan', x: 235, y: 395 },
      { kind: 'plant', x: 40, y: 400 },
      { kind: 'plant', x: 600, y: 400, variant: 1 },
    ],
  },

  boba: {
    id: 'boba',
    title: 'Boba Shop',
    welcome: 'The Boba Shop: grab a drink, or try making one!',
    width: 640,
    height: 420,
    wallHeight: 120,
    wall: '#fbe3d0',
    wallTrim: '#e2a98a',
    floor: 'tile',
    floorColors: ['#f7efe6', '#ecdfd2'],
    props: [
      { kind: 'window', x: 100, y: 56 },
      { kind: 'menuBoard', x: 320, y: 58, interact: panel('Read the menu board', 'boba.menu') },
      { kind: 'window', x: 540, y: 56 },
      { kind: 'teaStation', x: 240, y: 200, interact: { label: 'Make some boba (mini game)', action: { type: 'minigame', id: 'boba' } } },
      { kind: 'register', x: 405, y: 200, interact: panel('Check the register (POS system)', 'boba.pos') },
      // Tables sit outside the walking lines to the tea station (x≈240) and register (x≈405).
      { kind: 'cafeTable', x: 520, y: 335 },
      { kind: 'stool', x: 470, y: 340 },
      { kind: 'stool', x: 570, y: 340 },
      { kind: 'cafeTable', x: 135, y: 335, variant: 1 },
      { kind: 'stool', x: 85, y: 340 },
      { kind: 'stool', x: 185, y: 340 },
      { kind: 'plant', x: 40, y: 400 },
      { kind: 'plant', x: 600, y: 400, variant: 1 },
    ],
  },

  post: {
    id: 'post',
    title: 'Post Office',
    welcome: 'The Post Office: my resume, links, and a way to say hi.',
    width: 660,
    height: 420,
    wallHeight: 120,
    wall: '#e4ecf5',
    wallTrim: '#a9b9cf',
    floor: 'wood',
    floorColors: ['#d8b48a', '#cda87d'],
    props: [
      { kind: 'mailSlots', x: 150, y: 58, interact: panel('Check the mail slots', 'post.links') },
      { kind: 'window', x: 520, y: 56 },
      { kind: 'postCounter', x: 360, y: 205, interact: panel('Send a letter', 'post.contact') },
      { kind: 'letterDesk', x: 140, y: 310, interact: panel('Read the letter (resume)', 'post.resume') },
      { kind: 'parcels', x: 560, y: 330 },
      { kind: 'plant', x: 40, y: 400 },
      { kind: 'plant', x: 620, y: 400, variant: 1 },
    ],
  },
};
