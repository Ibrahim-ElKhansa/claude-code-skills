# usage-watch

A Claude Code mod that answers two commands in chat and keeps an eye on your limits. `/usage-now` shows your five hour
and weekly usage windows with their reset times, plus how full the context is. `/cost-now` shows what this session has
cost so far and where the tokens went. When the five hour window passes 80%, or the context passes 70% and then 85%,
Claude is told to mention it in one short line at the top of its next reply.

## What it looks like

```text
> /usage-now
Five-hour 42% (resets in 2h 15m) · Weekly 18% (resets in 4d 3h) · Context 23% (230k / 1M)

> /cost-now
$12.35 so far this session (API-equivalent, as /cost counts it). Tokens over 2 turns since usage-watch started,
subagents included: cache writes 120k · output 8k · cache reads 1.8M · uncached input 2k.
```

After a threshold, Claude opens its next reply with a line in its own words, something like:

```text
Heads up, the context is 72% full (720k / 1M).
```

## How the heads up works

The mod appends a short hidden note at the end of the conversation (a row Claude reads but you never see as typed), so
the prompt cache keeps everything before it. Each context threshold fires once, and both arm again when the context drops
below 50% again, after a compaction or `/clear`. The five hour warning fires once per window.

## Commands

- `/usage-now`: the five hour and weekly windows with reset times, and the context.
- `/cost-now`: the session's cost so far, with cache writes, output, cache reads and uncached input split out.

## Requirements

- Claude Code with mod support (plugins that carry a hooks module). The mod API is early access and may change between
  releases. Last tested with Claude Code 2.1.306.
- The limit figures are the ones Claude Code itself reports. Until it has a reading, `/usage-now` says so and shows the
  context alone.
- No settings, no API keys and no network calls.

## Install

In Claude Code, add the marketplace once, then install this mod:

```text
/plugin marketplace add Ibrahim-ElKhansa/claude-code-skills
/plugin install usage-watch@ibrahim-elkhansa
```

Mods need Claude Code 2.1.287 or later.

## Tests

From the repository root:

```text
claude plugin validate ./plugins/usage-watch
claude plugin test ./plugins/usage-watch
```

## License

MIT, see the repository's [LICENSE](../../LICENSE).
