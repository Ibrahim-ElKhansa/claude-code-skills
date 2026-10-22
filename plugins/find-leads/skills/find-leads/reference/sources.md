# Sources: where each lead kind is found

Free public sources by default. Search in the market's languages and English. Record for each candidate where it
was found (a link) and the date.

## Fit: businesses that match the profile

- **Maps and directories:** web search for "<business type> in <city>" and the local-language versions, Google
  Maps results quoted in search, local business directories, chamber of commerce lists, "best X in <city>" articles.
  The browser (if allowed) for Maps details: hours, reviews count, phone shown on the listing.
- **Instagram, Facebook and TikTok** (browser): search the business type and city, the local hashtags (for example
  `#austinbakery`, `#shoplocalaustin`), and the accounts that similar businesses follow or tag. Note followers,
  how recently they posted, and whether comments ask questions they answer.
- **Websites:** the business's own site for a contact email, a WhatsApp link, and signs of size (a team page, a
  catalogue, delivery coverage).
- **Lookalikes:** businesses like the person's existing customers, or like the ones a rival serves.
- **Bulk Maps lists (optional, local):** gosom/google-maps-scraper (github.com/gosom/google-maps-scraper, MIT) saves
  every business a Maps search shows (name, phone, website, rating, reviews, hours) from a Docker container on the
  person's own machine. Use it only if the person has it and says yes for this run, and only under these rules:
  - **Telemetry off:** by default each run sends usage data (an id built from the public IP, run counts, errors)
    to an analytics service; every run sets `DISABLE_TELEMETRY=1`.
  - **Run the Docker image by hand, pinned to one version.** Never its bundled Claude skill, which updates itself
    from GitHub on every run and promotes paid proxies.
  - **Docker:** check `docker info` first. If it fails, ask the person to start Docker; never start it yourself.
  - **Small runs:** Google's terms forbid scraping Maps. About 50 places a query, shallow depth, slow enough never
    to get the network's IP blocked.
  - **No email harvesting:** its `-email` option (visiting each site for addresses) stays off unless the person
    asks and cold email is allowed where the businesses are (the EU as a rule does not allow it).
  - Its rows are Fit candidates only: still checked in Step 5 and deduped against `leads.csv` by name plus phone.
  - Maps finds businesses with a storefront; businesses that sell only on Instagram or WhatsApp are not on Maps, so
    social search stays the source for those.

## Intent: people or businesses asking for help now

- **Reddit:** search results for `site:reddit.com <need> <place>` and local subreddits. reddit.com refuses plain
  page reads: use search results that quote threads, public copies of a thread, or the browser if allowed.
- **Facebook groups** (browser, public groups only): posts asking for recommendations ("anyone know a...",
  "looking for..."). Never join a group to read it.
- **Forums and Q&A sites:** local forums, Quora, community boards.
- **Comments:** under rivals' posts and ads, and under popular local pages in the niche ("how much?", "do you
  deliver to...?", "does anyone do this?").
- Keep posts from about the last 3 months; older ones only when the need clearly lasts.

## Rival's unhappy customer

- Start from `market-study.md` and its rival files if they exist: the complaint quotes and their sources.
- Otherwise: low-star reviews of rivals (App Store, Google Play, Trustpilot, Google Maps), and complaints in
  comments and forums.
- A reviewer on a store is reachable only where they wrote (often nowhere). Keep such a lead only when there is a
  public place to answer (a reply on the review where the platform allows it, a public post), else note the
  complaint as evidence for the business's pitch and move on.

## Trigger: a business that needs it now

- **Job boards:** businesses hiring for the job the product does (for example "customer service agent", "social
  media coordinator", "data entry"). A posting shows the need and a budget.
- **Ad libraries** (browser): the Meta Ad Library, TikTok Creative Center and Google Ads Transparency Center show
  who is spending on ads in the market, so has budget and wants customers. In the Meta Ad Library, search by
  keyword **and** by the advertiser's page (type the name and pick it under "Advertisers"): a keyword search misses
  ads whose text lacks the word. For pages outside the EU the library mostly shows active ads only, so an empty
  history does not prove a business never advertised.

## A video as the specific detail

- A lead's or a rival's reel, a video ad (including `facebook.com/ads/library/?id=...` pages) or a YouTube video
  can give the one real detail for a message. With the `watch` skill installed (and its own setup check passing),
  run it to read the frames and transcript; follow watch's own rules for login-gated sites such as Instagram.
  Without it, use the caption and comments.
- **New openings:** news, "now open" posts, new pages with a first post in the last few months.

## LinkedIn

- Look only, in the person's signed-in browser, at most about 10 pages a run: company pages for size and
  decision makers' roles. Never a message, connection request, follow or like, and never collect people's details
  beyond a role title for a business lead.
- LinkedIn's terms forbid automated collection: keep it small, slow and look-only.

## Paid tools

- Apollo, Hunter, Apify, Clay and similar sell contact details or scrape at scale. Use one only when its key is
  present and the person said yes for this run, after being told the tool and the expected cost. Never for people
  (B2C) leads.

## Not for leads

- Tools that call a site's private interfaces with the person's own login (for example "API Anything", which
  copies cookies from the everyday browser): calling LinkedIn's or Reddit's internals this way breaks their terms
  and risks the account. Leave them out.

## When a page will not load

A blocked, empty or JavaScript-only page: try the browser if allowed, then search results that quote it, then mark
the candidate "could not check" with the reason. Never work around a login, a block or a rate limit.
