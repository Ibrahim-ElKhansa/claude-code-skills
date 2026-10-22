# Report template: legal-review.md

Write in plain words for founders and developers. Explain each legal term in a short clause the first time. Dates
written out. Every finding carries its evidence.

## Levels

| Level | Meaning | Examples |
|---|---|---|
| **High** | A clear breach of a law or a service's terms, or a missing legal duty, with a realistic chance of a fine, a lawsuit, a ban or a lost account | scraping a site whose terms forbid it with a logged-in account; tracking pixels firing before consent for EU visitors; GPL code in a closed mobile app; marketing texts with no consent record |
| **Medium** | A likely gap, or a grey area with real exposure | a privacy policy that misses two services the code uses; no data processing agreement accepted with an email provider; no easy online cancellation |
| **Low** | Good practice, or a risk that depends on facts not in the project | no accessibility statement; no trademark search done; a contributor agreement missing |

Level by likelihood and impact together: a rule rarely enforced against a small project with mild consequences is
Low even when breached; a rule with private lawsuits per violation (US texting, biometrics) is High even for a small
project.

## Tags

**code** (seen in the project), **terms** (a service's own words), **law** (an official text or a regulator's
guidance), **reading** (our judgment where the text is unclear or facts are missing).

## Layout

```markdown
# Legal review: <project name>

> **Not legal advice.** This is an automated review to help you prepare for a conversation with a lawyer. It
> checks what it could read on <date>; laws and terms change, and it can miss things or be wrong. Have a qualified
> lawyer in each country you operate in confirm anything that matters before you rely on it.

Reviewed on <date> · Countries: <list> · Areas: <list> · Project: <one line>

## Since <last run's date>          (only on a re-run)
- Fixed: ...
- New: ...
- Still open: ...
- Terms that changed since last read: ...

## In short
<3 to 5 sentences: overall exposure (high, medium, low), the one or two things to fix first, and what was not
checked.>

| Level | Count |
|---|---|
| High | n |
| Medium | n |
| Low | n |

## Fix first
1. <High finding title>: <one line on the fix> ([details](#anchor))
2. ...

## Findings

### Privacy and data protection
#### <Level> · <title>
- **What we found:** <plain words> (`file:line`) · tag
- **The rule:** <law or clause>, <link>, read <date>
  > "<exact short quote, only if read>"
- **Why it matters:** <the realistic consequence>
- **Fix:** <change in code or text> / **Step for you:** <contract, registration, permission>

(one block per finding, most serious first; then the same for each area)

### Third-party services
<one block per service: how it is used, the documents read (link, last updated, date read), findings, or "No issue
found in the clauses read">

### Licences
### Consumer and content
### AI, sector and other

## Done well
- <one line each, with file:line>

## Steps for you
<Everything that is not a code change: sign a DPA with X, register with the ICO, register a DMCA agent, ask Y for
written permission, check VAT registration with an accountant, have a lawyer read the drafted policy. Each with why
and a link.>

## Not checked
- <what, why (blocked page, needs a contract, facts not in the code), and the question that would settle it>

## Appendix: inventory
<the inventory note: personal data, outside services, packages and assets, legal pages>

## Appendix: sources read
| Source | Link | Last updated | Read on |
|---|---|---|---|
```

## The page

The same content as a readable page: the summary and counts at the top, findings grouped by area with each level
coloured (High, Medium, Low), the "Not legal advice" note always visible at the top. A local `legal-review.html` is
one self-contained file with inline styles and no outside scripts or fonts.
