---
name: trim-clip
description: Take the best part out of a game clip or any recording. Makes a new copy of a video that keeps only its last 30 seconds (or any length you ask for, such as 45 or 60), compressed to a shareable 1080p MP4, and saves it on the Desktop; the original recording is never touched. Use when someone types /trim-clip, or says "trim my clip", "cut the last 30 seconds", "keep the last 45 seconds", "do it with my last two Minecraft videos", "compress my clips", "get my clips ready to share". Works on paths given, or on the newest recordings in the Videos folder (NVIDIA instant replay, Xbox Game Bar and OBS all save there by default).
argument-hint: [video paths, or "last 2 minecraft"] [seconds]
---

# Trim clip

Request for this run: $ARGUMENTS

Keeps the end of a recording, because an instant replay clip ends the moment you pressed save: the last few seconds
are the moment you wanted. The script reads the original and writes a separate file, so the recording itself is never
trimmed, moved or deleted.

Script: `trim_clip.py` in this skill's base directory (Python 3, needs ffmpeg). It runs on Windows, macOS and Linux.

## How long a clip

The default is the **last 30 seconds**. Any length works: pass `--seconds 45`, `--seconds 60` or `--seconds 12.5`.

- A length named in the request ("keep the last 45 seconds", "a minute", "last 20s") sets `--seconds`.
- No length named: keep 30, and say in the reply that another length is one word away.
- A clip shorter than the length asked is kept whole, still compressed, and the reply says so.

## Steps

1. **Pick the videos.**
   - Paths given: use them.
   - "The last N <game> clips": run with `--latest N --match <game> --list` first. It prints each pick with the time it
     was saved. If the request sets a window ("less than an hour ago") and a pick falls outside it, drop that one and
     say so. Otherwise go straight on, no confirmation.
   - Nothing named at all: take the single newest video (`--latest 1`).
2. **Run it.** Same arguments without `--list`, plus `--seconds S` when a length was named.

   ```sh
   python "<this skill's base directory>/trim_clip.py" --latest 2 --match Minecraft --seconds 45
   ```

   Use `python3` on macOS and Linux if `python` is not found.

3. **Check the output.** The script probes every file it wrote and prints its length, height and size. Each length
   must be within half a second of the asked length (or the full clip, when the clip was shorter). A wrong length or
   an ffmpeg error is reported as a failure, never as done.
4. **Reply** with a small table: source clip, saved time, new file, length, size before and after.

## Defaults and flags

| Flag | Default | What it does |
| --- | --- | --- |
| `--seconds` | 30 | How much of the end to keep, any number of seconds |
| `--latest` | off | Take the N newest videos under the Videos folder |
| `--match` | off | With `--latest`, only paths containing this text, such as a game's folder name |
| `--out` | the Desktop | Output folder (on Windows read from the system, so a moved Desktop is followed) |
| `--max-height` | 1080 | Anything taller is scaled down to 1080p; `0` keeps full resolution |
| `--crf` | 23 | x264 quality: lower is sharper and bigger (18 looks close to lossless) |
| `--list` | off | Show what would be trimmed and encode nothing |

- Video: H.264 (libx264, preset slow), yuv420p, frame rate kept. Audio: AAC 160k. `+faststart`, so it plays straight
  away when shared.
- More than one audio track (NVIDIA can save the microphone separately): the tracks are mixed into one, since most
  players and apps only play the first.
- Output name: `<original name> - last 30s.mp4` (or the length asked). An existing file is never overwritten; the new
  one gets `(2)`, `(3)` and so on.

## If ffmpeg is missing

The script says so and stops. Install it, then run again:

- Windows: `winget install --id Gyan.FFmpeg --exact` (the script also finds this install before a new shell sees it)
- macOS: `brew install ffmpeg`
- Linux: `sudo apt install ffmpeg` (or your distribution's package)

Installing software changes the computer, so ask before running the install command.
