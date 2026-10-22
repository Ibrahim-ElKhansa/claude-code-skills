# Fixes: what to offer after the report

Offer fixes in one dialog after the report is written. Each option names the files it changes and the finding it
answers. Change only what the person picks, and show what changed afterwards.

## Fixes you may offer

| Fix | What it does |
|---|---|
| Third-party notices | Generate a `THIRD_PARTY_NOTICES.md` (or an in-app "Open source licences" screen) from the dependencies' licences |
| Keep licence comments | Change the bundler config so licence comments are not stripped from built files |
| Project licence | Add a `LICENSE` file, only with the licence the person names (ask; never pick one for them) |
| Attribution | Add required credits for images, fonts, data or services where their terms ask |
| Consent before tracking | Load analytics, pixels and session recording only after consent; make "Reject" as easy as "Accept" |
| Self-hosted fonts | Serve web fonts from the project instead of an outside server |
| Click-to-load embeds | Load maps, videos and social embeds only after a click, with a short note |
| Privacy policy draft | Draft or update a privacy policy from the inventory: every data type, purpose, basis, service, transfer, retention and right found |
| Cookie notice draft | List each cookie and tracker found, with its purpose and provider |
| Terms of use draft | A starting draft covering what `consumer-content.md` lists |
| Consent capture | Add consent checkboxes (unticked) with stored timestamps for marketing email or texts |
| Unsubscribe | Add or fix unsubscribe links and the handler that honours them |
| Delete and export | Add a delete-account flow and a data export, if the stack makes it a small change |
| Scraper changes | Switch off, slow down, or move to an official API a scraper that breaks a site's terms (the person chooses which) |
| Remove a secret | Remove a committed secret from the code and add the file to `.gitignore`, then tell the person to rotate the key, since it stays in git history |
| Accessibility basics | Alt text, form labels, `lang` attribute, focus styles |
| AI disclosure | A visible "You are chatting with an AI" line, labels on generated images |

## Rules for drafts

- Every drafted legal text (policy, terms, notice) starts with: "Draft: have a lawyer read this before publishing."
- Build drafts only from the inventory and the confirmed answers. Leave clear placeholders (`[company legal name]`,
  `[registered address]`, `[contact email]`) for anything not known. Never invent a company name, an address, a
  registration number or a data retention period.
- Never copy another company's policy or terms. Write from the facts.
- A draft does not fix a finding by itself: the report keeps the finding open until the text is published and the
  code matches it, and says so.

## Not fixes: steps for the person

These go in the report's "Steps for you", never into files: signing or accepting a DPA, registering with a regulator
(for example the ICO fee), appointing an EU or UK representative, registering a DMCA agent, asking a service or site
for written permission, a trademark search or filing, carrier registration for texting, tax registration, insurance,
and having a lawyer review anything.

## Never

- Never commit or push.
- Never delete a scraper, a feature or data without the person choosing that exact option.
- Never accept a service's terms or sign anything on the person's behalf.
