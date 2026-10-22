# Output: leads.csv and leads.md

## leads/leads.csv

UTF-8 with a header row, comma-separated, every field quoted when it holds a comma, quote or line break (any
standard CSV writer does this). It opens in Excel, Google Sheets and any CRM (a customer tracking tool).

| Column | What goes in it |
|---|---|
| `id` | A running number, never reused |
| `found_on` | The date the lead was added (YYYY-MM-DD) |
| `kind` | `business` or `person` |
| `lead_type` | `fit`, `intent`, `rival-unhappy` or `trigger` |
| `name_or_handle` | The business name, or a person's public username |
| `link` | The page or post the lead was found on |
| `found_where` | The source in a few words (for example "Instagram search #austinbakery") |
| `location` | City or region, if known |
| `need_or_fit` | What they need (intent, people) or why they fit (business), one line |
| `fit_score` | 1 to 10 |
| `fit_reason` | One line |
| `detail` | The one real detail used in the message, with where it was seen |
| `channel` | `email`, `whatsapp`, `instagram`, `facebook`, `linkedin` or `reply-on-post` |
| `contact_route` | The public business email, WhatsApp number or page; for a person, "reply on the post" |
| `message` | The drafted message, in the lead's language (for email: `Subject: ...` on the first line) |
| `message_en` | The English version (empty when `message` is already English) |
| `status` | `new`, `messaged`, `replied`, `meeting`, `won` or `no`; the skill writes `new` and never changes it after. A candidate that failed the checks is written as `dropped`, with the reason in `fit_reason`, no message and no contact route, so later runs skip it (it may be checked again after about 90 days) |
| `notes` | Left for the person; the skill never writes here after creating the row |

A person row never holds a phone number or email address in any column.

## leads/leads.md

```markdown
# Leads: {business in a few words}

## Who we look for (saved {date})
{the confirmed ideal customer profile}

**Channels:** {channels}
**Leave out:** {exclusions}

## Run of {date}
Kept {n} leads ({by kind}), from {m} candidates. Sources: {short list}. Browser: {used, look only | not used}.

### Top 10
| Fit | Lead | Kind | Channel | Why |
|---|---|---|---|---|

### Could not check
- {what, why}

Nothing was sent. Every message is in leads.csv.
```

Each new run adds a "Run of {date}" section on top of the older ones and keeps the saved profile unless the person
changed it.
