import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import { CLICK_WINDOW_MS, PLAY_MS } from './art/overlay'
import { seasonal } from './calendar'
import { nearHalo, tap } from './clicks'
import { sceneSource } from './scene'
import type { Showing } from './scene'
import { lookOf, themeNamed, themeOf, THEMES } from './themes'
import type { ThemeId } from './themes'

const NAME = 'impasto'
/** What the person chose, kept across sessions: a theme, the calendar, or no skin. */
const CHOICE = 'choice'
type Choice = ThemeId | 'auto' | 'off'

/**
 * The prank's document stands a while longer than the prank, then the resting one returns.
 * The app can take a second or more to start playing a document, and the prank ends in the
 * resting picture anyway, so standing longer costs nothing and cutting it short would show.
 */
const SETTLE_MS = 2500

const prank = atom(
  { plugin: 'impasto', key: 'prank' } as const,
  { plays: 0, at: 0, lit: 0, litAt: 0 },
  { shape: 'prank-2' },
)

let clicks: readonly number[] = []
/** The clicks on the bare painting the app has reported since the mod loaded, for /impasto debug. */
let reported = 0
let recent: readonly { x: number; y: number; isOnHalo: boolean }[] = []

async function chosen($: EngineInterface): Promise<Choice> {
  const stored = await $.store.get(CHOICE)

  if (stored === 'auto' || stored === 'off') {
    return stored
  }

  return typeof stored === 'string' && themeOf(stored) !== undefined ? (stored as ThemeId) : 'starry'
}

/** Sets the session's look to what `choice` names. Returns the theme now showing, if any. */
async function show($: EngineInterface, choice: Choice): Promise<ThemeId | undefined> {
  if (choice === 'off') {
    return undefined
  }
  const id = choice === 'auto' ? seasonal(await $.clock.now(), -new Date().getTimezoneOffset()) : choice
  const theme = themeOf(id)

  if (theme === undefined) {
    return undefined
  }
  const { look, unpainted } = lookOf(theme, true)

  if (unpainted !== undefined) {
    $.ui.log(unpainted)
  }
  try {
    const set = await $.theme.set(look)

    if (!set.isDrawn) {
      $.ui.log(`impasto: ${set.reason}`)
    }
  } catch (error) {
    // A build that does not take message styling: the same look without it.
    $.ui.log(String(error))
    await $.theme.set(lookOf(theme, false).look)
  }

  return id
}

/** Starts the prank, unless it is already playing. */
async function summon($: EngineInterface): Promise<boolean> {
  const now = await $.clock.now()
  const last = await read($, prank)

  if (last.at > 0 && now - last.at < PLAY_MS + SETTLE_MS) {
    return false
  }
  clicks = []
  await update($, prank, () => ({ plays: last.plays + 1, at: now, lit: 0, litAt: 0 }))
  // Back to the resting scene once it is over, unless another play began meanwhile.
  $.clock.after(PLAY_MS + SETTLE_MS, () => {
    void update($, prank, value => (value.at === now ? { ...value, at: 0 } : value))
  })

  return true
}

/** What the backdrop should show at `now`. */
function showingAt(state: { at: number; lit: number; litAt: number }, now: number): Showing {
  if (state.at > 0 && now - state.at < PLAY_MS + SETTLE_MS) {
    return 'prank'
  }

  return state.litAt > 0 && now - state.litAt < CLICK_WINDOW_MS ? (state.lit === 1 ? 1 : state.lit >= 2 ? 2 : 0) : 0
}

const HELP = [
  '油画皮肤 · /impasto <主题>',
  ...THEMES.map(theme => `  ${theme.id.padEnd(13)}${theme.name}`),
  '  auto         跟着日历走：节日当季换节日主题，平时是星空',
  '  devil        召唤恶魔 Claude（也可以在天使的光环上点三下：一下一下点，每下隔半秒左右）',
  '  debug        看看应用把哪些背景点击转给了皮肤',
  '  off          关掉皮肤，回到应用自己的样子',
].join('\n')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'impasto',
      description: 'Oil-painted skin: pick a theme (starry, christmas, halloween, lunar, kids, thanksgiving, auto)',
      argumentHint: '[theme | auto | devil | off]',
    })
    await show($, await chosen($))

    return next(e)
  })

  on('command.run', { command: 'impasto' }, async ($, e) => {
    const word = e.args.trim().toLowerCase()

    if (word === '' || word === 'help' || word === '帮助') {
      return { text: HELP, isTextDisplayOnly: true }
    }
    if (word === 'devil' || word === '恶魔' || word === '彩蛋') {
      const isPlaying = await summon($)

      return { text: isPlaying ? '😈 来了。' : '😈 已经在路上了。', isTextDisplayOnly: true }
    }
    if (word === 'debug' || word === '诊断') {
      const lines = recent.map(
        click => `  (${click.x.toFixed(2)}, ${click.y.toFixed(2)})  ${click.isOnHalo ? '在光环那一带' : '不在光环上'}`,
      )

      return {
        text: [
          `应用一共把 ${reported} 次背景点击转给了皮肤（从皮肤上次加载算起）。`,
          ...(lines.length > 0 ? ['最近几次，横向和纵向各从 0 到 1：', ...lines] : []),
          '应用每半秒最多转一次点击，而且只转点在空白背景上的（点在消息、输入框、侧栏上的不算）。',
          '所以光环要一下一下点：点一下光环亮一点，第三下恶魔就来。',
        ].join('\n'),
        isTextDisplayOnly: true,
      }
    }
    if (word === 'off' || word === '关' || word === '关闭') {
      await $.store.set(CHOICE, 'off')
      await $.theme.clear()

      return { text: '皮肤已关闭。/impasto starry 可以再打开。', isTextDisplayOnly: true }
    }
    const choice: Choice | undefined =
      word === 'auto' || word === '自动' || word === '日历' ? 'auto' : themeNamed(word)?.id

    if (choice === undefined) {
      return { text: `没有叫「${e.args.trim()}」的主题。\n${HELP}`, isTextDisplayOnly: true }
    }
    await $.store.set(CHOICE, choice)
    const showing = await show($, choice)
    const name = showing === undefined ? '' : (themeOf(showing)?.name ?? showing)

    return {
      text: choice === 'auto' ? `跟着日历走，今天是：${name}` : `已换成：${name}`,
      isTextDisplayOnly: true,
    }
  })

  // Three clicks on the halo bring the devil down. The app passes on a click only where
  // the bare backdrop shows, and at most one each half second, so three quick clicks arrive
  // as one. Each counted click lights the halo for a few seconds, so a person sees it was
  // heard and clicks again; a count left alone goes out with the glow.
  on('ui.pointer', async ($, e, next) => {
    const isOnHalo = nearHalo(e.x, e.y)
    const now = await $.clock.now()

    reported += 1
    recent = [...recent.slice(-5), { x: e.x, y: e.y, isOnHalo }]
    if (isOnHalo && showingAt(await read($, prank), now) !== 'prank') {
      const counted = tap(clicks, now, CLICK_WINDOW_MS)

      clicks = counted.history
      if (counted.isTriple) {
        await summon($)
      } else {
        await update($, prank, value => ({ ...value, lit: clicks.length, litAt: now }))
        $.clock.after(CLICK_WINDOW_MS, () => {
          void update($, prank, value => (value.litAt === now ? { ...value, lit: 0, litAt: 0 } : value))
        })
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.props.plugin !== NAME || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const theme = themeOf(e.props.scene)

    if (theme === undefined) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const showing = showingAt(await read($, prank), await $.clock.now())

    return <Svg source={sceneSource(theme.art, showing)} alt={theme.art.alt} isInteractive />
  })
}
