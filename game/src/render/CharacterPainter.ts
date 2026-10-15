import type { CharacterAppearance } from '../content/types';
import { circle, ellipse, fillRoundRect, shade, shadow, type Ctx } from './draw';

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

  // Body
  fillRoundRect(g, x - bw / 2, bodyTop, bw, bh, [bw / 2.2, bw / 2.2, 7, 7], a.outfit);
  fillRoundRect(g, x - bw / 2 + 4, bodyTop + 2, bw - 8, 3.5, 2, shade(a.outfit, 0.28));
  if (side) ellipse(g, x + dir * 1, armY + 1, 3.5, 5.5, arm);

  // Head + hair
  const hair = a.hairColor;
  if (a.hair === 'bob' && !back) fillRoundRect(g, x - hr - 2.5, hy - 3, hr * 2 + 5, hr + 9, 7, hair);
  circle(g, x, hy - 0.5, hr + 1.5, hair);
  if (a.hair === 'bun') circle(g, x, hy - hr - 2.5, 5.5, hair);
  if (back && a.hair === 'long') fillRoundRect(g, x - hr - 1, hy, hr * 2 + 2, hr + 14, 9, hair);
  if (back && a.hair === 'bob') fillRoundRect(g, x - hr - 2.5, hy - 3, hr * 2 + 5, hr + 9, 7, hair);

  if (!back) {
    const fx = side ? x + dir * 3 : x;
    ellipse(g, fx, hy + 3, side ? hr - 3 : hr - 1.5, hr - 3.5, a.skin);
    drawFace(g, fx, hy, side ? dir : 0, pose.time);
  }

  drawAccessory(g, x, hy, hr, a, front, back, dir);
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

function drawAccessory(g: Ctx, x: number, hy: number, hr: number, a: CharacterAppearance, front: boolean, back: boolean, dir: number): void {
  const side = !front && !back;
  switch (a.accessory) {
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
    case 'none':
      break;
  }
}
