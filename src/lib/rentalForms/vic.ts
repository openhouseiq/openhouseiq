import type { RentalFormDefinition } from "./types";
import { documentAck, field, historyFields, options, refereeFields } from "./builders";

const FINANCIAL_DOCS = options(
  "Not requested",
  "Pay slips from current or recent employment",
  "Bank statement (without transaction details)",
  "Centrelink payment statements or letters",
);
const IDENTITY_DOCS = options(
  "Not requested",
  "Driver licence",
  "Proof of age card",
  "Medicare card",
  "Australian passport",
  "Foreign passport and Australian visa",
  "Birth certificate",
  "Certificate of Australian citizenship",
  "Tertiary student identification card",
  "Centrelink card",
  "Department of Veterans' Affairs card",
  "Utilities bill at current address",
  "Letter from a government department addressed to current address",
);

// Mirrors the Consumer Affairs Victoria standard residential rental application
// (31 March 2026). Source: consumer.vic.gov.au.
export const vicForm: RentalFormDefinition = {
  state: "VIC",
  stateName: "Victoria",
  formName: "Residential rental application",
  version: "CAV standard form, 31 March 2026",
  authority: "Consumer Affairs Victoria (CAV)",
  sourceUrl:
    "https://www.consumer.vic.gov.au/housing/renting/starting-and-changing-rental-agreements/resources-and-guides-for-renters/renters-guide/finding-and-applying-for-a-rental-property",
  agentSections: [
    {
      id: "provider",
      title: "Rental provider or agent's details",
      fields: [
        field("provider_name", "Full name or company name of the rental provider or agent", "text", { required: true }),
        field("provider_abn", "ACN (or ABN if not a registered company)", "text", { half: true }),
        field("provider_phone", "Phone", "tel", { half: true }),
        field("provider_address", "Address", "text"),
        field("provider_email", "Email", "email", { half: true }),
        field("provider_state", "State or territory where the rental provider lives (or \"overseas\")", "text", { half: true }),
      ],
    },
    {
      id: "docs",
      title: "6 and 7. Documents you request",
      intro: "Request no more than two documents in each category.",
      fields: [
        field("financial_doc_1", "Financial document 1", "select", { options: FINANCIAL_DOCS, half: true }),
        field("financial_doc_2", "Financial document 2", "select", { options: FINANCIAL_DOCS, half: true }),
        field("identity_doc_1", "Identity document 1", "select", { options: IDENTITY_DOCS, half: true }),
        field("identity_doc_2", "Identity document 2", "select", { options: IDENTITY_DOCS, half: true }),
      ],
    },
    {
      id: "databases",
      title: "11. Tenancy databases you may use",
      intro: "If you use a tenancy database, you must name it on the form.",
      fields: [
        field("db_1_name", "Database 1: name", "text", { half: true }),
        field("db_1_contact", "Phone or web address", "text", { half: true }),
        field("db_2_name", "Database 2: name", "text", { half: true }),
        field("db_2_contact", "Phone or web address", "text", { half: true }),
      ],
    },
  ],
  applicantSections: [
    {
      id: "occupants",
      title: "Number of occupants",
      fields: [field("occupants_total", "Total number of occupants intended to live at the premises", "number", { required: true })],
    },
    {
      id: "applicant",
      title: "Personal details of applicant",
      intro: "Each applicant aged 18 or over may be asked to complete a separate form.",
      fields: [
        field("full_name", "Full name", "text", { required: true }),
        field("date_of_birth", "Date of birth", "date", { required: true, half: true }),
        field("phone", "Phone", "tel", { half: true }),
        field("email", "Email", "email", { required: true }),
        field("current_address", "Current address", "text", { required: true }),
        field("current_postcode", "Postcode", "text", { required: true }),
      ],
    },
    {
      id: "employment",
      title: "Employment details",
      note: "If you cannot provide details of your current employment or income, give other details about your ability to pay rent under Financial information.",
      fields: [
        field("employer", "Current or most recent employer", "text", { required: true }),
        field("employer_address", "Employer address", "text"),
        field("net_weekly_income", "Net weekly income ($)", "number", { required: true }),
        field("employment_ended", "If not currently employed, date your most recent employment ended", "date"),
      ],
    },
    {
      id: "financial",
      title: "Financial information",
      intro: "Documents the rental provider or agent has requested to confirm your capacity to pay the proposed rent.",
      note: "If you are self-employed, casual, freelance or unemployed, you can give details of previous employment or other documents such as proof of savings or assets.",
      fields: [
        documentAck("financial_ack_1", "Requested document 1"),
        documentAck("financial_ack_2", "Requested document 2"),
      ],
    },
    {
      id: "identity",
      title: "Verification of identity",
      note: "Discuss the best way to verify your identity with the rental provider or agent if you do not have the requested documents.",
      fields: [
        documentAck("identity_ack_1", "Requested document 1"),
        documentAck("identity_ack_2", "Requested document 2"),
      ],
    },
    {
      id: "history",
      title: "Rental or residential history",
      fields: [...historyFields(1), ...historyFields(2)],
    },
    {
      id: "references",
      title: "References",
      intro: "If the rental provider or agent requests it, give contact details for personal referees.",
      fields: [...refereeFields(1), ...refereeFields(2)],
    },
    {
      id: "term",
      title: "Term of rental agreement",
      fields: [
        field("lease_term", "Desired lease term", "select", {
          required: true,
          half: true,
          options: options("6 months", "12 months", "24 months", "Other"),
        }),
        field("move_in_date", "Preferred move-in date", "date", { required: true, half: true }),
      ],
    },
    {
      id: "signature",
      title: "Signature",
      fields: [
        field("consent_agree", "I understand that my application may not be processed unless all required documents are submitted", "checkbox", { required: true }),
        field("consent_name", "Print name", "text", { required: true }),
      ],
    },
  ],
  notices: [
    { title: "No application fees", body: "A rental provider or agent must not charge you any fee for this application." },
    { title: "Only the information on this form", body: "You must only be asked for the information set out in this form. You cannot be asked about previous legal action or disputes with a rental provider, your bond history, or bank statements showing daily transactions." },
    { title: "No rental bidding", body: "The property must be offered at a fixed amount. The agent must not invite or accept offers of higher rent." },
    { title: "Your information", body: "It is confidential and may only be used to assess your suitability as a renter. It must be protected from misuse, loss and unauthorised access." },
    { title: "How long it is kept", body: "If you are unsuccessful, it must be destroyed or de-identified within 30 days after the property is leased, or within 6 months if you give written consent for it to be used for other premises." },
    { title: "Tenancy databases", body: "Any tenancy database used to check your history must be named on the form, and you must be told in writing within 7 days if you are listed." },
  ],
  basis: "prescribed",
  rankingInputs: { income: true, history: true, references: true, pets: false },
  reviewNotes: ["Is an electronic copy of the standard form acceptable, including Part B?", "Is a typed name and tick a valid signature?"],
  consent: "I understand that my application may not be processed unless all required documents are submitted.",
};
