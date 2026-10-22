# Sources: where to read the rules, and how to cite them

## Order of trust

1. **The official text:** the law, the regulation, the service's own terms page.
2. **The regulator's guidance:** what the body that enforces the law says it means.
3. **Reliable secondary sources:** law firm notes, trackers and summaries from known publishers. Use them to find the
   official text and to learn current status, and tag what rests only on them **reading**.
4. **Never** cite a forum post, an AI answer, or a blog without an author as the source of a rule.

## Official texts and regulators

| What | Where |
|---|---|
| EU laws (GDPR, AI Act, DSA, Consumer Rights Directive, ePrivacy, Accessibility Act) | eur-lex.europa.eu |
| EU privacy guidance | edpb.europa.eu (the European Data Protection Board) and each country's regulator |
| EU AI Act timeline and guidance | digital-strategy.ec.europa.eu, the AI Office pages |
| UK laws | legislation.gov.uk |
| UK privacy, cookies, PECR, data protection fee | ico.org.uk |
| UK consumer law | gov.uk (CMA), and Ofcom for the Online Safety Act |
| US federal rules (COPPA, CAN-SPAM, ROSCA, endorsements, health breach) | ftc.gov, ecfr.gov |
| US TCPA | fcc.gov |
| US copyright, DMCA agent registration | copyright.gov |
| California privacy law and rules | cppa.ca.gov, oag.ca.gov |
| Other US state privacy laws | each state's legislature site; trackers such as the IAPP US State Privacy Legislation Tracker for status |
| US sanctions | ofac.treasury.gov (Sanctions List Search) |
| EU and UK sanctions | the EU Sanctions Map, gov.uk (OFSI) |
| Trademarks | tmsearch.uspto.gov, euipo.europa.eu (eSearch, TMview), branddb.wipo.int |
| Accessibility standard | w3.org/WAI (WCAG 2.1 and 2.2) |
| Other countries | the national official gazette or legislation site, and the national data protection authority |

### When an official site does not load

Some official sites return an empty page or a 403 to a plain page read. Try, in order:

- **EUR-Lex:** the plain HTML form of the text, `https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:<number>`
  (for example `32016R0679` for the GDPR, `32024R1689` for the AI Act, `32000L0031` for the e-Commerce Directive),
  or the ELI link `https://eur-lex.europa.eu/eli/reg/2016/679/oj`.
- **A faithful mirror** of the same text, cited as a mirror next to the official link, for example gdpr-info.eu for
  the GDPR or artificialintelligenceact.eu for the AI Act. Tag what rests only on a mirror **law** only if the mirror
  reproduces the official text word for word; otherwise **reading**.
- **The regulator's own page** quoting the article.
- If nothing loads, the finding says "official text not read" and goes under "Not checked" with the link.

## Licences

| What | Where |
|---|---|
| Licence identifiers and full texts | spdx.org/licenses |
| Plain summaries of open-source licences | choosealicense.com, opensource.org/licenses |
| Creative Commons licences | creativecommons.org/licenses |
| A package's declared licence | its registry page (npmjs.com, pypi.org, crates.io, pkg.go.dev, rubygems.org) and its repository's LICENSE file |

## A service's terms

Search the service's own domain first: "<service> terms of service", "<service> API terms", "<service> developer
policy", "<service> acceptable use policy", "<service> brand guidelines", "<service> DPA". Read the version for the
user's region when the service has several (US, EU, UK terms often differ). Note the "last updated" date.

If a page blocks plain reads or needs a login, do not work around it: list it under "Not checked" with its link.

## How to cite

- A law: its name, the article or section, the official URL, and the date read. Example: "GDPR Article 28(3),
  https://eur-lex.europa.eu/eli/reg/2016/679/oj, read 22 October 2026".
- A service's terms: the document's name, the section, the URL, the "last updated" date it shows, and the date read.
- A quote: the exact words, in quotation marks, short (one or two sentences). Never put a summary in quotation marks.
- Dates written out ("22 October 2026"), never in a format a reader could misread.
