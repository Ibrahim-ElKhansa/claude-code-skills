import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderSurface, Timer } from 'claude-code'

import type {
  ContextBarSegment,
  ContextBarSnapshot,
  OfficeFace,
  OfficeFile,
  OfficeHelper,
  OfficeMain,
  OfficePeer,
  OfficeTask,
  OfficeWatch,
} from '../types'
import { bar, summary } from './bar'
import { HEAD_SIZE, headSvg, helperSprite, mainSprite } from './draw'

// The context bar: its reading, and whether /context-bar left it on.
const snapshot = atom({ plugin: 'toolbar', key: 'snapshot' } as const, null)
const isShown = atom({ plugin: 'toolbar', key: 'isShown' } as const, false)
const PANE = 'context'
const PANE_TITLE = 'Context'
// $.store key: whether /context-bar last left the bar on, kept across sessions.
const SHOWN_KEY = 'isShown'
// The band above the prompt is drawn on these surfaces; mobile has none, so it is offered the bar in a pane.
const BAND_SURFACES: readonly RenderSurface[] = ['terminal', 'desktop', 'vscode']

const wantsPane = (surface: RenderSurface | null): boolean => surface !== null && !BAND_SURFACES.includes(surface)

const main = atom({ plugin: 'toolbar', key: 'main' } as const, {
  sessionKey: '',
  project: '',
  cwd: '',
  mode: '',
  status: 'idle',
})
const helpers = atom({ plugin: 'toolbar', key: 'helpers' } as const, [])
const files = atom({ plugin: 'toolbar', key: 'files' } as const, [])
const tasks = atom({ plugin: 'toolbar', key: 'tasks' } as const, [])
const watches = atom({ plugin: 'toolbar', key: 'watches' } as const, [])
const peers = atom({ plugin: 'toolbar', key: 'peers' } as const, [])
const open = atom({ plugin: 'toolbar', key: 'open' } as const, null)
// Bumped while a box with running times is open, so the times move on.
const tick = atom({ plugin: 'toolbar', key: 'tick' } as const, 0)
const face = atom({ plugin: 'toolbar', key: 'face' } as const, { turnStartedAt: null, idleSince: null, frownUntil: 0, partyUntil: 0 })
// Bumped when one of the head's extras starts or ends, so the head redraws on time.
const beat = atom({ plugin: 'toolbar', key: 'beat' } as const, 0)

const FROWN_MS = 8_000
const PARTY_MS = 4_000
const SWEAT_AFTER = 5 * 60_000
const SLEEP_AFTER = 15 * 60_000

// The heads' size on screen: one sprite pixel is this many CSS pixels.
const MAIN_SCALE = 2
const HELPER_SCALE = 1.5
const HELPERS_DRAWN = 6
const KEPT = 40
const TICK_MS = 5_000
const LIVE = new Set(['pending', 'running', 'waiting'])
const EDITS = new Set<string>(['Edit', 'Write', 'NotebookEdit'])
// A session counts as active for 30 minutes after the last message either way, or while this chat waits on it.
const ACTIVE_MS = 30 * 60_000
// A schedule may fire up to 90 s early, and a wake-up late while a turn runs; one due within this is the one that fired.
const FIRE_SLACK = 2 * 60_000
// A subagent's id (a562ab0620169406d): SendMessage to one is this chat's own helper, not another session.
const AGENT_ID = /^a[0-9a-f]{16}$/
const ADDRESS = /^(uds|bridge):/
const KIND_WORD: Record<OfficeWatch['kind'], string> = { wakeup: 'check-back', cron: 'schedule', idle: 'idle wait' }

const lineCount = (s: unknown): number => (typeof s === 'string' && s !== '' ? s.split('\n').length : 0)

export const formatElapsed = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s % 60).padStart(2, '0')}s`

  return `${s}s`
}

// The chat's name in the strip: the last folder of the path it started in, on Windows, macOS or Linux.
export const projectOf = (cwd: string): string => {
  const folder = cwd.replace(/\\/g, '/').replace(/\/+$/, '')

  return folder.split('/').pop() || folder || '?'
}

const isLive = (r: { endedAt: number | null; status: string }): boolean => r.endedAt === null && LIVE.has(r.status)

const logOf = (r: OfficeTask | OfficeHelper): string => ('log' in r && typeof r.log === 'string' ? r.log : '')

const setMain = async ($: EngineInterface, patch: Partial<OfficeMain>): Promise<void> => {
  const now = await read($, main)
  const keys = Object.keys(patch) as (keyof OfficeMain)[]
  if (keys.every(k => now[k] === patch[k])) return
  await update($, main, m => ({ ...m, ...patch }))
}

// The module's own timers; a reload drops them, and session.start or the next draw starts them again.
let ticker: Timer | null = null
let sweatTimer: Timer | null = null
let sleepTimer: Timer | null = null

// Redraws the head when a look is due to start or end.
const wake = ($: EngineInterface, ms: number): Timer =>
  $.clock.after(Math.max(0, ms) + 50, () => {
    void update($, beat, n => n + 1).catch(() => undefined)
  })

const setFace = async ($: EngineInterface, patch: Partial<OfficeFace>): Promise<void> => {
  await update($, face, f => ({ ...f, ...patch }))
}

// A main-loop turn begins: no longer idle, and the sweat clock starts.
const startTurn = async ($: EngineInterface): Promise<void> => {
  const f = await read($, face)
  if (f.turnStartedAt !== null) return
  sleepTimer?.cancel()
  sleepTimer = null
  await setFace($, { turnStartedAt: await $.clock.now(), idleSince: null })
  sweatTimer?.cancel()
  sweatTimer = wake($, SWEAT_AFTER)
}

const endTurn = async ($: EngineInterface): Promise<void> => {
  sweatTimer?.cancel()
  sweatTimer = null
  await setFace($, { turnStartedAt: null, idleSince: await $.clock.now() })
  sleepTimer?.cancel()
  sleepTimer = wake($, SLEEP_AFTER)
}

const startTicking = ($: EngineInterface): void => {
  if (ticker) return
  ticker = $.clock.every(TICK_MS, () => {
    void (async () => {
      const which = await read($, open)
      const list =
        which === 'helpers'
          ? await read($, helpers)
          : which === 'running'
            ? await read($, tasks)
            : which === 'watching'
              ? await read($, watches)
              : []
      // Sessions shows how long ago each spoke, so it keeps moving while it lists anyone.
      const isMoving = which === 'sessions' ? (await read($, peers)).length > 0 : list.some(isLive)
      if (!isMoving) {
        ticker?.cancel()
        ticker = null
        return
      }
      await update($, tick, n => n + 1)
    })().catch(() => undefined)
  })
}

// How a task ended, in the box's words: the engine says completed, failed or killed (stopped by the person or Claude).
export const endedStatus = (status: string | undefined): string =>
  status === 'killed' || status === 'stopped' ? 'stopped' : status === 'failed' || status === 'error' ? 'failed' : 'finished'

// Each background task's end as the session's notice names it: <task-notification> with <task-id> and <status>.
export const noticesIn = (text: string): { id: string; status: string }[] => {
  const found: { id: string; status: string }[] = []
  for (const m of text.matchAll(/<task-notification>([\s\S]*?)<\/task-notification>/g)) {
    const body = m[1] ?? ''
    const id = /<task-id>\s*([^<\s]+)\s*<\/task-id>/.exec(body)?.[1]
    if (id) found.push({ id, status: /<status>\s*([^<\s]+)\s*<\/status>/.exec(body)?.[1] ?? 'completed' })
  }

  return found
}

const textOfRow = (content: readonly { type: string; text?: unknown }[]): string =>
  content.map(b => (b.type === 'text' && typeof b.text === 'string' ? b.text : '')).join('\n')

// A task that ended between turns: its notice, or Claude's TaskStop.
const endTask = async ($: EngineInterface, id: string, status: string): Promise<void> => {
  const now = await $.clock.now()
  await update($, tasks, list => list.map(t => (t.id === id && isLive(t) ? { ...t, endedAt: now, status } : t)))
}

// The boxes say when as "in 8m 05s" or "3m ago", never a clock time, so no time zone comes into it.
export const formatDue = (dueAt: number, now: number): string => (dueAt <= now ? 'due now' : `in ${formatElapsed(dueAt - now)}`)

// Each message another session sent, as its envelope names the sender:
// <cross-session-message from="uds:\\.\pipe\LOCAL\cc-msg-..." from-name="api-server-1" from-mode="bypass">.
export const peerMessagesIn = (text: string): { address: string; name: string }[] => {
  const found: { address: string; name: string }[] = []
  for (const m of text.matchAll(/<cross-session-message\b([^>]*)>/g)) {
    const attrs = new Map([...(m[1] ?? '').matchAll(/([\w-]+)="([^"]*)"/g)].map(a => [a[1] ?? '', a[2] ?? '']))
    const address = attrs.get('from') ?? ''
    if (address && address !== '...') found.push({ address, name: attrs.get('from-name') || address })
  }

  return found
}

// Each idle notice another session's harness sent:
// [Cross-session idle notice] "docs-session", which you asked to be notified about, is idle now ...
export const idleNoticesIn = (text: string): { name: string; isExpired: boolean }[] =>
  [...text.matchAll(/\[Cross-session idle notice\]([^\n]*)/g)].map(m => ({
    name: /"([^"]+)"/.exec(m[1] ?? '')?.[1] ?? '',
    isExpired: /expired/i.test(m[1] ?? ''),
  }))

// A schedule's prompt as one short line; an autonomous /loop's prompt is a sentinel, so it reads as /loop.
const labelOf = (prompt: string): string =>
  prompt.startsWith('<<') ? '/loop' : (prompt.split('\n')[0] ?? '').trim().slice(0, 120) || 'scheduled prompt'

// Waiting: this chat waits for that session to go idle, or sent last and has had no answer for under 30 minutes (a wait
// for a reply runs out then). Active: a message either way in the last 30 minutes. Quiet: the rest.
export const peerState = (p: OfficePeer, now: number, waits: readonly OfficeWatch[]): 'waiting' | 'active' | 'quiet' => {
  if (waits.some(w => w.kind === 'idle' && isLive(w) && w.label === p.name)) return 'waiting'
  if (now - p.lastAt >= ACTIVE_MS) return 'quiet'

  return p.lastWay === 'out' ? 'waiting' : 'active'
}

const endWatch = async ($: EngineInterface, id: string, status: string): Promise<void> => {
  const now = await $.clock.now()
  await update($, watches, list => list.map(w => (w.id === id && isLive(w) ? { ...w, endedAt: now, status } : w)))
}

const addWatch = async ($: EngineInterface, watch: OfficeWatch): Promise<void> => {
  await update($, watches, list => [...list.filter(w => w.id !== watch.id), watch].slice(-KEPT))
}

// A message from another session; a uds address heard before under a plain name keeps one row.
const heardFrom = async ($: EngineInterface, address: string, name: string, isMessage: boolean): Promise<void> => {
  const now = await $.clock.now()
  await update($, peers, list => {
    const was = list.find(p => (address && p.address === address) || p.name === name)
    const peer: OfficePeer = {
      name: name || was?.name || address,
      address: address || was?.address || '',
      sent: was?.sent ?? 0,
      received: (was?.received ?? 0) + (isMessage ? 1 : 0),
      firstAt: was?.firstAt ?? now,
      lastAt: now,
      lastWay: 'in',
    }
    return [...list.filter(p => p !== was), peer].slice(-KEPT)
  })
}

// SendMessage to another session: one more sent, and with notify_when_idle a wait in Watching. A send to "main" or to one
// of this chat's helpers is not another session.
const sentTo = async ($: EngineInterface, to: string, hasText: boolean, isIdleWait: boolean): Promise<void> => {
  const bare = to.replace(/\s*\[[^\]]*\]$/, '').trim()
  const helperList = await read($, helpers)
  if (!bare || bare === 'main' || AGENT_ID.test(bare) || helperList.some(h => h.id === bare || h.name === bare)) return
  const now = await $.clock.now()
  const was = (await read($, peers)).find(p => p.name === bare || p.address === bare)
  const name = was?.name ?? bare
  if (hasText) {
    await update($, peers, list => {
      const had = list.find(p => p.name === name)
      const peer: OfficePeer = {
        name,
        address: had?.address || (ADDRESS.test(bare) ? bare : ''),
        sent: (had?.sent ?? 0) + 1,
        received: had?.received ?? 0,
        firstAt: had?.firstAt ?? now,
        lastAt: now,
        lastWay: 'out',
      }
      return [...list.filter(p => p !== had), peer].slice(-KEPT)
    })
  }
  if (isIdleWait) {
    const id = `idle-${name}`
    if ((await read($, watches)).some(w => w.id === id && isLive(w))) return
    await addWatch($, { id, kind: 'idle', label: name, detail: '', isRecurring: false, startedAt: now, dueAt: null, endedAt: null, status: 'waiting' })
  }
}

// An idle notice ends the wait on that session; when the name matches none and one wait is open, it is that one.
const idleEnded = async ($: EngineInterface, name: string, isExpired: boolean): Promise<void> => {
  const now = await $.clock.now()
  await update($, watches, list => {
    const live = list.filter(w => w.kind === 'idle' && isLive(w))
    const target = live.find(w => w.label === name) ?? (live.length === 1 ? live[0] : undefined)
    return target ? list.map(w => (w === target ? { ...w, endedAt: now, status: isExpired ? 'expired' : 'done' } : w)) : list
  })
}

// A scheduled prompt started a turn: what was due has fired; a repeating schedule stays, its next time unknown until listed.
const fireDue = async ($: EngineInterface): Promise<void> => {
  const now = await $.clock.now()
  await update($, watches, list =>
    list.map(w => {
      if (!isLive(w) || w.kind === 'idle' || w.dueAt === null || w.dueAt > now + FIRE_SLACK) return w
      return w.isRecurring ? { ...w, dueAt: null } : { ...w, endedAt: now, status: 'fired' }
    }),
  )
}

// At each turn's end the engine lists every wake-up and schedule still pending; the box follows that list. A check-back's
// call names no id, so the one-shot entries the box does not know are taken to be the live check-backs, earliest first.
const onCrons = async (
  $: EngineInterface,
  crons: readonly { id: string; schedule: string; recurring: boolean; prompt: string }[],
): Promise<void> => {
  const now = await $.clock.now()
  await update($, watches, list => {
    const ids = new Set(crons.map(c => c.id))
    const known = new Set(list.map(w => w.id))
    const strangers = crons.filter(c => !known.has(c.id) && !c.recurring)
    const renamed = new Map<string, string>()
    list
      .filter(w => w.kind === 'wakeup' && isLive(w) && !ids.has(w.id))
      .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0))
      .forEach((w, i) => {
        const c = strangers[i]
        if (c) renamed.set(w.id, c.id)
      })
    const kept: OfficeWatch[] = list.map(w => {
      const id = renamed.get(w.id) ?? w.id
      if (w.kind === 'idle' || !isLive(w) || ids.has(id)) return id === w.id ? w : { ...w, id }
      return { ...w, endedAt: now, status: w.dueAt !== null && w.dueAt <= now ? 'fired' : 'done' }
    })
    const taken = new Set(kept.map(w => w.id))
    for (const c of crons) {
      if (taken.has(c.id)) continue
      kept.push({
        id: c.id,
        kind: 'cron',
        label: labelOf(c.prompt),
        detail: c.recurring ? c.schedule : `${c.schedule} · once`,
        isRecurring: c.recurring,
        startedAt: now,
        dueAt: null,
        endedAt: null,
        status: 'waiting',
      })
    }
    return kept.slice(-KEPT)
  })
}

// At each turn's end: the background work still in flight.
const onStop = async (
  $: EngineInterface,
  running: readonly { id: string; type: string; status: string; description: string; command?: string }[],
): Promise<void> => {
  const now = await $.clock.now()
  // Running is commands, monitors and workflows; a background helper agent shows under Helpers only.
  const background = running.filter(t => t.type !== 'subagent')
  // Only a task the engine still calls running, pending or waiting is in flight; one it lists as ended is not.
  const ids = new Set(background.filter(t => LIVE.has(t.status)).map(t => t.id))
  const said = new Map(background.map(t => [t.id, t.status]))
  await update($, tasks, list => {
    const known = new Set(list.map(t => t.id))
    const kept: OfficeTask[] = list.map(t =>
      isLive(t) && !ids.has(t.id) ? { ...t, endedAt: now, status: endedStatus(said.get(t.id)) } : t,
    )
    for (const t of background) {
      if (known.has(t.id) || !LIVE.has(t.status)) continue
      kept.push({
        id: t.id,
        type: t.type,
        description: t.description || t.command || t.type,
        log: '',
        startedAt: now,
        endedAt: null,
        status: t.status,
      })
    }
    return kept.slice(-KEPT)
  })
}

const measure = async ($: EngineInterface): Promise<ContextBarSnapshot | null> => {
  // `summary` estimates locally and sends no token-count request.
  const { context } = await $.session.usage({ breakdown: 'summary' })
  const breakdown = context.breakdown
  if (!breakdown) return null
  const segments: ContextBarSegment[] = []
  for (const row of breakdown.categories) {
    if (row.kind === 'deferred') continue
    segments.push({ name: row.name, tokens: row.tokens, color: row.color, kind: row.kind })
  }

  return {
    percent: context.percent ?? breakdown.percentage,
    tokens: context.tokens ?? breakdown.totalTokens,
    window: context.window,
    measuredAgainst: breakdown.rawMaxTokens,
    segments,
  }
}

const refresh = async ($: EngineInterface): Promise<ContextBarSnapshot | null> => {
  const reading = await measure($)
  if (reading) await update($, snapshot, () => reading)

  return reading
}

type ClassicBase = { session_id: string; transcript_path: string; cwd: string; permission_mode?: string; agent_id?: string }

// What a main-loop classic event says about the chat; a helper's events leave the main character alone.
// The strip is a view: a failure here never stands in the way of the event.
const fromClassic = async ($: EngineInterface, e: ClassicBase, patch: Partial<OfficeMain>): Promise<void> => {
  if (e.agent_id) return
  const change: Partial<OfficeMain> = { ...patch }
  if (e.permission_mode) change.mode = e.permission_mode
  if (e.session_id) {
    change.sessionKey = e.session_id
    // The event's cwd follows every cd the shell makes; the root, and the name taken from it, stay the folder the chat
    // started in.
    const now = await read($, main).catch(() => null)
    if (now && !now.cwd && e.cwd) {
      change.cwd = e.cwd
      change.project = projectOf(e.cwd)
    }
  }
  await setMain($, change).catch(() => undefined)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const m = await read($, main)
    if (!m.sessionKey) {
      const [id, cwd] = await Promise.all([$.session.id(), $.session.root()])
      await setMain($, { sessionKey: id, cwd, project: m.project || projectOf(cwd) })
    }
    // After a reload the timers are gone; the moments are kept, so set the redraws again.
    const f = await read($, face)
    const now = await $.clock.now()
    if (f.turnStartedAt !== null && !sweatTimer) sweatTimer = wake($, f.turnStartedAt + SWEAT_AFTER - now)
    if (f.idleSince !== null && !sleepTimer) sleepTimer = wake($, f.idleSince + SLEEP_AFTER - now)
    await $.command.register({
      name: 'context-bar',
      description: 'Show or hide the context window as a stacked bar',
    })
    // The bar is on in every session unless /context-bar last turned it off.
    const shown = (await $.store.get(SHOWN_KEY)) !== false
    await update($, isShown, () => shown)
    if (shown) {
      void refresh($).catch(() => undefined)
      if (wantsPane(e.surface)) void $.ui.open({ id: PANE, title: PANE_TITLE })
    }

    return next(e)
  })

  // A phone may attach after the session started; it gets the bar in a pane then.
  on('session.attach', async ($, e, next) => {
    if (wantsPane(e.surface) && (await read($, isShown))) void $.ui.open({ id: PANE, title: PANE_TITLE })

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context') && (await read($, isShown))) await refresh($)

    return next(e)
  })

  on('command.run', { command: 'context-bar' }, async $ => {
    const needsPane = (await $.session.surfaces()).some(wantsPane)
    const shown = !(await read($, isShown))
    await update($, isShown, () => shown)
    await $.store.set(SHOWN_KEY, shown)

    if (!shown) {
      if (needsPane) await $.ui.close({ id: PANE })

      return { text: 'Context bar off. It stays off in new sessions until you run /context-bar again.' }
    }

    const s = await refresh($)
    if (needsPane) void $.ui.open({ id: PANE, title: PANE_TITLE })

    return { text: s ? `Context bar on · ${summary(s)}` : 'Context bar on. It fills in after the next reply.' }
  })

  // Closing the phone's pane by hand turns the bar off for this session only.
  on('ui.close', async ($, e, next) => {
    if (e.id === PANE && e.origin.kind === 'person') await update($, isShown, () => false)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const s = await read($, snapshot)
    const draw = $.ui.resolve(e)
    if (s === null) return <draw.Text dimColor>No reading yet. It fills in after the next reply.</draw.Text>

    return bar(draw, s, e.props.bodyColumns)
  })

  // The classic events carry the chat's permission mode, which dresses the character, and its session id.
  on('classic.SessionStart', async ($, e, next) => {
    await fromClassic($, e, {})

    return next(e)
  })
  on('classic.UserPromptSubmit', async ($, e, next) => {
    await fromClassic($, e, { status: 'working' })
    if (!e.agent_id) await startTurn($).catch(() => undefined)

    return next(e)
  })
  on('classic.PostToolUse', async ($, e, next) => {
    await fromClassic($, e, {})

    return next(e)
  })
  on('classic.Stop', async ($, e, next) => {
    if (!e.agent_id) {
      await onStop($, e.background_tasks ?? []).catch(() => undefined)
      if (e.session_crons) await onCrons($, e.session_crons).catch(() => undefined)
      await endTurn($).catch(() => undefined)
    }
    await fromClassic($, e, { status: 'idle' })

    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await setMain($, { status: 'working' })
    await startTurn($).catch(() => undefined)

    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (!e.agentId) {
      if ((await read($, main)).status !== 'working') await setMain($, { status: 'working' })
      // A turn a background task's end started has no prompt.
      await startTurn($).catch(() => undefined)
    }
    const result = await next(e)
    try {
      const now = await $.clock.now()
      if (result.isError) {
        if (!e.agentId) {
          await setFace($, { frownUntil: now + FROWN_MS })
          wake($, FROWN_MS)
        }
        return result
      }
      // Claude Code marks a git commit or push that went through on the command's own result.
      if (e.tool === 'Bash' || e.tool === 'PowerShell') {
        const git = (result.result as { gitOperation?: { commit?: unknown; push?: unknown } } | undefined)?.gitOperation
        if (git?.commit || git?.push) {
          await setFace($, { partyUntil: now + PARTY_MS })
          wake($, PARTY_MS)
        }
      }
      if (EDITS.has(e.tool)) {
        let path = ''
        let added = 0
        let removed = 0
        let isWritten = false
        if (e.tool === 'Edit') {
          path = e.file_path
          added = lineCount(e.new_string)
          removed = lineCount(e.old_string)
        } else if (e.tool === 'Write') {
          path = e.file_path
          added = lineCount(e.content)
          isWritten = true
        } else if (e.tool === 'NotebookEdit') {
          path = e.notebook_path
          added = lineCount(e.new_source)
        }
        if (path) {
          await update($, files, list => {
            const was = list.find(f => f.path === path)
            const changed: OfficeFile = {
              path,
              added: (was?.added ?? 0) + added,
              removed: (was?.removed ?? 0) + removed,
              edits: (was?.edits ?? 0) + 1,
              isWritten: (was?.isWritten ?? false) || isWritten,
              lastAt: now,
            }
            return [...list.filter(f => f.path !== path), changed]
          })
        }
      }
      if ((e.tool === 'Bash' || e.tool === 'PowerShell') && e.run_in_background) {
        const text = typeof result.text === 'string' ? result.text : ''
        const id = /background with ID:\s*([A-Za-z0-9_-]+)/.exec(text)?.[1] ?? ''
        if (id) {
          const task: OfficeTask = {
            id,
            type: 'shell',
            description: e.description || e.command,
            log: /being written to:\s*(\S+)/.exec(text)?.[1]?.replace(/\.$/, '') ?? '',
            startedAt: now,
            endedAt: null,
            status: 'running',
          }
          await update($, tasks, list => [...list.filter(t => t.id !== id), task].slice(-KEPT))
        }
      }
      // Claude stopping a task sends no notice, so the box hears it here.
      if (e.tool === 'TaskStop') {
        const id = e.task_id ?? e.shell_id
        if (id) await endTask($, id, 'stopped')
      }
      // Watching: a check-back's time is on its result; stop:true cancels every one pending.
      if (e.tool === 'ScheduleWakeup') {
        if (e.stop) {
          await update($, watches, list => list.map(w => (w.kind === 'wakeup' && isLive(w) ? { ...w, endedAt: now, status: 'cancelled' } : w)))
        } else {
          const at = (result.result as { scheduledFor?: number } | undefined)?.scheduledFor
          if (typeof at === 'number') {
            await addWatch($, {
              id: `wake-${at}`,
              kind: 'wakeup',
              label: e.reason || 'Check back',
              detail: '',
              isRecurring: false,
              startedAt: now,
              dueAt: at,
              endedAt: null,
              status: 'waiting',
            })
          }
        }
      }
      if (e.tool === 'CronCreate') {
        const made = result.result as { id?: string; humanSchedule?: string; recurring?: boolean; nextFireAt?: number } | undefined
        if (made?.id) {
          const isRecurring = made.recurring ?? e.recurring !== false
          const schedule = made.humanSchedule || e.cron
          await addWatch($, {
            id: made.id,
            kind: 'cron',
            label: labelOf(e.prompt),
            detail: isRecurring ? schedule : `${schedule} · once`,
            isRecurring,
            startedAt: now,
            dueAt: made.nextFireAt ?? null,
            endedAt: null,
            status: 'waiting',
          })
        }
      }
      if (e.tool === 'CronDelete') await endWatch($, e.id, 'cancelled')
      // Sessions: a message to another session; idle waits are the main conversation's alone.
      if (e.tool === 'SendMessage' && typeof e.to === 'string') {
        await sentTo($, e.to, typeof e.message === 'string' && e.message !== '', !e.agentId && e.notify_when_idle === true)
      }
    } catch {
      // Recording is best effort; the call's own result is what matters.
    }

    return result
  })

  // A background task's end reaches the session as a notice row, often between turns; the box marks it then.
  on('session.append', async ($, e, next) => {
    const result = await next(e)
    if (e.message.type !== 'assistant') {
      const text = textOfRow(e.message.content)
      if (text.includes('<task-notification>')) {
        for (const n of noticesIn(text)) await endTask($, n.id, endedStatus(n.status)).catch(() => undefined)
      }
      // A queued message passes once as its queue record and again as the row it becomes; only the row counts.
      if (e.door !== 'queue' && text.includes('<cross-session-message')) {
        for (const p of peerMessagesIn(text)) await heardFrom($, p.address, p.name, true).catch(() => undefined)
      }
      if (text.includes('[Cross-session idle notice]')) {
        for (const n of idleNoticesIn(text)) {
          await idleEnded($, n.name, n.isExpired).catch(() => undefined)
          // Gone idle is that session's answer: this chat no longer waits on it.
          if (n.name && (await read($, peers)).some(p => p.name === n.name)) await heardFrom($, '', n.name, false).catch(() => undefined)
        }
      }
      if (e.origin.kind === 'scheduled-trigger') await fireDue($).catch(() => undefined)
    }

    return result
  })

  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.agentId) {
      const helper: OfficeHelper = {
        id: started.agentId,
        ...(e.name ? { name: e.name } : {}),
        description: e.description,
        type: e.subagentType,
        startedAt: await $.clock.now(),
        endedAt: null,
        status: 'running',
      }
      await update($, helpers, list => [...list.filter(h => h.id !== helper.id), helper].slice(-KEPT))
    }

    return started
  })

  on('turn.complete', async ($, e, next) => {
    const id = e.agentId
    if (id) {
      const now = await $.clock.now()
      const status = e.isAborted ? 'stopped' : e.reason === 'error' || e.reason === 'refusal' ? 'failed' : 'done'
      await update($, helpers, list => list.map(h => (h.id === id ? { ...h, endedAt: now, status } : h)))
    } else {
      // An interrupted turn may end with no Stop.
      await endTurn($).catch(() => undefined)
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const below = await next(e)
    if (e.props.hasSurvey) return below
    const { Box, Button, Text } = $.ui.resolve(e)
    const m = await read($, main)
    const which = await read($, open)
    const helperList = await read($, helpers)
    const fileList = await read($, files)
    const taskList = await read($, tasks)
    const watchList = await read($, watches)
    const peerList = await read($, peers)
    const now = await $.clock.now()
    await read($, beat)
    const f = await read($, face)
    const asleep = m.status !== 'working' && f.idleSince !== null && now - f.idleSince >= SLEEP_AFTER
    const extras = {
      frown: now < f.frownUntil,
      asleep,
      sweat: f.turnStartedAt !== null && now - f.turnStartedAt >= SWEAT_AFTER,
      party: now < f.partyUntil,
    }
    const status = asleep ? 'asleep' : m.status === 'working' ? (m.mode === 'plan' ? 'planning' : 'typing') : 'idle'
    const liveHelpers = helperList.filter(isLive)
    const liveTasks = taskList.filter(isLive)
    const liveWatches = watchList.filter(isLive)
    const activePeers = peerList.filter(p => peerState(p, now, watchList) !== 'quiet')

    const toggle = (id: string) => async () => {
      await update($, open, o => (o === id ? null : id))
      startTicking($)
    }
    const close = () => update($, open, () => null)
    // The panel draws every button at one size, so the labels are icons, the box each opens naming itself in words.
    // Sessions shows two numbers, active and talked to (💬 1/3); a button dims on 0.
    const button = (id: string, icon: string, count: number, shown = String(count)) => (
      <Button
        key={`open-${id}`}
        label={`${icon} ${shown}`}
        {...(which === id ? { variant: 'primary' as const } : {})}
        {...(count === 0 && which !== id ? { dimColor: true } : {})}
        onPress={toggle(id)}
      />
    )

    let figures = null
    if (e.surface === 'terminal') {
      figures = (
        <Text dimColor>
          {m.project || '?'} · {status}
          {liveHelpers.length ? ` · ${liveHelpers.length} helpers` : ''}
        </Text>
      )
    } else {
      const { Svg } = $.ui.resolve(e)
      const shown = liveHelpers.slice(0, HELPERS_DRAWN)
      figures = (
        <Box flexDirection="row" alignItems="flex-end" columnGap={1}>
          <Box key="me" flexDirection="column" alignItems="center">
            <Svg
              source={headSvg({ sprite: mainSprite(m.sessionKey), sessionKey: m.sessionKey, mode: m.mode, status: m.status, extras }, MAIN_SCALE)}
              alt={`This chat's pixel character, ${status}`}
              width={HEAD_SIZE.w * MAIN_SCALE}
              height={HEAD_SIZE.h * MAIN_SCALE}
            />
            <Text dimColor wrap="truncate-end">
              {m.project || 'this chat'} · {status}
            </Text>
          </Box>
          {/* Never name a variable `h` here: the JSX compiles to h(...), and shadowing it breaks the band. */}
          {shown.map(helper => (
            <Box key={`h-${helper.id}`} flexDirection="column" alignItems="center">
              <Svg
                source={headSvg(
                  { sprite: helperSprite(m.sessionKey, helper.id), sessionKey: m.sessionKey, mode: m.mode, status: 'working' },
                  HELPER_SCALE,
                )}
                alt={`Helper ${helper.type}`}
                width={HEAD_SIZE.w * HELPER_SCALE}
                height={HEAD_SIZE.h * HELPER_SCALE}
              />
              <Text dimColor wrap="truncate-end">
                {helper.type}
              </Text>
            </Box>
          ))}
          {liveHelpers.length > HELPERS_DRAWN ? <Text dimColor>+{liveHelpers.length - HELPERS_DRAWN}</Text> : null}
        </Box>
      )
    }

    const head = (title: string) => (
      <Box key="head" flexDirection="row" justifyContent="space-between">
        <Text bold>{title}</Text>
        <Button key="close" label="Close" role="dismiss" onPress={close} />
      </Box>
    )

    let box = null
    if (which === 'running' || which === 'helpers') {
      await read($, tick)
      const list = which === 'running' ? taskList : helperList
      const live = list.filter(isLive)
      const done = list.filter(r => !isLive(r)).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0)).slice(0, 6)
      const rows = [...live.sort((a, b) => a.startedAt - b.startedAt), ...done]
      box = (
        <Box flexDirection="column" borderStyle="round" paddingX={1}>
          {head(which === 'running' ? `Running in the background · ${live.length}` : `Helpers · ${live.length} working`)}
          {rows.length === 0 ? (
            <Text dimColor>{which === 'running' ? 'Nothing running in the background.' : 'No helpers in this chat yet.'}</Text>
          ) : (
            rows.map(r => (
              <Box key={r.id} flexDirection="column">
                <Box flexDirection="row" columnGap={1}>
                  <Text color={isLive(r) ? 'permission' : r.status === 'failed' ? 'error' : 'success'}>{r.status}</Text>
                  <Text dimColor>{formatElapsed((r.endedAt ?? now) - r.startedAt)}</Text>
                  <Text dimColor>{r.type}</Text>
                  <Text wrap="truncate-end">{r.description}</Text>
                  {which === 'running' && isLive(r) ? (
                    <Button
                      key={`stop-${r.id}`}
                      label="Stop"
                      onPress={async () => {
                        const answer = await $.ui
                          .ask(`Stop "${r.description.slice(0, 80)}"?`, ['Stop it', 'Keep it running'])
                          .catch(() => '')
                        if (answer !== 'Stop it') return
                        const stopped = await $.tool.call({ tool: 'TaskStop', task_id: r.id }).catch(() => null)
                        if (stopped && !stopped.isError) {
                          const at = await $.clock.now()
                          await update($, tasks, l => l.map(t => (t.id === r.id ? { ...t, endedAt: at, status: 'stopped' } : t)))
                        } else {
                          $.ui.toast('Could not stop it. Ask Claude to stop the task.')
                        }
                      }}
                    />
                  ) : null}
                </Box>
                {logOf(r) ? (
                  <Text dimColor wrap="truncate-end">
                    log: {logOf(r)}
                  </Text>
                ) : null}
              </Box>
            ))
          )}
        </Box>
      )
    } else if (which === 'watching') {
      await read($, tick)
      const live = [...liveWatches].sort((a, b) => (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity))
      const done = watchList.filter(w => !isLive(w)).sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0)).slice(0, 6)
      const whenOf = (w: OfficeWatch): string => {
        if (!isLive(w)) return `${formatElapsed(now - (w.endedAt ?? now))} ago`
        if (w.kind === 'idle') return 'until it goes idle'
        if (w.dueAt !== null) return formatDue(w.dueAt, now)
        return w.isRecurring ? 'repeats' : 'pending'
      }
      box = (
        <Box flexDirection="column" borderStyle="round" paddingX={1}>
          {head(`Watching · ${live.length}`)}
          {live.length + done.length === 0 ? (
            <Text dimColor>Nothing will wake this chat later.</Text>
          ) : (
            [...live, ...done].map(w => (
              <Box key={w.id} flexDirection="column">
                <Box flexDirection="row" columnGap={1}>
                  <Text
                    color={isLive(w) ? 'permission' : w.status === 'expired' ? 'error' : w.status === 'cancelled' ? 'warning' : 'success'}
                  >
                    {w.status}
                  </Text>
                  <Text dimColor>{whenOf(w)}</Text>
                  <Text dimColor>{KIND_WORD[w.kind]}</Text>
                  <Text wrap="truncate-end">{w.kind === 'idle' ? `${w.label} to go idle` : w.label}</Text>
                </Box>
                {w.detail ? (
                  <Text dimColor wrap="truncate-end">
                    {w.detail}
                  </Text>
                ) : null}
              </Box>
            ))
          )}
        </Box>
      )
    } else if (which === 'sessions') {
      await read($, tick)
      const rank = { waiting: 0, active: 1, quiet: 2 } as const
      const rows = peerList
        .map(p => ({ p, state: peerState(p, now, watchList) }))
        .sort((a, b) => rank[a.state] - rank[b.state] || b.p.lastAt - a.p.lastAt)
      box = (
        <Box flexDirection="column" borderStyle="round" paddingX={1}>
          {head(`Sessions · ${activePeers.length} active · ${peerList.length} talked to`)}
          {rows.length === 0 ? (
            <Text dimColor>No other sessions messaged from this chat yet.</Text>
          ) : (
            rows.map(({ p, state }) => (
              <Box key={`peer-${p.name}`} flexDirection="row" columnGap={1}>
                <Text {...(state === 'quiet' ? { dimColor: true } : { color: 'permission' })}>{state}</Text>
                <Text dimColor>last {formatElapsed(now - p.lastAt)} ago</Text>
                <Text dimColor>
                  sent {p.sent} · got {p.received}
                </Text>
                <Text wrap="truncate-end">{p.name}</Text>
              </Box>
            ))
          )}
        </Box>
      )
    }

    // Changes is a summary at the top right, nothing to press: files changed and their lines in all.
    const added = fileList.reduce((n, f) => n + f.added, 0)
    const removed = fileList.reduce((n, f) => n + f.removed, 0)
    // It never shrinks, so a narrow panel squeezes the heads on the left instead of pushing it under them.
    const changes = (
      <Box key="changes" flexDirection="row" columnGap={1} flexShrink={0}>
        <Text dimColor>
          {fileList.length} {fileList.length === 1 ? 'file' : 'files'} changed
        </Text>
        {fileList.length > 0 ? <Text color="success">+{added}</Text> : null}
        {fileList.length > 0 ? <Text color="error">-{removed}</Text> : null}
      </Box>
    )

    // A button appears once its box holds anything this chat, live or ended, and stays for the history.
    const buttons = [
      taskList.length > 0 || which === 'running' ? button('running', '▶', liveTasks.length) : null,
      helperList.length > 0 || which === 'helpers' ? button('helpers', '🧑', liveHelpers.length) : null,
      watchList.length > 0 || which === 'watching' ? button('watching', '⏰', liveWatches.length) : null,
      peerList.length > 0 || which === 'sessions'
        ? button('sessions', '💬', activePeers.length, `${activePeers.length}/${peerList.length}`)
        : null,
    ].filter(b => b !== null)

    // A blank row under the strip keeps it off the context bar.
    const strip = (
      <Box flexDirection="column" marginBottom={1}>
        {/* Heads on the left; on the right, files changed with the buttons under it. */}
        <Box flexDirection="row" justifyContent="space-between" columnGap={2} flexWrap="nowrap">
          <Box flexDirection="row" alignItems="flex-end" flexShrink={1} minWidth={0}>
            {figures}
          </Box>
          <Box flexDirection="column" alignItems="flex-end" rowGap={1} flexShrink={0}>
            {changes}
            {buttons.length > 0 ? (
              <Box flexDirection="row" columnGap={1} flexWrap="wrap" justifyContent="flex-end">
                {buttons}
              </Box>
            ) : null}
          </Box>
        </Box>
        {box}
      </Box>
    )

    // The strip on top, anything another mod draws in the band, then the context bar right above the prompt.
    const reading = (await read($, isShown)) ? await read($, snapshot) : null

    return (
      <Box key="band" flexDirection="column">
        {strip}
        {below}
        {reading ? bar($.ui.resolve(e), reading, e.props.bodyColumns) : null}
      </Box>
    )
  })
}
