# First-Run Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** New agents get a card-free 14-day trial with a sample listing and checklist, visitors give logged email consent, and lapsed accounts get notices then deletion at 90 days, all dry-run-gated.

**Architecture:** The DB trigger starts non-pilot signups as `trialing`. A sample listing, onboarding state and consent log live in new tables. A secret-protected Next API route computes trial notices and deletions (pure classifier plus dry-run default); a thin Netlify scheduled function calls it daily. Pure logic is unit-tested with a new Vitest setup; UI is verified with tsc, lint, build and a browser pass.

**Tech Stack:** Next.js 16.3.4 (App Router, breaking changes: read `node_modules/next/dist/docs/` before writing Next code, per AGENTS.md), React 19, Supabase (SQL run manually in the SQL Editor), Stripe, Resend (plain text only), Netlify scheduled functions, Vitest (new).

**Spec:** `docs/superpowers/specs/2026-10-06-first-run-conversion-design.md`

## Global Constraints

- Trial: 14 days, no card, `status='trialing'`; pilot allowlist stays 90 days; agency path unchanged.
- Prices unchanged: $39/month, $390/year. Read live Stripe prices back (currency, GST) and report against page copy before any pricing copy ships.
- Retention after lapse: 90 days then deletion. Notices: day 10, day 13, day 15 (trial); day 60 and day 83 after lapse (deletion warnings). Agency members, pilot agents and `active` subscribers are never notified or deleted.
- Email-only consent. No SMS. No listing photo uploads.
- Nothing sends and nothing is deleted until the owner approves exact copy, recipients and the deletion list: lifecycle route defaults to dry-run and both actions are behind `TRIAL_NOTICES_ENABLED` / `TRIAL_DELETION_ENABLED` env flags that stay unset.
- Public contact address: contact@cueproperty.com.au.
- Meta Pixel must not load on `/visit/*` or `/dashboard/*`.
- SQL migrations are applied by the owner in the Supabase SQL Editor; the implementer writes the files and does not run them. Env vars with secrets are added by the owner in Netlify (the assistant cannot write secrets).
- Commit steps show the intended message; commit only if the owner has told this session to commit. Never push without being told.
- Spend, publish and send actions: restate exact values, confirm, then read back (CLAUDE.md).

## Review Focus

- Same email with different case or `+tag` signs up twice: one trial per email (case-insensitive); the plan's migration test covers lowercase match.
- Lifecycle run twice in one day: no duplicate notice (unique `trial_notices (user_id, kind)`).
- Agency member, pilot agent or active subscriber hits the classifier: returns no action.
- Sample listing opened through its public `/visit/[id]` URL or posted to by API: friendly refusal, not an error or a stored submission.
- Checkout for a user who already used the internal trial: no second Stripe trial and no Stripe error from `trial_period_days: 0`.

## File Structure

- Create `vitest.config.ts`; `src/lib/trial.ts` (trial dates, checkout trial days); `src/lib/trialLifecycle.ts` (classifier); `src/lib/onboarding.ts` (checklist); `src/lib/sampleListing.ts`; `src/lib/consent.ts`; `src/lib/unsubscribeToken.ts`; `src/lib/accountExport.ts`; `src/lib/deleteAgentAccount.ts`.
- Create routes: `src/app/api/trial-lifecycle/run/route.ts`, `src/app/api/account-export/route.ts`, `src/app/unsubscribe/[token]/page.tsx`.
- Create components: `src/components/dashboard/TrialBanner.tsx`, `src/components/dashboard/OnboardingChecklist.tsx`, `src/components/visit/ConsentFields.tsx`.
- Create `netlify/functions/trial-lifecycle.ts`; migrations `supabase/0031`–`0035` (below).
- Modify: welcome page and `StartTrialSection`, `dashboard/page.tsx`, `ListingsList.tsx`, `api/stripe/checkout/route.ts`, `BillingSection.tsx`, `listings/new/page.tsx`, visitor forms and their `/api/*` routes, `lib/rateLimit.ts`, `MetaPixel.tsx`, `lib/supabase/middleware.ts` (public routes), admin page, landing page, layout and auth page metadata, Terms/Privacy, `supabase/README.md`.

### Task 0: Land existing uncommitted work

**Files:** none new.

- [ ] **Step 1:** Ask the owner whether to commit the current uncommitted work (UTM capture, Turnstile component, auth page changes, admin source column, Terms/Security contact fix) as a baseline. `signup`/`login` import untracked `src/components/auth/Turnstile.tsx`, so commit them together.
- [ ] **Step 2:** If approved, stage by explicit paths from `git status`, run `npx tsc --noEmit`, commit "Land UTM capture, Turnstile component and contact address fix". If not approved, continue with the tree dirty and avoid committing unrelated files.

### Task 1: Vitest and trial helpers

**Files:** Create `vitest.config.ts`, `src/lib/trial.ts`, `src/lib/trial.test.ts`; Modify `package.json` (add `"test": "vitest run"`, devDependency `vitest`).

**Interfaces:**
- Produces: `TRIAL_DAYS = 14`; `trialEndsAt(from: Date): Date`; `daysLeft(trialEndsAt: Date | null, now: Date): number` (ceil, min 0); `checkoutTrialDays(sub: { stripe_subscription_id: string | null; trial_ends_at: string | null; status: string } | null): number | undefined` returns `undefined` (omit `trial_period_days`) whenever the user has any `trial_ends_at` or status other than `incomplete`, else `14`.

- [ ] **Step 1:** Install `vitest`, add the script and config with the `@/` alias to `src`.
- [ ] **Step 2:** Write failing tests in `src/lib/trial.test.ts`: `trialEndsAt adds exactly 14 days`; `daysLeft rounds up and floors at 0`; `checkoutTrialDays is undefined for a trialing user with trial_ends_at`; `checkoutTrialDays is 14 for an incomplete user with no trial_ends_at`. Run `npx vitest run` and expect FAIL.
- [ ] **Step 3:** Implement `src/lib/trial.ts`. Run tests, expect PASS.
- [ ] **Step 4:** Commit "Add Vitest and trial helpers".

### Task 2: Card-free trial migration

**Files:** Create `supabase/0031_card_free_trial.sql`, `supabase/0032_backfill_incomplete_trials.sql`.

- [ ] **Step 1:** In 0031, replace `handle_new_user_subscription` (last defined in `0017`): pilot (`lower(email)` match) keeps 90 days; every other user inserts `status='trialing'`, `trial_ends_at = now() + interval '14 days'`. Header comment must say "Run once in the Supabase SQL Editor".
- [ ] **Step 2:** In 0032 (do not run until the owner approves), a commented `SELECT` listing every `incomplete` row with no active agency membership, then the guarded `UPDATE ... SET status='trialing', trial_ends_at = now() + interval '14 days'` for exactly those rows.
- [ ] **Step 3:** Include rollback SQL as a comment at the foot of 0031 (restore the 0017 body). Verification for the owner: new test signup row shows `trialing` and `trial_ends_at` ~14 days out; a pilot email shows 90 days; `has_active_access(uid)` is true.
- [ ] **Step 4:** Commit "Card-free 14-day trial trigger and backfill script".

### Task 3: Signup and welcome flow without a card

**Files:** Modify `src/app/dashboard/welcome/page.tsx`, `StartTrialSection.tsx` (delete if unused after the change), `src/app/dashboard/page.tsx:51-56`, `src/lib/rateLimit.ts` (`LIMITS["signup-profile"]` from 10 to 3).

- [ ] **Step 1:** In `welcome/page.tsx`, `needsCard` now only applies to agency owners starting an agency; solo users see a short "You have 14 days free, no card needed" screen with a "Go to dashboard" button and `daysLeft` from `lib/trial.ts`. Keep `coveredByAgency` and `startingAgency` branches unchanged.
- [ ] **Step 2:** In `dashboard/page.tsx`, keep the `incomplete`-redirect to `/dashboard/welcome` (still correct for agency starters).
- [ ] **Step 3:** Lower the signup-profile limit to 3 per minute per IP (Supabase Auth and Turnstile also rate-limit account creation itself; note this in the PR).
- [ ] **Step 4:** Verify with `npx tsc --noEmit && npm run lint`; browser: a new `trialing` account lands on dashboard without a card step.
- [ ] **Step 5:** Commit "Remove card gate from solo signup".

### Task 4: Sample listing

**Files:** Create `supabase/0033_sample_listing.sql`, `src/lib/sampleListing.ts`, `src/lib/sampleListing.test.ts`; Modify `dashboard/page.tsx`, `ListingsList.tsx`, `api/feedback`, `api/offers`, `api/applicants` routes, `visit/[id]/page.tsx`, admin page counts.

**Interfaces:**
- Produces: `listings.is_sample boolean not null default false`; table `onboarding_state(user_id uuid primary key references auth.users on delete cascade, sample_created_at timestamptz, checklist_dismissed_at timestamptz, qr_printed_at timestamptz)` with service-role access only; `buildSampleData(): { listing; feedback: SampleFeedback[]; offers: SampleOffer[] }` (pure: one sale listing "12 Example Street, Sydney NSW (Sample)", 6 feedback rows and 4 offers with fictional names and `@example.com` emails, plus seller preferences); `ensureSampleListing(service, userId): Promise<void>` (no-op if `onboarding_state.sample_created_at` is set).

- [ ] **Step 1:** Write failing tests: `sample data uses only @example.com emails`; `sample data has 6 feedback and 4 offers`; `ensureSampleListing is a no-op when sample_created_at is set` (inject a fake client). Run, expect FAIL.
- [ ] **Step 2:** Implement migration and `sampleListing.ts`. Run tests, expect PASS.
- [ ] **Step 3:** Call `ensureSampleListing` from `dashboard/page.tsx` for users with access and no onboarding row; render a "Sample" badge in `ListingsList.tsx` and allow deleting it.
- [ ] **Step 4:** In the three submission routes and `visit/[id]/page.tsx`, if the listing `is_sample`, return 400 "This is a sample listing" / render a plain notice, store nothing, notify nobody.
- [ ] **Step 5:** Exclude `is_sample` listings from dashboard counts and the admin stats and funnel queries, and hide the CSV export buttons on a sample listing's detail page.
- [ ] **Step 6:** Verify tsc, lint, tests; browser: new account shows the sample with ranked offers; its public URL shows the sample notice. Commit "Add sample listing for new accounts".

### Task 5: Checklist and trial banner

**Files:** Create `src/lib/onboarding.ts`, `src/lib/onboarding.test.ts`, `TrialBanner.tsx`, `OnboardingChecklist.tsx`; Modify `dashboard/page.tsx`, the QR download handler on the listing page (record `qr_printed_at`).

**Interfaces:**
- Produces: `buildChecklist(facts: { sampleViewed: boolean; realListingCount: number; qrPrintedAt: string | null; hasPushOrAppInstall: boolean; dismissedAt: string | null }): { items: { id: 'sample'|'listing'|'qr'|'alerts'; done: boolean }[]; hidden: boolean }`.

- [ ] **Step 1:** Failing tests: `checklist counts only non-sample listings`; `checklist is hidden once dismissed`; `all four items done marks every item done`. Run, expect FAIL.
- [ ] **Step 2:** Implement `buildChecklist`; build the two components; mount above the listings list. `TrialBanner` shows `daysLeft` and an Upgrade button to `/dashboard/settings`, stronger styling at 3 days or fewer, hidden for `active` and agency-covered users.
- [ ] **Step 3:** Run tests, tsc, lint. Commit "Add onboarding checklist and trial banner".

### Task 6: Upgrade flow and expired state

**Files:** Modify `src/app/api/stripe/checkout/route.ts`, `BillingSection.tsx`, `listings/new/page.tsx`.

- [ ] **Step 1:** In checkout, set `subscription_data.trial_period_days` from `checkoutTrialDays(subscription)` and spread it only when defined; keep `payment_method_collection: "always"`, prices and success/cancel URLs unchanged.
- [ ] **Step 2:** `BillingSection`: wording for internal trials ("Your free trial ends {date}. Add a card to continue.") with the existing Subscribe buttons; expired state reads "Your trial ended. Your data is safe for 90 days. Upgrade to keep creating listings." Mirror in `listings/new/page.tsx`.
- [ ] **Step 3:** Stripe test mode: upgrade a trialing user; webhook sets `status='active'` and no trial remains; no second 14 days. Read live Stripe price currency and GST and report to the owner before any pricing text changes.
- [ ] **Step 4:** Commit "Upgrade flow for card-free trials".

### Task 7: Visitor consent, notices and unsubscribe

**Files:** Create `supabase/0034_visitor_consents.sql`, `src/lib/consent.ts`, `src/lib/consent.test.ts`, `src/lib/unsubscribeToken.ts`, `src/lib/unsubscribeToken.test.ts`, `ConsentFields.tsx`, `src/app/unsubscribe/[token]/page.tsx`; Modify `FeedbackForm.tsx`, `OfferForm.tsx`, `ApplicationForm.tsx`, the three `/api/*` routes, `lib/supabase/middleware.ts` (add `/unsubscribe` to public routes).

**Interfaces:**
- Produces: tables `visitor_consents(id, listing_id, source_table text, source_id uuid, email text, channel text check ('email'), wording_version text, consented_at timestamptz default now())` and `email_suppressions(agent_id uuid, email text, created_at, primary key (agent_id, lower(email)))`, both service-role only; `CONSENT_WORDING_VERSION = "2026-10-v1"`; `consentText(agentName: string): string` returning "{agentName} may email me about this property and similar listings."; `signUnsubscribeToken(agentId: string, email: string, secret: string): string` and `verifyUnsubscribeToken(token: string, secret: string): { agentId: string; email: string } | null` (HMAC-SHA256, constant-time compare).

- [ ] **Step 1:** Failing tests: `consentText names the agent`; `token round-trips`; `tampered token returns null`; `token for a different secret returns null`. Run, expect FAIL.
- [ ] **Step 2:** Implement the libs. Run tests, expect PASS.
- [ ] **Step 3:** `ConsentFields` renders a short collection notice linking `/privacy` and an unticked checkbox with `consentText`. Add it to the three forms; send `emailConsent: boolean` in the POST body.
- [ ] **Step 4:** In each `/api/*` route, insert a `visitor_consents` row only when `emailConsent === true` and the submission has an email (submission still succeeds when unticked).
- [ ] **Step 5:** `/unsubscribe/[token]` verifies the token (secret `UNSUBSCRIBE_SECRET`, owner adds it in Netlify), inserts into `email_suppressions`, and shows a plain confirmation; invalid token shows a neutral message.
- [ ] **Step 6:** Verify tests, tsc, lint; browser: submit with and without the box and check rows. Commit "Add visitor email consent log and unsubscribe".

### Task 8: Meta Pixel only on marketing pages

**Files:** Modify `src/components/MetaPixel.tsx`, `src/app/privacy/page.tsx`; Create `src/lib/pixelPolicy.ts`, `src/lib/pixelPolicy.test.ts`.

**Interfaces:**
- Produces: `shouldLoadPixel(pathname: string, optedOut: boolean): boolean` true only for `/` and `/signup` when not opted out.

- [ ] **Step 1:** Failing tests: `loads on / and /signup`; `never loads on /visit/abc or /dashboard`; `never loads when opted out`. Run, expect FAIL.
- [ ] **Step 2:** Implement; make `MetaPixel` a client component using `usePathname()` and a `cp_no_pixel` cookie check, rendering the existing script only when `shouldLoadPixel` is true.
- [ ] **Step 3:** Privacy page gains a short "Tracking and cookies" section (Pixel, `cp_utm`, `cp_ref`) with an opt-out button that sets `cp_no_pixel=1`.
- [ ] **Step 4:** Verify in the browser network panel: no `fbevents.js` on `/visit/*` or `/dashboard`. Commit "Limit Meta Pixel to marketing pages".

### Task 9: Trial lifecycle notices and deletion (dry-run)

**Files:** Create `supabase/0035_trial_notices.sql`, `src/lib/trialLifecycle.ts`, `src/lib/trialLifecycle.test.ts`, `src/lib/deleteAgentAccount.ts`, `src/lib/accountExport.ts`, `src/app/api/trial-lifecycle/run/route.ts`, `src/app/api/account-export/route.ts`, `netlify/functions/trial-lifecycle.ts`; Modify `lib/supabase/middleware.ts` (public routes `/api/trial-lifecycle`, `/api/account-export`), `src/app/api/admin/delete-user/route.ts` and `api/account/delete` to reuse `deleteAgentAccount`.

**Interfaces:**
- Produces: `type LifecycleAction = 'trial_day10' | 'trial_day13' | 'trial_ended' | 'delete_warn_60' | 'delete_warn_83' | 'delete_90'`; `classifyAccount(input: { now: Date; status: string; trialEndsAt: Date | null; stripeSubscriptionId: string | null; isPilot: boolean; inAgency: boolean }): LifecycleAction | null` using days since `trialEndsAt`: day 10 of trial is `trialEndsAt - 4 days`, day 13 is `trialEndsAt - 1 day`, `trial_ended` at `trialEndsAt + 1 day`, warnings at +60 and +83 days, deletion at +90; table `trial_notices(user_id uuid, kind text, sent_at timestamptz default now(), primary key (user_id, kind))`; `signExportToken` / `verifyExportToken` in `accountExport.ts` (HMAC, 7-day expiry, secret `ACCOUNT_EXPORT_SECRET`) and `buildAccountCsv(service, userId): Promise<string>` (one CSV of all feedback, offers and applicants across the user's non-sample listings); `deleteAgentAccount(service, userId): Promise<void>` extracted from the existing admin delete route.

- [ ] **Step 1:** Failing tests: `classifies each of the six dates exactly`; `returns null on any other day`; `returns null for active, pilot, agency-member and stripe-subscribed accounts`; `export token expires after 7 days`. Run, expect FAIL.
- [ ] **Step 2:** Implement `trialLifecycle.ts` and the export token. Run tests, expect PASS.
- [ ] **Step 3:** Route `POST /api/trial-lifecycle/run` requires `Authorization: Bearer $TRIAL_LIFECYCLE_SECRET` (403 otherwise). It loads candidate subscriptions, classifies each, skips any `(user_id, kind)` already in `trial_notices`, and by default returns JSON `{ dryRun: true, wouldSend: [...], wouldDelete: [...] }`. Sending requires `TRIAL_NOTICES_ENABLED=true` (plain-text via `sendEmailChecked`, from contact@cueproperty.com.au copy approved by the owner, with export link for warnings); deletion requires `TRIAL_DELETION_ENABLED=true`; both write `trial_notices` rows.
- [ ] **Step 4:** `GET /api/account-export?token=` verifies the token and returns the CSV with a download filename.
- [ ] **Step 5:** `netlify/functions/trial-lifecycle.ts` uses `schedule("0 20 * * *", ...)` (daily, UTC) to POST the route with the bearer secret; it imports nothing from `src/lib`.
- [ ] **Step 6:** Verify tests, tsc, lint; run the route against production data in dry-run only (owner supplies the secret) and give the owner the printed lists. Commit "Add dry-run trial lifecycle notices and deletion".

### Task 10: Admin funnel

**Files:** Modify `src/app/admin/page.tsx` (insert before the "Current snapshot" heading around line 453); Create `src/lib/funnel.ts`, `src/lib/funnel.test.ts`.

**Interfaces:**
- Produces: `buildFunnel(rows: { source: string; signedUp: true; realListing: boolean; qrPrinted: boolean; upgraded: boolean }[]): { source: string; signedUp: number; realListing: number; qrPrinted: number; upgraded: number }[]`.

- [ ] **Step 1:** Failing tests: `groups by source with Direct for missing source`; `counts each stage per source`; `sample listings never count as a real listing`. Run, expect FAIL.
- [ ] **Step 2:** Implement and render a table using existing data in scope (`users`, `subscriptionRows`, `listingRows`, `onboarding_state`). Run tests, tsc, lint. Commit "Add funnel to admin dashboard".

### Task 11: Landing page and metadata

**Files:** Modify `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/signup/page.tsx` and `login/page.tsx` (add metadata via a small server wrapper or `layout.tsx` per route), `src/app/visit/[id]/layout.tsx`, `public/` (delete unused starter SVGs).

- [ ] **Step 1:** `page.tsx`: hero subline gains "for Australian agents"; primary CTA text "Start free, no card needed" (lines 154-161 and pricing CTA at 296-298); remove "Add photos if you have them" (line 70); replace "CAPTCHA-protected public forms" (line 111) with "Spam-protected public forms"; add FAQ entries (card required, trial end, data location); copyright year computed with `new Date().getFullYear()`; remove `priceValidUntil` (line 401). Add real screenshots from the sample listing only after the owner supplies them.
- [ ] **Step 2:** Root description becomes "Open house feedback, offers and rental applications for Australian real estate agents"; add per-route titles for signup and login; add Twitter card metadata.
- [ ] **Step 3:** `visit/[id]/layout.tsx`: description says "Apply to rent" for rentals, "Leave feedback or submit an offer" for sales.
- [ ] **Step 4:** Delete `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` after grepping that nothing references them. Verify tsc, lint, build. Commit "Landing copy, metadata and cleanup".

### Task 12: Legal pages and docs

**Files:** Modify `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`, `supabase/README.md`.

- [ ] **Step 1:** Draft updates: roles (agent controls visitor data, CueProperty processes it), overseas hosting (Supabase, Netlify, Stripe, Resend, Meta), 90-day post-trial retention, data-breach contact contact@cueproperty.com.au, email consent and unsubscribe, a US state-rights placeholder section marked for sub-project 6. Do not state anything the code does not do.
- [ ] **Step 2:** Add rows 0017–0035 to the stale README table. Flag the Terms and Privacy drafts to the owner for solicitor review. Commit "Update legal pages and migration docs".

### Task 13: Final verification

- [ ] **Step 1:** Run `npx vitest run`, `npx tsc --noEmit`, `npm run lint`, `npm run build`; all must pass with output shown.
- [ ] **Step 2:** Browser pass on a fresh test account: signup, sample listing, checklist, banner, consent boxes (ticked and unticked), upgrade in Stripe test mode; network panel shows no Pixel on `/visit/*` or `/dashboard`.
- [ ] **Step 3:** Give the owner the open-items list from the spec with the dry-run output, then wait for approval before running 0032, enabling any flag, or sending anything.
