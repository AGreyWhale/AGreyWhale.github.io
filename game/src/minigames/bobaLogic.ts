import type { BobaOption } from '../content/boba';

/** The drink being assembled. */
export interface Drink {
  base: string | null;
  flavor: string | null;
  toppings: string[];
}

export interface Order {
  id: number;
  customer: string;
  base: string;
  flavor: string;
  toppings: string[];
  /** Seconds left before the customer gives up. */
  patience: number;
  maxPatience: number;
}

export interface Menu {
  bases: BobaOption[];
  flavors: BobaOption[];
  toppings: BobaOption[];
}

const pick = <T>(list: readonly T[], rand: () => number): T => list[Math.floor(rand() * list.length) % list.length];

/** A random order with 0..maxToppings unique toppings (kept in menu order). */
export function makeOrder(menu: Menu, rand: () => number, id: number, customer: string, patience: number, maxToppings: number): Order {
  const count = Math.floor(rand() * (maxToppings + 1));
  const pool = menu.toppings.map((t) => t.id);
  const chosen = new Set<string>();
  while (chosen.size < Math.min(count, pool.length)) chosen.add(pick(pool, rand));
  return {
    id,
    customer,
    base: pick(menu.bases, rand).id,
    flavor: pick(menu.flavors, rand).id,
    toppings: pool.filter((t) => chosen.has(t)),
    patience,
    maxPatience: patience,
  };
}

/** True when the drink is exactly what was ordered (topping order doesn't matter). */
export function matches(drink: Drink, order: Order): boolean {
  if (drink.base !== order.base || drink.flavor !== order.flavor) return false;
  if (drink.toppings.length !== order.toppings.length) return false;
  return order.toppings.every((t) => drink.toppings.includes(t));
}

/** Points for a served order: 100 plus a tip of up to 50 for speed. */
export function serveScore(order: Order): number {
  const frac = Math.max(0, Math.min(1, order.patience / order.maxPatience));
  return 100 + Math.round(50 * frac);
}

/** Customer patience shrinks linearly over the round. */
export function patienceAt(elapsedFraction: number, start: number, end: number): number {
  const t = Math.max(0, Math.min(1, elapsedFraction));
  return start + (end - start) * t;
}

/** "Milk tea · Taro · Pearls + Pudding" */
export function describe(d: { base: string | null; flavor: string | null; toppings: string[] }, menu: Menu): string {
  const label = (list: BobaOption[], id: string | null) => list.find((o) => o.id === id)?.label;
  const parts = [label(menu.bases, d.base), label(menu.flavors, d.flavor)].filter(Boolean) as string[];
  const tops = d.toppings.map((t) => label(menu.toppings, t)).filter(Boolean);
  parts.push(tops.length ? tops.join(' + ') : 'no toppings');
  return parts.join(' · ');
}
