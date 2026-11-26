import { HALO } from './art/overlay'

/**
 * Counts clicks on the halo: each click waits `windowMs` for the next one, and the third
 * in a row is the cue. The count starts over once it has been reached, or when a click
 * comes too late.
 */
export function tap(
  history: readonly number[],
  now: number,
  windowMs: number,
): { history: number[]; isTriple: boolean } {
  const last = history[history.length - 1]
  const chain = last !== undefined && now - last < windowMs ? [...history, now] : [now]

  return chain.length >= 3 ? { history: [], isTriple: true } : { history: chain, isTriple: false }
}

/**
 * Whether a click the app reports, at `x` and `y` from 0 to 1 across the window, may have
 * landed on the angel's halo.
 *
 * Claude is pinned to the window's right edge at its full height, so the halo's height in
 * the window is fixed, but how far it sits from the right edge depends on the window's
 * shape, which a click does not say. Any shape from nearly square to very wide is taken, so
 * this is a band at the halo's height, not the halo's exact outline, with some slack for a
 * hand that is not exact either.
 */
export function nearHalo(x: number, y: number): boolean {
  const slack = 10
  if (Math.abs(y * 400 - HALO.y) > HALO.ry + slack) {
    return false
  }
  const fromRight = 1 - x
  if (fromRight <= 0) {
    return false
  }
  // 640 - HALO.x is the halo's distance from the right edge in the painting's own units,
  // 400 of which make the window's height: so the window is this many heights wide.
  const narrowest = (640 - HALO.x - HALO.rx - slack) / (400 * fromRight)
  const widest = (640 - HALO.x + HALO.rx + slack) / (400 * fromRight)

  return widest >= 0.9 && narrowest <= 3.2
}
