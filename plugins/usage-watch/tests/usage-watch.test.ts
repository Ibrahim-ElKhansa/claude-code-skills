import { expect, mock, test } from 'claude-code/testing'
import type { CommandRunInput, On, SessionRateLimit, SessionUsage } from 'claude-code'

import { headsUps, note, untilReset, usageText } from '../hooks/register'

const NOW = Date.parse('2026-10-08T12:00:00Z')
const FIVE: SessionRateLimit = { kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-08T14:15:00Z' }
const WEEK: SessionRateLimit = { kind: 'seven_day', percentUsed: 18, resetsAt: '2026-10-12T15:00:00Z' }

const usage = (rateLimits: SessionRateLimit[], percent = 23): SessionUsage => ({
  startedAt: 0,
  rateLimits,
  context: { tokens: percent * 10_000, window: 1_000_000, percent },
  cost: { usd: 12.345 },
})

const run = (command: string): CommandRunInput => ({
  command,
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 80 },
})

// The world beneath the mod: the usage reading, the clock, and the events it passes on.
// A mod's own $.session.append never reaches a test's hooks, so the note itself is
// checked through note() and headsUps(); the session test checks the measurement is
// passed on unchanged with a heads-up due.
const world = (on: On, reading: SessionUsage) => {
  mock.clock(on, { now: NOW })
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('session.usage', () => ({ value: reading }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('session.measure', (_, e) => ({ changed: e.changed }))
  on('session.append', (_, e, next) => next(e))
}

test('reset times read as days, hours or minutes', async () => {
  expect(untilReset('2026-10-08T14:15:00Z', NOW)).toBe('2h 15m')
  expect(untilReset('2026-10-12T15:00:00Z', NOW)).toBe('4d 3h')
  expect(untilReset('2026-10-08T12:12:00Z', NOW)).toBe('12m')
  expect(untilReset(undefined, NOW)).toBe(null)
  expect(usageText(usage([]), NOW)).toBe('No limit reading yet. It comes with the next reply. · Context 23% (230k / 1M)')
})

test('/usage-now answers with both windows and the context', async ($, on) => {
  world(on, usage([FIVE, WEEK]))

  expect((await $.command.run(run('usage-now'))).text).toBe(
    'Five-hour 42% (resets in 2h 15m) · Weekly 18% (resets in 4d 3h) · Context 23% (230k / 1M)',
  )
})

test('/cost-now gives the dollars and the token split from finished turns', async ($, on) => {
  world(on, usage([FIVE]))
  expect((await $.command.run(run('cost-now'))).text).toMatch(/^\$12\.35 so far .* No turns counted yet\.$/)

  const tokens = { input_tokens: 1_000, output_tokens: 4_000, cache_read_input_tokens: 900_000, cache_creation_input_tokens: 60_000, model: 'claude-opus-5-5' }
  for (const turnId of ['t1', 't2']) {
    await $.turn.complete({ answer: '', durationMs: 1, isAborted: false, turnId, reason: 'answer', usage: tokens })
  }

  expect((await $.command.run(run('cost-now'))).text).toMatch(
    /Tokens over 2 turns .*cache writes 120k · output 8k · cache reads 1\.8M · uncached input 2k\.$/,
  )
})

test('context heads-ups fire once at 70 and 85, and re-arm after the fill drops', async () => {
  const at = (percent: number) => ({ context: { tokens: percent * 10_000, window: 1_000_000, percent }, rateLimits: [] })
  let said = { context: [] as number[], fiveHour: null as string | null }

  let out = headsUps(at(72), said, NOW)
  expect(out.lines).toEqual(['the context is 72% full (720k / 1M)'])
  said = out.said
  expect(headsUps(at(74), said, NOW).lines).toEqual([])

  out = headsUps(at(86), said, NOW)
  expect(out.lines).toEqual(['the context is 86% full (860k / 1M), close to auto-compaction'])
  said = out.said

  said = headsUps(at(30), said, NOW).said
  expect(said.context).toEqual([])
  expect(headsUps(at(71), said, NOW).lines.length).toBe(1)
})

test('the five-hour heads-up fires once per window past 80%', async () => {
  const at = (percentUsed: number, resetsAt: string) => ({
    context: { window: 1_000_000 },
    rateLimits: [{ kind: 'five_hour', percentUsed, resetsAt }],
  })
  const none = { context: [], fiveHour: null }

  expect(headsUps(at(79, FIVE.resetsAt ?? ''), none, NOW).lines).toEqual([])
  const first = headsUps(at(82, '2026-10-08T14:15:00Z'), none, NOW)
  expect(first.lines).toEqual(['the five-hour usage window is at 82%, resets in 2h 15m'])
  expect(headsUps(at(90, '2026-10-08T14:15:00Z'), first.said, NOW).lines).toEqual([])
  expect(headsUps(at(85, '2026-10-08T19:15:00Z'), first.said, NOW).lines.length).toBe(1)
})

test('the note names every heads-up and asks for one line', async () => {
  const none = { context: [], fiveHour: null }
  const out = headsUps(
    { context: { tokens: 710_000, window: 1_000_000, percent: 71 }, rateLimits: [{ ...FIVE, percentUsed: 83 }] },
    none,
    NOW,
  )
  expect(note(out.lines)).toBe(
    'usage-watch heads-up: the context is 71% full (710k / 1M); the five-hour usage window is at 83%, resets in 2h 15m. ' +
      'Tell the user in one short line at the top of your next reply, then carry on.',
  )
})

test('a measurement with a heads-up due is passed on unchanged', async ($, on) => {
  world(on, usage([FIVE]))
  for (const [percent, five] of [[40, 50], [71, 83], [73, 84]] as const) {
    const r = await $.session.measure({
      context: { tokens: percent * 10_000, window: 1_000_000, percent },
      rateLimits: [{ ...FIVE, percentUsed: five }],
      changed: ['context', 'rateLimits'],
    })
    expect(r.changed).toEqual(['context', 'rateLimits'])
  }
})
