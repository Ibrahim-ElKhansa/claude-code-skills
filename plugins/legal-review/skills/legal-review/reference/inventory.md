# Inventory: what to read in the project

The inventory is the base every helper works from. Build it before the first dialog, with a `file:line` for every
item. Read files; do not run the project, call its servers, or install anything.

## 1. Outside services

Every service the project talks to, how, and with what data.

- **Manifests and lockfiles:** `package.json`, `requirements.txt`, `pyproject.toml`, `Pipfile`, `go.mod`,
  `Cargo.toml`, `Gemfile`, `composer.json`, `pubspec.yaml`, `*.csproj`, `build.gradle`, `Podfile`. An SDK in the
  dependencies is a service (for example `stripe`, `@supabase/supabase-js`, `firebase`, `openai`,
  `@anthropic-ai/sdk`, `twilio`, `@sendgrid/mail`, `resend`, `posthog-js`, `@sentry/*`, `mixpanel`, `@segment/*`,
  `googleapis`, `@googlemaps/*`, `boto3`, `algoliasearch`, `intercom`).
- **Env variable names:** `.env.example`, `.env.sample`, deploy config, CI secrets lists. `STRIPE_SECRET_KEY` says
  Stripe is used. Names only, never values; never open a real `.env` to read a value.
- **Outbound calls:** search for `https://` and `http://` literals, `fetch(`, `axios`, `requests.`, `httpx`,
  `urllib`, `curl`. Group the domains; the project's own domains are not outside services.
- **Script tags and embeds:** `<script src=`, tag managers, `gtag`, `fbq` (Meta pixel), `ttq` (TikTok pixel),
  LinkedIn Insight, Hotjar, Clarity, YouTube and Maps embeds, chat widgets, Google Fonts and other font CDNs.
- **Content Security Policy** headers and `next.config`, `vercel.json`, `netlify.toml`, `_headers`: they often list
  every outside domain.
- **Scrapers and automation:** `puppeteer`, `playwright`, `selenium`, `cheerio`, `beautifulsoup4`, `scrapy`, `jsdom`,
  headless browser flags, user-agent strings, proxy settings, rate limits and delays. Note the target sites.
- **Sign-in providers:** OAuth configs (Google, Apple, GitHub, LinkedIn, Facebook), the scopes requested.
- **Messaging:** email senders, SMS and WhatsApp APIs, push notifications, the message types (transactional or
  marketing).
- **AI calls:** the provider, the model, what goes into the prompt (user data?), whether outputs are stored, shown
  as the provider's or the product's, or used to train anything.
- **Hosting and storage:** host, database, file storage, CDN, and their regions.

For each service, record: name, what it is used for, how (official API, SDK, embed, scraping, browser automation),
what data goes to it, and the files.

## 2. Personal data

Anything that identifies a person or can be tied to one.

- **Database schema:** migrations (`migrations/`, `supabase/migrations/`, `prisma/schema.prisma`, `models.py`,
  `schema.rb`, `*.sql`). List each table holding personal data and its columns by type.
- **Forms and inputs:** every field a person fills in (`name=`, `type="email"`, `tel`, date of birth, address, ID
  numbers, uploads).
- **Special categories:** health, biometrics (face, fingerprint, voice prints), religion, ethnicity, sexual life or
  orientation, political views, union membership, genetic data, criminal records. Also children's data, precise
  location, financial account data, government IDs, and CVs (they often carry several of these).
- **Tracking:** cookies (`document.cookie`, `Set-Cookie`, cookie libraries), `localStorage`, analytics and pixels,
  fingerprinting libraries, IP logging, session recording.
- **Logs:** what request logs, error trackers and analytics events store (IPs, emails, full request bodies).
- **Data from elsewhere:** data the project scrapes, buys or imports about people who never signed up.
- **Retention and deletion:** any delete-account flow, cron jobs that purge data, backups.
- **Security basics:** passwords hashed (bcrypt, argon2, scrypt) or not, secrets committed to the repo, public
  buckets, admin routes without auth. Name the place, never a value.

## 3. Packages and assets

- Every direct dependency and its licence (from the lockfile, the installed package metadata such as
  `node_modules/<pkg>/package.json` or `site-packages/*.dist-info/METADATA`, or the registry page). Do not install a
  licence-checking tool; if one is already in the project, its config and last output may be read.
- Vendored or copied code (`vendor/`, `third_party/`, files with another project's header).
- Fonts, icons, images, videos, audio, datasets, AI model weights, and where each came from.
- The project's own `LICENSE`, `NOTICE`, `COPYING`, and whether the repo is public.
- How the project ships: a hosted service only, a website (its JavaScript is sent to every visitor), a mobile app, a
  desktop app, a library or package others install, or a Docker image.

## 4. Legal pages and flows

- Privacy policy, terms of use, cookie notice or banner, imprint or legal notice, refund policy, acceptable use
  policy, DMCA or takedown page, accessibility statement. Their text and their last-updated date.
- Sign-up flow: consent checkboxes, age gate, terms acceptance.
- Checkout flow: price display, taxes, auto-renewal wording, the buy button's label, cancellation path.
- Unsubscribe links in emails, opt-out handling, a "Do not sell or share" link.

## The inventory, written

A short structured note (it goes to every helper and into the report's appendix):

```
Project: <one line>
Ships as: <hosted service | website | mobile app | library | ...>, repo public: <yes | no | unknown>
Users: <consumers | businesses | both>, children possible: <yes | no | unknown>
Countries: <confirmed list>

Personal data:
- <type> from <whom>, stored in <where> (<file:line>)

Outside services:
- <name>: <use>, via <API | SDK | embed | scraping | automation>, sends <data> (<file:line>)

Packages and assets: <count> direct dependencies; notable: <...>; assets: <...>
Legal pages: <list with file:line, or "none">
```
