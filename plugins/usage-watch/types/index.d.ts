// Tokens summed from every turn's usage (subagents included) since the mod loaded in this session.
export type UsageWatchTokens = {
  input: number
  cacheWrite: number
  cacheRead: number
  output: number
  turns: number
}

// Which heads-ups this session has already handed to Claude: the context thresholds crossed
// since the fill was last low, and the five-hour window (by its reset time) already warned about.
export type UsageWatchSaid = {
  context: number[]
  fiveHour: string | null
}

declare module 'claude-code' {
  interface PluginState {
    'usage-watch': { tokens: UsageWatchTokens; said: UsageWatchSaid }
  }
}
