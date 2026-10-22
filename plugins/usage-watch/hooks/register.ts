import { atom, read, update } from 'claude-code'
import type { Register, SessionContextUsage, SessionRateLimit, SessionUsage } from 'claude-code'

import type { UsageWatchSaid, UsageWatchTokens } from '../types'

// Heads-ups: once per five-hour window past FIVE_HOUR_AT, and once per context threshold until
// the fill drops below CONTEXT_RESET_BELOW again (a compaction or /clear), when they re-arm.
export const FIVE_HOUR_AT = 80
export const CONTEXT_AT: readonly number[] = [70, 85]
const CONTEXT_RESET_BELOW = 50

const NO_TOKENS: UsageWatchTokens = { input: 0, cacheWrite: 0, cacheRead: 0, output: 0, turns: 0 }
const NOTHING_SAID: UsageWatchSaid = { context: [], fiveHour: null }
const tokens = atom({ plugin: 'usage-watch', key: 'tokens' } as const, NO_TOKENS)
const said = atom({ plugin: 'usage-watch', key: 'said' } as const, NOTHING_SAID)

const LABEL: Record<string, string> = { five_hour: 'Five-hour', seven_day: 'Weekly', spend_limit: 'Spend limit' }

export const formatTokens = (n: number): string => {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`

  return `${n}`
}

// "2h 15m", "4d 3h", "12m"; null when the window gave no reset time.
export const untilReset = (resetsAt: string | undefined, now: number): string | null => {
  if (!resetsAt) return null
  const ms = Date.parse(resetsAt) - now
  if (!Number.isFinite(ms)) return null
  if (ms <= 0) return 'now'
  const mins = Math.max(1, Math.round(ms / 60_000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`

  return `${m}m`
}

export const limitLine = (l: SessionRateLimit, now: number): string => {
  const reset = untilReset(l.resetsAt, now)

  return `${LABEL[l.kind] ?? l.kind} ${l.percentUsed}%${reset ? ` (resets in ${reset})` : ''}`
}

const contextLine = (c: SessionContextUsage): string | null =>
  c.percent === undefined
    ? null
    : `Context ${c.percent}% (${formatTokens(c.tokens ?? 0)} / ${formatTokens(c.window)})`

export const usageText = (u: SessionUsage, now: number): string => {
  const limits = u.rateLimits.map(l => limitLine(l, now))
  const ctx = contextLine(u.context)
  if (limits.length === 0) return ['No limit reading yet. It comes with the next reply.', ctx].filter(Boolean).join(' · ')

  return [...limits, ctx].filter(Boolean).join(' · ')
}

export const costText = (u: SessionUsage, t: UsageWatchTokens): string => {
  const usd = u.cost
    ? `$${u.cost.usd.toFixed(2)} so far this session (API-equivalent, as /cost counts it).`
    : 'No cost reading in this session.'
  if (t.turns === 0) return `${usd} No turns counted yet.`

  return (
    `${usd} Tokens over ${t.turns} turns since usage-watch started, subagents included: ` +
    `cache writes ${formatTokens(t.cacheWrite)} · output ${formatTokens(t.output)} · ` +
    `cache reads ${formatTokens(t.cacheRead)} · uncached input ${formatTokens(t.input)}.`
  )
}

// What a measurement should make Claude say, and the record of what has been said after it.
export const headsUps = (
  m: { context: SessionContextUsage; rateLimits: readonly SessionRateLimit[] },
  prior: UsageWatchSaid,
  now: number,
): { lines: string[]; said: UsageWatchSaid } => {
  const lines: string[] = []
  let context = [...prior.context]
  const pct = m.context.percent
  if (pct !== undefined) {
    if (pct < CONTEXT_RESET_BELOW) context = []
    const crossed = CONTEXT_AT.filter(at => pct >= at && !context.includes(at))
    if (crossed.length > 0) {
      const near = pct >= (CONTEXT_AT[CONTEXT_AT.length - 1] ?? 100) ? ', close to auto-compaction' : ''
      lines.push(`the context is ${pct}% full (${formatTokens(m.context.tokens ?? 0)} / ${formatTokens(m.context.window)})${near}`)
      context = [...context, ...crossed]
    }
  }

  let fiveHour = prior.fiveHour
  const five = m.rateLimits.find(l => l.kind === 'five_hour')
  const window = five?.resetsAt ?? 'no-reset-time'
  if (five && five.percentUsed >= FIVE_HOUR_AT && fiveHour !== window) {
    const reset = untilReset(five.resetsAt, now)
    lines.push(`the five-hour usage window is at ${five.percentUsed}%${reset ? `, resets in ${reset}` : ''}`)
    fiveHour = window
  }

  return { lines, said: { context, fiveHour } }
}

const sameSaid = (a: UsageWatchSaid, b: UsageWatchSaid): boolean =>
  a.fiveHour === b.fiveHour && a.context.length === b.context.length && a.context.every((x, i) => x === b.context[i])

// The row Claude reads (the person does not see it as typed); appended at the end of the
// conversation, so the prompt cache keeps everything before it.
export const note = (lines: readonly string[]): string =>
  `usage-watch heads-up: ${lines.join('; ')}. ` +
  'Tell the user in one short line at the top of your next reply, then carry on.'

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'usage-now',
      description: 'Your five-hour and weekly limits, with reset times, in one line',
    })
    await $.command.register({
      name: 'cost-now',
      description: "This session's cost so far, with cache writes and output split out",
    })

    return next(e)
  })

  on('command.run', { command: 'usage-now' }, async $ => ({
    text: usageText(await $.session.usage(), await $.clock.now()),
  }))

  on('command.run', { command: 'cost-now' }, async $ => ({
    text: costText(await $.session.usage(), await read($, tokens)),
  }))

  on('turn.complete', async ($, e, next) => {
    const u = e.usage
    if (u) {
      await update($, tokens, t => ({
        input: t.input + u.input_tokens,
        cacheWrite: t.cacheWrite + u.cache_creation_input_tokens,
        cacheRead: t.cacheRead + u.cache_read_input_tokens,
        output: t.output + u.output_tokens,
        turns: t.turns + 1,
      }))
    }

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context') || e.changed.includes('rateLimits')) {
      const prior = await read($, said)
      const out = headsUps(e, prior, await $.clock.now())
      if (!sameSaid(prior, out.said)) await update($, said, () => out.said)
      if (out.lines.length > 0) {
        // A row that cannot be appended (a run no plugin may shape) costs the heads-up, never the measurement.
        await $.session
          .append({ message: { type: 'user', content: [{ type: 'text', text: note(out.lines) }] } })
          .catch(() => undefined)
      }
    }

    return next(e)
  })
}
