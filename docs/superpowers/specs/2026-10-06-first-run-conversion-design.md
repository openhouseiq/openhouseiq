# First-run conversion: card-free trial, sample listing, compliant visitor consent

Date: 2026-10-06. Status: awaiting owner review (not committed, no code written).

## Goal

More Australian real estate agents sign up, run a real open house, and pay. Success means a new agent sees working results within minutes, without entering a card, and upgrades before the trial lapses.

Constraints from the owner:
- No spend, publishing or sending of messages without confirming exact values first (CLAUDE.md). Anything that sends email is built behind a dry-run and ships disabled until the owner approves the exact copy and recipients.
- No paid channels or recurring-cost services added now. No SMS.
- No listing photo uploads (storage and bandwidth cost, little return).
- Comply with Australian law now and US law when the US launch happens. This is not legal advice; Terms and Privacy drafts get a one-off solicitor review before launch.

## Decomposition (each its own spec, plan and build)

1. First-run conversion (this spec).
2. Vendor-wow output: auto-generated print flyer (QR, address, price guide, bed/bath/parking, agent details) and a shareable private vendor report link. No photo uploads.
3. Attendee follow-up by email, consent-gated. Uses the consent log from this spec.
4. Polish and trust: branding leftovers, SEO titles, accessibility, structured data.
5. Insights across open houses.
6. US launch: `cueproperty.com` on the same app, USD pricing (owner supplies exact figures), US legal pages and consent wording. SMS only if the owner later funds carrier registration.

Already done outside this spec: Terms and Security contact address changed to contact@cueproperty.com.au.

## Design

### 1. Trial and access

- Signup trigger (`handle_new_user_subscription`, last defined in `supabase/0017_require_card_at_signup.sql`) writes `status = 'trialing'`, `trial_ends_at = now() + 14 days` for non-pilot users. Pilot allowlist keeps 90 days. Agency owners keep the existing agency checkout path unchanged.
- One-time data change: users currently `incomplete` with no agency coverage get `trialing` for 14 days from the run date. The exact rows are listed for the owner before the statement runs.
- Abuse guards: Turnstile (existing), required email confirmation before any access, one trial per email (auth enforces), per-IP signup rate limit using the existing limiter.
- Expiry: `has_active_access()` already blocks new listings and leaves viewing intact; keep that.
- Upgrade: existing Stripe Checkout, no second trial, same prices ($39/month, $390/year). Before copy ships, read the live Stripe prices back and report currency and GST treatment against what the pages say.
- Existing Stripe-trial and paying subscribers are untouched.
- Data retention after a lapsed trial: 90 days, then deletion of the account's data (see section 4). Reactivating before day 90 cancels deletion.

### 2. First-run experience

- After email confirmation the welcome page becomes a short "14 days free, no card needed" screen, then the dashboard.
- A sample listing is created on first login: `listings.is_sample = true`, labelled "Sample", fictional visitors with `@example.com` addresses, ranked offers against sample seller preferences. Its public visit form is disabled, it sends no notifications, it is excluded from CSV exports and counts, and it can be deleted.
- Dashboard checklist (dismissible, state stored per user): explore the sample, create a real listing, print the QR or flyer, turn on alerts or install the app.
- Trial banner shows days left and an Upgrade button, stronger in the final 3 days.

### 3. Visitor consent and notices (Australia now, US-ready)

- Visitor forms (`/visit/[id]/feedback`, `offer`, `apply`) show a short collection notice with a link to Privacy (Privacy Act APP 5; US notice at collection).
- A separate, unticked checkbox: "[Agent name] may email me about this property and similar listings." Required contact fields stay required; marketing consent is independent of them.
- New table `visitor_consents`: listing, visitor submission reference, channel (`email`), wording version, timestamp. No raw IP stored.
- Unsubscribe: tokenised one-click link, honoured immediately, per-agent suppression list. Required for Spam Act sender identification and unsubscribe, and CAN-SPAM when the US launches.
- SMS is not built. Consent is email-only, so SMS later requires fresh consent from visitors.
- Meta Pixel: load only on marketing pages. It must not fire on `/visit/*` or `/dashboard/*`. Disclose Pixel, UTM cookie and referral cookie in Privacy, with an opt-out.
- Terms and Privacy updated: agent is the controller of visitor data and CueProperty the processor; overseas hosting and disclosures (Supabase, Netlify, Stripe, Resend, Meta); retention and deletion; breach contact; state the 90-day post-trial retention; US state rights section prepared for sub-project 6.

### 4. Trial-ending and deletion messages (agent account notices)

- Daily scheduled Netlify function (same pattern as `netlify/functions/keep-warm.ts`) computes who is due. Trial notices at day 10 (4 days left), day 13 (tomorrow) and day 15 (ended). Post-lapse deletion warnings at day 60 and day 83 after lapse, each with a one-click CSV export link. Account notices only, no promotional content, sent via existing Resend setup.
- Deletion at day 90 after lapse. Reactivation before then cancels it.
- Dry-run first: the function lists recipients and message type without sending or deleting. Both sending and deletion are gated behind separate flags that stay off until the owner approves the exact copy, recipients, and the list of accounts to be deleted.

### 5. Funnel in admin

Admin dashboard adds: signed up, created a real listing, printed the QR, upgraded, grouped by existing UTM source. Requires recording "printed QR" and "created real listing" events.

### 6. Landing page and metadata

- Keep "Run better open houses." Add a "for Australian agents" subline. Primary CTA: "Start free, no card needed".
- Remove "Add photos if you have them". Replace "CAPTCHA-protected" with plain wording. State currency and GST once confirmed.
- Real screenshots from the sample listing (dashboard, ranked offers, feedback, flyer once built). No invented testimonials; any quotes come from real pilot agents with permission.
- FAQ additions: card required, what happens when the trial ends, where data is stored.
- Fixes: per-page titles for signup and login, better site description, Twitter card tags, remove the expiring `priceValidUntil` in structured data, automatic copyright year, rental wording on visit-page metadata, delete unused starter SVGs in `public/`.

## Testing

- Migration tested on a copy first: new signup gets 14 days; pilot gets 90; agency path unchanged; stalled `incomplete` accounts get trials only after owner approval.
- Sample listing: cannot receive public submissions, excluded from exports and counts, deletable.
- Consent: form submits without ticking; consent row exists only when ticked; unsubscribe suppresses future sends.
- Pixel: confirmed not requested on `/visit/*` or `/dashboard/*` (network inspection).
- Stripe: test-mode upgrade flips status to `active` and clears the trial end.
- Scheduled function: dry-run output reviewed before any flag is enabled.

## Open items (owner decisions or confirmations)

1. Exact Stripe currency and GST treatment (read-back before copy ships).
2. Final email copy and recipient rules for trial and deletion notices.
3. Approval of the list of `incomplete` accounts to receive trials.
4. Solicitor review of Terms and Privacy before launch.
5. US pricing in USD (sub-project 6).
