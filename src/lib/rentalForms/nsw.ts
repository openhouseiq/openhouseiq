import type { RentalFormDefinition } from "./types";
import { field, options } from "./builders";

const ID_DOCS = options("Not requested", "Driver licence", "Passport", "Other photo identification");
const PAY_DOCS = options(
  "Not requested",
  "Current rental ledger",
  "Recent payslips",
  "Bank statement showing savings only (daily transactions removed)",
);

// Built from NSW Fair Trading Commissioner's guidance on tenancy applications.
// NSW has no prescribed application form, so this form is deliberately small:
// only what the guidance says is reasonably necessary, for people on the lease.
// No pet question: since 19 May 2025 landlords may refuse a pet only on set grounds.
export const nswForm: RentalFormDefinition = {
  state: "NSW",
  stateName: "New South Wales",
  formName: "Rental application",
  version: "Based on Fair Trading Commissioner's guidance, 2026",
  authority: "NSW Fair Trading",
  sourceUrl:
    "https://www.nsw.gov.au/housing-and-construction/rental-forms-surveys-and-data/resources/fair-trading-commissioners-guidance/when-a-prospective-tenant-applies-for-a-property",
  basis: "guidance",
  rankingInputs: { income: true, history: false, references: true, pets: false },
  reviewNotes: [
    "NSW has no prescribed form: does the Residential Tenancies Regulation 2019 list anything we must or must not ask?",
    "Is Open Home Hero a digital rental application provider for the rent-bidding rule?",
    "What retention period applies to unsuccessful applicants?",
    "Is asking for weekly income itself necessary, or is a payslip enough?",
  ],
  agentSections: [
    {
      id: "agent",
      title: "Agent or landlord details",
      fields: [
        field("agent_name", "Agent or landlord name", "text", { required: true }),
        field("agent_phone", "Phone", "tel", { half: true }),
        field("agent_email", "Email", "email", { half: true }),
        field("licence_number", "Agent licence number", "text"),
      ],
    },
    {
      id: "docs",
      title: "How you will check the applicant",
      intro: "Ask for no more than you need. You may sight ID and note the details, but do not store copies.",
      fields: [
        field("identity_doc", "Identity: document to sight", "select", { options: ID_DOCS }),
        field("pay_doc_1", "Capacity to pay: document 1", "select", { options: PAY_DOCS, half: true }),
        field("pay_doc_2", "Capacity to pay: document 2", "select", { options: PAY_DOCS, half: true }),
        field("reference_asked", "Reference from a previous landlord or agent", "yesno", { half: true }),
        field("tis_asked", "Confirmation that the applicant has read the Tenant Information Statement", "yesno", { half: true }),
      ],
    },
    {
      id: "database",
      title: "Tenancy database",
      intro: "If you search a residential tenancy database, tell applicants here before you do.",
      fields: [
        field("db_name", "Database name", "text", { half: true }),
        field("db_contact", "Contact details", "text", { half: true }),
      ],
    },
  ],
  applicantSections: [
    {
      id: "applicant",
      title: "About you",
      intro: "Only people who will be named on the lease need to apply.",
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
      title: "Capacity to pay",
      fields: [
        field("weekly_income", "Weekly income ($)", "number", { required: true }),
        field("pay_ack_1", "Document 1 the agent asked for", "select", {
          options: [
            { value: "provide", label: "I will provide a copy" },
            { value: "show", label: "I will show the original" },
            { value: "discuss", label: "I'll discuss alternatives" },
          ],
          half: true,
        }),
        field("pay_ack_2", "Document 2 the agent asked for", "select", {
          options: [
            { value: "provide", label: "I will provide a copy" },
            { value: "show", label: "I will show the original" },
            { value: "discuss", label: "I'll discuss alternatives" },
          ],
          half: true,
        }),
      ],
    },
    {
      id: "identity",
      title: "Identity",
      note: "The agent will look at your ID and note details. They should not keep a copy.",
      fields: [
        field("identity_ack", "Identity document", "select", {
          options: [
            { value: "show", label: "I will show the original" },
            { value: "discuss", label: "I'll discuss alternatives" },
          ],
        }),
      ],
    },
    {
      id: "landlord",
      title: "Previous landlord or agent reference",
      fields: [
        field("landlord_name", "Name", "text", { half: true }),
        field("landlord_phone", "Phone", "tel", { half: true }),
        field("landlord_email", "Email", "email"),
        field("consent_landlord", "I consent to the agent contacting this person for a reference", "checkbox"),
        field("tis_read", "I have read the Tenant Information Statement", "checkbox"),
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
        field("consent_name", "Print name", "text", { required: true }),
      ],
    },
  ],
  notices: [
    { title: "No fees", body: "You cannot be charged for the application or for credit or background checks. Only a holding fee (after approval), rent, bond and the lease registration fee may be charged." },
    { title: "Only what is needed", body: "The agent should ask only for information that is reasonably necessary to confirm your identity, your ability to pay, and that you are likely to look after the property." },
    { title: "No credit report", body: "You do not need to provide a credit report." },
    { title: "Identity documents", body: "The agent may look at your ID and note the details, but should not keep a copy." },
    { title: "No rent bidding", body: "A landlord, agent or digital rental application provider must not invite or ask you to offer more than the advertised rent." },
    { title: "Discrimination", body: "Discriminating on race, sex, marital or partner status, age, disability, sexual orientation or gender identity is unlawful. Complaints can go to the NSW Anti-Discrimination Board." },
    { title: "Wording", body: "NSW does not prescribe an application form. This one follows Fair Trading's guidance." },
  ],
  consent:
    "The information I have given is true, and I agree it may be used to assess this application.",
};
