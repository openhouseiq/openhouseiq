import { generalRentalForm } from "./other";

// Tasmania has no prescribed rental application form (the Residential Tenancy
// Regulations 2025 set none). Like NSW, this form is deliberately small:
// identity, ability to pay, a reference and move-in only. No pet question.
export const tasForm = generalRentalForm({
  state: "TAS",
  stateName: "Tasmania",
  formName: "Rental application",
  version: "General form for Tasmania, November 2026",
  authority: "Not a government form (Tasmania does not prescribe one)",
  sourceUrl: "https://www.legislation.tas.gov.au/view/whole/html/inforce/current/act-1997-082",
  reviewNotes: [
    "Tasmania has no prescribed form: does the Residential Tenancy Act 1997 limit what may be asked of applicants?",
    "What retention period applies to unsuccessful applicants?",
  ],
  agentIntro: "Ask for no more than you need to check identity and ability to pay.",
  extraNotices: [
    {
      title: "Discrimination",
      body: "Treating an applicant unfairly because of a protected attribute is unlawful under the Anti-Discrimination Act 1998 (Tas).",
    },
    { title: "Wording", body: "Tasmania does not prescribe a rental application form. This one asks only for the basics." },
  ],
});
