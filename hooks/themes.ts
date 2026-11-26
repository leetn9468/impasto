import type { ThemeMessageRule, ThemeSetArgs } from 'claude-code'

import * as christmas from './art/christmas'
import { COLORS } from './art/colors'
import * as halloween from './art/halloween'
import * as kids from './art/kids'
import * as lunar from './art/lunar'
import * as starry from './art/starry'
import * as thanksgiving from './art/thanksgiving'

export type ThemeId = 'starry' | 'christmas' | 'halloween' | 'lunar' | 'kids' | 'thanksgiving'

/** What one theme's painter wrote: the painting, the small things laid over it, the colour under the paint. */
export type Art = { painting: string; extras: string; alt: string; ground: string }

type Theme = {
  id: ThemeId
  /** The name a person reads, and the words they may type for it. */
  name: string
  words: readonly string[]
  art: Art
  /** How strongly the app's panels are veiled over the painting, 0 to 1. */
  veil: number
}

// Each theme's interface colours are mixed from its painting's own, when the mod is built
// (scripts/make_colors.mjs), and kept in ./art/colors.
export const THEMES: readonly Theme[] = [
  {
    id: 'starry',
    name: '星空 · 时间长河',
    words: ['starry', 'star', 'night', 'river', '星空', '时间长河', '长河', '默认'],
    art: starry,
    veil: 0.72,
  },
  {
    id: 'christmas',
    name: '圣诞 · 河面结冰',
    words: ['christmas', 'xmas', 'winter', '圣诞', '圣诞节', '冬'],
    art: christmas,
    veil: 0.78,
  },
  {
    id: 'halloween',
    name: '万圣 · 南瓜月夜',
    words: ['halloween', 'pumpkin', '万圣', '万圣节', '南瓜'],
    art: halloween,
    veil: 0.72,
  },
  {
    id: 'lunar',
    name: '农历新年 · 灯河',
    words: ['lunar', 'newyear', 'new-year', 'spring', 'cny', '农历', '农历新年', '春节', '新年', '过年'],
    art: lunar,
    veil: 0.74,
  },
  {
    id: 'kids',
    name: '儿童 · 向日葵白天',
    words: ['kids', 'kid', 'children', 'child', 'day', 'sunflower', '儿童', '儿童节', '六一', '向日葵', '白天'],
    art: kids,
    veil: 0.8,
  },
  {
    id: 'thanksgiving',
    name: '感恩节 · 麦田黄昏',
    words: ['thanksgiving', 'harvest', 'autumn', 'wheat', '感恩节', '感恩', '麦田', '秋'],
    art: thanksgiving,
    veil: 0.76,
  },
]

export function themeOf(id: string): Theme | undefined {
  return THEMES.find(theme => theme.id === id)
}

/** The theme a typed word names, in English or Chinese; undefined for a word that names none. */
export function themeNamed(word: string): Theme | undefined {
  const typed = word.trim().toLowerCase()

  return THEMES.find(theme => theme.id === typed || theme.words.includes(typed))
}

// A person's own message is a slip of letter paper, as every written thing is in
// Diary for Mom: warm paper, brown ink, a slight tilt, never a chat bubble.
const slip: ThemeMessageRule = {
  color: '#2a1c12',
  backgroundColor: '#f4e7c8',
  radius: 3,
  paddingX: 14,
  paddingY: 10,
  shadow: { x: 1, y: 4, blur: 10, color: '#00000066' },
}

/**
 * The whole look of one theme, as `$.theme.set` takes it. `withStyle` false leaves the
 * message styling out, for a build that does not take it.
 */
export function lookOf(theme: Theme, withStyle: boolean): { look: ThemeSetArgs; unpainted: string | undefined } {
  const mixed = COLORS[theme.id]

  if (mixed === undefined) {
    throw new Error(`impasto: no colours were mixed for ${theme.id}`)
  }
  const look: ThemeSetArgs = {
    colors: mixed.colors,
    overrideColorScheme: mixed.scheme,
    // No blur: a blurred painting loses its brushwork. The panels are veiled instead.
    backdrop: { scene: theme.id, glass: { blur: 0, tint: mixed.tint, opacity: theme.veil } },
  }

  if (withStyle) {
    look.style = {
      Heading: { fontFamily: ['serif'] },
      UserMessage: [
        { ...slip, rotate: -0.6 },
        { ...slip, rotate: 0.5 },
        { ...slip, rotate: -0.3 },
      ],
    }
  }

  return { look, unpainted: mixed.unpainted }
}
