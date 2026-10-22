---
name: legal-review
description: Review how legally safe a project is and report every risk found, with the evidence. Reads the repo (or asks about the operation when there is no repo), lists what personal data it collects and every outside service, API, SDK, scraper and package it uses, guesses where its users are and asks to confirm, then checks five areas with helper agents: privacy and data protection (GDPR, UK GDPR, CCPA and other US state laws, cookies, children, local laws), each third-party service's current terms of service read live and quoted with a link, open-source and asset licences, consumer and content law (terms, refunds, auto-renewal, marketing email and SMS, user content and takedowns, accessibility), and AI, sector and other rules (EU AI Act, health, finance, hiring, minors, sanctions, trademarks). Writes legal-review.md with findings ranked High, Medium or Low, shows it as a page, then offers fixes and changes files only on a yes. Not legal advice. Use when someone types /legal-review, or says "legal review", "is my app legal", "legal check", "compliance check", "are we GDPR compliant", "check our licences", "license audit", "are we allowed to scrape this", "does this break their terms of service", "check the API terms", "privacy review", "legal risks in this repo", "is this operation legal".
argument-hint: "[privacy|terms|licences|consumer|ai or nothing]"
---

# Legal review

Request for this run: $ARGUMENTS

This skill reviews a project the way a careful in-house lawyer would before launch: what personal data it collects and
what the law says about that, what each outside service it uses allows in its terms, whether its packages and assets
may be used the way the project uses them, and what consumer, content, AI and sector rules apply. It ends with a ranked
list of risks, each with its evidence, and offers fixes.

**It is not legal advice.** It is a review to take to a lawyer, and the report says so at the top. It never claims
something is "legal" or "compliant": it says what it checked, what it found, and what it could not check.

It reads and writes notes. It never signs in, posts, sends, pays, or changes a file without the person's yes.

## Areas

Read the arguments first. No argument means all five areas. One area name means that area only (the inventory and the
first dialog still run, since every area needs them).

| Area | Argument | File | What it checks |
|---|---|---|---|
| Privacy and data protection | `privacy` | `reference/areas/privacy.md` | Personal data, consent, cookies, privacy policy, user rights, transfers, children |
| Third-party terms | `terms` | `reference/areas/third-party.md` | Each outside API, SDK, platform and scraped site: its current terms, read live |
| Licences | `licences` (or `licenses`) | `reference/areas/licences.md` | Packages, copied code, fonts, images, datasets, AI models |
| Consumer and content | `consumer` | `reference/areas/consumer-content.md` | Terms of use, payments, refunds, marketing messages, user content, accessibility |
| AI, sector and other | `ai` | `reference/areas/ai-sector-other.md` | AI rules, regulated sectors, sanctions and export, trademarks, security duties |

## Step 1 · Know the project

- **In a repo:** follow `reference/inventory.md`. Read the README first, then the code: manifests and lockfiles,
  routes and pages, forms, database schema, auth, payments, analytics and tracking, cookies, outbound HTTP calls,
  scrapers and browser automation, AI calls, email and SMS senders, file uploads, hosting and deploy config, and any
  existing legal pages (privacy policy, terms, cookie notice, licence files).
- **Env files:** read variable **names** only, never values. Never print, copy or quote a secret.
- **No repo, or an operation with no code** (a scraping job, a marketing campaign, a data-sharing deal): ask the
  intake questions in `reference/intake.md`.

The result is the **inventory**: what the project is, who uses it, what personal data it collects and from whom, where
that data goes (database, processors, outside services), every outside service and how it is used, every package and
asset source, and every legal page that exists. Keep each item with its `file:line`.

## Step 2 · The first dialog

Ask everything in **one first dialog** (the question tool if the host has one, a short numbered list if not), in
plain words with every legal term explained in a short clause:

1. **What it is,** in one line, for example "A paid app that books dog walkers in Austin, 15 US dollars a month,
   live". Ask: right, mostly right (with a fix), or something else.
2. **Who it is aimed at.** Show the countries the project is aimed at, with the evidence from
   `reference/intake.md` ("prices in USD and EUR, Arabic and English pages, written for shops in Dubai"), and the
   countries left out with why. Only the countries it is aimed at, plus the operator's own country, are reviewed.
   Ask the person to confirm, add or remove countries.
3. **The outside services found,** as a short list. Ask whether any is missing (a service used outside the code, such
   as a mailing tool or a data vendor) and whether any is no longer used.
4. **Who the users are,** when the code does not make it clear: consumers, businesses, or both; and whether children
   (under 13 in the US, under 13 to 16 in the EU depending on the country) can use it.

Never start the helpers on an unconfirmed scope: a wrong country or a missed service sends the review the wrong way.

## Step 3 · Check the tools

Do this quietly and mention a missing tool once, in the report's "Not checked" list.

- **Web search and page reading:** needed to read services' current terms and official legal texts. Without them,
  the review runs from the code and from what is generally known, and every terms finding is marked "not read live:
  check the current terms at <link>".
- **Helper agents:** without them, work through the areas one by one yourself with the same briefs.
- **A browser tool** is not used. Terms pages are public; a page that blocks plain reads is listed with its link for
  the person to open.

## Step 4 · Helpers, one per area

Send **helper agents**, at most **5 working at the same time**, one per area in scope, each with the brief in
`reference/helper-brief.md` filled in: the inventory, the confirmed countries, the user type, and its own area file.
Helpers use the repo, web search and page reads only. They never use a browser, never sign in, never send a request
to the project's own servers or to an outside API, and never change a file.

When there are many outside services (more than about 8), the third-party area may take two helpers, each with half
the services, as long as no more than 5 run at once.

## Step 5 · Check every finding

Before anything goes in the report, go through each helper's findings:

1. **Evidence:** every finding cites a `file:line` in the project, or a URL that was read (with the date it was
   read), or both. A finding with neither is dropped. Open a few cited lines and links yourself to confirm they say
   what the helper says.
2. **Tag:** **code** (seen in the project), **terms** (a service's own words), **law** (an official text or a
   regulator's guidance), **reading** (our judgment, where the text is unclear or the facts are incomplete).
3. **Level** from likelihood and impact, per `reference/report-template.md`: **High** (a clear breach of a law or a
   service's terms, or a missing duty, that could bring a fine, a lawsuit, a ban or a lost account), **Medium** (a
   likely gap or a grey area with real exposure), **Low** (good practice, or a risk that needs facts not in the
   project).
4. **Merge** duplicates across areas (a scraper can be both a terms and a privacy finding: one finding, both areas
   named).
5. **No overreach:** a finding says what the text says and how the code meets it. It never says "illegal" when the
   honest word is "risky", and never says "fine" for something not checked.

## Step 6 · Write the report

Use `reference/report-template.md`.

- **Where:** `legal-review.md` at the repo root. With no repo, the current folder.
- **Re-runs:** if `legal-review.md` already exists, read it first. Open the new one with "Since <last run's date>":
  findings fixed, findings new, findings still open, and terms that changed since they were last read.
- **Then show it as a page:** with an artifact or page publishing tool, write the page's source in a temporary
  folder (never the repo), publish it as a readable page private to the person, and give the link. Without one, write
  `legal-review.html` next to the `.md` (one self-contained file, no outside scripts) and give its full path.

## Step 7 · Offer fixes

Follow `reference/fixes.md`. In one dialog, offer the fixes that are safe to make in code or text (a notices file,
attribution lines, a cookie notice draft, a privacy policy draft built from the inventory, consent checkboxes, a
scraper switched off or slowed down, a missing licence file). Each option says what file changes and why. Change only
what the person picks. Every drafted legal text carries the line "Draft: have a lawyer read this before publishing."

Fixes that are not code (sign a data processing agreement, register with a regulator, ask a service for written
permission, appoint an EU representative) go in the report's "Steps for you" list, never into files.

## Step 8 · Git and the summary

- Ask once whether `legal-review.md` (and the `.html`, if written) should be committed or added to `.gitignore`. A
  legal report can be sensitive in a public repo. Never commit or push anything yourself unless the person asks.
- **Summary in chat,** at most about 15 lines: the project in one line, the countries covered, the count of findings
  by level, the top 3 High findings in one line each, the files written, what could not be checked, and the "not
  legal advice" line. Clean up any temporary files the run made.

## Rules for every run

- **Not legal advice:** never say a project is legal, compliant or safe. Say what was checked and found.
- **Evidence:** every finding has a `file:line`, a read URL with its date, or both. Never invent a law, an article
  number, a clause, a fine amount or a case. Unknown stays "unknown". A quote is the exact words of the source, in
  quotation marks, short; a summary is never written as a quote.
- **Current law only:** laws and terms change. Read the current text where it matters, give the date read, and say
  when a law is passed but not yet in force (with its start date).
- **Look only:** never sign in, sign up, post, send, buy, accept terms on the person's behalf, or call the project's
  APIs or an outside API. Reading public pages only.
- **Secrets:** read env variable names, never values. A secret found committed in the code is a finding (it is a
  security duty under most privacy laws): name the file and line, never the value.
- **People's data:** never copy personal data from the project's database, fixtures or logs into the report. Describe
  it by type ("email addresses and CVs of job seekers").
- **Plain words:** the report is for founders and developers, not lawyers. Explain every legal term (controller,
  processor, lawful basis, copyleft...) in a short clause the first time.
