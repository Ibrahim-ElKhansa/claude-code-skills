# Area: consumer and content

Rules for selling to the public, sending them messages, hosting what users post, and making the service usable by
everyone. Most of these apply only when users are **consumers** (people acting for themselves, not for a business);
some apply to every user. Check the first dialog's answer on who the users are.

## Terms of use and business information

- **Terms of use:** a service with accounts, payments or user content needs them: what the service is, the price and
  billing, cancellation, acceptable use, content ownership and licences, liability limits, how disputes are settled
  and under which law. Clauses that are unfair to consumers (one-sided changes, total liability waivers, forced
  far-away courts) are not enforceable in the EU and UK (Unfair Contract Terms Directive 93/13/EEC, the UK Consumer
  Rights Act 2015) and can draw regulator action. In the US, arbitration clauses and class waivers are common but
  must be clearly agreed to.
- **How terms are accepted:** a clear checkbox or button that says "I agree to the Terms" with a link holds up far
  better than a link in the footer ("clickwrap" over "browsewrap").
- **Who you are:** the EU e-Commerce Directive (2000/31/EC, Article 5) requires a commercial site to show its name,
  geographic address, email and registration details. Germany and Austria require a full legal notice ("Impressum").
  Many other countries have similar rules.

## Selling online

- **Pre-contract information and the checkout:** the total price including taxes and mandatory fees shown up front,
  the main features, the duration and auto-renewal, how to cancel. In the EU, the final button must make clear it
  commits to pay (for example "Order with obligation to pay" or "Buy now"), under the Consumer Rights Directive
  (2011/83/EU, Article 8(2)).
- **Right of withdrawal:** EU and UK consumers can cancel most distance contracts within 14 days. For digital content
  and services that start straight away, the right can be lost only with the consumer's express request and
  acknowledgement at checkout. Check the EU's new withdrawal function rule (Directive (EU) 2023/2673, adding Article
  11a to the Consumer Rights Directive), which requires an easy online "withdraw from contract" function; read its
  application date and current text.
- **Subscriptions and auto-renewal:** in the US, the FTC's ROSCA rules and state auto-renewal laws (California's is the
  strictest; read its current version) require clear disclosure before payment, affirmative consent to the renewal
  terms, a confirmation, renewal reminders in some cases, and cancellation as easy as sign-up (online if signed up
  online). Check the current status of the FTC's federal "click to cancel" rule before citing it. The UK's Digital
  Markets, Competition and Consumers Act 2024 adds subscription contract rules in stages: check which are in force.
- **Prices and discounts:** in the EU, a price reduction must show the lowest price of the prior 30 days (Price
  Indication Directive as amended by the Omnibus Directive). Drip pricing (fees revealed late) is targeted by the
  FTC's fees rule for some sectors, California's law on hidden fees, and the UK DMCC Act. Fake countdown timers,
  pre-ticked extras and confirmshaming are "dark patterns" regulators act on.
- **Reviews and endorsements:** fake or bought reviews, hiding bad reviews, and undisclosed paid endorsements are
  banned (the FTC's rule on consumer reviews and testimonials, the FTC Endorsement Guides, the EU Omnibus Directive,
  the UK DMCC Act). Affiliate links and sponsored posts need a clear disclosure.
- **Payments:** never handle raw card numbers in your own code or logs; use the payment provider's hosted fields or
  checkout (PCI DSS). Holding money for others, paying out to third parties or running a wallet can be a regulated
  money service; check the payment provider's marketplace product covers it.
- **Taxes** (VAT, GST, sales tax on digital services) are outside this review; if the project sells across borders,
  list "check VAT and sales tax registration with an accountant" under "Steps for you".

## Marketing messages

- **Email:** the US CAN-SPAM Act (honest headers and subject, a working unsubscribe honoured within 10 business days,
  a physical postal address, ads identified as ads). In the EU and UK (ePrivacy, PECR), marketing email to
  individuals needs prior opt-in consent, with a "soft opt-in" exception for existing customers (UK and some EU
  countries; check the country). Canada's CASL needs express or implied consent and identification. Cold B2B email
  is treated differently by country: check each confirmed country.
- **SMS, WhatsApp and calls:** in the US, the TCPA needs prior express written consent for marketing texts and calls
  sent with automated systems, with damages per message in private suits; quiet hours under some state laws; US
  business texting usually needs carrier registration (10DLC). WhatsApp Business has its own opt-in and template
  rules (see `third-party.md`). The EU and UK need prior consent for marketing texts.
- **Check the code:** consent captured and stored with a timestamp, an unsubscribe link in every marketing email,
  unsubscribe handled automatically, transactional and marketing messages kept apart.

## User content

When users can post, upload or message:

- **US copyright safe harbour** (DMCA, 17 U.S.C. 512): protection from users' copyright infringement needs a
  designated agent registered with the US Copyright Office (the registration expires and must be renewed), a
  takedown process, and a repeat-infringer policy.
- **US Section 230** shields platforms from most liability for users' posts, not for their own content and not for
  federal crimes or intellectual property.
- **EU Digital Services Act** (Regulation (EU) 2022/2065): hosting services need a point of contact, terms that
  explain content moderation, a notice-and-action mechanism, and statements of reasons when removing content. Online
  platforms have more duties; micro and small enterprises are exempt from some. Check which tier fits.
- **UK Online Safety Act 2023:** user-to-user and search services with UK users need illegal content risk
  assessments and, if children can access them, children's risk assessments and age checks for some content. Ofcom's
  codes apply in stages: check the current ones.
- **Illegal content:** a way to report it, and mandatory reporting of child sexual abuse material where the law
  requires (in the US, to NCMEC).
- **Defamation and harmful content:** in user posts and in AI-generated text the project publishes as its own.

## Accessibility

- **EU European Accessibility Act** (Directive (EU) 2019/882), applying since 28 June 2025 to e-commerce, consumer
  banking, e-books, transport ticketing and some other services sold to EU consumers; micro-enterprises are exempt for
  services. Usually met by following WCAG 2.1 level AA (through the EN 301 549 standard), plus an accessibility
  statement.
- **US ADA Title III:** many lawsuits against websites and apps of businesses open to the public, judged against WCAG
  2.1 AA in practice. State laws (California's Unruh Act) add damages.
- **Check the code quickly** (this is not a full audit): images without alt text, form inputs without labels, colour
  contrast in the theme, keyboard focus styles removed, no `lang` attribute, video without captions. Recommend a full
  audit with a tool such as axe as a step for the person.

## Promotions and age

- **Contests, giveaways, raffles:** rules differ widely (no purchase necessary in the US, registration in some
  countries, bans in others); a raffle with a paid entry can be illegal gambling.
- **Age limits:** a minimum age in the terms, and an age gate where the content or the law needs one (alcohol,
  gambling, adult content, some social features for children).

## What "done well" looks like

Clear terms accepted by a checkbox, prices with all fees up front, cancellation online in a few clicks, consent stored
for marketing, unsubscribe links working, a takedown contact, an accessibility statement and no obvious WCAG gaps.
