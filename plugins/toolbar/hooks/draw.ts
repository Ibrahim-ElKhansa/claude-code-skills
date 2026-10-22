// The Pixel Agents characters (see LICENSE-pixel-agents.txt) as head icons: the same sprite for the same chat, the same
// outfit for the same permission mode.
import { CHARACTERS } from './sprites'
import type { Picture } from './sprites'

const SESSION_COLORS = ['#f2c94c', '#56ccf2', '#6fcf97', '#eb5757', '#bb6bd9', '#f2994a']

// A small string hash, so the same chat always gets the same character and colour.
export const hash = (s: string): number => {
  let h = 0
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0

  return Math.abs(h)
}

export const mainSprite = (sessionKey: string): number => hash(sessionKey) % 6

export const helperSprite = (sessionKey: string, agentId: string): number =>
  (hash(sessionKey) + 1 + (hash(agentId) % 5)) % 6

type Rect = [number, number, number, number, string]

const LENS = 'rgba(165,216,255,0.75)'
const BLACK = '#111418'
const BAND = '#343a40'
const CUP = '#228be6'
const GOLD = '#f2c94c'
// The outfits, facing the viewer: [x, y, w, h, colour] in the 16x32 frame.
const LOOKS: Record<string, Rect[]> = {
  chain: [[5, 19, 1, 1, GOLD], [6, 20, 1, 1, GOLD], [7, 21, 2, 1, GOLD], [9, 20, 1, 1, GOLD], [10, 19, 1, 1, GOLD], [7, 22, 2, 1, '#ffe066']],
  glasses: [[5, 14, 2, 2, LENS], [9, 14, 2, 2, LENS], [4, 13, 8, 1, BLACK], [4, 14, 1, 2, BLACK], [7, 14, 2, 1, BLACK],
    [11, 14, 1, 2, BLACK], [4, 16, 4, 1, BLACK], [8, 16, 4, 1, BLACK]],
  shades: [[4, 13, 8, 1, BLACK], [4, 14, 4, 2, BLACK], [8, 14, 4, 2, BLACK], [5, 14, 1, 1, '#ffffff'], [9, 14, 1, 1, '#ffffff']],
  cap: [[3, 2, 10, 4, '#e03131'], [5, 3, 3, 1, '#ff6b6b'], [2, 6, 12, 1, '#a61e1e']],
  phones: [[4, 1, 8, 1, BAND], [3, 2, 1, 1, BAND], [12, 2, 1, 1, BAND], [2, 3, 1, 9, BAND], [13, 3, 1, 9, BAND],
    [0, 12, 3, 5, CUP], [13, 12, 3, 5, CUP]],
}
const OUTFIT: Record<string, string[]> = { default: ['glasses'], bypassPermissions: ['shades', 'chain'], acceptEdits: ['cap'], dontAsk: ['phones'] }
// A seated frame sits 3 pixels low facing the viewer; every overlay moves with it.
const SIT = 3

// The head's extras: a frown after a failed tool call, asleep after 15 idle minutes, a sweat drop once a turn runs past
// 5 minutes, and confetti on a commit or push.
export type Extras = { frown?: boolean; asleep?: boolean; sweat?: boolean; party?: boolean }

export type Figure = {
  sprite: number
  sessionKey: string
  mode: string
  status: 'idle' | 'working'
  extras?: Extras
}

// Each character's top eye row in the frame and the skin beside the eyes, read off sprites.ts (frame 3; frame 5's
// eyes sit within a row of it).
const EYE_TOP = [17, 18, 18, 18, 18, 18]
const SKIN = ['#e9a384', '#e9a384', '#5f4132', '#b67352', '#e9a384', '#fcd6c4']
const LINE = '#2b1d1a'
const VEIN = '#ff6b6b'
const DROP = '#74c0fc'
const ZED = '#d0ebff'

const picture = (p: Picture | undefined): string =>
  p
    ? p.layers
        .map(([fill, opacity, d]) => `<path fill="${fill}"${opacity < 1 ? ` fill-opacity="${opacity}"` : ''} d="${d}"/>`)
        .join('')
    : ''

const rects = (list: readonly Rect[], dy: number): string =>
  list.map(([x, y, w, h, c]) => `<rect x="${x}" y="${y + dy}" width="${w}" height="${h}" fill="${c}"/>`).join('')

const blinking = (inner: string, values: string, dur: string): string =>
  `<g>${inner}<animate attributeName="opacity" values="${values}" dur="${dur}" calcMode="discrete" repeatCount="indefinite"/></g>`

// A 4x4 "z", or 3 wide when small (3x3 reads as an "I").
const zed = (x: number, y: number, size: 3 | 4): Rect[] =>
  size === 4
    ? [[x, y, 4, 1, ZED], [x + 2, y + 1, 1, 1, ZED], [x + 1, y + 2, 1, 1, ZED], [x, y + 3, 4, 1, ZED]]
    : [[x, y, 3, 1, ZED], [x + 2, y + 1, 1, 1, ZED], [x, y + 2, 1, 1, ZED], [x, y + 3, 3, 1, ZED]]

// Shut eyes go under the outfit, so glasses and shades still sit on top of them.
const shutEyes = (eye: number, skin: string): string =>
  rects([[5, eye, 2, 3, skin], [9, eye, 2, 3, skin], [5, eye + 2, 2, 1, LINE], [9, eye + 2, 2, 1, LINE]], 0)

// A turned-down mouth, brows pulled in and a red cross vein at the top left.
const frown = (eye: number): string =>
  `<g id="frown">${rects(
    [
      [7, eye + 3, 2, 1, LINE], [6, eye + 4, 1, 1, LINE], [9, eye + 4, 1, 1, LINE],
      [5, eye - 2, 1, 1, LINE], [6, eye - 1, 1, 1, LINE], [10, eye - 2, 1, 1, LINE], [9, eye - 1, 1, 1, LINE],
      [1, 2, 1, 1, VEIN], [3, 2, 1, 1, VEIN], [0, 3, 2, 1, VEIN], [3, 3, 2, 1, VEIN],
      [0, 5, 2, 1, VEIN], [3, 5, 2, 1, VEIN], [1, 6, 1, 1, VEIN], [3, 6, 1, 1, VEIN],
    ],
    0,
  )}</g>`

const zz = (): string =>
  `<g id="asleep">${blinking(rects(zed(13, 7, 3), 0), '1;1;0', '2.4s')}${blinking(rects(zed(15, 2, 4), 0), '0;1;1', '2.4s')}</g>`

// A drop on the right temple that slides down and fades, over and over.
const sweat = (): string =>
  `<g id="sweat">${rects([[15, 10, 1, 1, DROP], [14, 11, 2, 2, DROP], [14, 11, 1, 1, '#e7f5ff']], 0)}` +
  '<animateTransform attributeName="transform" type="translate" values="0 0;0 3" dur="1.4s" repeatCount="indefinite"/>' +
  '<animate attributeName="opacity" values="1;1;0" dur="1.4s" repeatCount="indefinite"/></g>'

// Pixels thrown out from above the head, three bursts, then gone.
const PIECES: readonly [number, number, string][] = [
  [-7, -3, '#f2c94c'], [-5, -5, '#56ccf2'], [-3, 2, '#6fcf97'], [-6, 4, '#eb5757'], [-1, -5, '#bb6bd9'],
  [2, -5, '#f2994a'], [4, -2, '#ffffff'], [7, -4, '#56ccf2'], [6, 3, '#f2c94c'], [9, 0, '#eb5757'],
]
const confetti = (): string =>
  `<g id="confetti">${PIECES.map(
    ([dx, dy, c]) =>
      `<rect x="8" y="7" width="1" height="1" fill="${c}">` +
      `<animateTransform attributeName="transform" type="translate" values="0 0;${dx} ${dy};${dx} ${dy + 2}" dur="1.2s" repeatCount="3" fill="freeze"/>` +
      '<animate attributeName="opacity" values="1;1;0" dur="1.2s" repeatCount="3" fill="freeze"/></rect>',
  ).join('')}</g>`

// One head facing the viewer: frame 3 at a computer, frame 5 reading (plan mode, its own reading glasses).
const head = (f: Figure): string => {
  const sheet = CHARACTERS[f.sprite] ?? CHARACTERS[0] ?? {}
  const isPlan = f.mode === 'plan'
  const looks = (OUTFIT[f.mode] ?? []).filter(look => !(isPlan && (look === 'glasses' || look === 'shades')))
  const dress = looks.map(look => rects(LOOKS[look] ?? [], SIT)).join('')
  // The session's colour on top of the head; it pulses while the chat works.
  const team = rects([[6, 0, 4, 2, SESSION_COLORS[hash(f.sessionKey) % 6] ?? '#f2c94c']], SIT)
  const mark = f.status === 'working' ? blinking(team, '1;0.3', '1.2s') : team
  const x = f.extras ?? {}
  const eye = EYE_TOP[f.sprite] ?? 18

  return (
    picture(sheet[isPlan ? '5' : '3']) +
    (x.asleep ? shutEyes(eye, SKIN[f.sprite] ?? '#e9a384') : '') +
    dress +
    mark +
    (x.frown ? frown(eye) : '') +
    (x.asleep ? zz() : '') +
    (x.sweat ? sweat() : '') +
    (x.party ? confetti() : '')
  )
}

// Rows 1 to 25 of the frame (the colour mark to the shoulders) and three columns on the right for the "z z".
export const HEAD_SIZE = { w: 19, h: 25 }

export const headSvg = (f: Figure, scale: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 1 ${HEAD_SIZE.w} ${HEAD_SIZE.h}" width="${HEAD_SIZE.w * scale}" ` +
  `height="${HEAD_SIZE.h * scale}" shape-rendering="crispEdges">${head(f)}</svg>`
