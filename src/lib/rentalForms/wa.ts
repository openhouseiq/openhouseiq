import type { RentalFormDefinition } from "./types";
import { field, options } from "./builders";

const FREQUENCY = options("Week", "Fortnight", "Month");

function contactBlock(prefix: string, title: string) {
  return [
    field(`${prefix}_name`, `${title}: name`, "text", { required: true }),
    field(`${prefix}_relationship`, "How related", "text", { half: true }),
    field(`${prefix}_phone_mobile`, "Phone mobile", "tel", { half: true }),
    field(`${prefix}_phone_home`, "Phone home", "tel", { half: true }),
    field(`${prefix}_phone_work`, "Phone work", "tel", { half: true }),
    field(`${prefix}_address`, "Address", "text"),
  ];
}

// Mirrors Form 18, Application to rent residential premises, Residential Tenancies
// Act 1987 (WA), Consumer Protection file dated July 2025. Source:
// consumerprotection.wa.gov.au. The form has no signature or consent field.
export const waForm: RentalFormDefinition = {
  state: "WA",
  stateName: "Western Australia",
  formName: "Application to rent residential premises (Form 18)",
  version: "Form 18, July 2025",
  authority: "Department of Local Government, Industry Regulation and Safety (Consumer Protection)",
  sourceUrl:
    "https://www.consumerprotection.wa.gov.au/system/files/documents/2025-07/rentappwrittennoticeform18.pdf",
  basis: "prescribed",
  rankingInputs: { income: true, history: true, references: true, pets: false },
  reviewNotes: [
    "Is Form 18 compulsory, and is a digital copy acceptable?",
    "We add a privacy acknowledgement and typed name that are not on Form 18: is that acceptable?",
    "Form 18 states no retention period. Which timetable applies to data we hold?",
    "Option fees are paid to the agent outside Open Home Hero: confirm the notice wording.",
  ],
  agentSections: [
    {
      id: "agent",
      title: "Agent's contact details",
      fields: [
        field("agent_name", "Agent or property manager name", "text", { required: true }),
        field("agent_phone", "Phone", "tel", { half: true }),
        field("agent_email", "Email", "email", { half: true }),
        field("agent_address", "Address", "text"),
      ],
    },
    {
      id: "databases",
      title: "Attachment A. Tenancy databases you use (written notice)",
      intro:
        "You must give this written notice to applicants. If you find personal information about an applicant on a database, you must tell them within 7 days.",
      fields: [
        field("db_1_name", "Database 1: name", "text", { half: true }),
        field("db_1_contact", "Operator contact details", "text", { half: true }),
        field("db_1_how", "How to obtain information from the operator", "text"),
        field("db_2_name", "Database 2: name", "text", { half: true }),
        field("db_2_contact", "Operator contact details", "text", { half: true }),
        field("db_2_how", "How to obtain information from the operator", "text"),
        field("db_3_name", "Database 3: name", "text", { half: true }),
        field("db_3_contact", "Operator contact details", "text", { half: true }),
        field("db_3_how", "How to obtain information from the operator", "text"),
        field("db_4_name", "Database 4: name", "text", { half: true }),
        field("db_4_contact", "Operator contact details", "text", { half: true }),
        field("db_4_how", "How to obtain information from the operator", "text"),
      ],
    },
  ],
  applicantSections: [
    {
      id: "applicant",
      title: "Applicant",
      intro: "Each applicant completes their own application. We link applicants who apply together.",
      fields: [
        field("full_name", "Name", "text", { required: true }),
        field("date_of_birth", "Date of birth", "date", { required: true, half: true }),
        field("email", "Email address", "email", { required: true, half: true }),
        field("phone_mobile", "Phone mobile", "tel", { half: true }),
        field("phone_home", "Phone home", "tel", { half: true }),
        field("phone_work", "Phone work", "tel", { half: true }),
        field("current_address", "Current address", "text", { required: true }),
        field("proof_of_id", "Proof of identification cited (for example driver's licence, passport, birth certificate)", "text"),
      ],
    },
    {
      id: "history",
      title: "Previous rental history",
      fields: [
        field("history_address", "Address", "text"),
        field("history_rent", "Rent paid ($)", "number", { half: true }),
        field("history_rent_frequency", "Per", "select", { options: FREQUENCY, half: true }),
        field("history_manager", "Rent paid to (property manager or lessor's name)", "text"),
        field("history_manager_phone", "Phone", "tel", { half: true }),
        field("history_manager_address", "Property manager or lessor's address", "text", { half: true }),
        field("history_from", "Rented from", "date", { half: true }),
        field("history_to", "Rented to", "date", { half: true }),
        field("history_reason", "Reasons for leaving", "text"),
      ],
    },
    {
      id: "employment",
      title: "Employment details",
      note: "If you have been self-employed for less than one year, give your previous employer.",
      fields: [
        field("occupation", "Occupation", "text", { half: true }),
        field("employer", "Employer", "text", { half: true }),
        field("employer_address", "Employer's address", "text"),
        field("employed_from", "Employed from", "date", { half: true }),
        field("employed_to", "Employed to (leave blank if current)", "date", { half: true }),
        field("employer_contact", "Contact name", "text", { half: true }),
        field("employer_phone", "Phone", "tel", { half: true }),
        field("net_income", "Net income ($)", "number", { half: true }),
        field("net_income_frequency", "Per", "select", { options: FREQUENCY, half: true }),
        field("other_income", "Net income from other sources ($)", "number", { half: true }),
        field("other_income_frequency", "Per", "select", { options: FREQUENCY, half: true }),
      ],
    },
    {
      id: "references",
      title: "Personal references",
      fields: [
        field("referee_1_name", "1. Name", "text", { required: true }),
        field("referee_1_relationship", "Relationship to applicant", "text", { half: true }),
        field("referee_1_phone", "Contact phone", "tel", { half: true }),
        field("referee_1_address", "Address", "text"),
        field("referee_2_name", "2. Name", "text"),
        field("referee_2_relationship", "Relationship to applicant", "text", { half: true }),
        field("referee_2_phone", "Contact phone", "tel", { half: true }),
        field("referee_2_address", "Address", "text"),
      ],
    },
    { id: "kin", title: "Next of kin", fields: contactBlock("kin", "Next of kin") },
    { id: "emergency", title: "Emergency contact", fields: contactBlock("emergency", "Emergency contact") },
    {
      id: "privacy",
      title: "Privacy acknowledgement (added by Open Home Hero)",
      note: "This is not part of the official Form 18. It lets us pass your details to the agent and landlord.",
      fields: [
        field("consent_agree", "I agree that my details may be passed to the agent and landlord to assess this application", "checkbox", { required: true }),
        field("consent_name", "Print name", "text", { required: true }),
      ],
    },
  ],
  notices: [
    { title: "About this application", body: "This application helps the landlord choose a tenant. The landlord or property manager may not approve it if not enough information is provided. It does not form part of a tenancy agreement." },
    { title: "Option fee", body: "An option fee may be paid to the landlord or property manager when you lodge an application (capped at $50 or $100 depending on the weekly rent). It is paid to them, not through Open Home Hero. If you are unsuccessful it must be returned within 7 days." },
    { title: "Tenancy databases", body: "The agent must tell you in writing which databases they use (see the notice above), and must tell you within 7 days if they find information about you on one." },
    { title: "No rent bidding", body: "The rent must be advertised at a fixed amount, and you cannot be asked or pressured to offer more." },
    { title: "Equality", body: "All applicants must be considered under the Equal Opportunity Act 1984 (WA). There must be no discrimination based on sex, marital status, pregnancy, gender history, parental or carer status, sexual orientation, race, religious or political conviction, disability, mental health, age, or association with someone treated unfairly on those grounds." },
  ],
  consent:
    "I agree that my details may be passed to the agent and landlord to assess this application.",
};
