# Area: licences

Every package, copied file, font, image, dataset and AI model the project uses comes with a licence: the permission
to use it and the conditions attached. Code with **no licence** is not free to use: all rights stay with its author.
What a licence requires depends on **how the project ships**, so start from the inventory's "Ships as" line.

## How the project ships, and what that triggers

- **Hosted service only** (code runs on your servers, users see only the result): most licences' conditions are
  triggered by distribution, which hosting is not. The main exceptions are the **AGPL** (users interacting with it
  over a network must be offered the source of a modified version) and some source-available licences that restrict
  offering the software as a service.
- **Website front end:** the JavaScript and CSS sent to each visitor **is** distributed. Licence notices must travel
  with it (most bundlers keep licence comments or write a licence file; check the build config does not strip them).
- **Mobile, desktop or Docker image:** distributed. Notices required, and copyleft licences apply in full.
- **A library or package others install:** distributed, and the project's own licence must be compatible with its
  dependencies' licences.

## Licence families

Use the SPDX identifier of each licence (see `../sources.md`).

- **Permissive** (MIT, BSD-2-Clause, BSD-3-Clause, ISC, Apache-2.0, Zlib): keep the copyright and licence notice.
  Apache-2.0 also requires passing on its NOTICE file and marking changed files, and includes a patent licence.
- **Weak copyleft** (LGPL-2.1, LGPL-3.0, MPL-2.0, EPL-2.0): changes to the licensed files themselves must be shared
  under the same licence when distributed; using them unchanged alongside your own code is generally fine, with
  conditions (LGPL needs the user to be able to swap the library).
- **Strong copyleft** (GPL-2.0, GPL-3.0): distributing a program that includes GPL code generally means the whole
  program must be offered under the GPL with its source. A finding when a distributed app (website bundle, mobile app,
  desktop app, library) includes GPL code and the project is not GPL.
- **Network copyleft** (AGPL-3.0): as GPL, plus users of a modified version over a network must be offered its
  source. A finding for a hosted service that uses modified AGPL code, and worth noting for unmodified AGPL servers
  (many companies forbid AGPL entirely).
- **Source-available, not open source** (SSPL, BUSL or BSL, Elastic License 2.0, Commons Clause, PolyForm, "fair
  source" licences): restrict commercial or competing use, or offering as a service, often until a change date. Read
  the exact terms against the project's use.
- **Content licences** (Creative Commons): BY needs attribution; SA needs sharing alike; NC forbids commercial use; ND
  forbids changes. CC0 and public domain need nothing.
- **No licence, "all rights reserved", or a custom licence:** a finding unless the project has permission in
  writing. Code copied from Stack Overflow is under CC BY-SA (with the version depending on when it was posted) and
  needs attribution.

## Checks

1. **Every direct dependency's licence.** Read it from the lockfile, the installed package metadata, or the registry
   page. Do not install a licence-checking tool. Flag: GPL or AGPL in something distributed or modified, any
   source-available licence, any package with no licence, any licence the project's own licence cannot carry.
   Transitive dependencies (dependencies of dependencies) matter too: check the ones with copyleft or no licence, and
   say how far the check went.
2. **Notices.** Is there a way the project passes on required notices (a third-party notices file, an "Open source
   licences" screen in a mobile app, licence comments kept in bundles)?
3. **Copied and vendored code.** Files carrying another project's header, `vendor/` and `third_party/` folders,
   snippets with a source link in a comment. Is their licence kept and followed?
4. **Fonts.** OFL fonts (most Google Fonts) are fine to use and embed. Commercial fonts need a licence that covers web
   embedding or app embedding specifically. Loading fonts from an outside server is also a privacy point (see
   `privacy.md`).
5. **Images, icons, video, audio.** Stock photos and icons have their own licences (attribution, no use in logos or
   trademarks, no resale as-is). Images found on the web are not free to use. Check credits are shown where required.
6. **Datasets.** Training or seed data, scraped datasets, open data (licences such as ODbL need share-alike for
   derived databases; some datasets are non-commercial).
7. **AI models and their outputs.** Open-weight models carry licences with use restrictions and sometimes user-count
   limits or naming rules (read the model's own licence and acceptable use policy). Outputs of hosted AI services are
   governed by the provider's terms (see `third-party.md`).
8. **The project's own licence.** A public repo with no `LICENSE` file means nobody may legally reuse it: a finding
   only if the README invites reuse or contributions. A project that accepts outside contributions benefits from a
   contribution policy (inbound equals outbound, a DCO sign-off, or a CLA).
9. **Copyright headers and ownership.** Code written by contractors or friends without a written assignment may not
   belong to the project. Note this as a **reading** item for the person to confirm, never as a fact.

## What "done well" looks like

A clear `LICENSE`, a generated third-party notices file, licence comments kept in bundles, only permissive
dependencies (or copyleft used as its licence allows), self-hosted OFL fonts, credited images from known sources.
