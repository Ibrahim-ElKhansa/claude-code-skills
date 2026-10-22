---
name: find-leads
description: Find leads (businesses or people who might buy) for any business or startup idea, check each one, and draft one tailored first message per lead, without ever sending anything. Finds businesses that fit the ideal customer, people publicly asking for this kind of help, rivals' unhappy customers, and businesses showing a buying trigger (hiring for the role, just opened, running ads). Works inside a repo (reads the business from its README and any market-study.md) or with no repo (asks). Writes a growing leads.csv with no repeats, kept out of git. Use when someone types /find-leads, or says "find leads", "find customers", "find prospects", "who can I sell to", "build a prospect list", "find shops to pitch", "find people asking for ...", "find people who need ...", "lead generation".
argument-hint: "[count] [business or nothing]"
---

# Find leads

Request for this run: $ARGUMENTS

This skill finds people and businesses likely to buy, checks that each one is real and a good fit, finds a
public way to reach them, and drafts a short first message for each. **It never sends, posts, likes, follows,
comments or connects.** The person sends every message themselves.

## Step 1 · Know the business and the ideal customer

Follow `reference/intake.md`.

- **In a repo:** read the README, any `market-study.md` with its rival files (from the study-competition skill),
  and any existing prospect or lead list (a `prospects.md`, a `leads/` folder, a CSV). Write the **ideal customer
  profile** (who is most likely to buy) in 2 or 3 lines: who they are, where, how big, what sign shows they need
  it, and who is excluded.
- **No repo, or no business in it:** ask the intake questions.

## Step 2 · The first dialog

Ask everything in one dialog (the question tool if the host has one, a short numbered list if not), plain words,
recommended option first:

1. The profile: confirm or fix it (or the intake answers).
2. **How many leads:** 25 by default; 10 or 50 or 100 on request.
3. **Channels** to draft for: email, WhatsApp, Instagram and Facebook messages, LinkedIn (pick any).
4. **Who to leave out:** competitors of an employer or partner, current clients, too small to pay, a region.
   Add any exclusion rules written in the README or the study.
5. **Browser permission**, if a browser tool is available: "May I look at pages in your browser? Look only: I
   never like, follow, comment, message, connect or buy." A yes covers this run only.
6. **A paid tool**, only if its key is present (Step 3): name the tool and what this run would cost, and ask.
7. **An old list**, if one exists and is not yet in `leads.csv`: "Import its rows (with their status) into
   leads.csv so there is one list?"

Save the profile, channels and exclusions at the top of `leads.md` so later runs reuse them (and ask only
"same as last time?").

## Step 3 · Check the tools

Quietly. Mention what is missing once, in the summary.

- Web search and page reading: needed; without them, stop and say so.
- A browser tool (for example Claude in Chrome): needed for Instagram, Facebook, TikTok, Maps details, ad
  libraries and LinkedIn.
- Docker (`docker info`): only matters for the optional bulk Maps tool in `reference/sources.md`. If it is absent
  or not running, say so once; never start Docker.
- The `watch` skill: optional, for videos as the specific detail (`reference/sources.md`).
- Paid lead tools: check whether a key for one exists as an environment variable (for example `APOLLO_API_KEY`,
  `HUNTER_API_KEY`, `APIFY_TOKEN`, `CLAY_API_KEY`), **present or absent only, never print or copy a key**. Use one
  only after a yes in Step 2 for this run.

## Step 4 · Find candidates

Follow `reference/sources.md`. Search in **the market's languages and English** (for example Arabic, Arabizi and
French for Lebanon), the way a customer or the business would search. Make one pass for each lead kind:

| Lead kind | What it is | Where |
|---|---|---|
| **Fit** | Businesses that match the profile | Maps, directories, "best X in city" lists, Instagram and Facebook pages, websites |
| **Intent** | People or businesses publicly asking for this kind of help right now | Reddit, forums, Facebook groups, comments, Q&A sites |
| **Rival's unhappy customer** | Someone who publicly complained about a rival | Reviews and comments on rivals (the study's rival files first) |
| **Trigger** | A business showing it needs this now | Job posts for the role the product replaces, new openings, ads running in ad libraries |

Collect about twice the requested count as candidates, so the checks can drop the weak ones. Skip anything already
in `leads.csv` (any status), in an old list, or excluded.

## Step 5 · Check each candidate (helpers)

Send **helper agents**, at most **5 at the same time**, each with a batch of candidates and the brief in
`reference/helper-brief.md`. Helpers use web search and page reads only. They never use the browser (one shared
browser cannot be driven by several agents at once). Do the browser checks yourself, one tab at a time. Without
helper agents, check the batches yourself.

Each kept lead is:

- **real and active:** the page opens, and it has posted, sold or answered within about the last 3 months, or the
  post is recent;
- **scored:** a fit out of 10 against the profile, with the reason in one line;
- **reachable:** a public contact route on one of the picked channels (a business email or WhatsApp number on its
  own page, its Instagram for a DM, a reply on the person's post);
- **specific:** one real detail to mention (a product, a post, a complaint, a job ad), with where it was seen.

**People** (not businesses) follow `reference/people-rules.md`: their public username, the post link and date,
and what they need in one line. Never their phone, email, address, photo or workplace, even when findable.

Drop candidates that fail, and keep the best up to the requested count. Candidates that failed (or did not make
the cut) go into `leads.csv` as `dropped` rows with the reason and no contact details, so no later run checks them
again for about 90 days.

## Step 6 · Draft one message per lead

Follow `reference/messages.md`: under about 80 words, in the lead's own language with an English version beside
it, opening with the one real detail, saying who is writing and why, with an easy next step. Emails end with a
one-line opt-out. If a `market-study.md` exists, use its selling points and hooks. No follow-ups.

## Step 7 · Write the files

Follow `reference/output.md`.

- **Where:** a `leads/` folder in the repo, next to an existing prospect list if there is one, else at the repo
  root. With no repo, `leads/` in the current folder.
- **What:** `leads/leads.csv` (one row per lead, growing across runs) and `leads/leads.md` (the saved profile and
  exclusions, then the run's summary and top 10).
- **Keep it out of git:** if the folder is inside a git repo and not ignored, ask before adding `leads/` to the
  repo's `.gitignore`: lead files hold details about real people and businesses. Never commit or push lead files.
- **Re-runs:** append new rows, never change the person's `status` or `notes`, never suggest a lead marked `no`
  again, and skip `dropped` rows younger than about 90 days.

## Step 8 · Summary in chat

At most about 15 lines: how many leads were kept (by kind), the top 5 with their fit and channel, what could not
be checked, and the file paths. End with: "Nothing was sent: each message is in leads.csv for you to send."

## Rules for every run

- **Never send:** no message, email, DM, comment, like, follow or connection request, through any tool.
- **Never pay** without a yes for that run, naming the tool and the cost.
- **Look only** in the browser. LinkedIn: at most about 10 pages a run, never a message or connection.
- **People's privacy:** `reference/people-rules.md`, always.
- **Honesty:** `reference/messages.md`. No fake claims, numbers, urgency, discounts or personas.
- **Evidence:** every detail carries where it was seen; nothing invented. Unknown stays unknown.
- **Plain words:** the summary and files are for a founder, not a marketer. Explain any term in a short clause.
