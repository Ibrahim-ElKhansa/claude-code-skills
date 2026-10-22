// This chat as the toolbar shows it: its key (the session id), the folder it started in and the name taken from it,
// its permission mode and what it is doing.
export type OfficeMain = {
  sessionKey: string
  project: string
  cwd: string
  mode: string
  status: 'idle' | 'working'
}

// One subagent this chat started, from its spawn to the end of its turn.
export type OfficeHelper = {
  id: string
  // The name the Agent call gave it, when one: SendMessage can address it by that.
  name?: string
  type: string
  description: string
  startedAt: number
  endedAt: number | null
  status: string
}

// One thing that will wake this chat later: a timed check-back (ScheduleWakeup), a scheduled prompt (CronCreate,
// /loop), or a wait for another session to go idle (SendMessage with notify_when_idle). Live while `waiting`.
export type OfficeWatch = {
  id: string
  kind: 'wakeup' | 'cron' | 'idle'
  label: string
  detail: string
  isRecurring: boolean
  startedAt: number
  dueAt: number | null
  endedAt: number | null
  status: string
}

// One other Claude session this chat has messaged or heard from, and how often each way.
export type OfficePeer = {
  name: string
  address: string
  sent: number
  received: number
  firstAt: number
  lastAt: number
  lastWay: 'in' | 'out'
}

// One file changed this chat, with the lines its edits added and removed.
export type OfficeFile = {
  path: string
  added: number
  removed: number
  edits: number
  isWritten: boolean
  lastAt: number
}

// One background task: a shell, monitor or subagent the turn left running.
export type OfficeTask = {
  id: string
  type: string
  description: string
  log: string
  startedAt: number
  endedAt: number | null
  status: string
}

// The moments the head's extras read: a turn's start (sweat), the last turn's end (asleep), and until when it frowns
// after a failed tool call and throws confetti after a commit or push. Times are $.clock milliseconds.
export type OfficeFace = {
  turnStartedAt: number | null
  idleSince: number | null
  frownUntil: number
  partyUntil: number
}

// One /context category's share of the window, as the context bar draws it.
export type ContextBarSegment = {
  name: string
  tokens: number
  color: string
  kind: 'used' | 'free' | 'buffer'
}

export type ContextBarSnapshot = {
  percent: number
  tokens: number
  window: number
  measuredAgainst: number
  segments: ContextBarSegment[]
}

declare module 'claude-code' {
  interface PluginState {
    toolbar: {
      main: OfficeMain
      helpers: OfficeHelper[]
      files: OfficeFile[]
      tasks: OfficeTask[]
      watches: OfficeWatch[]
      peers: OfficePeer[]
      open: string | null
      tick: number
      face: OfficeFace
      beat: number
      snapshot: ContextBarSnapshot | null
      isShown: boolean
    }
  }
}
