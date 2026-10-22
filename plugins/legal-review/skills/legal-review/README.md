# legal-review

A skill for Claude Code that reviews how legally safe your project is and tells you what to fix first.

Run it once inside your repo and it:

- lists what personal data your project collects, from whom, and where it goes;
- lists every outside service, API, SDK, scraper, package, font and image it uses;
- works out which countries your project is aimed at (languages, currencies, who the text speaks to, tracking) and
  asks you to confirm, so it reviews only the laws that reach you;
- checks privacy law in those countries: for example the EU and UK GDPR, cookie consent, California and other US
  state laws, children's data, and local data protection laws;
- reads the **current** terms of each outside service live (developer terms, acceptable use, brand rules) and quotes
  the clause that matters, with a link and the date read;
- checks the licences of your packages, copied code, fonts, images, datasets and AI models against how you ship;
- checks consumer and content rules: terms of use, checkout, refunds, auto-renewal, marketing email and texts, user
  content and takedowns, accessibility;
- checks AI rules (EU AI Act, US state laws, automated decisions), regulated sectors, sanctions and trademarks;
- writes `legal-review.md` with every finding ranked High, Medium or Low, each with its file and line or its source,
  and shows it as a page;
- offers fixes (notices files, consent before tracking, policy drafts, unsubscribe links...) and changes files only
  when you pick them.

It also works with no repo: describe what you are doing (a scraping job, a cold email campaign, an AI product) and it
reviews that.

**It is not legal advice.** It is a thorough first pass to take to a lawyer. It never says a project is "legal" or
"compliant": it says what it checked, what it found, and what it could not check.

## Install

Copy this folder to `~/.claude/skills/legal-review/` (or `.claude/skills/legal-review/` inside one project). Then
type `/legal-review` in Claude Code.

## Use

| Command | What it does |
|---|---|
| `/legal-review` | The full review, all five areas, with helper agents working in parallel (about 10 to 20 minutes) |
| `/legal-review privacy` | Privacy and data protection only |
| `/legal-review terms` | Third-party terms only |
| `/legal-review licences` | Licences only |
| `/legal-review consumer` | Consumer and content only |
| `/legal-review ai` | AI, sector and other rules only |

You can also just ask: "are we allowed to scrape this site?", "does our app break Stripe's terms?", "are we GDPR
compliant?".

## Needs

- **Web search and page reading** to read services' current terms and official legal texts. Without them it reviews
  from the code alone and marks every terms finding "not read live".
- **Helper agents** (built into Claude Code) for the parallel run. Without them it goes through the areas one by one.

## What it never does

It never signs in, signs up, accepts terms, posts, sends or pays; never calls your servers or any outside API; never
prints a secret (it reads env variable names only); never copies people's data into the report; never invents a law,
a clause or a quote; and never changes, commits or pushes a file without your yes.

## Output

`legal-review.md` at your repo root, a readable page of the same report, and a short summary in the chat. Run it again
later and it opens with what was fixed, what is new and which terms changed. It asks before the report goes into git,
since a legal report can be sensitive in a public repo.

## License

MIT, see `LICENSE`.
