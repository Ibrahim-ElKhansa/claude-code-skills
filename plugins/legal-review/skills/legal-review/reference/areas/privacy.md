# Area: privacy and data protection

Personal data is any information about a person who can be identified, directly or by combining it with other data:
names, emails, phone numbers, IP addresses, device IDs, cookies, photos, CVs, location. Most privacy laws apply to a
business **outside** their country when it offers services to, or tracks, people inside it.

Two roles decide most duties: the **controller** (who decides why and how data is used, usually the project) and the
**processor** (who handles data for the controller, such as a hosting or email provider). A project is often a
processor for its business customers' data and a controller for its own users' data.

Check every item that fits. Read the current text of each law you cite (see `../sources.md`).

## EU GDPR and UK GDPR

The EU General Data Protection Regulation (Regulation (EU) 2016/679) and the UK's copy of it (UK GDPR with the Data
Protection Act 2018, as amended since). They apply to a business anywhere that offers goods or services to people in
the EU or UK, or monitors their behaviour there (Article 3).

- **Lawful basis** (Article 6): each use of personal data needs one of six reasons: consent, a contract with the
  person, a legal duty, vital interests, a public task, or legitimate interests (balanced against the person's
  rights). Map each data use in the inventory to a basis. Marketing, analytics cookies and AI training on user data
  usually need consent or a careful legitimate-interests assessment.
- **Special categories** (Article 9): health, biometrics used to identify, religion, ethnicity, sexual orientation,
  politics, union membership, genetic data. Processing them needs an extra condition, usually explicit consent.
  Criminal records (Article 10) are stricter still. CVs often contain these.
- **Consent** (Articles 4(11), 7): freely given, specific, informed, a clear action (no pre-ticked boxes), as easy to
  withdraw as to give, and recorded.
- **Children** (Article 8): online services offered to children need a parent's consent below an age each country
  sets between 13 and 16.
- **Privacy notice** (Articles 12 to 14): who the controller is and how to reach them, what data, why, the lawful
  basis, who receives it, transfers abroad, how long it is kept, the person's rights, the right to complain to a
  regulator, and the source of data not collected from the person. Compare the project's privacy policy with the
  inventory: every service and data type in the code should appear, and nothing the policy promises should be
  contradicted by the code.
- **Rights** (Articles 15 to 22): access, correction, deletion, restriction, portability, objection, and rules on
  automated decisions with legal or similar effects (Article 22). Is there a way to delete an account and its data?
  To export it? Who answers requests, within one month?
- **Processors** (Article 28): every service that handles personal data for the project needs a data processing
  agreement (DPA). Most large providers include one in their terms; list each processor and whether its DPA applies
  automatically or must be signed or accepted.
- **Records and assessments:** records of processing (Article 30, with a narrow exemption for small organisations),
  a data protection impact assessment (DPIA, Article 35) for high-risk processing (large-scale special categories,
  systematic monitoring, profiling, new technology such as AI on personal data), a data protection officer (Article
  37) in some cases.
- **Security and breaches** (Articles 32 to 34): appropriate security; a breach reported to the regulator within 72
  hours of becoming aware of it when it risks people's rights. Secrets committed to a repo, plain-text passwords,
  public storage buckets and unauthenticated admin routes are findings here.
- **Transfers abroad** (Chapter V, Articles 44 to 49): sending EU or UK data to a country without an adequacy
  decision needs a safeguard such as Standard Contractual Clauses. US recipients certified under the EU-US Data
  Privacy Framework (and the UK Extension) are covered while that framework stands; check the provider's
  certification and the framework's current status.
- **Representative** (Article 27): a business outside the EU that falls under Article 3(2) usually needs a
  representative in the EU, and the same applies for the UK. Small, occasional, low-risk processing is exempt.
- **UK specifics:** the ICO data protection fee (most controllers must register and pay), and the UK changes made by
  the Data (Use and Access) Act 2025, which come into force in stages: check which parts apply today.

## Cookies and tracking (ePrivacy and PECR)

The EU ePrivacy Directive (2002/58/EC, Article 5(3)) as each country implements it, and the UK's Privacy and
Electronic Communications Regulations (PECR, regulation 6). Storing or reading anything on a person's device
(cookies, local storage, pixels, fingerprinting) needs **prior consent** unless it is strictly necessary for the
service the person asked for.

- Analytics, advertising pixels, session recording, A/B testing tools and most chat widgets are not strictly
  necessary. Check that they load **only after** consent, not before the banner is answered.
- The banner must make refusing as easy as accepting, with no pre-ticked boxes, and record the choice.
- Third-party embeds (YouTube, Google Maps, social buttons) and fonts loaded from an outside server send the
  visitor's IP to that provider. Self-hosting fonts, or loading embeds after a click, removes the issue.
- Check the UK's current exemptions for some analytics cookies under the Data (Use and Access) Act 2025 before
  flagging UK analytics.

## United States

No single federal privacy law; a mix of state laws and sector laws.

- **California (CCPA as amended by CPRA):** applies to for-profit businesses doing business in California that pass
  one of three thresholds (annual revenue above a figure adjusted every two years, buying, selling or sharing the
  data of 100,000 or more California consumers or households, or earning half their revenue from selling or sharing
  data). Read the current revenue figure on cppa.ca.gov. Duties include a notice at collection, a privacy policy
  updated every 12 months, the rights to know, delete, correct and opt out, a "Do Not Sell or Share My Personal
  Information" link when data is sold or shared for cross-context ads (pixels count), honoring the Global Privacy
  Control browser signal, and contracts with service providers. Check the current status of the CPPA's rules on
  automated decision-making, risk assessments and cybersecurity audits.
- **CalOPPA:** any commercial website or app that collects personal data from California residents needs a privacy
  policy, whatever its size, that says how it responds to "Do Not Track".
- **Other state privacy laws** (Virginia, Colorado, Connecticut, Utah, Texas, Oregon, Montana and more each year):
  thresholds differ and some (Texas) have no revenue threshold. Read a current tracker (see `../sources.md`) and list
  only the states whose thresholds the project plausibly meets, given its user count. Sensitive data (health,
  precise location, children's data) usually needs opt-in consent under these laws.
- **Children (COPPA):** a service aimed at children under 13, or that knows it collects their data, needs verifiable
  parental consent and more. Check the FTC's amended COPPA Rule and its compliance date.
- **Health data outside HIPAA:** Washington's My Health My Data Act and similar laws reach apps that are not health
  providers; the FTC Health Breach Notification Rule covers health apps (see `ai-sector-other.md`).
- **Biometrics:** Illinois BIPA (written consent, a public retention policy, private lawsuits with damages per
  violation), plus Texas and Washington laws.
- **Video viewing data:** the Video Privacy Protection Act has been used against sites that send video-watching data
  to ad pixels.
- **Wiretap and session-recording suits:** California's CIPA and similar laws are used against chat widgets, session
  replay and pixels that capture what visitors type. Flag session recording and third-party chat as **reading**
  risks when no consent is shown.
- **Data breach laws:** every state has one; notice duties follow a breach of certain data types.

## Other countries

For each country confirmed in the first dialog, find its main data protection law and check the same basics: a
notice, a lawful reason or consent, registration with a regulator where required, transfers abroad, and rights.
Examples to start from (read each current text): Canada (PIPEDA, Quebec's Law 25), Brazil (LGPD), India (DPDP Act
2023 and its rules, in force in phases), Saudi Arabia (PDPL), the UAE (Federal Decree-Law 45 of 2021, and the DIFC
and ADGM regimes), Qatar (Law 13 of 2016), Lebanon (Law 81 of 2018 on electronic transactions and personal data),
Egypt (Law 151 of 2020), Turkey (KVKK), South Africa (POPIA), Australia (Privacy Act 1988), Japan (APPI), China
(PIPL), Switzerland (revised FADP). Some require registering databases or the processing with a regulator.

## Scraped or bought data about people

Data about people who never signed up (scraped profiles, bought lead lists, enriched contacts) still needs a lawful
basis and, under GDPR Article 14, a notice to those people within a month, unless an exemption truly applies. Public
data is still personal data. This is one of the most common High findings in scrapers and lead tools.

## What "done well" looks like

A privacy policy that matches the code, consent before tracking, self-hosted fonts, a working delete-account flow,
DPAs in place, data minimised to what the feature needs, retention limits enforced by a job, hashed passwords, no
secrets in the repo.
