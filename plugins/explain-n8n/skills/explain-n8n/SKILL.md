---
name: explain-n8n
description: Explain a concept in your code as an interactive n8n-style workflow page (steps as tiles, branches, loops, sub-workflows, the real code lines and example runs), built as one self-contained HTML file and published as a private Artifact when the host supports it. Manual only, type /explain-n8n <topic | path[:line] | function>.
argument-hint: [topic | path[:line] | function]
disable-model-invocation: true
---

# Explain n8n

Code is often easiest to follow as an n8n drawing. This skill reads the code behind a concept and
builds a page that draws it as a workflow: tiles for the steps, connectors for the data, IF and
Switch branches, loops, sticky notes and sub-workflows. Clicking a step opens n8n's
Input | Parameters | Output view, with what it does, why, how, the n8n node it behaves like, the
real code lines, example data and the gotchas. A walkthrough steps through it in order, example
runs light the path green with item counts, and a document view reads it top to bottom.

Subject for this run: $ARGUMENTS

**Manual only.** It runs when you type `/explain-n8n`. An ordinary "how does X work" question gets a
normal answer in chat.

## The parts

All paths below are relative to this skill's folder (the folder that holds this `SKILL.md`).

- `template.html`: the one renderer. Never edit it during a run; a run only writes data.
- `build.py`: checks `flow.json`, copies the code snippets from the real files, writes `page.html`
  (for publishing) and `preview.html` (a full page to open locally). Run with `--layout` to fill
  missing positions. Python 3 standard library only.
- `reference/flow-schema.md`: the schema, the layout rules, the icons and every error code.
  **Read it before writing `flow.json`, every run.**
- `examples/`: `sample-flow.json` explains the trim-clip script in this repo (real code, with a
  relative `source.root`), and `stress-flow.json` pushes the renderer. `tests/`: run
  `python -m unittest discover -s tests` from this folder.

## Steps

1. **Pin the subject.** From `$ARGUMENTS`, else the conversation or the IDE selection. If there is
   none, ask in one line what to explain, and stop. Say back in one line what the page will cover,
   from where to where, and roughly how many canvases.
2. **Read the code first.** Start at the entry point and follow the calls two levels deep. Note every
   file read (`source.readFiles`). Before attributing a design choice to anyone, check `git log`.
   Never open `.env`, credential or secret files; name a key by its variable only. A step you could
   not confirm in code is marked `assumed` with the reason, never drawn as fact.
3. **Plan the canvases.** The main canvas tells the story in 6 to 12 steps; detail goes into
   sub-workflows (3 levels at most). Pick the runs: the happy path plus the one that teaches most
   (a retry, a failure, a branch). A concept with no code behind it is a concept page: leave out
   `source.root` and the code refs.
4. **Write `flow.json`** in `~/.claude/explain/<YYYY-MM-DD>-<slug>/`, following the schema. Plain
   words, written to the reader ("you"). An n8n analogy wherever one fits. Every term the reader may
   not know goes in the glossary. Example data is invented: never a real person, contact, account or
   secret.
5. **Build.** `python "<skill folder>/build.py" <folder>/flow.json` (add `--layout` the first time if
   positions are missing, then read what it chose). Fix every `E_` line and read every `W_` line;
   fix the ones that hurt reading. Never weaken a check to make a page pass.
6. **Publish.**
   - **If the host has Claude's `Artifact` tool:** `Artifact` with `action: "quickstart"`,
     `intent: "other"`, then publish `<folder>/page.html` with `icon: "diagram"` and a one-sentence
     `description`. The page stays private. If `INDEX.md` already lists this slug, republish to its
     URL instead of making a new one. If the publish refuses the path, copy `page.html` to the
     session scratchpad and publish that.
   - **Otherwise:** the page is self-contained (one HTML file; it only loads fonts and the code
     highlighter from public CDNs). Open `<folder>/preview.html` in a browser, or serve the folder
     with `python -m http.server` and open it there. `page.html` is the same page without the outer
     `<html>` skeleton, for hosts that add their own.
7. **Record it.** Add a line to `~/.claude/explain/INDEX.md`: date, title, repo@commit, canvases,
   nodes, assumed, URL (or the local path when nothing was published), folder. Keep that folder out
   of any public repo: pages can hold code you may not want to share.
8. **Reply in chat.** The link (or the local path), the summary in three lines, the takeaway, the
   key steps written out in the reply (not only on the page), the counts (canvases, nodes, assumed),
   the files read, and repo@commit. Mention any `W_DIRTY`: the page shows code that is not committed
   yet.

## Changing a page later

Edit the saved `flow.json`, build again, and republish to the same URL (step 6). If the folder is
gone, read the published page (`Artifact` with `action: "read"`): it holds the whole flow in its
`flow-data` block.

## Checking a change to the renderer

A change to `template.html` or `build.py` is a UI change: run the tests, build both examples, serve
the output folder with `python -m http.server` and look at `preview.html` in a browser: desktop, a
390px-wide window, light and dark, a step opened, a run played, a sub-workflow opened, the document
view. Delete the build outputs (`flow.built.json`, `page.html`, `preview.html`) from `examples/`
afterwards; they are not meant to be committed.
