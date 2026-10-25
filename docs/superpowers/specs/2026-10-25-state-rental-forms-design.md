# State-specific rental forms and applicant shortlist: design

Status: draft for the owner's sign-off. Nothing in this document has been built.
Date: 25 October 2026. Scope for the first release: Queensland and Victoria.
Research and sources: `docs/research/rental-application-forms-qld-vic.md`.

## 1. Purpose and agreed understanding

What the owner said:
- Agents must select the state the rental property is in, and the form for each state must comply with that state's rules.
- Start with Queensland and Victoria.
- Open Home Hero should **present the most suitable applicants** to the agent, who presents them to the landlord. It is a ranking and shortlisting tool, not just a form.
- The data comes from the official form fields, and the ranking inputs and exclusions in section 6 are agreed.
- For now the product is described as a **shortlisting tool**, not a replacement for the official application. Whether the digital form can count as the official application is a question for a tenancy lawyer (section 11).

Assumptions I am making (correct me if wrong):
- Sales listings (feedback and offers) are unchanged by this work.
- Existing rental applicant rows stay readable on the dashboard.
- No document uploads in the first release.

Success looks like:
- An agent creating a rental listing in Queensland or Victoria gets the matching official form for visitors, with no questions beyond the form.
- The agent sees applicants ranked, with the reasons shown, and can mark a shortlist to present to the landlord.
- Rentals in any state we have not built cannot collect applications.
- Applicant data is deleted or de-identified on the legal timetables.

## 2. What is wrong today

The current rental form (`src/app/visit/[id]/apply/ApplicationForm.tsx`) and API (`src/app/api/applicants/route.ts`) collect a smoker tick and free-text notes, which neither state allows. They lack date of birth, current address, two-property rental history, two referees, document requests, tenancy database disclosure, vehicles (Queensland) and the signature and consent. Ranking (`src/lib/rentalScoring.ts`) scores smoking, which is not collected on either official form, and ignores affordability, history and references.

The original rentals migration (`supabase/0020_rentals.sql`) already describes the feature as a pre-qualification tool that does not replace the tenancy application, so this design is consistent with the original intent.

## 3. Approach

Three approaches were considered:

A. **Digital copy of each official form, ranked by us (recommended).** One configuration object per state mirrors the official form exactly. The visitor completes it once. We rank the results.
B. **Interest form only, official PDF afterwards.** Very low risk, but little to rank, and applicants fill in two forms.
C. **Build our own universal form.** Rejected: it breaks the "only what is on the form" rule in both states.

Approach A is built so that whether it is *called* "the application" or "the shortlisting form" is a wording decision after the lawyer's review, not a rebuild.

## 4. Architecture

### 4.1 Listings
- Add `state` to `listings` (check constraint: `QLD`, `VIC`, later others). Required for rentals; not used for sales.
- Add `rental_config` (jsonb) holding the agent-completed items (section 5.2).
- Add `rental_forms_enabled` logic in code: a list of states enabled for production, set by environment variable so a state is switched on only after review. A rental in a state not on the list collects no applications.
- Listing creation (`NewListingForm.tsx`) and edit pages gain a state selector when "Rental" is chosen.

### 4.2 Form definitions
- New folder `src/lib/rentalForms/` with one file per state (`qld.ts`, `vic.ts`), each exporting a typed definition: version label (for example "Form 22 v4 Mar26", "CAV standard form 31 March 2026"), source URL, sections, fields (label, type, required, helper text), the consent and privacy wording, and the "information for applicants" notices.
- A shared renderer builds the form from the definition, so adding a state means adding a definition, not new screens.
- A shared validator checks submissions on the server against the same definition and rejects any field that is not in it.

### 4.3 Submissions
- New table `rental_applications`: `id`, `listing_id`, `state`, `form_version`, `answers` (jsonb), display columns `applicant_name`, `email`, `phone`, `status` (`new`, `shortlisted`, `successful`, `unsuccessful`), `read_at`, `created_at`, `consent_name`, `consent_at`, `retain_until`, `anonymised_at`.
- Same protections as today: server-side API route only, CAPTCHA, rate limiting, row-level security so agents see only their own listings' rows, no agent edits of visitor content except read and status columns.
- The old `applicants` table stays for existing rows. Dashboard views read both.

### 4.4 Visitor flow
- `/visit/[id]/apply` loads the listing, picks the state's definition and renders it. If the state is not enabled, it shows only a contact page, with no application fields.
- The agent-completed items appear on the form (read-only for the applicant), including the submission methods and requested documents.
- The page shows the required notices (no fee, only the form's information is requested, use limited to assessing suitability, how long information is kept).
- Consent: typed name, an agreement tick and an auto date, labelled as the digital equivalent of the signature (lawyer to confirm).
- Each adult applicant completes their own form. The agent can link applicants applying together.

## 5. Agent features

### 5.1 State and gating
A rental listing cannot accept applications until its state is chosen and its agent-completed items are saved.

### 5.2 Agent-completed items (per listing, saved in `rental_config`)
- Queensland: ways to submit (at least two; at least one non-restricted such as email or in person), up to two requested documents in each of financial, identity and suitability, whether body corporate by-laws or park rules limit pets, tenancy databases used (name, phone, website), plus manager or owner details.
- Victoria: rental provider or agent details (name, ACN or ABN, address, phone, email, rental provider's state or territory), up to two financial and two identity documents, tenancy databases used.
- Open Home Hero counts as a third-party platform. In Queensland the agent must confirm and enter a non-platform route, which the form displays.

### 5.3 Ranking and shortlist
Described in section 6. The listing page shows applicants in ranked order with a short "why" list, a status control and a "Shortlist" toggle. A printable shortlist report extends the existing report page.

### 5.4 Official-layout export (phase 2)
A PDF of each application laid out like the official form, for the agent's records and to attach for the landlord.

## 6. Ranking

Inputs, all from fields on the official forms:
1. **Affordability:** reported weekly income against weekly rent. The agent can set the threshold (default to be agreed).
2. **Rental history:** completeness and length of tenancies.
3. **References:** whether both were supplied.
4. **Fit:** preferred move-in date and lease term against the landlord's wishes.
5. **Pets:** against the landlord's pet policy (Queensland only; Victoria's form has no pet question).
6. **Documents:** whether the requested documents were provided or are to be shown.

Never used: age or date of birth, gender, ethnicity, disability, family status or number of children, smoking, anything from bank transactions, or any free text.

Output: a score, plus a plain list of reasons for and against, plus any unmet "required" landlord conditions. The agent can reorder by shortlisting, and the ranking is explicitly a guide. The existing `landlord_pref_smoking` preference is hidden for rentals in the interface and ignored by scoring (column kept for old data).

## 7. Data retention
- Agents mark applicants successful or unsuccessful and mark the listing leased (date).
- A daily job (same pattern as the existing secret-protected scheduled API routes) sets `retain_until` and then deletes or de-identifies:
  - Victoria: unsuccessful applications 30 days after the property is leased, or 6 months if the applicant gave written consent to keep their details for other premises; successful applications 3 years after the agreement ends.
  - Queensland: unsuccessful applicants' identity information within 3 months of the tenancy commencing unless the applicant consents to longer.
- Without a leased date, the agent is reminded by email, and a conservative maximum applies (to be agreed with the lawyer).
- Existing delete-on-request rights for agents remain.

## 8. Error handling
- Unknown fields, missing required fields or an unsupported state: reject, never silently accept.
- CAPTCHA or rate-limit failure: unchanged behaviour.
- State switched on without agent items saved: the visitor sees the contact page.
- Form definition changes: new submissions use the new version; old submissions keep theirs.

## 9. Testing
- The repository has no automated test framework today. I would add a small unit-test setup for the two pure parts: the validator (rejecting extra fields) and the scoring (including that excluded attributes have no effect).
- Manual checks on the branch preview: Queensland and Victoria happy path, an unsupported state, a rental with no agent items saved, and a sale listing (unchanged).
- Compare each form's field list line by line against the official PDFs (checklist stored with the form definition).

## 10. Phases
1. State selector, agent items, the two forms and API, ranking and shortlist view, site copy changes. Branch preview only.
2. Retention job, official-layout PDF export, shortlist report improvements.
3. More states (NSW, then the rest), each after its own research and review.

Production release of any state only after the lawyer's review of that state's form.

## 11. Open questions for a tenancy lawyer
- Is a faithful digital reproduction of each official form acceptable as the form, and what exactly must it show?
- Is Open Home Hero a "restricted way" under Queensland's two-methods rule, and how should that be disclosed?
- Who carries the retention and destruction duty when the data is held in Open Home Hero's database?
- Is a typed name and tick an acceptable signature and consent?
- Does ranking applicants raise automated-decision or discrimination concerns beyond excluding the attributes listed?

## 12. Website and marketing changes (with the build, not before)
Rental-application wording on the landing page (hero, sample phones, FAQ), the visitor sample "Apply to rent" phone, the `/preview` page, scheduled social posts and the pilot video should describe a "ranked shortlist" and avoid saying the product replaces the official application. A list of exact lines will come with the build.

## 13. Not in scope
Document uploads, tenancy database lookups, payments, social housing and other exempt lessors (Queensland "relevant lessors"), rooming accommodation forms (Queensland Form R22), and states other than Queensland and Victoria.
