import type { RentalFormDefinition } from "./types";
import { field, options } from "./builders";

const ID_DOCS = options("Not requested", "Driver licence", "Passport", "Other photo identification");
const PAY_DOCS = options("Not requested", "Recent payslips", "Employment letter", "Bank statement");

// A general rental application for properties outside the Australian states we
// have built official forms for: New Zealand, the United States, Canada and
// elsewhere. No jurisdiction's form is copied, so it asks only the basics an
// agent needs and makes no legal claims. Deliberately no date of birth,
// marital status, children or similar questions, which many places restrict.
type GeneralFormOptions = Pick<
  RentalFormDefinition,
  "state" | "stateName" | "formName" | "version" | "authority" | "sourceUrl" | "reviewNotes"
> & { agentIntro: string; extraNotices: RentalFormDefinition["notices"] };

/** A small, general application: only the basics, for places with no prescribed form. */
export function generalRentalForm(o: GeneralFormOptions): RentalFormDefinition {
  return {
    state: o.state,
    stateName: o.stateName,
    formName: o.formName,
    version: o.version,
    authority: o.authority,
    sourceUrl: o.sourceUrl,
    basis: "guidance",
    rankingInputs: { income: true, history: false, references: true, pets: false },
    reviewNotes: o.reviewNotes,
    agentSections: [
      {
        id: "agent",
        title: "Agent or landlord details",
        intro: "Shown to applicants so they know who they're applying to.",
        fields: [
          field("agent_name", "Agent or landlord name", "text", { required: true }),
          field("agent_phone", "Phone", "tel", { half: true }),
          field("agent_email", "Email", "email", { half: true }),
          field("licence_number", "Licence number (if your area has one)", "text"),
        ],
      },
      {
        id: "docs",
        title: "What you'll ask to see",
        intro: o.agentIntro,
        fields: [
          field("identity_doc", "Identity: document to sight", "select", { options: ID_DOCS }),
          field("pay_doc_1", "Ability to pay: document 1", "select", { options: PAY_DOCS, half: true }),
          field("pay_doc_2", "Ability to pay: document 2", "select", { options: PAY_DOCS, half: true }),
        ],
      },
    ],
    applicantSections: [
      {
        id: "applicant",
        title: "About you",
        intro: "Each adult who will be named on the lease applies separately.",
        fields: [
          field("full_name", "Full name", "text", { required: true }),
          field("email", "Email", "email", { required: true, half: true }),
          field("phone", "Phone", "tel", { required: true, half: true }),
          field("current_address", "Current address", "text", { required: true }),
          field("occupants_total", "Number of people who will live at the property", "number", { required: true }),
        ],
      },
      {
        id: "income",
        title: "Income",
        fields: [
          field("income_amount", "Income before tax", "number", { required: true, half: true }),
          field("income_frequency", "Per", "select", {
            options: options("Week", "Fortnight", "Month", "Year"),
            required: true,
            half: true,
          }),
          field("employer", "Employer (or 'self-employed')", "text", { half: true }),
          field("occupation", "Occupation", "text", { half: true }),
        ],
      },
      {
        id: "landlord",
        title: "Current or previous landlord reference",
        fields: [
          field("landlord_name", "Name", "text", { half: true }),
          field("landlord_phone", "Phone", "tel", { half: true }),
          field("landlord_email", "Email", "email"),
          field("consent_landlord", "I consent to the agent contacting this person for a reference", "checkbox"),
        ],
      },
      {
        id: "term",
        title: "Move-in",
        fields: [
          field("move_in_date", "Preferred move-in date", "date", { half: true }),
          field("lease_term", "Preferred lease length", "select", {
            options: options("6 months", "12 months", "24 months", "Other"),
            half: true,
          }),
        ],
      },
      {
        id: "consent",
        title: "Confirmation",
        fields: [
          field("consent_agree", "The information I have given is true, and I agree it may be used to assess this application", "checkbox", { required: true }),
          field("consent_name", "Type your full name", "text", { required: true }),
        ],
      },
    ],
    notices: [
      ...o.extraNotices,
      { title: "Who sees this", body: "Your application goes only to the agent or landlord for this property. It is not shared with other applicants." },
      { title: "Only what is needed", body: "You only need to give the information on this form. The agent may ask to see documents that confirm your identity and income." },
    ],
    consent:
      "The information I have given is true, and I agree it may be used to assess this application.",
  };
}

export const otherForm = generalRentalForm({
  state: "OTHER",
  stateName: "Other / outside Australia",
  formName: "Rental application (general)",
  version: "General form, November 2026",
  authority: "Not a government form",
  sourceUrl: "https://openhomehero.com.au",
  reviewNotes: [
    "General form for agents outside Australia. Agents are responsible for local rules on what may be asked.",
  ],
  agentIntro: "Ask for no more than you need, and check your local rules.",
  extraNotices: [],
});
