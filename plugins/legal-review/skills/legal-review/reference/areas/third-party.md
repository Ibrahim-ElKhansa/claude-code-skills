# Area: third-party terms

Every outside service the project uses has terms the project agreed to, usually by signing up or by using an API key.
Breaking them rarely brings a fine, but it often brings a suspended account, a blocked API key, a frozen payout, a
removed app, or a lawsuit for breach of contract. For a business that depends on one platform, that can be the end of
the business. This area reads each service's **current** terms live and checks how the project uses it.

## For each service in the inventory

1. **Find the right documents.** A service often has several:
   - the general terms of service, and separate **developer or API terms** (these usually govern API use);
   - an **acceptable use policy** or usage policy (what you may build);
   - a **data processing agreement** and privacy terms (see `privacy.md`);
   - **brand, attribution or display requirements**;
   - **platform or store rules** (app stores, marketplaces);
   - the plan or pricing page (some limits sit there: seats, commercial use, request caps).
   Look under `/legal`, `/terms`, `/policies`, `/developers/terms`, `/acceptable-use`, or search "<service> API terms
   of service". Prefer the service's own pages over summaries.
2. **Record** the URL, the date read, and the "last updated" date the page shows.
3. **Check the clauses that matter for how the project uses it** (below). Quote the exact words, short.
4. **Compare** with the code (`file:line`): does the project do what the clause forbids, or skip what it requires?

## Clauses to check

- **Automated access and scraping:** many terms forbid bots, crawlers, scraping or accessing the service other than
  through the official API or interface (LinkedIn, Instagram, Facebook, X, Amazon, Google Search, many job boards).
  A scraper or browser automation against a service whose terms forbid it is usually High.
- **Account rules:** one person per account, no shared or bought accounts, no automating a personal account, no
  creating accounts in bulk, business accounts for business use.
- **Rate limits and quotas:** the code's request rate against the documented limit; using several keys or accounts to
  get around a limit.
- **Caching and storing content:** how long API data may be kept (for example, map platforms often limit caching and
  storing their content), whether it must be refreshed or deleted, whether it may be put in your own database.
- **Display and attribution:** required logos, "Powered by" lines, showing data only on the provider's own map or
  widget, not altering the content.
- **Use of the data:** no reselling, no building a competing product, no using outputs to train other models (common
  in AI providers' terms), no combining with other data to identify people, no using the data for decisions about
  credit, employment, insurance or housing (some data providers forbid this).
- **Permitted use cases and banned uses:** AI providers' usage policies, payment providers' prohibited and restricted
  business lists, messaging platforms' policies (for example opt-in and template rules for business messaging).
- **Commercial use:** free tiers, student plans or personal plans that forbid commercial use; open data under
  non-commercial licences.
- **Sublicensing and white-labelling:** whether the project may let its own customers use the service through it, or
  must have each customer sign up directly.
- **Countries:** services not offered in some countries; sanctions clauses (see `ai-sector-other.md`).
- **OAuth and user data:** for "Sign in with" and API access to users' accounts (Gmail, Drive, Calendar, LinkedIn,
  Meta), the provider's user data policy: only the scopes needed, limited use of what is read, and for some sensitive
  scopes an app review or security assessment before going live.
- **App stores:** the store's rules for payments in the app (digital goods often must use the store's in-app
  purchase, with exceptions that differ by country), account deletion inside the app, privacy labels, and data
  collection disclosures.
- **Liability and changes:** whether the service can change the terms or prices at will, cut access without notice,
  and limit its own liability. Note a heavy dependency on one service that may cut access, as a business risk.

## Websites without an API

For a site the project reads or scrapes without an agreement, also check:

- the site's **terms of use** (browsewrap terms are weaker than clicked ones, but logged-in scraping is bound by the
  terms the account accepted);
- **robots.txt** (not a law, but courts and regulators read ignoring it as bad faith, and some AI-training opt-outs
  rely on it);
- **anti-bot measures** the scraper works around (CAPTCHAs solved, blocks evaded, logins faked): working around a
  technical barrier carries much more risk under computer misuse laws (the US CFAA, the UK Computer Misuse Act and
  similar) than reading public pages;
- **the EU database right** (Directive 96/9/EC): taking a substantial part of a protected database can infringe it
  even when single facts are free;
- **copyright** in the scraped content (text, photos, reviews), and the EU text and data mining rules (Directive
  2019/790, Articles 3 and 4: mining is allowed for commercial uses unless the rights holder opted out in a
  machine-readable way);
- **personal data** in what is scraped (see `privacy.md`).

Court cases on scraping turn on their facts and their country. Cite a case only after reading a reliable source on it,
and tag the finding **reading**.

## Output per service

One block per service, even when nothing is wrong: name, how the project uses it, the documents read (URL, date read,
last-updated date), the findings with quotes, and one line "Done well" or "No issue found in the clauses read". A
service whose terms could not be read is listed under "Not checked" with its link.
