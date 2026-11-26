import type { ThemeMessageRule, ThemeSetArgs } from 'claude-code'

import * as christmas from './art/christmas'
import * as halloween from './art/halloween'
import * as kids from './art/kids'
import * as lunar from './art/lunar'
import * as starry from './art/starry'
import * as thanksgiving from './art/thanksgiving'
import { makeColors } from './make-colors.js'

export type ThemeId = 'starry' | 'christmas' | 'halloween' | 'lunar' | 'kids' | 'thanksgiving'

/** What one theme's painter wrote: the painting, the small things laid over it, the colour under the paint. */
export type Art = { painting: string; extras: string; alt: string; ground: string }

type Anchors = {
  'surface-0': string
  'surface-1': string
  'surface-2': string
  'surface-3'?: string
  'text-primary': string
  'text-secondary': string
  'text-muted': string
}

type Theme = {
  id: ThemeId
  /** The name a person reads, and the words they may type for it. */
  name: string
  words: readonly string[]
  art: Art
  scheme: 'dark' | 'light'
  roles: { accent: string; danger: string; success: string; warning: string; pro: string }
  anchors: Anchors
  /** How strongly the app's panels are veiled over the painting, 0 to 1. */
  veil: number
}

// Diary for Mom's own tokens: night, cream, gold, wax, leaf, amber, violet.
export const THEMES: readonly Theme[] = [
  {
    id: 'starry',
    name: '星空 · 时间长河',
    words: ['starry', 'star', 'night', 'river', '星空', '时间长河', '长河', '默认'],
    art: starry,
    scheme: 'dark',
    roles: { accent: '#f2bd3a', danger: '#c9353a', success: '#4f9a4a', warning: '#e2951f', pro: '#6c5aa8' },
    anchors: {
      'surface-0': '#060f2b',
      'surface-1': '#0b1838',
      'surface-2': '#101f45',
      'surface-3': '#101f45',
      'text-primary': '#fff5d3',
      'text-secondary': '#d9d0b4',
      'text-muted': '#aaa690',
    },
    veil: 0.72,
  },
  {
    id: 'christmas',
    name: '圣诞 · 河面结冰',
    words: ['christmas', 'xmas', 'winter', '圣诞', '圣诞节', '冬'],
    art: christmas,
    scheme: 'dark',
    roles: { accent: '#7fafd9', danger: '#d0242b', success: '#3f9a5c', warning: '#f2bd3a', pro: '#b8a6e8' },
    anchors: {
      'surface-0': '#07172f',
      'surface-1': '#0c2040',
      'surface-2': '#10274b',
      'surface-3': '#10274b',
      'text-primary': '#f5f9fd',
      'text-secondary': '#cfdcea',
      'text-muted': '#9fb4ca',
    },
    veil: 0.78,
  },
  {
    id: 'halloween',
    name: '万圣 · 南瓜月夜',
    words: ['halloween', 'pumpkin', '万圣', '万圣节', '南瓜'],
    art: halloween,
    scheme: 'dark',
    roles: { accent: '#e8801c', danger: '#d9363a', success: '#9bbf3a', warning: '#f2a93a', pro: '#8a5cc2' },
    anchors: {
      'surface-0': '#120a24',
      'surface-1': '#1a0f33',
      'surface-2': '#20133d',
      'surface-3': '#20133d',
      'text-primary': '#f6ead8',
      'text-secondary': '#d3c4d8',
      'text-muted': '#a898b8',
    },
    veil: 0.72,
  },
  {
    id: 'lunar',
    name: '农历新年 · 灯河',
    words: ['lunar', 'newyear', 'new-year', 'spring', 'cny', '农历', '农历新年', '春节', '新年', '过年'],
    art: lunar,
    scheme: 'dark',
    roles: { accent: '#f2bd3a', danger: '#e0452a', success: '#6aa84f', warning: '#e2951f', pro: '#c96a8a' },
    anchors: {
      'surface-0': '#1c0408',
      'surface-1': '#28070b',
      'surface-2': '#32090f',
      'surface-3': '#32090f',
      'text-primary': '#fff0d0',
      'text-secondary': '#e6cfa8',
      'text-muted': '#b89a7a',
    },
    veil: 0.74,
  },
  {
    id: 'kids',
    name: '儿童 · 向日葵白天',
    words: ['kids', 'kid', 'children', 'child', 'day', 'sunflower', '儿童', '儿童节', '六一', '向日葵', '白天'],
    art: kids,
    scheme: 'light',
    roles: { accent: '#1e62ae', danger: '#c9353a', success: '#2f8a4a', warning: '#b8740f', pro: '#7a4fb0' },
    anchors: {
      'surface-0': '#e3f1ec',
      'surface-1': '#edf7f2',
      'surface-2': '#f7fcf8',
      'text-primary': '#1c2a4a',
      'text-secondary': '#3a4a66',
      'text-muted': '#56657e',
    },
    veil: 0.8,
  },
  {
    id: 'thanksgiving',
    name: '感恩节 · 麦田黄昏',
    words: ['thanksgiving', 'harvest', 'autumn', 'wheat', '感恩节', '感恩', '麦田', '秋'],
    art: thanksgiving,
    scheme: 'dark',
    roles: { accent: '#e8862a', danger: '#c9353a', success: '#7a9c3a', warning: '#e2b23c', pro: '#a86a9a' },
    anchors: {
      'surface-0': '#1f1208',
      'surface-1': '#2a190c',
      'surface-2': '#32200f',
      'surface-3': '#32200f',
      'text-primary': '#fbeccb',
      'text-secondary': '#dcc7a0',
      'text-muted': '#b09a78',
    },
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
  const { theme: colors, problems } = makeColors({
    label: `Impasto: ${theme.id}`,
    roles: theme.roles,
    only: theme.scheme,
    [theme.scheme]: { gray: { anchors: theme.anchors } },
  })
  const look: ThemeSetArgs = {
    colors,
    overrideColorScheme: theme.scheme,
    // No blur: a blurred painting loses its brushwork. The panels are veiled instead.
    backdrop: { scene: theme.id, glass: { blur: 0, tint: theme.anchors['surface-0'], opacity: theme.veil } },
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

  return { look, unpainted: problems.find(line => line.startsWith("Desktop won't paint")) }
}
