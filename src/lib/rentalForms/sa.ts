import type { RentalFormDefinition } from "./types";
import { documentAck, field, options } from "./builders";

const ID_DOCS = options(
  "Not requested",
  "Driver's licence",
  "Passport",
  "Birth certificate",
  "Proof of age card",
);
const PAY_DOCS = options(
  "Not requested",
  "Bank statement with outgoing transactions and account numbers redacted or removed",
  "A payslip or document confirming employment",
  "Proof of pension or other income",
  "Other document directly relating to financial capacity or primary source of income",
);
const WHO_PAYS = options("Tenant", "Landlord", "Not applicable");

// Mirrors Form A1, Residential Tenancies Act 1995 s47B(3), dated December 2025
// (compulsory from 1 January 2026). Source: cbs.sa.gov.au.
// The form asks nothing about employer, income or rental history, so we do not.
export const saForm: RentalFormDefinition = {
  state: "SA",
  stateName: "South Australia",
  formName: "Application for a prospective tenant (Form A1)",
  version: "Form A1, December 2025",
  authority: "Consumer and Business Services (CBS)",
  sourceUrl:
    "https://www.cbs.sa.gov.au/documents/tenancy/forms/Form-A1_Application-for-a-prospective-tenant-to-enter-into-a-residential-tenancy-1.pdf",
  basis: "prescribed",
  rankingInputs: { income: false, history: false, references: true, pets: false },
  reviewNotes: [
    "Is a typed name and date a valid signature on Form A1?",
    "Who must destroy the data 30 days after the tenant signs when Open Home Hero holds it?",
    "Does the lack of income and history on the form limit ranking to referees, fit and documents?",
  ],
  agentSections: [
    {
      id: "tenancy",
      title: "2 to 6. The tenancy",
      fields: [
        field("exclusions", "Parts of the premises excluded from the tenancy", "text"),
        field("duration", "Duration of tenancy", "select", {
          options: options("Periodic", "12 months", "Other fixed term"),
          required: true,
          half: true,
        }),
        field("duration_other", "If other fixed term, specify", "text", { half: true }),
        field("available_date", "Date the premises are available", "date"),
        field("rent_frequency", "How rent is paid", "select", {
          options: options("Weekly", "Fortnightly", "Calendar monthly"),
          half: true,
        }),
        field("bond_required", "Bond required?", "yesno", { half: true }),
        field("bond_amount", "Bond amount ($)", "number", {
          help: "Up to 4 weeks' rent, or 6 weeks' if the rent is over $800 a week.",
        }),
        field("water", "Water charges paid by", "select", { options: WHO_PAYS, half: true }),
        field("electricity", "Electricity charges paid by", "select", { options: WHO_PAYS, half: true }),
        field("gas", "Gas charges paid by", "select", { options: WHO_PAYS, half: true }),
        field("other_charges", "Other charges (internet, subscription TV, solar)", "text"),
        field(
          "sale_advertised",
          "The landlord has advertised, intends to advertise or has a sales agency agreement for the sale of the premises",
          "yesno",
        ),
      ],
    },
    {
      id: "agent",
      title: "8. Landlord or agent details",
      fields: [
        field("agent_name", "Agent name or company (or landlord's name if no agent)", "text", { required: true }),
        field("agent_abn", "ABN (if applicable)", "text", { half: true }),
        field("agent_rla", "Agent's Registered Land Agent (RLA) number", "text", { half: true }),
        field("agent_contact", "Contact person", "text"),
        field("agent_email", "Email", "email", { half: true }),
        field("agent_phone", "Phone", "tel", { half: true }),
        field("agent_address", "Postal address or address for service", "text"),
      ],
    },
    {
      id: "docs",
      title: "9. Documents you request",
      intro:
        "Request no more than two identification documents (at least one with a photo) and no more than two documents on the ability to pay rent.",
      fields: [
        field("identity_doc_1", "Identification document 1", "select", { options: ID_DOCS, half: true }),
        field("identity_doc_2", "Identification document 2", "select", { options: ID_DOCS, half: true }),
        field("pay_doc_1", "Ability-to-pay document 1", "select", { options: PAY_DOCS, half: true }),
        field("pay_doc_2", "Ability-to-pay document 2", "select", { options: PAY_DOCS, half: true }),
        field("pay_doc_other", "If other, describe the document", "text"),
      ],
    },
    {
      id: "databases",
      title: "11. Residential tenancy databases you use",
      intro: "Name any database and its contact details, unless you gave them to the applicant not more than 7 days before.",
      fields: [
        field("db_1_name", "Database 1: name", "text", { half: true }),
        field("db_1_contact", "Contact details", "text", { half: true }),
        field("db_2_name", "Database 2: name", "text", { half: true }),
        field("db_2_contact", "Contact details", "text", { half: true }),
        field("db_3_name", "Database 3: name", "text", { half: true }),
        field("db_3_contact", "Contact details", "text", { half: true }),
      ],
    },
    {
      id: "submit",
      title: "12. Ways to submit an application",
      intro: "List how applicants can submit. Open Home Hero is one way; add others if you offer them.",
      fields: [
        field("submit_1", "Submission method 1", "text", { required: true }),
        field("submit_2", "Submission method 2", "text"),
        field("submit_3", "Submission method 3", "text"),
      ],
    },
  ],
  applicantSections: [
    {
      id: "applicant",
      title: "7. Prospective tenant details",
      intro: "Each prospective tenant over the age of 18 years must complete a separate application form.",
      fields: [
        field("full_name", "Full name", "text", { required: true }),
        field("current_address", "Current address", "text", { required: true }),
        field("email", "Email", "email", { required: true }),
        field("phone_1", "Phone 1", "tel", { required: true, half: true }),
        field("phone_2", "Phone 2", "tel", { half: true }),
        field("joint_with", "Joint application with", "text"),
        field(
          "over_18_capacity",
          "Are all prospective tenants over the age of 18 and have legal capacity to enter into a residential tenancy agreement?",
          "yesno",
          { required: true },
        ),
      ],
    },
    {
      id: "term",
      title: "3. Your preferred tenancy duration and move-in date",
      fields: [
        field("preferred_duration", "Preferred tenancy duration", "text", { half: true }),
        field("move_in_date", "Preferred move-in date", "date", { half: true }),
      ],
    },
    {
      id: "documents",
      title: "9. Documents requested by the landlord or agent",
      intro:
        "You can be asked for no more than two documents in each group. You may attach more if you think it helps. Tell us how you will provide each one.",
      fields: [
        documentAck("identity_ack_1", "Identification document 1"),
        documentAck("identity_ack_2", "Identification document 2"),
        documentAck("pay_ack_1", "Ability-to-pay document 1"),
        documentAck("pay_ack_2", "Ability-to-pay document 2"),
        field("identity_other", "Another form of identification you propose (optional)", "text"),
      ],
    },
    {
      id: "referees",
      title: "10. Referees",
      intro: "Please provide relevant referees on your suitability as a tenant.",
      fields: [
        field("referee_1_name", "Referee 1: full name", "text", { required: true }),
        field("referee_1_relationship", "Relationship to you", "text", { half: true }),
        field("referee_1_contact", "Contact details", "text", { half: true }),
        field("referee_2_name", "Referee 2: full name", "text"),
        field("referee_2_relationship", "Relationship to you", "text", { half: true }),
        field("referee_2_contact", "Contact details", "text", { half: true }),
        field("referee_other", "Other relevant referee information", "text"),
      ],
    },
    {
      id: "signature",
      title: "13. Signature",
      fields: [
        field("consent_agree", "I confirm the information I have given is true and I have not given false information or a falsified document", "checkbox", { required: true }),
        field("consent_name", "Print name (this is your signature)", "text", { required: true }),
      ],
    },
  ],
  notices: [
    { title: "This is an application only", body: "This is an application to enter into a residential tenancy agreement only. You will be told the outcome by the landlord or agent." },
    { title: "Only what is on this form", body: "The landlord or agent must use this form and must not ask for information that South Australian law prohibits, such as past legal action, past breaches, bond assistance, or employment details beyond a payslip or a document confirming employment." },
    { title: "No payments", body: "Nobody may require or take any payment from you for this application, other than rent or bond once the tenancy is agreed." },
    { title: "Fixed rent, no bidding", body: "The rent must be offered as a fixed amount. You cannot be invited to offer more than the advertised rent." },
    { title: "How long it is kept", body: "Your information must be protected. It must be destroyed 30 days after the successful tenant signs the agreement, unless you consent to it being kept longer, and then it must be destroyed as soon as practicable within 6 months of the application date." },
    { title: "Tenancy databases", body: "If the landlord or agent checks a residential tenancy database, the name and contact details must be on this form. Nobody can charge you a fee to see what is listed about you." },
    { title: "False information", body: "Giving false information or a falsified document with an application is an offence with a maximum penalty of $20,000." },
  ],
  consent:
    "I confirm the information in this application is true. I understand that giving false information or a falsified document is an offence.",
};
