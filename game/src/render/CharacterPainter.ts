import type { Accessory, CharacterAppearance } from '../content/types';
import { circle, ellipse, fillRoundRect, mixColor, shade, shadow, type Ctx } from './draw';

export type Facing = 'down' | 'up' | 'left' | 'right';

export interface Pose {
  facing: Facing;
  /** Walk cycle phase in radians. */
  walk: number;
  moving: boolean;
  /** Seconds, for idle breathing and blinking. */
  time: number;
  /** 0..1 how much the right arm is raised in a wave. */
  wave?: number;
}

const INK = '#3a2b30';

/**
 * Draws a flat, rounded character with its feet at (x, y). Everything is
 * built from circles and rounded rects so any appearance combo just works.
 */
export function drawCharacter(g: Ctx, x: number, y: number, a: CharacterAppearance, pose: Pose): void {
  const tall = a.body === 'tall';
  const bw = tall ? 20 : 24;
  const bh = tall ? 22 : 18;
  const front = pose.facing === 'down';
  const back = pose.facing === 'up';
  const dir = pose.facing === 'left' ? -1 : 1;
  const side = !front && !back;

  const stride = pose.moving ? Math.sin(pose.walk) : 0;
  const bob = pose.moving ? Math.abs(Math.sin(pose.walk)) * 2 : Math.sin(pose.time * 2.2) * 0.5;

  shadow(g, x, y, 13, 4.2, 0.2);

  // Feet
  const foot = shade(a.outfit, -0.5);
  if (side) {
    ellipse(g, x + stride * 4.5, y - 2.5, 4.5, 3, foot);
    ellipse(g, x - stride * 4.5, y - 2.5, 4.5, 3, foot);
  } else {
    ellipse(g, x - 5, y - 2.5 - Math.max(0, stride) * 2.5, 4, 3, foot);
    ellipse(g, x + 5, y - 2.5 - Math.max(0, -stride) * 2.5, 4, 3, foot);
  }

  const bodyBottom = y - 4 - bob;
  const bodyTop = bodyBottom - bh;
  const hr = 11;
  const hy = bodyTop - hr + 4;

  // Long hair falls behind the body (except when seen from behind, where it's on top).
  if (a.hair === 'long' && !back) {
    fillRoundRect(g, x - hr - 1, hy - 2, hr * 2 + 2, hr + 18, 9, shade(a.hairColor, -0.08));
  }

  // Arms
  const arm = shade(a.outfit, -0.12);
  const swing = stride * 3;
  const armY = bodyTop + bh * 0.5;
  if (side) {
    ellipse(g, x - dir * 2 - swing * dir, armY, 3.5, 5.5, arm);
  } else {
    ellipse(g, x - bw / 2 - 1.5, armY + swing * 0.6, 3.5, 5.5, arm);
    if (pose.wave && pose.wave > 0.05) {
      const wy = armY - 12 * pose.wave + Math.sin(pose.time * 14) * 1.5 * pose.wave;
      ellipse(g, x + bw / 2 + 3, wy, 3.5, 5.5, arm);
      circle(g, x + bw / 2 + 3.5, wy - 5, 2.8, a.skin);
    } else {
      ellipse(g, x + bw / 2 + 1.5, armY - swing * 0.6, 3.5, 5.5, arm);
    }
  }

  // Body (and outfit style)
  if (a.outfitStyle === 'dress') {
    g.fillStyle = shade(a.outfit, 0.08);
    g.beginPath();
    g.moveTo(x - bw / 2 + 1, armY - 1);
    g.lineTo(x - bw / 2 - 4, bodyBottom + 1.5);
    g.lineTo(x + bw / 2 + 4, bodyBottom + 1.5);
    g.lineTo(x + bw / 2 - 1, armY - 1);
    g.closePath();
    g.fill();
  }
  fillRoundRect(g, x - bw / 2, bodyTop, bw, bh, [bw / 2.2, bw / 2.2, 7, 7], a.outfit);
  drawOutfitStyle(g, x, bodyTop, bodyBottom, bw, bh, a, back);
  fillRoundRect(g, x - bw / 2 + 4, bodyTop + 2, bw - 8, 3.5, 2, shade(a.outfit, 0.28));
  if (side) ellipse(g, x + dir * 1, armY + 1, 3.5, 5.5, arm);
  const body = { top: bodyTop, bottom: bodyBottom, w: bw, armY };
  for (const acc of BODY_ORDER) {
    if (a.accessories.includes(acc)) drawBodyExtra(g, x, body, acc, a, front, back, dir);
  }

  // Head + hair
  const hair = a.hairColor;
  if (a.hair === 'hijab' && !back) fillRoundRect(g, x - hr - 2.5, hy - 3, hr * 2 + 5, hr + 9, 7, hair);
  circle(g, x, hy - 0.5, hr + 1.5, hair);
  if (a.hair === 'bun') circle(g, x, hy - hr - 2.5, 5.5, hair);
  if (a.hair === 'curly') {
    // A ring of little curls around the crown (all the way round when seen from behind).
    const from = back ? 0 : Math.PI * 0.82;
    const to = back ? Math.PI * 2 : Math.PI * 2.18;
    for (let ang = from; ang <= to + 0.01; ang += 0.34) {
      circle(g, x + Math.cos(ang) * (hr + 1), hy - 0.5 + Math.sin(ang) * (hr + 1), 4.2, hair);
    }
    circle(g, x - 3, hy - hr - 1, 3.4, shade(hair, 0.12));
    circle(g, x + 4, hy - hr - 0.5, 3, shade(hair, 0.12));
  }
  if (a.hair === 'pigtails') {
    for (const s of [-1, 1]) {
      circle(g, x + s * (hr + 3), hy + 3, 4.6, hair);
      circle(g, x + s * (hr + 4.5), hy + 7.5, 3.6, hair);
      circle(g, x + s * (hr + 1.5), hy + 0.5, 1.8, shade(a.outfit, 0.15));
    }
  }
  if (back && a.hair === 'long') fillRoundRect(g, x - hr - 1, hy, hr * 2 + 2, hr + 14, 9, hair);
  if (back && a.hair === 'hijab') fillRoundRect(g, x - hr - 2.5, hy - 3, hr * 2 + 5, hr + 9, 7, hair);

  if (!back) {
    const fx = side ? x + dir * 3 : x;
    ellipse(g, fx, hy + 4.5, side ? hr - 3 : hr - 1.5, hr - 3.5, a.skin);
    drawFace(g, fx, hy, side ? dir : 0, pose.time);
  }

  // Layer order: ear things, then hats, then face and hair decorations.
  for (const acc of ACCESSORY_ORDER) {
    if (a.accessories.includes(acc)) drawAccessory(g, x, hy, hr, acc, a, front, back, dir);
  }
}

const ACCESSORY_ORDER: readonly Accessory[] = [
  'freckles',
  'earrings',
  'headphones',
  'catEars',
  'beanie',
  'cap',
  'crown',
  'flowerCrown',
  'wizardHat',
  'glasses',
  'hairClip',
  'bow',
  'flower',
];

/** Things worn on the body (drawn before the head). */
const BODY_ORDER: readonly Accessory[] = ['backpack', 'scarf', 'camera', 'coffeeCup'];

interface BodyBox {
  top: number;
  bottom: number;
  w: number;
  armY: number;
}

function drawOutfitStyle(g: Ctx, x: number, top: number, bottom: number, bw: number, bh: number, a: CharacterAppearance, back: boolean): void {
  switch (a.outfitStyle ?? 'plain') {
    case 'stripes': {
      g.save();
      g.beginPath();
      g.roundRect(x - bw / 2, top, bw, bh, [bw / 2.2, bw / 2.2, 7, 7]);
      g.clip();
      g.fillStyle = shade(a.outfit, 0.35);
      for (let yy = top + 7; yy < bottom - 2; yy += 4.5) g.fillRect(x - bw / 2, yy, bw, 2);
      g.restore();
      break;
    }
    case 'overalls': {
      const denim = mixColor(a.outfit, '#3f5f8a', 0.65);
      fillRoundRect(g, x - bw / 2 + 0.5, top + bh * 0.48, bw - 1, bh * 0.52, [2, 2, 7, 7], denim);
      if (!back) fillRoundRect(g, x - 5, top + 5, 10, bh * 0.5, 2, denim);
      g.strokeStyle = denim;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(x - 4, top + 6);
      g.lineTo(x - bw / 2 + 3, top + 2);
      g.moveTo(x + 4, top + 6);
      g.lineTo(x + bw / 2 - 3, top + 2);
      g.stroke();
      if (!back) {
        circle(g, x - 3, top + 7, 1.1, '#f2c14e');
        circle(g, x + 3, top + 7, 1.1, '#f2c14e');
      }
      break;
    }
    case 'dress':
      fillRoundRect(g, x - bw / 2 + 2, bottom - 3, bw - 4, 2, 1, shade(a.outfit, 0.3));
      break;
    case 'plain':
      break;
  }
}

function drawBodyExtra(g: Ctx, x: number, b: BodyBox, acc: Accessory, a: CharacterAppearance, front: boolean, back: boolean, dir: number): void {
  const side = !front && !back;
  switch (acc) {
    case 'backpack': {
      const pack = mixColor(a.outfit, '#c98a4e', 0.7);
      if (front) {
        g.strokeStyle = shade(pack, -0.15);
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x - b.w / 2 + 3, b.top + 2);
        g.lineTo(x - b.w / 2 + 4, b.armY + 4);
        g.moveTo(x + b.w / 2 - 3, b.top + 2);
        g.lineTo(x + b.w / 2 - 4, b.armY + 4);
        g.stroke();
      } else {
        const px = back ? x : x - dir * (b.w / 2 + 2);
        fillRoundRect(g, px - 8, b.top + 1, 16, 16, 5, pack);
        fillRoundRect(g, px - 6, b.top + 9, 12, 6, 3, shade(pack, -0.12));
      }
      break;
    }
    case 'scarf': {
      const c = mixColor(a.outfit, '#ffffff', 0.55);
      fillRoundRect(g, x - b.w / 2 + 1, b.top - 1, b.w - 2, 5, 2.5, c);
      if (!back) fillRoundRect(g, x + (side ? dir * 2 : 3), b.top + 2, 4, 9, 2, shade(c, -0.08));
      break;
    }
    case 'camera': {
      if (back) break;
      g.strokeStyle = '#3f3b4b';
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x - b.w / 2 + 3, b.top + 1);
      g.lineTo(x, b.armY + 1);
      g.lineTo(x + b.w / 2 - 3, b.top + 1);
      g.stroke();
      const cx = side ? x + dir * 3 : x;
      fillRoundRect(g, cx - 5, b.armY - 2, 10, 7, 2, '#3f3b4b');
      circle(g, cx, b.armY + 1.5, 2.4, '#d9d4cf');
      circle(g, cx, b.armY + 1.5, 1.4, '#5c6f8f');
      break;
    }
    case 'coffeeCup': {
      if (back) break;
      const cx = side ? x + dir * 7 : x + b.w / 2 + 3;
      const cy = b.armY + 3;
      fillRoundRect(g, cx - 3, cy - 4, 6, 8, [1, 1, 2, 2], '#fff7ec');
      fillRoundRect(g, cx - 3.2, cy - 1, 6.4, 3, 1, '#c98a5e');
      fillRoundRect(g, cx - 3.5, cy - 5, 7, 2, 1, '#5f7139');
      break;
    }
    default:
      break;
  }
}

function drawFace(g: Ctx, x: number, hy: number, dir: number, time: number): void {
  const blink = time % 4.2 > 4.05;
  const eye = (ex: number) => ellipse(g, ex, hy + 2.5, 1.6, blink ? 0.4 : 1.9, INK);
  const blush = (bx: number) => ellipse(g, bx, hy + 6, 2.6, 1.5, 'rgba(240, 120, 120, 0.38)');
  if (dir === 0) {
    eye(x - 4);
    eye(x + 4);
    blush(x - 7);
    blush(x + 7);
    g.beginPath();
    g.arc(x, hy + 5.6, 1.8, 0.15 * Math.PI, 0.85 * Math.PI);
    g.strokeStyle = INK;
    g.lineWidth = 1.1;
    g.stroke();
  } else {
    eye(x + dir * 3.5);
    blush(x + dir * 5.5);
  }
}

function drawAccessory(
  g: Ctx,
  x: number,
  hy: number,
  hr: number,
  acc: Accessory,
  a: CharacterAppearance,
  front: boolean,
  back: boolean,
  dir: number,
): void {
  const side = !front && !back;
  switch (acc) {
    case 'freckles': {
      if (back) break;
      const fx = side ? x + dir * 3 : x;
      const dots = side ? [[dir * 5, 5], [dir * 6.5, 4], [dir * 4, 4.2]] : [[-6.5, 5], [-5, 4], [-7.5, 3.8], [6.5, 5], [5, 4], [7.5, 3.8]];
      for (const [dx, dy] of dots) circle(g, fx + dx, hy + dy, 0.55, 'rgba(120, 70, 50, 0.65)');
      break;
    }
    case 'earrings': {
      if (back) break;
      const ears = side ? [x - dir * 4] : [x - hr + 0.5, x + hr - 0.5];
      for (const ex of ears) {
        circle(g, ex, hy + 6.5, 1.5, '#f2c14e');
        circle(g, ex, hy + 9, 1.1, '#f2c14e');
      }
      break;
    }
    case 'hairClip': {
      const cx = x + (side ? -dir * 4 : -6);
      const cy = hy - hr + 4;
      g.fillStyle = '#f2c14e';
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 1.3 : 3;
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      }
      g.closePath();
      g.fill();
      break;
    }
    case 'catEars': {
      const ear = (ex: number, tilt: number) => {
        g.fillStyle = a.hairColor;
        g.beginPath();
        g.moveTo(ex - 4.5, hy - hr + 4);
        g.lineTo(ex + tilt, hy - hr - 7);
        g.lineTo(ex + 4.5, hy - hr + 4);
        g.closePath();
        g.fill();
        if (!back) {
          g.fillStyle = '#f3b3bf';
          g.beginPath();
          g.moveTo(ex - 2.2, hy - hr + 2.5);
          g.lineTo(ex + tilt * 0.6, hy - hr - 3.5);
          g.lineTo(ex + 2.2, hy - hr + 2.5);
          g.closePath();
          g.fill();
        }
      };
      ear(x - 6.5, -1.5);
      ear(x + 6.5, 1.5);
      break;
    }
    case 'flowerCrown': {
      const colors = ['#f3b3bf', '#fff4e2', '#cdb9e6', '#f7d36b'];
      for (let i = 0; i <= 6; i++) {
        const ang = Math.PI * (1.08 + (0.84 * i) / 6);
        const fx = x + Math.cos(ang) * (hr + 0.5);
        const fy = hy - 1 + Math.sin(ang) * (hr + 0.5);
        if (i % 2) ellipse(g, fx, fy, 2.6, 1.4, '#8aa265');
        else {
          for (let k = 0; k < 5; k++) {
            const pa = (k / 5) * Math.PI * 2;
            circle(g, fx + Math.cos(pa) * 1.7, fy + Math.sin(pa) * 1.7, 1.5, colors[(i / 2) % colors.length]);
          }
          circle(g, fx, fy, 1, '#f2c14e');
        }
      }
      break;
    }
    case 'beanie': {
      const c = shade(a.outfit, -0.2);
      g.beginPath();
      g.arc(x, hy - 1, hr + 2.2, Math.PI, 0);
      g.closePath();
      g.fillStyle = c;
      g.fill();
      fillRoundRect(g, x - hr - 2.5, hy - 3.5, hr * 2 + 5, 4.5, 2.2, shade(c, 0.25));
      circle(g, x, hy - hr - 3.5, 3.4, shade(c, 0.45));
      break;
    }
    case 'bow': {
      const bx = x + (side ? -dir * 4 : 6);
      const by = hy - hr + 1;
      g.fillStyle = '#ec7186';
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx - 6, by - 4);
      g.lineTo(bx - 6, by + 4);
      g.closePath();
      g.moveTo(bx, by);
      g.lineTo(bx + 6, by - 4);
      g.lineTo(bx + 6, by + 4);
      g.closePath();
      g.fill();
      circle(g, bx, by, 2, '#d85770');
      break;
    }
    case 'glasses': {
      if (back) break;
      g.strokeStyle = '#3a3340';
      g.lineWidth = 1.2;
      g.beginPath();
      if (front) {
        g.arc(x - 4, hy + 2.5, 3.6, 0, Math.PI * 2);
        g.moveTo(x + 7.6, hy + 2.5);
        g.arc(x + 4, hy + 2.5, 3.6, 0, Math.PI * 2);
        g.moveTo(x - 0.4, hy + 2.2);
        g.lineTo(x + 0.4, hy + 2.2);
      } else {
        const ex = x + dir * 6.5;
        g.arc(ex, hy + 2.5, 3.6, 0, Math.PI * 2);
        g.moveTo(ex - dir * 3.6, hy + 2);
        g.lineTo(x - dir * 4, hy + 1);
      }
      g.stroke();
      break;
    }
    case 'headphones': {
      g.strokeStyle = '#4a4656';
      g.lineWidth = 2.6;
      g.beginPath();
      g.arc(x, hy, hr + 2.6, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
      const cup = (cx: number) => {
        fillRoundRect(g, cx - 3.2, hy - 3, 6.4, 9, 3, '#4a4656');
        fillRoundRect(g, cx - 1.8, hy - 1.5, 3.6, 6, 2, shade(a.outfit, 0.1));
      };
      if (side) cup(x - dir * 2);
      else {
        cup(x - hr - 1.5);
        cup(x + hr + 1.5);
      }
      break;
    }
    case 'wizardHat': {
      const hat = '#4b3f7a';
      const brimY = hy - hr + 3;
      ellipse(g, x, brimY, hr + 8, 3.6, shade(hat, -0.15));
      // Cone with a floppy tip that leans away from the face.
      const lean = side ? -dir * 7 : 6;
      g.fillStyle = hat;
      g.beginPath();
      g.moveTo(x - hr + 1, brimY);
      g.quadraticCurveTo(x - 4, brimY - 18, x + lean, brimY - 30);
      g.quadraticCurveTo(x + 3, brimY - 16, x + hr - 1, brimY);
      g.closePath();
      g.fill();
      fillRoundRect(g, x - hr + 1.5, brimY - 5, hr * 2 - 3, 4, 2, '#f2c14e');
      // Little star
      const sx = x - 2;
      const sy = brimY - 13;
      g.fillStyle = '#ffe28a';
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 1.4 : 3.2;
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        g.lineTo(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r);
      }
      g.closePath();
      g.fill();
      break;
    }
    case 'cap': {
      const c = shade(a.outfit, -0.25);
      g.beginPath();
      g.arc(x, hy - 1, hr + 1.8, Math.PI, 0);
      g.closePath();
      g.fillStyle = c;
      g.fill();
      if (front) ellipse(g, x, hy - 1.5, hr + 1, 3, shade(c, -0.15));
      else if (side) ellipse(g, x + dir * 10, hy - 2, 7, 2.6, shade(c, -0.15));
      circle(g, x, hy - hr - 2.2, 1.6, shade(c, 0.3));
      break;
    }
    case 'flower': {
      const fx = x + (side ? -dir * 5 : -7);
      const fy = hy - hr + 3;
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        circle(g, fx + Math.cos(ang) * 2.6, fy + Math.sin(ang) * 2.6, 2.2, '#fff1f4');
      }
      circle(g, fx, fy, 1.8, '#f3bd45');
      break;
    }
    case 'crown': {
      const top = hy - hr - 1;
      g.fillStyle = '#f2c14e';
      g.beginPath();
      g.moveTo(x - 9, top + 6);
      g.lineTo(x - 9, top - 4);
      g.lineTo(x - 4.5, top + 1);
      g.lineTo(x, top - 7);
      g.lineTo(x + 4.5, top + 1);
      g.lineTo(x + 9, top - 4);
      g.lineTo(x + 9, top + 6);
      g.closePath();
      g.fill();
      circle(g, x, top - 1, 1.6, '#e0685a');
      circle(g, x - 5, top + 3, 1.2, '#6ea2d6');
      circle(g, x + 5, top + 3, 1.2, '#87b48b');
      break;
    }
  }
}
