# study-competition

A skill for Claude Code that studies the market around a business or startup idea and tells you what to do with it.

Run it once and it:

- finds your current competitors, local and online, with their prices;
- reads their negative reviews (App Store, Google Play, Trustpilot, Google Maps, Reddit, forums, social comments, G2,
  Capterra, Product Hunt) and groups the complaints;
- reads their paid ads (Meta Ad Library, TikTok Creative Center, Google Ads Transparency Center) and watches their
  longest-running video ads;
- checks Google Trends for your keywords;
- finds where the idea already works abroad (the "global Hormozi" check);
- turns rivals' weak spots into your selling points and video hooks;
- advises changes to your idea, or a better idea the gaps point to.

It works inside a project (it reads what the business is from the README and asks you to confirm) or with no project
at all (it asks what your idea is and where you want to launch it).

## Install

From the plugin marketplace, in Claude Code:

```text
/plugin marketplace add Ibrahim-ElKhansa/claude-code-skills
/plugin install study-competition@ibrahim-elkhansa
```

Then type `/study-competition:study-competition`.

Or copy this folder to `~/.claude/skills/study-competition/` (or `.claude/skills/study-competition/` inside one
project) and type `/study-competition`.

## Use

| Command | What it does |
|---|---|
| `/study-competition` | The whole study. It asks Quick (about 15 minutes) or Full (45 to 60 minutes) |
| `/study-competition rival <link>` | Checks one company or ad: is this a competitor? |
| `/study-competition abroad <idea>` | Only the "where else is this a niche" check |

You can also just ask: "is this a competitor?" with an ad link, or "study the competition for my idea".

## Optional extras

- **The watch skill** (https://github.com/mathiaschu/claude-video) lets it watch video ads: frames and a transcript.
  It needs ffmpeg, yt-dlp and Whisper. Without it, videos are read from their page and caption only.
- **A browser tool** (for example Claude in Chrome) lets it read ad libraries, Google Trends and social comments. It
  asks before each run and only looks. Without it, the report gives you the links to open yourself.

## What it never does

It never pays for anything or uses a paid service without your yes, never signs in, posts, comments, sends or buys,
and never copies anyone's videos or scripts. Every fact in the report says where it came from and whether it is the
rival's own claim, something seen, or an estimate.

## Output

A `market-study.md` report plus one short file per competitor, saved in your project's competitors folder (or
`market-study/`), and a short summary in the chat. Run it again later and it updates the study and tells you what
changed.

## License

MIT, see `LICENSE`.
