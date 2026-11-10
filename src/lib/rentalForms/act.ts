import { generalRentalForm } from "./other";

// The ACT has no prescribed rental application form. Like NSW, this form is
// deliberately small: identity, ability to pay, a reference and move-in only.
// No pet question (ACT landlords need consent or ACAT approval to refuse pets).
export const actForm = generalRentalForm({
  state: "ACT",
  stateName: "Australian Capital Territory",
  formName: "Rental application",
  version: "General form for the ACT, November 2026",
  authority: "Not a government form (the ACT does not prescribe one)",
  sourceUrl: "https://www.legislation.act.gov.au/a/1997-84",
  reviewNotes: [
    "The ACT has no prescribed form: does the Residential Tenancies Act 1997 limit what may be asked of applicants?",
    "What retention period applies to unsuccessful applicants?",
  ],
  agentIntro: "Ask for no more than you need to check identity and ability to pay.",
  extraNotices: [
    {
      title: "Discrimination",
      body: "Treating an applicant unfairly because of a protected attribute is unlawful under the Discrimination Act 1991 (ACT).",
    },
    { title: "Wording", body: "The ACT does not prescribe a rental application form. This one asks only for the basics." },
  ],
});
