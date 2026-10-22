---
name: netlify-bot-shield
description: Shield a site deployed on Netlify from vulnerability-scanner bots and help its analytics show real people. Adds one small edge function that answers probes for hidden files and other stacks' admin pages (/.env, /config/.env, /.git/config, /wp-login.php, /xmlrpc.php, /phpmyadmin, /.aws/credentials ...) with an empty 403 before the site's code runs, checks the build first for secret files that really are public, proves the block locally with a probe script, and explains how to read real visitor numbers (Netlify Observability's browser filter, an optional free cookie-free counter). Use when someone types /netlify-bot-shield, or says "block the bots on Netlify", "my Netlify analytics are full of .env requests", "top resources not found is all bots", "protect my Netlify site from scanners", "clean up my Netlify analytics", "bots hitting /.env".
argument-hint: [repo path, or nothing for the current repo]
---

# Netlify bot shield

Request for this run: $ARGUMENTS

Bots scan every public site for leftovers of other stacks: `.env` files, `.git` folders, WordPress logins, PHP
admin pages, backups. On Netlify they fill "Top resources not found" and, on a Next.js site, each one can start
the paid server function. This skill adds one edge function, `bot-shield.ts`, that answers those paths with an
empty 403 before anything else runs.

Files in this skill's base directory:
- `bot-shield.ts`: the edge function template, with its list of probe paths.
- `probe.mjs`: checks a running site (local or live): probes must answer 403 with no body, real pages 200,
  lookalike paths must not be blocked. Node 18 or later.

## What it can and cannot fix (say this to the user before starting)

- **It clears "Top resources not found"** for the paths it blocks, because that panel counts only 404s.
- **It does not lower Pageviews, Top pages or Top locations.** Netlify counts a pageview when a real HTML page
  loads, so those numbers include crawlers and bots reading real pages. No Netlify plan filters bots out of
  Project Analytics. Step 8 covers how to see real visitors.
- **It never blocks crawlers or user agents.** Search engines and AI search bots are how people find a site,
  and scripts or monitors the owner runs (curl, headless Chrome, node) look like bots too.
- Netlify Firewall Traffic Rules block by IP or country only, and its WAF is Enterprise only, so neither
  replaces this.

Why an edge function and not a redirect: on Next.js sites the server function answers before `netlify.toml`
redirects run, and a redirect's `*` cannot sit in the middle of a path (`/*/.env` is not allowed). An edge
function runs before the cache, functions and redirects, and its `path` list is a URLPattern where `*` matches
across folders, so `/*.env` covers `/.env` and `/config/.env`. It runs only on the listed paths, never on
normal pages, and costs one web request per probe, which the probe costs anyway.

## Steps

1. **Find the Netlify setup.** Read `netlify.toml` (or `_redirects` alone on simple sites): base directory,
   publish directory, `[build] ignore`, any `[build] edge_functions` folder. Note the framework (Next.js,
   Astro, Vite, plain HTML), any `netlify/edge-functions/` already there, `middleware.ts`, and
   `.netlify/state.json` (the linked site id). No `netlify.toml` and no link: ask which Netlify site this repo
   deploys to. The edge functions folder is `<base>/netlify/edge-functions/` unless `netlify.toml` says
   otherwise.
2. **Look at real traffic (optional).** With the Netlify connector or CLI available, read the last 24 hours
   of 404 and 403 URLs for the site, read only. Probe paths the default list misses go into the site's copy.
   Note anything odd for the report, for example many POST requests to `/` or `/admin` from one fake browser
   string: that is a Next.js server-action exploit scan. Next.js answers it with its own 403, and blocking it
   would mean an edge function on every page, so only report it.
3. **Leak check, before anything else.** Search the publish directory, `public/` (or `static/`) and the
   build output for files bots are hunting: `.env*`, `.git`, `*.sql`, `*.bak`, `*.pem`, `*.key`, `id_rsa`,
   credentials or config dumps. Also check `.gitignore` covers `.env*`. A real secret that is public is the
   first line of the report: stop and tell the user before changing anything. Rotating that secret matters
   more than the bots.
4. **Collision check.** For each path in `bot-shield.ts`, check the site never serves a real page or file that
   matches: routes (`app/`, `pages/`, `src/pages/`, `src/routes/`), files in `public/`, redirects and rewrites.
   A site that really serves a `/vendor/...` file, a `.php` page or a `.bak` download keeps that path: remove
   the pattern from the site's copy and name it in the report.
5. **Add the edge function.** Copy `bot-shield.ts` to the edge functions folder as `bot-shield.ts`. Never edit
   other edge functions or `middleware.ts`. It imports nothing, so no package is needed.
6. **Make sure it deploys.** If `[build] ignore` lists paths (`git diff --quiet ... -- src public ...`), add
   `netlify` (or the custom edge functions folder) to that list, or the next deploy is skipped. Do the same in
   any ignore script the repo uses.
7. **Prove it locally.** Start Netlify's local server with the edge function loaded:
   - Static or prebuilt output: `netlify dev --offline --dir <publish dir> --port 8899`.
   - Framework sites (Next.js, Astro, Vite): run the framework's dev server behind Netlify's proxy on a
     fixed port, for example `netlify dev --offline --command "npx next dev -p 3100" --target-port 3100
     --port 8899` (for Vite, `npx vite --port 3100 --strictPort`). Do not rely on `netlify serve --offline`:
     when the build command is set only in Netlify's dashboard, offline mode cannot see it, skips the
     build and serves the repo folder as plain files.
   Wait for "Loaded edge function bot-shield", then run:

   ```sh
   node "<this skill's base directory>/probe.mjs" http://localhost:8899 --real /,/about --safe /blog/my.envoy
   ```

   Pass `--real` with 3 to 5 of the site's real pages (the home page, a deep page, a static asset such as an
   image or the favicon), and `--safe` with any real path that looks like a probe. Every line must pass.
   Then stop the local server, its whole process tree (the framework's dev server can outlive the Netlify CLI).
   `netlify dev` also leaves a `.netlify` folder and appends `.netlify` to `.gitignore` when it is not there:
   remove both afterwards unless the user wants them, so the commit holds only the shield.
   If the framework's dev server will not start locally (old dependencies, missing env), say so plainly: the
   live probe in step 9 is then the site's only test, and the user decides whether to deploy on that.
8. **Real visitor numbers.** Tell the user:
   - **Netlify Observability**, "Browser traffic only" filter: real browsers only, free, no code. History
     depends on the plan (24 hours on the smaller plans).
   - **Optional free counter**, asked per site: a cookie-free script that counts only visitors whose browser
     runs it, which most bots skip. Cloudflare Web Analytics is free and needs no cookie banner (the user
     creates the site in their Cloudflare dashboard and gets a beacon snippet; its token is a public site id,
     not a secret). If the site sends a Content-Security-Policy, add `https://static.cloudflareinsights.com`
     to `script-src` and `https://cloudflareinsights.com` to `connect-src`, in every place the policy is
     set (`netlify.toml` headers, `next.config`, `_headers`). Other free options: GoatCounter, or a
     self-hosted Umami.
9. **Commit and deploy** the way the repo deploys (a push to the production branch, or `netlify deploy
   --prod` for a site with no git link). A production deploy may cost credits on Netlify's credit plans, so
   say so before it. After it is live, run `probe.mjs` once against the production URL with the same `--real`
   and `--safe` lists. Against a live site it is gentle on its own (4 probe paths, 1.5 seconds apart). Never
   pass `--full` to a live site, never run it twice in a row, and never loop it over several sites at once: a
   burst of scanner-looking requests is what Netlify's edge protection blocks, and it then drops every
   connection from that IP to every Netlify-hosted site for a while (seen 2026-10-22: about 60 requests in
   seconds cut the IP off for about 6 minutes). The sites stay up for everyone else. With the Netlify connector or CLI, the request log is the
   other proof: the probe paths show `edge_function_invocations` and status 403, with no function run.
10. **Report:** leaks found (or none), the patterns blocked, any removed for a collision, the local and live
    probe results, and a reminder to compare "Top resources not found" a day later.

## Rules

- Ask before committing, pushing or deploying. Never deploy a site that failed the local probe.
- Never block by user agent, country or IP from this skill. If the user asks for that, explain the risk to
  search traffic and to their own tools, and point to Netlify's Traffic Rules for IPs and countries.
- Keep the response an empty 403. A page, a redirect to a joke, or a slow tarpit costs bandwidth or function
  time, and some scanners follow redirects.
- If a site already has its own probe blocking (middleware, a WAF, `_redirects` lines), keep it, add only the
  missing paths, and say what was there.
