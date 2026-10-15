import type { InteractionDef } from './types';

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
  | 'crate';

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
    title: 'DIVE Lab',
    welcome: 'The DIVE Lab: machine learning research.',
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
};
