# Area: AI, sector and other rules

Rules that apply because of **what** the project does: using AI, working in a regulated field, crossing borders, or
using names and brands. Many of these laws are new and come into force in stages, so read the current status of each
before citing it.

## AI

- **EU AI Act** (Regulation (EU) 2024/1689). It applies in stages; read the current timeline, since the EU has
  proposed changing some dates.
  - **Banned practices** (Article 5), in force since February 2025: for example manipulative techniques, social
    scoring, emotion recognition at work or school, untargeted scraping of face images.
  - **AI literacy** (Article 4): staff using AI systems need sufficient AI literacy.
  - **Transparency** (Article 50): people must be told they are talking to an AI system unless it is obvious;
    AI-generated images, audio and video (deepfakes) must be labelled; synthetic content marked in a machine-readable
    way by the provider. Check whether the project's chatbot, generated media or AI-written text meets this, and the
    article's application date.
  - **High-risk uses** (Annex III): AI used in hiring and worker management, education and exams, access to
    essential services and credit, insurance pricing, and others. Deployers of high-risk systems have duties (human
    oversight, logs, informing people, sometimes an impact assessment). A job-matching, CV-screening, credit or
    tenant-screening feature is likely in scope: flag it and read the current application date.
  - **General-purpose AI models:** duties fall on model providers, not on apps calling their API, unless the app
    substantially modifies or rebrands a model.
- **GDPR Article 22 and automated decisions:** decisions with legal or similarly significant effects made solely by
  automated means need a lawful exception, information to the person and a way to get human review.
- **US state AI laws:** a growing set, with different start dates and some delays. Examples to check: Colorado's AI
  Act (high-risk consequential decisions), New York City's Local Law 144 (automated employment decision tools: bias
  audit and notice), Illinois' amendment to its Human Rights Act on AI in employment, California's AI transparency and
  companion-chatbot laws and its CCPA rules on automated decision-making, Utah's disclosure law. Read each current
  status; list only those that fit the project's use and users.
- **Claims about AI:** the FTC acts against unsupported claims about what an AI product does ("AI-powered", accuracy
  figures, "guaranteed results"). Compare marketing copy with what the code does.
- **Outputs:** AI output shown as fact can be defamatory or harmful; medical, legal or financial answers need care and
  disclaimers; generated code, text and images may reproduce copyrighted material. Pure AI output may not be
  protected by copyright in some countries (the US Copyright Office's position), which matters if the business sells
  it as its own IP.
- **Data sent to AI providers:** personal data in prompts makes the AI provider a processor (`privacy.md`); check the
  provider's data retention and training settings for the account type used (`third-party.md`).

## Regulated sectors

Flag only the sectors the project actually touches, with the evidence.

- **Health:** HIPAA applies to covered entities (providers, health plans, clearinghouses) and their business
  associates; a consumer health app is usually outside HIPAA but under the FTC Health Breach Notification Rule and
  state health data laws. Medical advice, symptom checkers and diagnosis features can make software a medical device
  (FDA in the US, the EU MDR). Health data is a special category under GDPR.
- **Finance:** payments and money transmission, lending and credit, investment advice, crypto (the EU's MiCA, US state
  money transmitter licences), consumer reports (see hiring). GLBA for US financial institutions' customer data.
- **Hiring and employment:** background checks and consumer reports (the US FCRA: consent, disclosure, adverse action
  notices) when the project supplies or uses reports about candidates; anti-discrimination law in job ads and
  screening (no age, gender, nationality filters where the law forbids them); AI in hiring (above). Job boards and
  recruitment agencies can need licences in some countries.
- **Children and education:** COPPA, FERPA for US school records, the UK Age Appropriate Design Code for services
  likely to be used by children, state laws on minors' social media use.
- **Real estate, insurance, legal services, gambling, alcohol, tobacco, firearms, adult content, telecoms:** each has
  licensing or advertising rules; name the sector and recommend a local specialist.

## Borders: sanctions and export

- **Sanctions:** US (OFAC), EU and UK sanctions forbid dealing with sanctioned people and, for some places, offering
  services there. Many providers' terms (payment, cloud, AI) forbid use from embargoed regions. Check whether the
  project blocks or serves sanctioned regions, and whether its payment provider screens. Read the current lists; they
  change often.
- **Export control:** most software, including standard encryption, is publicly available or mass-market and exempt,
  but strong custom encryption, some AI and some dual-use tools can need classification. Flag only when the project
  builds such tools.
- **Data localisation:** some countries require certain data to stay in the country (for example some financial,
  health or government data, and some Gulf and Asian countries' rules). Check each confirmed country.

## Names and brands

- **The project's own name and domain:** search for registered trademarks in the same class (USPTO, EUIPO, WIPO's
  Global Brand Database, the national office of each confirmed country). A similar mark in the same field is a risk
  to rebranding later; tag **reading**.
- **Other companies' brands:** logos, names and trade dress in the UI, ads, domains and app names. Using a brand to
  say what you work with is usually fine; implying endorsement, or using their logo outside their brand guidelines,
  is not. "Sign in with" buttons have strict brand rules (see `third-party.md`).
- **Comparative advertising:** naming a rival in ads is allowed in many places under conditions (true, comparable,
  not misleading, not denigrating); check the confirmed countries and the ad platform's policy.

## Security duties

Most privacy laws require "appropriate" security, and breaches bring notice duties. This review notes the obvious:
secrets committed to the repo (file and line only, never the value), plain-text passwords, public storage, missing
auth on admin or data routes, sensitive data in logs. For a real security review, recommend a dedicated security
review as a step for the person. EU NIS2 applies to medium and large entities in listed sectors (and some digital
providers): flag only if the project fits.

## What "done well" looks like

An AI chatbot that says it is an AI, AI images labelled, human review of automated decisions that matter, sectors
handled with the right agreements, sanctioned regions blocked, a name checked against trademark registers.
