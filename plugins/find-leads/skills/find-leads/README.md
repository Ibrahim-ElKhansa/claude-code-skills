# find-leads

A skill for Claude Code that finds leads for any business or startup idea: businesses and people likely to buy.
It checks each one and drafts a short, tailored first message for you to send yourself.

Run it once and it:

- works out who your ideal customer is, from your project's README (and a market study if you have one) or by
  asking you;
- finds four kinds of leads: businesses that fit, people publicly asking for this kind of help, rivals' unhappy
  customers, and businesses showing a buying signal (hiring for the job your product does, just opened, running
  ads);
- checks each lead is real and active, scores its fit out of 10, finds a public way to reach it, and notes one
  real detail to mention;
- drafts one message per lead in the lead's own language, with an English version;
- saves everything in `leads/leads.csv` (opens in Excel, Google Sheets or any CRM) and a short `leads/leads.md`.

Run it again later and it adds new leads to the same list, never repeating one, and keeps the status you set
(messaged, replied, meeting, won, no).

## Install

From the plugin marketplace, in Claude Code:

```text
/plugin marketplace add Ibrahim-ElKhansa/claude-code-skills
/plugin install find-leads@ibrahim-elkhansa
```

Then type `/find-leads:find-leads`, or just ask "find me leads for this".

Or copy this folder to `~/.claude/skills/find-leads/` (or `.claude/skills/find-leads/` inside one project) and
type `/find-leads`.

## Optional extras

- **A browser tool** (for example Claude in Chrome) lets it look at Instagram, Facebook, TikTok, Maps details, ad
  libraries and a few LinkedIn pages. It asks before each run and only looks.
- **A paid lead tool key** (Apollo, Hunter, Apify, Clay) lets it find more business emails. It asks before each
  run that would spend credits, naming the cost.
- **The study-competition skill**: with a `market-study.md` in the project, it targets the gaps and rivals'
  unhappy customers and uses the study's hooks in its messages.

## What it never does

- It never sends anything: no message, email, DM, comment, like, follow or connection request.
- It never pays without your yes.
- For private people, it keeps only their public username, the post link and what they asked: never their phone,
  email or other details. They are reached only where they asked.
- Messages say who is writing and why, emails carry an opt-out line, and there are no fake claims, urgency or
  personas.
- Lead files are kept out of git (it asks before adding `leads/` to `.gitignore`).

## License

MIT, see `LICENSE`.
