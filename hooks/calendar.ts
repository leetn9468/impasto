import type { ThemeId } from './themes'

const DAY = 86_400_000

// The first day of each lunar new year. The lunar calendar has no short formula, so the
// dates are listed; past the table the new year theme is simply not chosen by itself.
const LUNAR_NEW_YEAR: Readonly<Record<number, readonly [number, number]>> = {
  2026: [2, 17],
  2027: [2, 6],
  2028: [1, 26],
  2029: [2, 13],
  2030: [2, 3],
  2031: [1, 23],
  2032: [2, 11],
  2033: [1, 31],
  2034: [2, 19],
  2035: [2, 8],
  2036: [1, 28],
  2037: [2, 15],
  2038: [2, 4],
  2039: [1, 24],
  2040: [2, 12],
}

function utc(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day)
}

/** The fourth Thursday of November. */
function thanksgiving(year: number): number {
  const first = new Date(utc(year, 11, 1)).getUTCDay()
  const firstThursday = 1 + ((4 - first + 7) % 7)

  return utc(year, 11, firstThursday + 21)
}

/**
 * The theme the calendar asks for at `now` (milliseconds since the epoch): a holiday's
 * theme through its season, the starry night the rest of the year.
 *
 * Days are counted in the session's own time zone when `offsetMinutes` gives it, else UTC,
 * so a season can start or end a few hours off at its edges.
 */
export function seasonal(now: number, offsetMinutes = 0): ThemeId {
  const local = now + offsetMinutes * 60_000
  const year = new Date(local).getUTCFullYear()
  const within = (from: number, to: number) => local >= from && local < to + DAY

  const newYear = LUNAR_NEW_YEAR[year]
  if (newYear !== undefined) {
    const first = utc(year, newYear[0], newYear[1])
    // from three days before to the Lantern Festival, the fifteenth day
    if (within(first - 3 * DAY, first + 14 * DAY)) {
      return 'lunar'
    }
  }
  // International Children's Day, and the weekend round it
  if (within(utc(year, 5, 30), utc(year, 6, 2))) {
    return 'kids'
  }
  if (within(utc(year, 10, 24), utc(year, 10, 31))) {
    return 'halloween'
  }
  const turkey = thanksgiving(year)
  if (within(turkey - 3 * DAY, turkey + DAY)) {
    return 'thanksgiving'
  }
  if (within(utc(year, 12, 1), utc(year, 12, 26))) {
    return 'christmas'
  }

  return 'starry'
}
