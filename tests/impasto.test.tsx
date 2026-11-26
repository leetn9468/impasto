import { expect, mock, test } from 'claude-code/testing'

import { PLAY_MS, SUBJECT } from '../hooks/art/overlay'
import { seasonal } from '../hooks/calendar'
import { nearHalo, tap } from '../hooks/clicks'
import { sceneSource, SHEET } from '../hooks/scene'
import { THEMES } from '../hooks/themes'

const LIMIT = 131_072

function backdrop(scene: string) {
  return {
    plugin: 'impasto',
    component: 'Backdrop',
    requestId: 'backdrop',
    props: { scene, plugin: 'impasto', glass: { blur: 0, opacity: 0.7 } },
  } as const
}

const typed = { origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 100 } } as const

test('every theme draws one still vector scene that fits, on both surfaces that draw one', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  for (const theme of THEMES) {
    for (const surface of ['desktop', 'mobile'] as const) {
      const ui = await $.ui.mount({ ...backdrop(theme.id), surface })
      const svg = await ui.find({ type: 'Svg' })
      const source = String(svg?.props.source)

      expect(source.startsWith('<svg')).toBe(true)
      expect(source.length <= LIMIT).toBe(true)
      // at rest nothing moves, so the app has nothing to play
      expect(/animation|transition|@keyframes|<animate|<set\b/.test(source)).toBe(false)
      // pure vector: nothing the engine would refuse, nothing the app's player has no room for
      expect(/<image|feImage|foreignObject|data:|@import|@font-face|href|Lighting/.test(source)).toBe(false)
      await ui.unmount()
    }
  }
})

test('the devil comes when called, and the angel is back when the prank is over', async ($, on) => {
  const clock = mock.clock(on, { now: 1_000_000 })
  const sourceOf = async (scene: string) => {
    const ui = await $.ui.mount({ ...backdrop(scene), surface: 'desktop' })
    const source = String((await ui.find({ type: 'Svg' }))?.props.source)
    await ui.unmount()

    return source
  }

  for (const theme of THEMES) {
    const atRest = await sourceOf(theme.id)
    expect(atRest.includes('@keyframes')).toBe(false)

    await $.command.run({ command: 'impasto', args: 'devil', ...typed })
    const during = await sourceOf(theme.id)
    expect(during.includes('@keyframes devil')).toBe(true)
    expect(during.length <= LIMIT).toBe(true)
    // what the app's player has no room for: lighting filters, SMIL, anything from outside
    expect(/<image|feImage|foreignObject|data:|@import|@font-face|href|Lighting|<animate|<set\b/.test(during)).toBe(false)

    // calling again while it plays starts nothing new
    await clock.advance(1000)
    await $.command.run({ command: 'impasto', args: '恶魔', ...typed })
    expect(await sourceOf(theme.id)).toBe(during)

    await clock.advance(PLAY_MS + 3000)
    expect(await sourceOf(theme.id)).toBe(atRest)
  }
})

test('every document is one picture, and only its sheet says what moves', async () => {
  // The app strips the animation from a backdrop and draws what is left in a frame. A
  // document that leaves another picture makes it rebuild the frame, and the window goes
  // blank meanwhile. So the documents must differ in their sheets alone...
  const bare = (source: string) => source.replace(/<style>[^<]*<\/style>/, '<style></style>')
  for (const theme of THEMES) {
    const atRest = sceneSource(theme.art, 0)
    for (const showing of [1, 2, 'prank'] as const) {
      const source = sceneSource(theme.art, showing)
      expect(source === atRest).toBe(false)
      expect(bare(source)).toBe(bare(atRest))
    }
  }
  // ...and the sheets in their animation alone: with it taken out, each is the resting one.
  const still = (sheet: string) =>
    sheet
      .replace(/@keyframes [\w-]+\{(?:[^{}]*\{[^{}]*\})*\}/g, '')
      .replace(/animation[\w-]*:[^;}]*;?/g, '')
      .replace(/;\}/g, '}')
  expect(/animation|transition|@keyframes/.test(SHEET.rest)).toBe(false)
  for (const sheet of [...SHEET.lit, SHEET.prank]) {
    expect(sheet.includes('@keyframes')).toBe(true)
    expect(still(sheet)).toBe(SHEET.rest)
  }
  // Whatever only a sheet brings to life is out of sight in the plain markup.
  expect(SUBJECT.includes('<g class="a devil" transform="translate(-30 -430)')).toBe(true)
  for (const part of ['spark', 'burp', 'pow', 'g1', 'g2']) {
    expect(new RegExp(`class="a ${part}[^"]*" opacity="0"`).test(SUBJECT)).toBe(true)
  }
  expect(SUBJECT.includes('stroke-dasharray="100 100" stroke-dashoffset="100"')).toBe(true)
})

test('three clicks in a row are the cue, and a late one starts the count over', async () => {
  let history: readonly number[] = []
  const click = (now: number) => {
    // the test's own window; the mod's is CLICK_WINDOW_MS
    const counted = tap(history, now, 1200)
    history = counted.history

    return counted.isTriple
  }

  expect([click(0), click(300), click(600)]).toEqual([false, false, true])
  expect(click(700)).toBe(false) // the count starts over
  expect([click(5000), click(7000), click(9000)]).toEqual([false, false, false])
  expect([click(9400), click(9800)]).toEqual([false, true])
  // each click waits for the next: a second apart is still in a row
  expect([click(20000), click(21000), click(22000)]).toEqual([false, false, true])
})

test('a reported click counts only at the halo, whatever the shape of the window', async () => {
  // the halo sits 92 units from the right edge and 226 down, in a picture 400 units tall
  const at = (aspect: number) => [1 - 92 / (400 * aspect), 226 / 400] as const

  for (const aspect of [1.0, 1.6, 2.4]) {
    const [x, y] = at(aspect)
    expect(nearHalo(x, y)).toBe(true)
    expect(nearHalo(x, y + 0.12)).toBe(false) // on his body
    expect(nearHalo(x, y - 0.12)).toBe(false) // above him
  }
  expect(nearHalo(0.3, 226 / 400)).toBe(false) // the middle of the window
  expect(nearHalo(0.5, 0.5)).toBe(false)
})

test('the command switches the theme and remembers it', async ($, on) => {
  mock.clock(on, { now: 1_000_000 })
  mock.store(on)
  const scenes: string[] = []
  on('command.register', () => ({ value: { command: 'impasto' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('theme.set', (_, e) => {
    const scene = e.backdrop !== undefined && 'scene' in e.backdrop ? e.backdrop.scene : undefined
    scenes.push(String(scene))

    return { value: { isDrawn: true, requestId: 'backdrop' } }
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(scenes).toEqual(['starry'])

  const answer = await $.command.run({ command: 'impasto', args: '圣诞', ...typed })
  expect(scenes).toEqual(['starry', 'christmas'])
  expect(answer.text?.includes('圣诞')).toBe(true)

  const unknown = await $.command.run({ command: 'impasto', args: 'disco', ...typed })
  expect(scenes.length).toBe(2)
  expect(unknown.text?.includes('disco')).toBe(true)

  // a later session opens on what was chosen
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(scenes).toEqual(['starry', 'christmas', 'christmas'])
})

test('the calendar picks each holiday in its season and the starry night otherwise', async () => {
  const at = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d, 12)

  expect(seasonal(at(2026, 11, 26))).toBe('thanksgiving') // the fourth Thursday of November 2026
  expect(seasonal(at(2026, 11, 20))).toBe('starry')
  expect(seasonal(at(2026, 12, 24))).toBe('christmas')
  expect(seasonal(at(2026, 12, 28))).toBe('starry')
  expect(seasonal(at(2026, 10, 31))).toBe('halloween')
  expect(seasonal(at(2027, 2, 6))).toBe('lunar')
  expect(seasonal(at(2027, 2, 20))).toBe('lunar') // the Lantern Festival
  expect(seasonal(at(2027, 2, 22))).toBe('starry')
  expect(seasonal(at(2027, 6, 1))).toBe('kids')
  expect(seasonal(at(2027, 8, 15))).toBe('starry')
})
