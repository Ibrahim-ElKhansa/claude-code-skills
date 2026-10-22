# toolbar

A Claude Code mod that adds a band above the prompt. It shows this chat's pixel character with its helper agents beside
it, how many files the chat has changed, buttons that unfold what is running or waiting in the background, and the
context window as a stacked bar colored by what fills it.

## What it looks like

In the desktop app and the VS Code chat panel (the heads are pixel art there):

```text
 [head] [head] [head]                            3 files changed  +42  -7
 my-app · typing  Explore  general-purpose       [▶ 1] [🧑 2] [⏰ 1] [💬 1/2]

 ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒
 41% · 82k / 200k   ■ Messages 60k   ■ System tools 18k   ■ System prompt 4k
```

In a terminal the heads become one line of text, such as `my-app · typing · 2 helpers`. On a phone, which has no band,
the context bar opens in a pane named Context.

**The character.** Its outfit follows the permission mode. It wears glasses by default, shades and a gold chain when permissions
are bypassed, a red cap when edits are accepted, headphones in "don't ask" mode, and a reading pose in plan mode. The
color mark on its head pulses while Claude works. It frowns for a few seconds after a failed tool call, sweats once a
turn runs past five minutes, falls asleep after fifteen idle minutes, and throws confetti when a git commit or push goes
through.

**The buttons.** Each one appears once its box has held something in this chat, and shows how many are live:

- ▶ **Running**: background shell commands, monitors and workflows, each with a Stop button that asks first.
- 🧑 **Helpers**: the subagents this chat started, live and finished.
- ⏰ **Watching**: what will wake this chat later. That covers timed check backs, scheduled prompts like `/loop`, and
  waits for another session to go idle.
- 💬 **Sessions**: other Claude sessions this chat has messaged or heard from, shown as active / talked to.

**The context bar.** One colored segment per `/context` category, then free space and the auto compact buffer. The
reading turns amber at 70% and red at 85%.

## Commands

- `/context-bar` shows or hides the context bar. The choice is remembered for new sessions.

## Requirements

- Claude Code with mod support (plugins that carry a hooks module). The mod API is early access and may change between
  releases. Last tested with Claude Code 2.1.306.
- The pixel heads draw in the desktop app and the VS Code chat panel. The terminal gets the text line.
- No settings, no API keys and no network calls. It only reads what Claude Code already reports about the session.

## Install

In Claude Code, add the marketplace once, then install this mod:

```text
/plugin marketplace add Ibrahim-ElKhansa/claude-code-skills
/plugin install toolbar@ibrahim-elkhansa
```

Mods need Claude Code 2.1.287 or later, and 2.1.299 or later to draw in the VS Code chat panel.

## Tests

From the repository root:

```text
claude plugin validate ./plugins/toolbar
claude plugin test ./plugins/toolbar
```

## Credits

The pixel characters come from [Pixel Agents](https://github.com/pixel-agents-hq/pixel-agents) by Pablo De Lucca,
released under the MIT license. `hooks/sprites.ts` is generated from its character art, and its license is kept in
[LICENSE-pixel-agents.txt](LICENSE-pixel-agents.txt).

## License

MIT, see the repository's [LICENSE](../../LICENSE).
