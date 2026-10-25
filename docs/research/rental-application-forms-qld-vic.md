# Rental application forms: Queensland and Victoria (research, 25 Oct 2026)

Purpose: decide how Open Home Hero's rental application should work per state. This is research from the official government sources, not legal advice. A tenancy lawyer should review the final forms before they are promoted.

## Sources read in full

| Source | What | Version/date |
|---|---|---|
| RTA Queensland, Form 22 (PDF) | Standard rental application, general tenancies | v4, March 2026 |
| RTA Queensland, Application process page | Rules for submission methods, information, documents, privacy | read 25 Oct 2026 |
| RTA Queensland news, 20 May 2025 | Warning about non-compliant forms on online platforms | 20 May 2025 |
| Consumer Affairs Victoria, Residential rental application (docx) | Standard form, Residential Tenancies Act 1997 s30AC, Regulations 2021 regs 14A and 14B | dated 31 March 2026 |
| Consumer Affairs Victoria, Finding and applying for a rental property | Plain-English rules | updated 30 June 2026 |

Links:
- https://www.rta.qld.gov.au/forms-resources/forms/rental-application-form-22
- https://www.rta.qld.gov.au/before-renting/applying-for-a-rental-property/application-process
- https://www.rta.qld.gov.au/news/2025/05/20/rta-warns-against-non-compliance-with-qld-rental-application-laws
- https://www.consumer.vic.gov.au/library/forms/housing-and-accommodation/renting/residential-rental-application-31-march-2026.docx
- https://www.consumer.vic.gov.au/housing/renting/starting-and-changing-rental-agreements/resources-and-guides-for-renters/renters-guide/finding-and-applying-for-a-rental-property

## Legal position in one paragraph

Both states require a prescribed or standardised application form for residential rentals. Agents may only ask what is on the form. Asking for more, or using a non-compliant form, is an offence (Queensland: up to 20 penalty units, and the RTA says responsibility sits with the property manager or owner, not the platform. Victoria: s30C offence). Neither state allows an application fee.

## Queensland: Form 22 (v4 Mar26) fields, in order

Completed by the property manager or owner: 1 manager details; 2 premises address; 3 ways to submit; 7, 8, 9 which documents are requested; 12 whether by-laws or park rules restrict pets; 15 tenancy databases used.

Completed by the applicant (each adult applicant completes a separate form):
- 4 Occupants: total number (including under 18) and number under 18
- 5 Applicant details: name, date of birth, current address and postcode, phone, email
- 6 Employment: current employer, job title, length of employment, gross weekly income, employer name, phone, email
- 7 Financial information: up to 2 requested documents (pay slips, bank statements without transaction details, others); alternatives if no regular income
- 8 Verification of identity: up to 2 requested documents
- 9 Applicant suitability: up to 2 requested documents
- 10 Rental history: 2 properties (address, postcode, rental period, manager or owner name, email, phone), or prior living arrangements if none
- 11 References: 2 referees (name, phone, email, connection)
- 12 Pets: do you intend to keep pets, types, number, other information
- 13 Vehicles: whether any, and numbers of cars, trailers, caravans, heavy vehicles, boats, other
- 14 Term: preferred move-in date, desired lease term
- 15 Tenancy databases (disclosure)
- 16 Consent and submission: consent for the manager to contact current employer, current or previous manager or owner, and referees; print name, signature, date

Rules that shape the product (RTA application process page and Form 22 notes):
- At least 2 ways to submit must be offered; one must not be a "restricted way". Restricted: the applicant must give personal information through an online platform run by someone who is not the manager or owner but collects it on their behalf, or the method costs the applicant money. Email or online direct to the manager or owner is allowed.
- Up to 2 documents per category (identity, financial, suitability).
- Identity documents: applicant may show originals; the manager must not keep a copy without the applicant's consent.
- Bank statements: managers must tell applicants they do not need transaction details.
- Cannot ask about legal actions or tribunal matters, bond claim history, breach notices, or credit or bank account statements detailing transactions.
- Information used only to assess suitability; stored securely. Unsuccessful applicants' identity information must be destroyed within 3 months of the tenancy commencing unless the applicant consents to longer.
- Tenancy database use must be disclosed; applicants must be told of any listing.
- Reasons for an unsuccessful application need not be given.

## Victoria: standard form (31 March 2026) fields, in order

Part A:
- Premises address; rental provider or agent details (name, ACN or ABN, address, phone, email, state or territory of residence of the rental provider)
- Number of occupants (single total)
- Applicant details: full name, date of birth, current address and postcode, phone, email
- Employment: current or most recent employer, employer address, net weekly income, date employment ended if not employed
- Financial information: up to 2 documents (pay slips, bank statement without transaction details, Centrelink statements)
- Verification of identity: up to 2 documents from a prescribed list (driver licence, proof of age card, Medicare card, passports, birth certificate, citizenship certificate, student ID, Centrelink card, DVA card, utilities bill, government letter)
- Rental or residential history: 2 properties (address, postcode, period, provider or agent name, email, phone)
- References: 2 personal referees (name, phone, email, connection)
- Term: desired lease term, preferred move-in date
- Tenancy databases disclosure
- Signature: print name, signature, date

Part B (rights and obligations) is printed with the form and includes:
- No application fees.
- Only information set out in the form may be requested; must not add questions.
- Rental auctions and bidding prohibited: premises advertised at a fixed amount; must not invite or accept offers above it.
- Privacy notices must be given and may only contemplate use for processing the application.
- Information must be protected from misuse or loss.
- Destruction or de-identification: successful applicants within 3 years after the agreement ends; unsuccessful within 30 days after the property is leased, or 6 months with the applicant's written consent to use it for other premises.
- Tenancy database used: written notice to the applicant within 7 days (s439D(2)).
- Discrimination statement; reasons for a refusal need not be given.
- Each applicant aged 18 or over may be asked to complete a separate form.

## Gap analysis: the current Open Home Hero form (`src/app/visit/[id]/apply/ApplicationForm.tsx`)

| Current field | Status in QLD and VIC |
|---|---|
| Name, email, phone | OK (on both forms) |
| Employer, occupation | Employer is on both forms. "Occupation" is not on either (Qld has job title) |
| Income range (banded) | Not on either form. Qld asks gross weekly income, Vic asks net weekly income |
| "Can provide proof of income" tick | Not on either form |
| Desired move-in date, lease term | OK (on both) |
| Occupants: total, adults, children | Qld wants total and number under 18; Vic wants total only |
| Pets: yes/no and details | Qld wants a specific pet section; Vic has no pet question |
| **Smoker tick** | **Not on either form: must be removed** |
| One reference (name, phone, relationship) | Both forms want 2 referees with email as well |
| **Notes (free text)** | **Not on either form: must be removed** (asking for extra information is an offence) |
| Missing | Date of birth, current address, rental history (2 properties), second referee, vehicles (Qld), document requests (up to 2 per category), tenancy database disclosure, consent and signature, submission-methods item (Qld) |

## Design implications

1. State on every rental listing; a form per state; form version stored with every submission.
2. Agent-completed items must be configured by the agent per listing (Queensland item 3 submission methods, items 7 to 9 requested documents, item 12 by-laws, item 15 databases; Victoria rental provider details and databases).
3. Open Home Hero is a third-party platform. In Queensland the agent must also offer a non-restricted way to submit (for example email or in person). The product should require the agent to state that alternative and show it on the form.
4. Documents: prefer no uploads in version 1. Record which documents the applicant will provide or show, and let the agent sight originals. That avoids holding identity copies.
5. Retention: build automatic deletion or de-identification on the statutory timetables, plus applicant privacy notices.
6. No rent-bidding on rentals: do not add any offer-amount field to rental listings (Victoria prohibits it).
7. States not yet built: rental applications switched off; visitors can leave contact details only.

## Open questions for a tenancy lawyer

- Is an electronic reproduction of the standard form acceptable, and what must it show exactly (headings, Part B notices, version)?
- Is Open Home Hero a "restricted way" in Queensland (it collects on behalf of the agent), and how should that be disclosed?
- Does the agent or Open Home Hero carry the obligation for retention and destruction, given the data sits in Open Home Hero's database?
- Do Queensland's separate applicant-per-adult rules and Victoria's joint-applicant rules change how we store linked applications?
