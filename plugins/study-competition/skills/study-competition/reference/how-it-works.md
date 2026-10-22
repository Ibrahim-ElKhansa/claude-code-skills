# How it works: one rival feature, from the inside (optional)

An optional step after the study, for 1 or 2 rival features that matter (a feature behind a top complaint, a
selling point, or a gap). It uses REA, "Reverse Engineer Anything" (https://github.com/morluto/rea, MIT licence),
when the person has it installed. REA connects the agent to tools that show how software works inside: website
structure and network calls, Electron desktop apps, Android apps (APKs) and native programs.

## When to offer it

- Only after Step 8, and only if REA is installed (its tools are available, or the `reverse-engineer-anything` skill
  is in the skill list). Without REA, skip this step silently; the README mentions REA as an optional extra.
- Offer it in one question, naming the feature and the rival: "Want to see how Bayt's AI chat picks jobs, from what
  its website sends and receives?" Never run it unasked.

## The limits (always)

REA's own terms limit it to "lawful research, education, interoperability, software preservation, and analysis of
software you own or are authorized to examine". So:

1. **A rival's public website** is fine to observe the way any visitor's browser does: page structure, scripts the
   page loads, the network calls it makes while you use it normally. No logins that are not the person's own, no
   bypassing paywalls, rate limits or protections, no load on their servers beyond normal use.
2. **A rival's app (Android APK, desktop or Electron app, native program):** only if the person confirms they own it
   or are authorized to examine it, and that their country allows it. Ask plainly before anything is opened:
   "Taking apart a rival's app usually breaks its terms, and in some countries the law (in the EU only for narrow
   reasons such as interoperability; in the US the DMCA limits it). Are you authorized to examine this app?" Without
   a clear yes, stay with the public website.
3. **The person's own software** (to compare with a rival) is always fine.
4. **Understand, never copy.** The output is how the feature behaves and what it relies on, in plain words, so the
   person can design their own version. Never copy a rival's code, assets, text or data into the person's product,
   and never extract keys, tokens or personal data. If any turn up, leave them out of the notes and say only that
   they exist.
5. **Never pay**: REA's commercial engines (IDA, Hopper, JEB) are used only if the person already has a licence.

## Steps

1. Pick the feature and the target (a page of the rival's site, or an app the person is authorized to examine).
2. Follow the `reverse-engineer-anything` skill for the target type (websites: its browser and network evidence;
   Electron: its JavaScript application workflow; Android: its Android guide). Use the browser permission from the
   first dialog for anything that opens pages.
3. Write what was found into the rival's file, under "How {feature} works": what the user sees, what the page or app
   does to produce it (in plain words), what it depends on (a third-party service, a model, a data source), its limits,
   and what that means for the person's own version. Tag every point **seen** (observed) or **ours** (inferred), as in
   the rest of the study.
4. Add one line to `market-study.md`, "What to do", if the finding changes the advice.

## What it does not do

It does not decompile a rival's app without the person's yes, does not log in as anyone but the person, and does not
put a rival's code or data into the person's project.
