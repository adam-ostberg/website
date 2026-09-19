/** Tiny keyframe helpers. A station's whole choreography is a set of these tables. */
export type Ease = (x: number) => number;
/** `ease`, when given, shapes the segment that ends at this key. */
export type Key = [time: number, value: number, ease?: Ease];

/** Length of every station's loop, in seconds. */
export const PERIOD = 12;

export const smooth = (x: number) => x * x * (3 - 2 * x);
export const linear = (x: number) => x;
export const easeIn = (x: number) => x * x;
export const easeOut = (x: number) => 1 - (1 - x) * (1 - x);

/**
 * Value at time t; holds the first/last value outside the range. Segments without an
 * explicit ease use a monotone cubic: motion comes to rest at holds and turning points,
 * flows through keys it is only passing, and never overshoots.
 */
export function kf(t: number, keys: Key[]): number {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 1;
  while (t > keys[i][0]) i++;
  const [t0, v0] = keys[i - 1];
  const [t1, v1, ease] = keys[i];
  const h = t1 - t0;
  const f = (t - t0) / h;
  if (ease) return v0 + (v1 - v0) * ease(f);
  const m0 = slope(keys, i - 1);
  const m1 = slope(keys, i);
  const f2 = f * f;
  const f3 = f2 * f;
  return (2 * f3 - 3 * f2 + 1) * v0 + (f3 - 2 * f2 + f) * h * m0 + (3 * f2 - 2 * f3) * v1 + (f3 - f2) * h * m1;
}

/** Tangent at key i: zero at the ends, holds and turning points, else the PCHIP weighted harmonic mean. */
function slope(keys: Key[], i: number): number {
  if (i === 0 || i === keys.length - 1) return 0;
  const [ta, va] = keys[i - 1];
  const [tb, vb] = keys[i];
  const [tc, vc] = keys[i + 1];
  const ha = tb - ta;
  const hb = tc - tb;
  if (ha <= 0 || hb <= 0) return 0;
  const da = (vb - va) / ha;
  const db = (vc - vb) / hb;
  if (da * db <= 0) return 0;
  return (3 * (ha + hb)) / ((2 * hb + ha) / da + (hb + 2 * ha) / db);
}

/** 0 before a, 1 after b, smoothstep in between. */
export const span = (t: number, a: number, b: number) => smooth(Math.min(Math.max((t - a) / (b - a), 0), 1));

export const between = (t: number, a: number, b: number) => t >= a && t < b;

/** Square-wave blink, `hz` times per second. Keep `hz * PERIOD` whole so the loop wraps cleanly. */
export const blink = (t: number, hz = 3) => Math.floor(t * hz * 2) % 2 === 0;

/** Gentle hover bob: a whole number of cycles per loop, so it doesn't jump when the loop wraps. */
export const hover = (t: number) => Math.sin((t / PERIOD) * Math.PI * 2 * 5) * 0.03;

/** Scroll-driven boost shared by every station: 0 at rest, up to ~2.5 while scrolling fast. */
export const motion = { boost: 0 };
