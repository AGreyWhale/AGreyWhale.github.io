/** Building styles the BuildingPainter knows how to draw. */
export type BuildingStyle = 'cottage' | 'lab' | 'workshop';

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
  /** Interior id in content/interiors.ts. */
  interior: string;
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
    name: 'DIVE Lab',
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
];

export function findBuilding(id: string): BuildingDef | undefined {
  return buildings.find((b) => b.id === id);
}
