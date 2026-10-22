import { expect, mock, test } from 'claude-code/testing'
import type { AgentSpawnInput, CommandRunInput, On, RenderSurface, SessionUsage } from 'claude-code'
import type { MockClock } from 'claude-code/testing'

import { cellsFor, formatTokens, toneFor } from '../hooks/bar'
import { hash, headSvg, helperSprite, mainSprite } from '../hooks/draw'
import { endedStatus, formatDue, formatElapsed, idleNoticesIn, noticesIn, peerMessagesIn, projectOf } from '../hooks/register'

const SITE = { bodyColumns: 100, scroll: { offset: 0, bodyRows: 20 }, view: {} }
const BAND = { component: 'AbovePrompt' as const, props: { ...SITE, hasSurvey: false, isWorking: false, maxRows: 30 } }

const USAGE: SessionUsage = {
  startedAt: 0,
  rateLimits: [{ kind: 'five_hour', percentUsed: 42, resetsAt: '2026-10-14T22:15:00Z' }],
  context: {
    tokens: 82_000,
    window: 200_000,
    percent: 41,
    breakdown: {
      categories: [
        { name: 'System prompt', tokens: 4_000, color: 'promptBorder', isDeferred: false, kind: 'used' },
        { name: 'System tools', tokens: 18_000, color: 'inactive', isDeferred: false, kind: 'used' },
        { name: 'Messages', tokens: 60_000, color: 'permission', isDeferred: false, kind: 'used' },
        { name: 'MCP tools', tokens: 9_000, color: 'inactive', isDeferred: true, kind: 'deferred' },
        { name: 'Free space', tokens: 85_000, color: 'promptBorder', isDeferred: false, kind: 'free' },
        { name: 'Autocompact buffer', tokens: 33_000, color: 'inactive', isDeferred: false, kind: 'buffer' },
      ],
      totalTokens: 82_000,
      maxTokens: 200_000,
      rawMaxTokens: 200_000,
      autocompactSource: 'model-default',
      percentage: 41,
      gridRows: [],
      model: 'claude-opus-5-5',
      memoryFiles: [],
      mcpTools: [],
      agents: [],
      isAutoCompactEnabled: true,
      apiUsage: null,
    },
  },
}

const RUN: CommandRunInput = {
  command: 'context-bar',
  args: '',
  origin: { kind: 'composer' },
  presentation: { isFullscreen: false, columns: 80 },
}

const ROOT = '/home/user/projects/my-app'

// An Agent call's spawn as the engine raises it, the fields it fills included.
const spawnOf = (prompt: string, description: string, more: { subagentType?: string; name?: string } = {}): AgentSpawnInput => ({
  tool_use_id: `toolu_${description.replace(/\W+/g, '_')}`,
  prompt,
  description,
  subagentType: more.subagentType ?? 'general-purpose',
  provider: { plugin: 'engine', tier: 'core' },
  parentModel: 'claude-opus-5-5',
  background: true,
  fork: false,
  ...(more.name ? { name: more.name } : {}),
})

// The world beneath the mod: the session, the usage reading, the store, the pane calls, and an empty band.
const world = (
  on: On,
  surfaces: readonly RenderSurface[],
  stored: Record<string, unknown> = {},
  given: { usage?: SessionUsage } = {},
) => {
  const panes: string[] = []
  const open = new Set<string>()
  mock.store(on, stored)
  const clock = mock.clock(on, { now: Date.parse('2026-10-14T20:00:00Z') })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.surfaces', () => ({ value: surfaces }))
  on('session.id', () => ({ value: '8b1d0d2f-2cd3-4048-861e-43bc4ae9079b' }))
  on('session.cwd', () => ({ value: ROOT }))
  on('session.root', () => ({ value: ROOT }))
  on('session.usage', () => ({ value: given.usage ?? USAGE }))
  on('session.messages', () => ({ value: [{ role: 'user' as const, text: 'please fix the build', toolUses: [] }] }))
  on('command.register', (_, e) => ({ value: { command: e.name } }))
  on('tool.call', () => ({ result: {}, text: 'ok' }))
  on('ui.open', (_, e) => {
    panes.push(`open ${e.id}`)
    open.add(e.id)
    return { value: { isPlaced: true as const } }
  })
  on('ui.close', (_, e) => {
    panes.push(`close ${e.id}`)
    open.delete(e.id)
    return { value: undefined }
  })
  on('ui.panes', () => ({
    value: [...open].map(id => ({ id, title: id, isShown: true, isFocused: false, isPlaced: true })),
  }))
  on('ui.render', ($, e) => $.ui.resolve(e).Box({}))
  on('classic.Stop', () => ({}))
  on('classic.UserPromptSubmit', () => ({}))
  on('classic.Notification', () => ({}))

  return { panes, clock }
}

test('the same chat always gets the same character, and its helpers another one', async () => {
  // main = hash(key) % 6, helper = (hash(key) + 1 + hash(agent) % 5) % 6
  const key = '8b1d0d2f-2cd3-4048-861e-43bc4ae9079b'
  expect(mainSprite(key)).toBe(hash(key) % 6)
  expect(helperSprite(key, 'a1')).toBe((hash(key) + 1 + (hash('a1') % 5)) % 6)
  expect(helperSprite(key, 'a1')).not.toBe(mainSprite(key))
  expect(hash('')).toBe(0)

  expect(projectOf(ROOT)).toBe('my-app')
  expect(projectOf('C:\\code\\my-app\\')).toBe('my-app')
  expect(projectOf('/')).toBe('?')
  expect(formatElapsed(125_000)).toBe('2m 05s')

  const working = headSvg({ sprite: 2, sessionKey: key, mode: 'bypassPermissions', status: 'working' }, 2)
  const idle = headSvg({ sprite: 2, sessionKey: key, mode: 'default', status: 'idle' }, 2)
  expect(working.startsWith('<svg')).toBe(true)
  expect(working.includes('<animate')).toBe(true)
  expect(idle.includes('<animate')).toBe(false)
  expect(working.length < 131_072).toBe(true)
})

test('the context bar\'s cells add up to the width and every used segment shows', async () => {
  const segments = [
    { name: 'tiny', tokens: 10, color: 'a', kind: 'used' as const },
    { name: 'big', tokens: 150_000, color: 'b', kind: 'used' as const },
    { name: 'Free space', tokens: 49_990, color: 'c', kind: 'free' as const },
  ]
  for (const width of [10, 37, 80, 143]) {
    const cells = cellsFor(segments, 200_000, width)
    expect(cells.reduce((a, b) => a + b, 0)).toBe(width)
    expect(cells[0]).toBe(1)
  }
  expect(formatTokens(82_000)).toBe('82k')
  expect(formatTokens(1_000_000)).toBe('1M')
  expect(formatTokens(950)).toBe('950')
})

test('Running and Helpers open their box above the prompt', async ($, on) => {
  world(on, ['vscode'])
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  await $.classic.Stop({ stop_hook_active: false, background_tasks: [
    { id: 'b1', type: 'shell', status: 'running', description: 'npm run build' },
    { id: 'a9', type: 'subagent', status: 'running', description: 'Search the bookings code' },
  ] })

  for (const surface of ['vscode', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'toolbar', surface, ...BAND })
    expect(await ui.find({ type: 'Svg' })).toBeDefined()
    // Icons for labels, and a button only once its box holds something.
    expect((await ui.find({ key: 'open-running' }))?.props.label).toBe('▶ 1')
    expect(await ui.find({ key: 'open-helpers' })).toBeUndefined()
    expect(await ui.find({ key: 'open-watching' })).toBeUndefined()
    expect(await ui.find({ key: 'open-sessions' })).toBeUndefined()

    await ui.press({ key: 'open-running' })
    expect(await ui.find({ type: 'Text', text: /npm run build/ })).toBeDefined()
    // A background helper agent belongs to Helpers, not Running.
    expect(await ui.find({ type: 'Text', text: /Search the bookings code/ })).toBeUndefined()
    await ui.press({ key: 'close' })
    expect(await ui.find({ type: 'Text', text: /npm run build/ })).toBeUndefined()
    await ui.unmount()
  }
})

// A running helper agent must never make the band vanish.
test('a live helper draws its head beside the main one, and the band stays', async ($, on) => {
  world(on, ['vscode'])
  let n = 0
  on('agent.spawn', () => ({ model: 'claude-opus-5-5', agentId: `a${++n}` }))
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  await $.classic.UserPromptSubmit({ prompt: 'look into the band' })
  await $.agent.spawn(spawnOf('Search the bookings code', 'Search bookings', { subagentType: 'Explore' }))
  await $.agent.spawn(spawnOf('Read the README', 'Read README'))

  for (const surface of ['vscode', 'desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ plugin: 'toolbar', surface, ...{ ...BAND, props: { ...BAND.props, isWorking: true } } })
    expect(await ui.find({ key: 'band' })).toBeDefined()
    expect(await ui.find({ key: 'open-helpers' })).toBeDefined()
    if (surface !== 'terminal') expect(await ui.find({ key: 'h-a1' })).toBeDefined()
    await ui.press({ key: 'open-helpers' })
    expect(await ui.find({ type: 'Text', text: /Helpers · 2 working/ })).toBeDefined()
    await ui.press({ key: 'close' })
    await ui.unmount()
  }
})

test('a task notice reads as its id and how it ended', async () => {
  const notice = '<task-notification>\n<task-id>b2ya20qo3</task-id>\n<status>completed</status>\n</task-notification>'
  expect(noticesIn(`note\n${notice}\n${notice.replace('b2ya20qo3', 'x1').replace('completed', 'killed')}`)).toEqual([
    { id: 'b2ya20qo3', status: 'completed' },
    { id: 'x1', status: 'killed' },
  ])
  expect(noticesIn('no notice here')).toEqual([])
  expect(endedStatus('completed')).toBe('finished')
  expect(endedStatus('killed')).toBe('stopped')
  expect(endedStatus('failed')).toBe('failed')
  expect(endedStatus(undefined)).toBe('finished')
})

// A finished task and a stopped one must not stay listed as running.
test('Running lets a task go when its notice says it ended, when Claude stops it, or when a turn end lists it ended', async ($, on) => {
  world(on, ['vscode'])
  const session = mock.session(on)
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  await $.classic.Stop({ stop_hook_active: false, background_tasks: [
    { id: 'b1', type: 'shell', status: 'running', description: 'Watch the phone sync' },
    { id: 'b2', type: 'shell', status: 'running', description: 'Watch the new session' },
    { id: 'b3', type: 'shell', status: 'running', description: 'npm run build' },
  ] })

  // The notice as the session keeps it: a user row its queue delivered, from origin task-notification.
  await $.session.append({
    door: 'queue',
    origin: { kind: 'task-notification' },
    uuid: 'notice-b1',
    message: { type: 'user', role: 'user', content: [{ type: 'text' as const, text:
      '<task-notification>\n<task-id>b1</task-id>\n<status>completed</status>\n</task-notification>' }] },
  })
  // The notice is kept as it came: the box reads it and passes it on.
  expect(session.appended().length).toBe(1)
  await $.tool.call({ tool: 'TaskStop', task_id: 'b2' })

  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  await ui.press({ key: 'open-running' })
  expect(await ui.find({ type: 'Text', text: /Running in the background · 1/ })).toBeDefined()
  expect(await ui.find({ key: 'stop-b1' })).toBeUndefined()
  expect(await ui.find({ key: 'stop-b2' })).toBeUndefined()
  expect(await ui.find({ key: 'stop-b3' })).toBeDefined()
  // The box stays open across draws; Running again would fold it.
  await ui.press({ key: 'close' })
  await ui.unmount()

  // The engine listing a task as completed is no reason to keep it running.
  await $.classic.Stop({ stop_hook_active: false, background_tasks: [
    { id: 'b3', type: 'shell', status: 'completed', description: 'npm run build' },
  ] })
  const after = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  await after.press({ key: 'open-running' })
  expect(await after.find({ type: 'Text', text: /Running in the background · 0/ })).toBeDefined()
  expect(await after.find({ type: 'Text', text: /^stopped$/ })).toBeDefined()
  expect(await after.find({ type: 'Text', text: /^finished$/ })).toBeDefined()
  await after.unmount()
})

// The envelope and the idle notice as real sessions send them.
const PEER = 'uds:\\\\.\\pipe\\LOCAL\\cc-msg-f41c4fd17e5b84be1df1a9e4de4efeb9'
const FROM_PEER = `<cross-session-message from="${PEER}" from-name="api-server-1" from-mode="bypass">\nThe deploy is done.\n</cross-session-message>`
const IDLE = '[Cross-session idle notice] "api-server-1", which you asked to be notified about, is idle now. This is an automated notice.'
const row = (uuid: string, text: string, door: 'delivery' | 'queue' | 'prompt', kind: 'peer-send-message' | 'unclassified' | 'scheduled-trigger') => ({
  door,
  origin: { kind },
  uuid,
  message: { type: 'user' as const, role: 'user' as const, content: [{ type: 'text' as const, text }] },
})

test('the envelopes read as who spoke, which session went idle, and how long until', async () => {
  expect(peerMessagesIn(FROM_PEER)).toEqual([{ address: PEER, name: 'api-server-1' }])
  // The SendMessage tool's own description shows the envelope with "..." for the address.
  expect(peerMessagesIn('arrives wrapped as <cross-session-message from="...">')).toEqual([])
  expect(idleNoticesIn(IDLE)).toEqual([{ name: 'api-server-1', isExpired: false }])
  expect(idleNoticesIn('[Cross-session idle notice] The subscription to "x" expired.')).toEqual([{ name: 'x', isExpired: true }])
  expect(formatDue(1_600_000, 1_000_000)).toBe('in 10m 00s')
  expect(formatDue(1_000_000, 1_000_000)).toBe('due now')
})

test('Watching counts a check-back down, stop:true cancels it, and the scheduled turn marks the next one fired', async ($, on) => {
  // A test's own hook may not call $, so the engine's answer reads the test's clock.
  let clock: MockClock | null = null
  on('tool.call', { tool: 'ScheduleWakeup' }, (_, e) => ({
    result: { scheduledFor: (clock?.now() ?? 0) + (e.delaySeconds ?? 0) * 1000, clampedDelaySeconds: e.delaySeconds ?? 0, wasClamped: false },
    text: 'ok',
  }))
  const time = world(on, ['vscode']).clock
  clock = time
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  await $.tool.call({ tool: 'ScheduleWakeup', delaySeconds: 600, reason: 'See whether the sync caught up', prompt: '/loop check the sync' })

  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect((await ui.find({ key: 'open-watching' }))?.props.label).toBe('⏰ 1')
  await ui.press({ key: 'open-watching' })
  expect(await ui.find({ type: 'Text', text: /Watching · 1/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^in 10m 00s$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^check-back$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /See whether the sync caught up/ })).toBeDefined()
  // The open box keeps counting.
  await time.advance(60_000)
  expect(await ui.find({ type: 'Text', text: /^in 9m 00s$/ })).toBeDefined()
  await ui.press({ key: 'close' })
  await ui.unmount()

  await $.tool.call({ tool: 'ScheduleWakeup', stop: true })
  await $.tool.call({ tool: 'ScheduleWakeup', delaySeconds: 60, reason: 'Look at the deploy', prompt: '/loop look' })
  await time.advance(61_000)
  await $.session.append(row('w1', '/loop look', 'prompt', 'scheduled-trigger'))
  const after = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect((await after.find({ key: 'open-watching' }))?.props.label).toBe('⏰ 0')
  await after.press({ key: 'open-watching' })
  expect(await after.find({ type: 'Text', text: /^cancelled$/ })).toBeDefined()
  expect(await after.find({ type: 'Text', text: /^fired$/ })).toBeDefined()
})

test('a scheduled prompt shows its schedule, and the turn-end list adds, keeps and ends schedules', async ($, on) => {
  on('tool.call', { tool: 'CronCreate' }, () => ({
    result: { id: 'c1', humanSchedule: 'Every day at 9:03 AM', recurring: true, nextFireAt: Date.parse('2026-10-14T21:00:00Z') },
    text: 'ok',
  }))
  world(on, ['vscode'])
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  await $.tool.call({ tool: 'CronCreate', cron: '3 9 * * *', prompt: 'Read the overnight log\nand say what failed' })

  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  await ui.press({ key: 'open-watching' })
  expect(await ui.find({ type: 'Text', text: /^Read the overnight log$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^Every day at 9:03 AM$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^in 1h 00m$/ })).toBeDefined()
  await ui.press({ key: 'close' })
  await ui.unmount()

  // A schedule the box never saw made (an autonomous /loop's) joins from the list.
  await $.classic.Stop({ stop_hook_active: false, session_crons: [
    { id: 'c1', schedule: '3 9 * * *', recurring: true, prompt: 'Read the overnight log' },
    { id: 'c2', schedule: '30 14 21 10 *', recurring: false, prompt: '<<autonomous-loop>>' },
  ] })
  const listed = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect((await listed.find({ key: 'open-watching' }))?.props.label).toBe('⏰ 2')
  await listed.press({ key: 'open-watching' })
  expect(await listed.find({ type: 'Text', text: /^\/loop$/ })).toBeDefined()
  expect(await listed.find({ type: 'Text', text: /30 14 21 10 \* · once/ })).toBeDefined()
  await listed.press({ key: 'close' })
  await listed.unmount()

  await $.tool.call({ tool: 'CronDelete', id: 'c1' })
  await $.classic.Stop({ stop_hook_active: false, session_crons: [] })
  const after = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect((await after.find({ key: 'open-watching' }))?.props.label).toBe('⏰ 0')
  await after.press({ key: 'open-watching' })
  expect(await after.find({ type: 'Text', text: /^cancelled$/ })).toBeDefined()
  expect(await after.find({ type: 'Text', text: /^done$/ })).toBeDefined()
})

test('Sessions counts other sessions only, waits until the idle notice, and goes quiet after 30 minutes', async ($, on) => {
  const { clock } = world(on, ['vscode'])
  on('agent.spawn', () => ({ model: 'claude-opus-5-5', agentId: 'a562ab0620169406d' }))
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  await $.agent.spawn(spawnOf('Look around', 'Look around', { subagentType: 'Explore', name: 'scout' }))

  // A message in: its queue record and its row are one message.
  await $.session.append(row('q1', FROM_PEER, 'queue', 'peer-send-message'))
  await $.session.append(row('m1', FROM_PEER, 'delivery', 'peer-send-message'))
  // The answer goes to its address and asks to hear when that session is idle.
  await $.tool.call({ tool: 'SendMessage', to: PEER, message: 'Thanks, installing now.', notify_when_idle: true })
  // This chat's own helper and the main conversation are not other sessions.
  await $.tool.call({ tool: 'SendMessage', to: 'main', message: 'x' })
  await $.tool.call({ tool: 'SendMessage', to: 'scout', message: 'x' })
  await $.tool.call({ tool: 'SendMessage', to: 'a562ab0620169406d', message: 'x' })

  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect((await ui.find({ key: 'open-sessions' }))?.props.label).toBe('💬 1/1')
  expect((await ui.find({ key: 'open-watching' }))?.props.label).toBe('⏰ 1')
  await ui.press({ key: 'open-sessions' })
  expect(await ui.find({ type: 'Text', text: /Sessions · 1 active · 1 talked to/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^waiting$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^sent 1 · got 1$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^api-server-1$/ })).toBeDefined()
  await ui.press({ key: 'open-watching' })
  expect(await ui.find({ type: 'Text', text: /^api-server-1 to go idle$/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /^until it goes idle$/ })).toBeDefined()
  await ui.press({ key: 'close' })
  await ui.unmount()

  await $.session.append(row('n1', IDLE, 'delivery', 'unclassified'))
  const idle = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect((await idle.find({ key: 'open-watching' }))?.props.label).toBe('⏰ 0')
  await idle.press({ key: 'open-sessions' })
  expect(await idle.find({ type: 'Text', text: /^active$/ })).toBeDefined()
  await idle.press({ key: 'close' })
  await idle.unmount()

  await clock.advance(31 * 60_000)
  const quiet = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect((await quiet.find({ key: 'open-sessions' }))?.props.label).toBe('💬 0/1')
  await quiet.press({ key: 'open-sessions' })
  expect(await quiet.find({ type: 'Text', text: /^quiet$/ })).toBeDefined()
  await quiet.press({ key: 'close' })
  await quiet.unmount()

  // A plain message with no answer waits 30 minutes, then goes quiet.
  await $.tool.call({ tool: 'SendMessage', to: 'docs-session', message: 'Thanks, all done here.' })
  const sent = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect((await sent.find({ key: 'open-sessions' }))?.props.label).toBe('💬 1/2')
  await sent.unmount()
  await clock.advance(31 * 60_000)
  const late = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect((await late.find({ key: 'open-sessions' }))?.props.label).toBe('💬 0/2')
})

test('Changes is a summary of files and lines, with nothing to press', async ($, on) => {
  world(on, ['vscode'])
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect(await ui.find({ type: 'Text', text: /0 files changed/ })).toBeDefined()
  await ui.unmount()

  await $.tool.call({ tool: 'Edit', file_path: `${ROOT}/src/bookings.ts`, old_string: 'a', new_string: 'b\nc' })
  await $.tool.call({ tool: 'Edit', file_path: `${ROOT}/src/bookings.ts`, old_string: 'x\ny\nz', new_string: 'w' })
  await $.tool.call({ tool: 'Write', file_path: `${ROOT}/notes.md`, content: 'one\ntwo\nthree' })

  const after = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect(await after.find({ type: 'Text', text: /2 files changed/ })).toBeDefined()
  expect(await after.find({ type: 'Text', text: /^\+6$/ })).toBeDefined()
  expect(await after.find({ type: 'Text', text: /^-4$/ })).toBeDefined()
  expect(await after.find({ key: 'open-changes' })).toBeUndefined()
  expect(await after.find({ text: /bookings\.ts/ })).toBeUndefined()
})

test('the band holds the strip and the context bar together, with no limits rows and no pane', async ($, on) => {
  const { panes } = world(on, ['terminal', 'vscode'])
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })

  for (const surface of ['terminal', 'desktop', 'vscode'] as const) {
    const ui = await $.ui.mount({ plugin: 'toolbar', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: /0 files changed/ })).toBeDefined()
    // A quiet chat shows no buttons yet.
    expect(await ui.find({ key: 'open-running' })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /41% · 82k \/ 200k/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Messages 60k/ })).toBeDefined()
    // The band draws no usage-limit rows.
    expect(await ui.find({ type: 'Text', text: /42%/ })).toBeUndefined()
    await ui.unmount()
  }
  expect(panes).toEqual([])
})

test('/context-bar hides and shows the bar, and the strip stays', async ($, on) => {
  world(on, ['vscode'])
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })

  expect((await $.command.run(RUN)).text).toMatch(/^Context bar off\./)
  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect(await ui.find({ type: 'Text', text: /41% · 82k/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /0 files changed/ })).toBeDefined()
  await ui.unmount()

  expect((await $.command.run(RUN)).text).toBe('Context bar on · 41% · 82k / 200k')
})

test('on a phone the bar opens in a pane', async ($, on) => {
  const { panes } = world(on, ['mobile'])
  await $.session.start({ cwd: '/', surface: 'mobile', isInteractive: true })
  expect(panes).toEqual(['open context'])

  const ui = await $.ui.mount({
    plugin: 'toolbar',
    surface: 'mobile',
    component: 'Pane',
    requestId: 'context',
    props: { ...SITE, title: 'Context', isFocused: false, placement: 'inline' },
  })
  expect(await ui.find({ type: 'Text', text: /Messages 60k/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /MCP tools/ })).toBeUndefined()
})

test('a new session stays quiet once /context-bar turned the bar off', async ($, on) => {
  const { panes } = world(on, ['mobile'], { isShown: false })
  await $.session.start({ cwd: '/', surface: 'mobile', isInteractive: true })

  expect(panes).toEqual([])
})

test('the terminal gets the strip as text, with no picture', async ($, on) => {
  world(on, ['terminal'])
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: /^my-app · idle/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /0 files changed/ })).toBeDefined()
})

test('the context reading turns amber at 70% and red at 85%', async ($, on) => {
  expect(toneFor(69)).toBe(null)
  expect(toneFor(70)).toBe('warning')
  expect(toneFor(85)).toBe('error')
  world(on, ['vscode'], {}, { usage: { ...USAGE, context: { ...USAGE.context, percent: 86 } } })
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect((await ui.find({ type: 'Text', text: /^86% · 82k/ }))?.props.color).toBe('error')
})

// The main head's picture, as the band drew it last.
const headOf = async (ui: { find: (q: { type: string }) => Promise<{ props: Record<string, unknown> } | undefined> }) =>
  String((await ui.find({ type: 'Svg' }))?.props.source ?? '')

test('the head frowns after a failed tool call, and the frown passes', async ($, on) => {
  on('tool.call', { tool: 'Read' }, () => ({ isError: true as const, result: 'File does not exist.', text: 'File does not exist.' }))
  const { clock } = world(on, ['vscode'])
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  await $.tool.call({ tool: 'Read', file_path: `${ROOT}/nope.txt` })
  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  expect(await headOf(ui)).toContain('id="frown"')
  await clock.advance(9_000)
  expect(await headOf(ui)).not.toContain('id="frown"')
})

test('waiting for the person raises no flag, and fifteen idle minutes put the head to sleep until a prompt', async ($, on) => {
  const { clock } = world(on, ['vscode'])
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  await $.classic.UserPromptSubmit({ prompt: 'fix the bar' })
  await $.classic.Stop({ stop_hook_active: false })
  await $.classic.Notification({ message: 'Claude is waiting for your input', notification_type: 'idle_prompt' })
  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  // The question dialog covers the band, so there is no red "!" or "needs you" flag.
  expect(await headOf(ui)).not.toContain('#ff5a4f')
  expect(await ui.find({ type: 'Text', text: /needs you/ })).toBeUndefined()
  expect(await headOf(ui)).not.toContain('id="asleep"')
  await clock.advance(15 * 60_000 + 1_000)
  expect(await headOf(ui)).toContain('id="asleep"')
  expect(await ui.find({ type: 'Text', text: /asleep/ })).toBeDefined()
  await $.classic.UserPromptSubmit({ prompt: 'wake up' })
  expect(await headOf(ui)).not.toContain('id="asleep"')
})

test('a turn past five minutes sweats until it ends', async ($, on) => {
  const { clock } = world(on, ['vscode'])
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  await $.classic.UserPromptSubmit({ prompt: 'a long job' })
  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  await clock.advance(4 * 60_000)
  expect(await headOf(ui)).not.toContain('id="sweat"')
  await clock.advance(61_000)
  expect(await headOf(ui)).toContain('id="sweat"')
  await $.classic.Stop({ stop_hook_active: false })
  expect(await headOf(ui)).not.toContain('id="sweat"')
})

test('a commit or push throws confetti over the head, and a plain command does not', async ($, on) => {
  on('tool.call', { tool: 'Bash' }, () => ({
    result: {
      stdout: '[main 4bdf3d6] toolbar: head extras',
      stderr: '',
      interrupted: false,
      gitOperation: { commit: { sha: '4bdf3d6', kind: 'committed' as const, branch: 'main' } },
    },
    text: 'ok',
  }))
  const { clock } = world(on, ['vscode'])
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  const ui = await $.ui.mount({ plugin: 'toolbar', surface: 'vscode', ...BAND })
  await $.tool.call({ tool: 'PowerShell', command: 'git status' })
  expect(await headOf(ui)).not.toContain('id="confetti"')
  await $.tool.call({ tool: 'Bash', command: 'git commit -F msg.txt' })
  expect(await headOf(ui)).toContain('id="confetti"')
  await clock.advance(5_000)
  expect(await headOf(ui)).not.toContain('id="confetti"')
})

test('the band has no background of its own, and makes no network call', async ($, on) => {
  let fetches = 0
  on('http.fetch', () => {
    fetches++
    return { value: { status: 200, ok: true, headers: {}, text: '{}' } }
  })
  const { clock } = world(on, ['vscode', 'terminal'])
  await $.session.start({ cwd: '/', surface: 'vscode', isInteractive: true })
  for (const surface of ['vscode', 'desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ plugin: 'toolbar', surface, ...BAND })
    await clock.advance(10_000)
    expect((await ui.find({ key: 'band' }))?.props.backgroundColor).toBeUndefined()
    await ui.unmount()
  }
  expect(fetches).toBe(0)
})
