import type { RentalFormDefinition } from "./types";
import { field, options } from "./builders";

const PRIMARY_ID = options(
  "Not requested",
  "Driver's licence",
  "Proof of age card",
  "Defence Force ID",
  "Government ID",
  "Passport",
  "Working with Children Clearance or Ochre Card",
  "Photographic identification from a recognised local Aboriginal authority",
);
const SECONDARY_ID = options(
  "Not requested",
  "Letter from land council confirming identity",
  "Medicare card",
  "Concession or Health Care card",
  "Birth, marriage or divorce certificate",
  "Centrelink income assessment",
  "Income tax notice of assessment",
  "Utility bill",
  "Immigration or citizenship papers",
  "Approved Department of Housing (NT) proof of identification form",
);
const PAY_DOCS = options(
  "Not requested",
  "Current payslips",
  "Income statement (employer or Centrelink)",
  "Letter on letterhead from employer",
  "Income tax notice of assessment (if self-employed)",
  "Document showing investment income or interest and frequency (self-funded retirees)",
);

// Built from the Commissioner of Tenancies' "Approved information and documents
// for rental applications" (s18A Residential Tenancies Act 1999), version 2,
// 2 February 2026. The NT has no prescribed form; this lists only approved items.
export const ntForm: RentalFormDefinition = {
  state: "NT",
  stateName: "Northern Territory",
  formName: "Rental application (approved information)",
  version: "Approved information v2, 2 February 2026",
  authority: "Commissioner of Tenancies, NT Consumer Affairs",
  sourceUrl:
    "https://consumeraffairs.nt.gov.au/_resources/documents/for-consumers/residential-tenancies/residential-tenancy-legislation-amendment-bill-2023/approved-information-and-documents-for-rental-applications-v2-2-february-2026.pdf",
  basis: "approved-list",
  rankingInputs: { income: true, history: false, references: true, pets: true },
  reviewNotes: [
    "The NT has no prescribed form: is a form built from the approved list safe to use?",
    "What do s18A(4) and s18B require for destroying and keeping applicant information?",
    "Is the question order and wording acceptable?",
  ],
  agentSections: [
    {
      id: "agent",
      title: "Landlord or agent details",
      fields: [
        field("agent_name", "Agent or landlord name", "text", { required: true }),
        field("agent_phone", "Phone", "tel", { half: true }),
        field("agent_email", "Email", "email", { half: true }),
      ],
    },
    {
      id: "docs",
      title: "Documents you request",
      intro:
        "Only approved documents may be requested. A document means a type of document, so two payslips count as one. Photo ID is ideal but not mandatory.",
      fields: [
        field("identity_primary", "Identity: primary document (one only)", "select", { options: PRIMARY_ID }),
        field("identity_secondary_1", "Identity: secondary document 1 (up to two, if no primary document)", "select", { options: SECONDARY_ID, half: true }),
        field("identity_secondary_2", "Identity: secondary document 2", "select", { options: SECONDARY_ID, half: true }),
        field("pay_doc_1", "Ability to pay: primary document 1 (up to two)", "select", { options: PAY_DOCS, half: true }),
        field("pay_doc_2", "Ability to pay: primary document 2", "select", { options: PAY_DOCS, half: true }),
        field("care_reference", "Ability to care for the property: ask for a reference", "yesno", {
          help: "From a previous landlord, neighbour or personal associate.",
        }),
      ],
    },
    {
      id: "criteria",
      title: "Housing criteria (only if the property has one)",
      fields: [
        field("criteria_text", "Eligibility criteria for this property, if any", "text", {
          help: "For example, a community or key-worker housing requirement. Leave blank if none.",
        }),
      ],
    },
  ],
  applicantSections: [
    {
      id: "applicant",
      title: "Applicant details",
      fields: [
        field("full_name", "Name", "text", { required: true }),
        field("email", "Email address", "email", { required: true, half: true }),
        field("phone", "Telephone number", "tel", { required: true, half: true }),
        field("current_address", "Current address", "text", { required: true }),
        field("legal_age", "Are you of legal age to enter a tenancy agreement?", "yesno", { required: true }),
        field("meets_criteria", "Do you meet the housing criteria for this property (if it has one)?", "yesno"),
      ],
    },
    {
      id: "occupants",
      title: "Occupants",
      fields: [
        field("occupants_total", "Number of occupants who will be living at the property", "number", { required: true, half: true }),
        field("occupants_children", "Number of those who are children under 18", "number", { required: true, half: true }),
      ],
    },
    {
      id: "income",
      title: "Income and employment",
      fields: [
        field("weekly_income", "Current weekly income ($)", "number", { required: true }),
        field("employer", "Current employer", "text", { half: true }),
        field("job_title", "Job title or employment status (for example self-employed)", "text", { half: true }),
        field("consent_employer", "I consent to the landlord or agent contacting my current employer to confirm my employment", "checkbox"),
      ],
    },
    {
      id: "landlord",
      title: "Previous or current landlord",
      fields: [
        field("landlord_name", "Name", "text", { half: true }),
        field("landlord_phone", "Phone", "tel", { half: true }),
        field("landlord_email", "Email", "email"),
        field("consent_landlord", "I consent to the landlord or agent contacting this person for a reference", "checkbox"),
      ],
    },
    {
      id: "referee",
      title: "Referee",
      note: "A referee may be a landlord, employer, neighbour or other person who can speak to your identity, ability to pay or care of the property.",
      fields: [
        field("referee_name", "Referee name", "text"),
        field("referee_phone", "Phone", "tel", { half: true }),
        field("referee_email", "Email", "email", { half: true }),
        field("referee_connection", "Connection to you", "text"),
        field("consent_referee", "I consent to the landlord or agent contacting this referee", "checkbox"),
      ],
    },
    {
      id: "pets",
      title: "Pets",
      fields: [field("has_pets", "Do you have pets?", "yesno")],
    },
    {
      id: "emergency",
      title: "Emergency contact",
      fields: [
        field("emergency_name", "Name", "text"),
        field("emergency_phone", "Phone", "tel"),
      ],
    },
    {
      id: "documents",
      title: "Documents requested",
      intro: "Tell us how you will provide each document the agent has requested. If you have no payslips or similar, a bank statement may be used, and you can remove information that does not relate to your ability to pay.",
      fields: [
        field("identity_ack", "Identity documents", "select", {
          options: [
            { value: "provide", label: "I will provide copies" },
            { value: "show", label: "I will show the originals" },
            { value: "discuss", label: "I'll discuss alternatives" },
          ],
        }),
        field("pay_ack", "Ability-to-pay documents", "select", {
          options: [
            { value: "provide", label: "I will provide copies" },
            { value: "show", label: "I will show the originals" },
            { value: "discuss", label: "I'll discuss alternatives" },
          ],
        }),
      ],
    },
    {
      id: "term",
      title: "Move-in",
      fields: [
        field("move_in_date", "When would you like to move in?", "date", { half: true }),
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
    { title: "Only relevant information", body: "The landlord or agent may only ask for what helps them decide who to rent to. They should not ask about your marital status, age, gender, sexuality, plans to start a family, race, nationality, health, religion, political beliefs, disability, domestic violence, or any arrests, convictions or criminal history." },
    { title: "Bank statements", body: "A bank statement shows what you spend. It may only be used if you have no other proof of income, and you must be able to remove anything that does not relate to your ability to pay." },
    { title: "Your information", body: "It is private. The landlord or agent must keep it secure and destroy it as the Residential Tenancies Act requires." },
    { title: "Photo ID", body: "Photographic identification is ideal but it is not mandatory." },
    { title: "Wording", body: "This is a summary of the Commissioner of Tenancies' approved list, not an official form. The NT does not prescribe a form." },
  ],
  consent:
    "The information I have given is true, and I agree it may be used to assess this application.",
};
