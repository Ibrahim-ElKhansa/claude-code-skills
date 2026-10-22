# Claude Code skills

Skills and mods I built for my own Claude Code setup. More about each one is on
[ibrahimelkhansa.com/claude-code-skills](https://ibrahimelkhansa.com/claude-code-skills).

| | Name | Type | What it does |
|---|---|---|---|
| <img src="plugins/study-competition/.claude-plugin/icon.png" width="40" alt=""> | [study-competition](plugins/study-competition/skills/study-competition) | Skill | Studies the market around a business idea. It finds the competitors and their prices, their ads, what their customers complain about, the gaps nobody fills, and where the idea already works abroad. It ends with selling points, video hooks and advice. |
| <img src="plugins/find-leads/.claude-plugin/icon.png" width="40" alt=""> | [find-leads](plugins/find-leads/skills/find-leads) | Skill | Finds leads for a business idea. It looks for businesses that fit, people asking for this kind of help in public, competitors' unhappy customers, and businesses hiring for the job your product does. It checks each one, finds a public way to reach it, and drafts one short first message for you to send. It never sends anything. |
| <img src="plugins/explain-n8n/.claude-plugin/icon.png" width="40" alt=""> | [explain-n8n](plugins/explain-n8n/skills/explain-n8n) | Skill | Explains a piece of code as an interactive workflow page in the style of n8n, with steps, branches, loops, the real code lines and example runs you can play. |
| <img src="plugins/open-choices/.claude-plugin/icon.png" width="40" alt=""> | [open-choices](plugins/open-choices/skills/open-choices) | Skill | Turns a wide open choice into a page of dozens of options on shelves. You mark Want or Maybe, and Claude reads your marks back. |
| <img src="plugins/trim-clip/.claude-plugin/icon.png" width="40" alt=""> | [trim-clip](plugins/trim-clip/skills/trim-clip) | Skill | Keeps the last 30 seconds of a game clip (or any length you ask for) as a small 1080p MP4 on your Desktop. The original is never touched. |
| <img src="plugins/netlify-bot-shield/.claude-plugin/icon.png" width="40" alt=""> | [netlify-bot-shield](plugins/netlify-bot-shield/skills/netlify-bot-shield) | Skill | Blocks the bots that scan a Netlify site for `/.env`, `.git` folders, WordPress logins and PHP pages, with one small edge function that answers them with an empty 403. It checks for files that really leaked first, proves the block locally, and shows how to see your real visitors. |
| <img src="plugins/legal-review/.claude-plugin/icon.png" width="40" alt=""> | [legal-review](plugins/legal-review/skills/legal-review) | Skill | Reviews how legally safe your project is, for the countries it is aimed at: privacy law, the current terms of every outside service it uses (read live and quoted), open-source and asset licences, consumer and content rules, and AI rules. Every finding is ranked and cites a file and line or a source, and it offers fixes. Not legal advice. |
| <img src="plugins/toolbar/.claude-plugin/icon.png" width="40" alt=""> | [toolbar](plugins/toolbar) | Mod | Adds a band above the prompt with the chat's pixel character and its helper agents, what files changed, and the context window as a stacked bar. |
| <img src="plugins/usage-watch/.claude-plugin/icon.png" width="40" alt=""> | [usage-watch](plugins/usage-watch) | Mod | Answers `/usage-now` and `/cost-now` in chat, and has Claude tell you when the five hour window passes 80% or the context passes 70% and 85%. |

## Install

In Claude Code, add this repo as a plugin marketplace once:

```text
/plugin marketplace add Ibrahim-ElKhansa/claude-code-skills
```

Then install only the ones you want:

```text
/plugin install trim-clip@ibrahim-elkhansa
/plugin install study-competition@ibrahim-elkhansa
```

A skill installed this way runs as `/<plugin>:<skill>`, for example `/trim-clip:trim-clip`. You can also copy a
skill's folder (the one with `SKILL.md`) to `~/.claude/skills/<name>/` and run it as `/<name>`.

## Requirements

- **Claude Code.** The two mods need version 2.1.287 or later, and 2.1.299 or later to draw in the VS Code chat panel.
- **explain-n8n and open-choices** publish their page as a private claude.ai artifact when Claude's artifact tool is
  available. Without it, they write a single HTML file you open in your browser.
- **trim-clip** needs Python 3 and ffmpeg. It works on Windows, macOS and Linux.
- **netlify-bot-shield** needs Node 18 or later and the Netlify CLI (`npm install -g netlify-cli`) for its local
  test. It reads the site's recent traffic only when a Netlify connector or the CLI is signed in.
- **study-competition** needs web search. A browser tool (such as Claude in Chrome) and the
  [watch](https://github.com/mathiaschu/claude-video) skill let it read ad libraries and watch video ads, and
  [REA](https://github.com/morluto/rea) lets it look inside one competitor feature. All three are optional.
- **find-leads** needs web search. A browser tool lets it check Instagram, Facebook, ad libraries and a few LinkedIn
  pages, and a paid lead tool key (Apollo, Hunter, Apify, Clay) is used only after a yes for that run. Both are
  optional.
- **legal-review** needs web search and page reading to read services' current terms and the law. Without them it
  reviews from the code alone and says so.

## What they will not do

None of these skills pay for anything, sign in, post or send on your behalf. study-competition only reads public pages,
and asks before it looks at pages in your browser. find-leads drafts messages but never sends one, and for private
people it keeps only their public username, the post link and what they asked. trim-clip writes a new file and never changes or deletes the
recording. netlify-bot-shield asks before it commits or deploys, and never blocks crawlers or browsers by name. The mods only draw and read what Claude Code already knows about the session. They send nothing anywhere.
legal-review only reads your code and public pages, never prints a secret, and changes, commits or pushes nothing
without your yes.

## License

MIT, see [LICENSE](LICENSE). The toolbar's pixel characters come from
[pixel-agents](https://github.com/pixel-agents-hq/pixel-agents) by Pablo De Lucca, also MIT
([its license](plugins/toolbar/LICENSE-pixel-agents.txt)).

If one of these saves you time, a star helps other people find it.
