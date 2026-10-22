# Intake: what the project is and where its users are

## In a repo

1. Read `README.md`, and any business overview it points to (a "what it is" section, `docs/`, a pitch). The README
   says what the project is meant to be; the code says what it actually does. When they disagree, the code wins for
   the review and the gap is a finding only if a legal page repeats the README's claim.
2. Write the project in one line: **what** it does, **for whom** (consumers, businesses, both), **where**, **paid or
   free**, **stage** (idea, built, live). Example: "A paid app that books dog walkers in Austin, Texas, 15 US
   dollars a month, live since March 2026."
3. Build the country guess from the signals below, then ask in the first dialog.

### Signals for where the users are

Note each signal with its `file:line`. Two or three agreeing signals make a confident guess; one alone is a hint.

| Signal | Where to look |
|---|---|
| Currencies and prices | pricing pages, payment config, plan constants (`"EUR"`, `"GBP"`, `"usd"`) |
| Languages | locale files (`locales/`, `i18n/`, `messages/*.json`), `hreflang`, `lang` attributes |
| Domain and links | the site's domain and its country code (`.de`, `.co.uk`, `.lb`), links to local services |
| Hosting region | Vercel or Netlify region, Supabase or Firebase region, AWS / GCP / Azure region in config |
| Payment provider setup | the provider (some work only in certain countries), tax settings, country lists |
| Forms | phone number formats, address fields, country pickers, ID number fields, date formats |
| Text | the README, landing page copy and marketing text ("for freelancers in the UAE") |
| Legal pages already there | the law a privacy policy names, a governing-law clause, a stated company address |

**Aimed at, not merely reachable.** Review only the countries the project is aimed at, plus the country the operator
runs it from. A public website can be opened from anywhere, but most laws reach a business abroad only when it targets
people in their country (offers them goods or services, in their language or currency, or speaks to them) or tracks
them there. GDPR draws the line this way (Article 3(2)), and most other laws follow a similar test. So:

- Add a country when the signals show the project is aimed at people there, or the person says so.
- Add the EU, the UK or a US state law also when the project **tracks** visitors from there (analytics, pixels,
  profiling), even without aiming at them, and say why.
- List the countries left out and the reason ("no EU language, currency or tracking"), so the person can add one.

For each country kept, review its own privacy, consumer and e-commerce laws.

## No repo, or an operation with no code

Ask these in the first dialog (one question each, plain words, a recommended option where one makes sense):

1. **The operation.** "What are you doing or planning to do?" For example: scraping listings from a site, sending
   cold emails, running a WhatsApp bot for shops, reselling an API, collecting CVs, an AI product. Accept a sentence,
   a link or a pasted plan.
2. **Whose data.** Does it touch information about people (names, emails, phone numbers, photos, CVs, health,
   location)? Whose: your customers, the public, another company's users?
3. **Which outside services and sites.** Every platform, API, data source or tool involved, paid or free, and
   whether you use it through an official API, a browser, or by copying pages.
4. **Where.** Where you are based, and where the people affected are.
5. **Money.** Free, paid, or earning from someone else's data or content.

The answers become the inventory. Every finding in a no-repo run is tagged **reading** or **terms** or **law**, never
**code**.

## Anything the person pasted

Links, screenshots and documents given with the request are inputs: a service's terms page, a contract, a
screenshot of a sign-up form. Read them directly and cite them in the report.
