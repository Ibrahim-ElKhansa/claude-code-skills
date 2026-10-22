---
name: study-competition
description: Study the market around a business or startup idea and report what to do with it. Finds the current competitors (local and online), their prices, their paid ads and their negative reviews, groups the complaints, finds the gaps nobody fills, turns rivals' weak spots into selling points and video hooks, checks Google Trends, finds where the idea already works abroad (the "global Hormozi" check), and advises improving the idea or pivoting to a new one. Works inside a repo (reads the niche from its README) or with no repo at all (asks about the idea and where it launches). Also checks a single rival from a pasted ad, video or link. Use when someone types /study-competition, or says "study the competition", "competitor research", "market study", "market analysis", "who competes with ...", "is this a competitor?", "check this ad / this company", "find gaps in the market", "what are people complaining about in this niche", "turn their bad reviews into our selling points", "where else is this a niche", "who does this abroad", "Hormozi theory", "find the Chinese version of ...".
argument-hint: "[quick|full|rival|abroad] [idea, link or nothing]"
---

# Study the competition

Request for this run: $ARGUMENTS

This skill studies a niche the way a careful analyst would: who already sells to these customers, what they charge,
how they advertise, what their customers hate about them, and what that leaves open. It ends with concrete advice:
selling points and video hooks built on rivals' weaknesses, changes to the idea, or a better idea.

It researches and writes notes. It never pays for anything, signs in anywhere, posts, sends or buys.

## Modes

Read the arguments first and pick one:

| Mode | When | What it does |
|---|---|---|
| **study** (default) | `/study-competition`, `/study-competition quick`, `/study-competition full`, or an idea in words | The whole study, at the depth picked in the first dialog |
| **rival** | `/study-competition rival <link>`, or one ad, video, screenshot or company with "is this a competitor?" | A short check of one company: who they are, what they sell, prices, ads, top complaints, and a verdict. Adds one rival file to the existing study |
| **abroad** | `/study-competition abroad <idea>`, or "where else is this a niche", "Hormozi theory" | Only the abroad stage (`reference/abroad.md`) and its report section |

## Step 1 · Know the niche

The niche is: what is sold, to whom, where, at what price, and at what stage (an idea, live, or pure research).

- **In a repo:** read the README (and a `docs/` overview or business notes if the README points to one). Write the
  niche in one line, for example "A meal prep delivery service for office workers in Austin, $12 a meal, live since
  March". Show
  it in the first dialog for the person to confirm or correct. Never start researching on an unconfirmed niche: an
  outdated README sends the whole study the wrong way.
- **No repo, or no niche in it:** ask the intake questions in `reference/intake.md`.
- **Rival mode:** the niche still matters (a rival to what?). Take it from the repo or ask for it in one line.

Ask everything in **one first dialog** (the question tool if the host has one, a short numbered list if not):
the niche or intake questions, the **depth** (Quick or Full, study mode only), and **browser permission** (see
Step 2). Keep each question in plain words and explain any technical term in a short clause.

| Depth | Rivals | Sources | Abroad stage | Rough time |
|---|---|---|---|---|
| Quick | about 5, the biggest | stores, the main review sites, Reddit, ads, Trends | no | about 15 minutes |
| Full | 10 or more, local and global | every source in `reference/sources.md` | yes | 45 to 60 minutes |

## Step 2 · Check the tools

Do this quietly, and mention a missing tool once, in the report's "Could not check" list.

- **Web search and page reading:** needed. Without them, stop and say so.
- **The `watch` skill** (videos): installed if `watch` is in the skill list or `~/.claude/skills/watch/SKILL.md`
  exists. Installed is not enough: run its own preflight, `python <watch folder>/scripts/setup.py --check` (`python3`
  on macOS and Linux). Exit 0 means ready. Any other exit means a piece is missing (yt-dlp, ffmpeg or Whisper): do
  not install anything yourself, read videos as text for this run, and say in the report which piece is missing and
  the command watch's `setup.py` prints for it. If watch is not installed, videos are read from their page, caption
  and comments only, and the report says once: "For a full read of video ads, install the watch skill:
  https://github.com/mathiaschu/claude-video".
- **Facebook ad library videos:** the video in an ad is reached through the ad's own page,
  `https://www.facebook.com/ads/library/?id=<library id>`, which watch's downloader can open. Do not try to copy a
  video's direct address out of the browser.
- **A browser tool** (for example Claude in Chrome): needed for ad libraries, Google Trends, social comments and some
  review sites. Ask once per run, in the first dialog: "May I look at pages in your browser? Look only: I never click
  save, send, post or buy." A yes covers this run only. A no, or no browser tool, means public pages plus ready links
  in the report for the person to open themselves.

## Step 3 · Map the rivals

Search in **the launch market's languages and in English**, for example Arabic, Arabizi (Arabic in Latin letters)
and French for Lebanon. Search the way a customer would: "<service> in <city>", "best <product> app", "<problem>
help", and the local-language versions. Look for:

- direct rivals (same offer, same customers), indirect rivals (another way to solve the same problem, including
  "doing it by hand" and WhatsApp groups), and global players that reach this market online;
- rival apps on the App Store and Google Play;
- rivals the person already named.

List them with one line each and a first guess of how much each matters. Quick keeps the biggest 5. Full keeps 10 or
more, the global ones included.

## Step 4 · Research each rival (helpers)

Send **helper agents**, at most **5 working at the same time**, one rival each, with the brief in
`reference/helper-brief.md`. Helpers use web search and page reads only. They never use the browser (one shared
browser cannot be driven by several agents at once) and never watch videos. If the host has no helper agents, do the
rivals one by one yourself with the same brief.

While the helpers work, do the browser and video work yourself, one tab at a time (Steps 5 and 6).

## Step 5 · Ads and Trends (browser, if allowed)

Follow `reference/sources.md`, "Ad libraries" and "Google Trends":

- each rival in the Meta Ad Library, TikTok Creative Center and Google Ads Transparency Center: their messages,
  offers and prices in ads, when each active ad started, and which have run longest (a long-running ad usually
  works);
- 3 to 5 keywords of the niche in Google Trends, in the launch country, over 5 years and 12 months: rising, flat or
  falling, and which related searches are climbing.

Without a browser, put the exact links in the report instead.

## Step 6 · Videos

Watch **every video link the person gave**, plus **up to 3 rival video ads** found in Step 5, picking the
longest-running ones. With `watch` installed, run it for each, and read the frames and transcript for the hook, the
offer, the promise and the call to action. Without it, read the page, caption and comments. A transcript in an
unexpected language or a repeated syllable means the video has no speech: say so and work from the frames. Delete
watch's working folders once their findings are written down.

## Step 7 · Abroad (Full depth, or abroad mode)

Follow `reference/abroad.md`: where the same idea already works in other markets, in their own languages and on their
own platforms, and what that says about the gap at home.

## Step 8 · Put it together

From the helpers' findings, the ads, the videos, Trends and the abroad stage:

1. **Complaint themes:** group every negative review and comment by what went wrong (price, trust, quality, support,
   speed, a missing feature...). Count each theme and note which rivals it hits. Keep 1 or 2 short quotes per theme
   with their source.
2. **Gaps:** what customers ask for that nobody offers, the customers nobody serves, the places nobody covers, and
   the price points nobody fills.
3. **Selling points and hooks:** take the top complaint themes, write what the idea does differently for each, and
   turn it into a short video hook (the first line of an ad). Write hooks per `reference/report-template.md`. A hook
   that names a rival is allowed, but it is flagged: "names a rival, check your country's ad rules and the platform's
   policy first".
4. **Advice:** for a live business or a set idea, the 3 to 5 changes most likely to win customers, each tied to a gap
   or a complaint. Then 2 or 3 new or pivoted ideas the gaps point to, each with why it has a chance and the main
   risk. For pure market research, the advice is the opportunities ranked.

## Step 9 · Write the files

Use `reference/report-template.md`.

- **Where:** inside a repo, reuse an existing rivals folder (for example `notes/competitors/`, `docs/competitors/`,
  `competitors/`); otherwise make `market-study/` at the repo root. With no repo, use the current folder.
- **What:** one main report, `market-study.md`, plus one short file per rival (`<rival-name>.md`, lowercase,
  hyphens). In an existing rivals folder, update the files already there instead of making duplicates.
- **Re-runs:** if `market-study.md` already exists, read it and the rival files first. Update them, keep older
  findings with their dates, and open the report with "Since <last study's date>": new rivals, price changes, new ads,
  new complaint themes, trends that turned.
- **Rival mode:** one rival file, plus a line in `market-study.md`'s rival table if a study exists.

## Step 10 · The README

If the repo's README has a competitors section (or describes the business and its rivals), show the exact lines that
would be added or changed there, and ask yes or no. Edit the README only after a yes. Never commit or push anything
unless the person asks.

## Step 11 · Report in chat

A short summary, at most about 15 lines: the niche in one line, the top 3 rivals and their prices, the top 3 complaint
themes, the best 3 hooks, the single most useful piece of advice, and the paths of the files written. Then what could
not be checked. Clean up any temporary files the run made.

## Rules for every run

- **Evidence:** every fact carries where it came from and one of three tags: **theirs** (the rival's own claim),
  **seen** (seen on a page, store, ad or review), **ours** (our own count or estimate). Never invent a number, a
  rival, a quote or a review count. Unknown stays "unknown".
- **Reviews:** quote short, leave reviewers' names and photos out, translate non-English quotes with the original
  beside them.
- **Money:** never pay, start a trial, or use a paid key or paid service without the person's clear yes for that
  use. Free public pages and free accounts the person already has (with browser permission) only.
- **Look only:** never sign in, sign up, post, comment, message, like, follow, click save, send or buy. A page behind
  a login is read only through the browser with permission, never by working around the login.
- **Originality:** borrow ideas, structure and formats, never someone's footage, script, voice or exact wording.
  Say so when a suggestion sits close to one creator's or company's work.
- **Plain words:** the reports are for founders, not analysts. Explain every term (CAC, churn, TAM...) in a short
  clause, or avoid it.
