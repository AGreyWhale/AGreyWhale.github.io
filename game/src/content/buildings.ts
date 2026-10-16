/** Building styles the BuildingPainter knows how to draw. */
export type BuildingStyle = 'cottage' | 'lab' | 'workshop' | 'boba' | 'school' | 'greenhouse' | 'postOffice' | 'pavilion';

export interface BuildingDef {
  id: string;
  name: string;
  /** One-line description for prompts and the screen-reader announcement. */
  blurb: string;
  style: BuildingStyle;
  /** Bottom-center of the front wall (the door sits here), in town coordinates. */
  x: number;
  y: number;
  width: number;
  wallHeight: number;
  roofHeight: number;
  palette: { wall: string; roof: string; trim: string; door: string; accent: string };
  /** Interior id in content/interiors.ts (walk-in buildings)… */
  interior?: string;
  /** …or a panel id in content/panels.ts (open-air spots like the pavilion). */
  panel?: string;
}

export const buildings: BuildingDef[] = [
  {
    id: 'cottage',
    name: 'Cottage',
    blurb: 'About me',
    style: 'cottage',
    x: 430,
    y: 640,
    width: 220,
    wallHeight: 92,
    roofHeight: 86,
    palette: { wall: '#f6e3c9', roof: '#d9705a', trim: '#fff6ea', door: '#8a5a44', accent: '#f2b24c' },
    interior: 'cottage',
  },
  {
    id: 'lab',
    name: 'Research Lab',
    blurb: 'ML research',
    style: 'lab',
    x: 900,
    y: 380,
    width: 270,
    wallHeight: 104,
    roofHeight: 54,
    palette: { wall: '#e4ecf1', roof: '#6d8fb3', trim: '#ffffff', door: '#4e6c8c', accent: '#8fd3c8' },
    interior: 'lab',
  },
  {
    id: 'workshop',
    name: 'Workshop',
    blurb: 'Projects',
    style: 'workshop',
    x: 1370,
    y: 640,
    width: 232,
    wallHeight: 96,
    roofHeight: 70,
    palette: { wall: '#e7c9a3', roof: '#7f6a5a', trim: '#fbeedd', door: '#6b4a35', accent: '#e9a23b' },
    interior: 'workshop',
  },
  {
    id: 'school',
    name: 'Schoolhouse',
    blurb: 'Coursework & teaching',
    style: 'school',
    x: 440,
    y: 300,
    width: 236,
    wallHeight: 98,
    roofHeight: 78,
    palette: { wall: '#e98f7a', roof: '#6e5a7e', trim: '#fff4ea', door: '#5a4060', accent: '#f2c14e' },
    interior: 'school',
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    blurb: 'Floral design',
    style: 'greenhouse',
    x: 1340,
    y: 300,
    width: 220,
    wallHeight: 86,
    roofHeight: 62,
    palette: { wall: '#d8efe6', roof: '#bfe3d6', trim: '#ffffff', door: '#6aa38a', accent: '#f49cb0' },
    interior: 'greenhouse',
  },
  {
    id: 'boba',
    name: 'Boba Shop',
    blurb: 'Boba POS project & mini game',
    style: 'boba',
    x: 440,
    y: 1080,
    width: 212,
    wallHeight: 94,
    roofHeight: 52,
    palette: { wall: '#fbe3d0', roof: '#c88a5c', trim: '#fffaf2', door: '#7a4e3a', accent: '#e58aa2' },
    interior: 'boba',
  },
  {
    id: 'post',
    name: 'Post Office',
    blurb: 'Resume & contact',
    style: 'postOffice',
    x: 1360,
    y: 1080,
    width: 224,
    wallHeight: 98,
    roofHeight: 74,
    palette: { wall: '#dfe8f3', roof: '#d0605a', trim: '#ffffff', door: '#3f5f8a', accent: '#f2c14e' },
    interior: 'post',
  },
  {
    id: 'community',
    name: 'Community corner',
    blurb: 'Service',
    style: 'pavilion',
    x: 900,
    y: 1190,
    width: 190,
    wallHeight: 70,
    roofHeight: 60,
    palette: { wall: '#f4e8d6', roof: '#7fae8a', trim: '#fffaf2', door: '#8c6448', accent: '#f2c14e' },
    panel: 'community',
  },
];

export function findBuilding(id: string): BuildingDef | undefined {
  return buildings.find((b) => b.id === id);
}
