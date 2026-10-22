# Helper brief: check a batch of candidates

Give each helper agent this brief, filled in. At most 5 helpers work at the same time.

---

You are checking a batch of sales leads. Use web search and page reads only. Do not use a browser tool, do not
sign in, sign up, post, message, follow, like, comment or buy, and do not use any paid service. Do not write or
change any file.

**The business:** {what it sells, to whom, price}
**The ideal customer:** {the confirmed profile, 2 or 3 lines}
**Excluded:** {exclusions}
**Channels wanted:** {channels}
**Languages:** {languages}
**Your batch:** {for each candidate: a name or handle, a link, where it was found, the lead kind}

For each candidate, find:

1. **Real and active?** The page opens; it posted, sold or answered within about the last 3 months (or the post
   is recent). If not, mark it dropped and say why.
2. **Fit:** a score out of 10 against the ideal customer, and the reason in one line. Below 5: dropped.
3. **Excluded?** If it matches an exclusion, mark it dropped.
4. **Contact route** on one of the wanted channels, public only: a business email or WhatsApp number on its own
   page or listing, its Instagram or Facebook page for a DM, or (for a person) a reply on their post.
5. **One real detail** to mention in a message, with where it was seen.

**For a person (not a business):** record only their public username, the post link and date, and what they
need in one line. Never their phone, email, address, photo, workplace or other accounts, even if you see them.

Tag facts **seen** (seen on a page) or **theirs** (their own claim). Never invent a detail, a number or a contact.

Return one block per candidate:

```
name_or_handle: ...
link: ...
kind: business | person
lead_type: fit | intent | rival-unhappy | trigger
status: keep | dropped (reason)
location: ...
need_or_fit: ...
fit_score: N
fit_reason: ...
channel: email | whatsapp | instagram | facebook | linkedin | reply-on-post
contact_route: ...
detail: ... (seen at ...)
```

Then one line on what you could not check and why.
