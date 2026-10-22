# Sources: where to look and how

Free public sources only. Paid tools (Sensor Tower, AppMagic, SimilarWeb Pro, paid trend or review APIs) are never
used, unless the person names one they already pay for and says yes for this run.

Search in the launch market's languages and in English. Record each fact with its URL, the date read, and its tag
(theirs, seen, ours).

## The rival's own pages (no browser needed)

- **Home page:** what they promise, to whom, in which countries, in which languages.
- **Pricing page:** every plan, price, billing period and currency, free trial or free plan, refund terms. If there is
  no pricing page, say "no public price".
- **About, careers, press:** who runs it, where it is based, when it started, size hints (team page, job posts).
- **Their social accounts' public pages:** follower counts and posting rhythm when visible without a login.

## App stores (no browser needed)

- **Google Play** (`play.google.com/store/apps/details?id=...`): rating, number of ratings, the download range
  ("100K+"), last update, the "What's new" text, and the low-star reviews shown on the page.
- **App Store** (`apps.apple.com/<country>/app/...`): rating and count for that country's store, last update,
  in-app purchase prices. Low-star reviews: the page shows a few; Apple's public review feed
  `https://itunes.apple.com/<country>/rss/customerreviews/id=<app id>/sortby=mostrecent/json` gives the latest ones
  (free, no key).
- Use the launch country's store (`/lb/`, `/ae/`, `gl=LB`), since ratings and reviews differ by country.

## Review sites

- **Trustpilot** (`trustpilot.com/review/<domain>`): TrustScore, review count, 1- and 2-star reviews (filterable in
  the page's address: `?stars=1&stars=2`).
- **Google Maps** (local businesses): rating and count from search results. The reviews themselves mostly need the
  browser.
- **G2, Capterra, Product Hunt** (software): rating, "cons" sections, launch comments. G2 and Capterra often block
  plain page reads; use the browser if allowed, or search results that quote them.

## Reddit and forums

- Search `site:reddit.com <rival>` and `site:reddit.com <problem> <country>`, and local forums or Facebook groups that
  show up in search. Unprompted complaints ("is X a scam?", "anyone else had this with Y?") are often the most
  honest evidence.
- Old threads count, but mark their date: a 2021 complaint may be fixed.

## Social comments

- Comments under rivals' Instagram, TikTok, YouTube and Facebook posts and ads: questions people keep asking,
  complaints, prices people quote. YouTube comments are often public; Instagram and TikTok mostly need the browser.
- With `watch` installed, a video's page, caption and frames come through it (Step 6). Comments still come from the
  page.

## Ad libraries (browser, look only)

- **Meta Ad Library:** `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=<CC>&q=<name>&search_type=keyword_unordered`
  (CC is the two-letter country code, or `ALL`). Note each active ad's start date, the page running it, its text,
  offer, price, and call to action. Ads running for months are the ones that work.
- **TikTok Creative Center** (`ads.tiktok.com/business/creativecenter`): top ads in the industry and country, and
  the rival's ads if listed.
- **Google Ads Transparency Center:** `https://adstransparency.google.com/?region=<CC>` then search the advertiser:
  search, display and YouTube ads.
- Without a browser, put these links, filled in for each rival, in the report.

## Google Trends (browser, look only)

- `https://trends.google.com/trends/explore?date=today%205-y&geo=<CC>&q=<kw1>,<kw2>,<kw3>` (up to 5 keywords,
  comma-separated, URL-encoded). Also `date=today%2012-m` for the last year.
- Read: the direction (rising, flat, falling), seasonality, the related queries marked "Rising" or "Breakout", and
  which regions search most. In small countries Trends often shows too little data: say so, then try the region or a
  broader keyword.
- Without a browser, put the filled links in the report.
- There is no free, open way for a program to read Trends (Google's own API is invite-only, the old free library
  stopped working in 2025). Do not use paid scrapers for it.

## When a page will not load

A page that refuses a plain read (blocked, empty, built by JavaScript): try the browser if allowed, then search
results that quote it, then mark it in "Could not check" with the reason. Never work around a login or a block.
