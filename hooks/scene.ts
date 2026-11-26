import { DEFS, FRAMES, RULES, SUBJECT, SUBJECT_BOX } from './art/overlay'
import type { Frames } from './art/overlay'
import type { Art } from './themes'

/**
 * A style sheet as text: its rules, then each animation's steps written out as keyframes.
 * The art keeps the steps as plain pairs and the keyframes are written here, so a reader
 * of the art sees what happens when, a line to a step.
 */
function sheet(rules: string, frames: Frames): string {
  const keyframes = Object.entries(frames).map(
    ([name, steps]) => '@keyframes ' + name + '{' + steps.map(([at, says]) => at + '%{' + says + '}').join('') + '}',
  )

  return rules + keyframes.join('')
}

/** What moves: nothing at rest, the halo after one click and after two, the whole prank. */
export const SHEET = {
  rest: sheet(RULES.rest, FRAMES.rest),
  lit: RULES.lit.map((rules, count) => sheet(rules, FRAMES.lit[count] ?? {})),
  prank: sheet(RULES.prank, FRAMES.prank),
}

/** What the backdrop shows: Claude at rest, his halo lit by 1 or 2 counted clicks, or the prank. */
export type Showing = 0 | 1 | 2 | 'prank'

/**
 * One backdrop document for a theme.
 *
 * Two pictures share it. The painting fills the window and is cropped to it, so any shape
 * of window is covered. Claude is pinned to the right edge at full height in a picture of
 * his own, so a narrow window still shows him.
 *
 * Every document is the same picture with another style sheet, and that is the point.
 * The desktop app holds a mod's backdrop still: it strips every animation, writes the
 * markup back out and draws that in a frame. Handed a document whose stilled form differs
 * from the one showing, it builds a new frame and the window goes blank until the whole
 * painting has been drawn again. Handed one whose stilled form is the same, it leaves the
 * frame alone, and plays the document, if it moves, as an image over it. So the halo's
 * glow and the whole of the prank's cast are in every document, out of sight in their
 * plain markup, and only the sheet says what moves: nothing, the glow, or the prank.
 *
 * scripts/overlay.py composes the same documents, and scripts/check_app.mjs puts those
 * through the app's own steps.
 */
export function sceneSource(art: Art, showing: Showing): string {
  const moving = showing === 'prank' ? SHEET.prank : showing === 0 ? SHEET.rest : (SHEET.lit[showing - 1] ?? SHEET.rest)

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">',
    `<style>${moving}</style>`,
    `<defs>${DEFS}</defs>`,
    `<rect width="100%" height="100%" fill="${art.ground}"/>`,
    '<svg width="100%" height="100%" viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice">',
    art.painting,
    art.extras,
    '</svg>',
    `<svg width="100%" height="100%" viewBox="${SUBJECT_BOX}" preserveAspectRatio="xMaxYMid meet" overflow="visible">`,
    SUBJECT,
    '</svg></svg>',
  ].join('')
}
