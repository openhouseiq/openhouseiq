import type { RentalFormDefinition } from "./types";
import { documentAck, field, historyFields, options, refereeFields } from "./builders";

const FINANCIAL_DOCS = options(
  "Not requested",
  "Most recent pay slips",
  "Bank statement (without transaction details)",
  "Centrelink payment statement or letter",
  "Other financial document",
);
const IDENTITY_DOCS = options(
  "Not requested",
  "Driver licence",
  "Australian passport",
  "Medicare card",
  "Proof of age card",
  "Other identity document",
);

// Mirrors RTA Form 22 (version 4, March 2026). Source: rta.qld.gov.au.
export const qldForm: RentalFormDefinition = {
  state: "QLD",
  stateName: "Queensland",
  formName: "Rental application (Form 22)",
  version: "Form 22 v4, March 2026",
  authority: "Residential Tenancies Authority (RTA)",
  sourceUrl: "https://www.rta.qld.gov.au/forms-resources/forms/rental-application-form-22",
  agentSections: [
    {
      id: "manager",
      title: "1. Property manager or owner details",
      fields: [
        field("manager_name", "Full name", "text", { required: true }),
        field("manager_phone", "Phone", "tel", { half: true }),
        field("manager_email", "Email", "email", { half: true }),
        field("agency_details", "Agency details (if applicable)", "text"),
      ],
    },
    {
      id: "submit",
      title: "3. Ways to submit your application",
      intro:
        "You must offer at least two ways to apply, and at least one must not be a restricted way. Open Home Hero is an online platform that collects information for you, so it counts as a restricted way. Add at least one other way, such as email to you or in person.",
      fields: [
        field("submit_1", "Way 1 (for example: email to you)", "text", { required: true }),
        field("submit_2", "Way 2 (for example: in person at the property)", "text", { required: true }),
        field(
          "submit_confirm",
          "At least one of these does not use someone else's online platform and costs the applicant nothing",
          "checkbox",
          { required: true },
        ),
      ],
    },
    {
      id: "docs",
      title: "7, 8 and 9. Documents you request",
      intro: "Request no more than two documents in each category.",
      fields: [
        field("financial_doc_1", "Financial document 1", "select", { options: FINANCIAL_DOCS, half: true }),
        field("financial_doc_2", "Financial document 2", "select", { options: FINANCIAL_DOCS, half: true }),
        field("identity_doc_1", "Identity document 1", "select", { options: IDENTITY_DOCS, half: true }),
        field("identity_doc_2", "Identity document 2", "select", { options: IDENTITY_DOCS, half: true }),
        field("suitability_doc_1", "Suitability document 1 (optional)", "text", { half: true }),
        field("suitability_doc_2", "Suitability document 2 (optional)", "text", { half: true }),
      ],
    },
    {
      id: "bylaws",
      title: "12. Pets: by-laws and park rules",
      fields: [
        field("pet_bylaws", "Are there body corporate by-laws, park rules or other laws about keeping pets at the premises?", "select", {
          options: options("Yes", "No", "Not applicable"),
        }),
      ],
    },
    {
      id: "databases",
      title: "15. Tenancy databases you may use",
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
      title: "4. Number of occupants",
      fields: [
        field("occupants_total", "Total occupants intended to live at the premises (including those under 18)", "number", { required: true }),
        field("occupants_under_18", "Number of occupants under 18", "number", { required: true }),
      ],
    },
    {
      id: "applicant",
      title: "5. Applicant details",
      intro: "Each adult applicant completes their own application.",
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
      title: "6. Employment details",
      note: "If you cannot provide details of your current employment or income, give other details about your ability to pay rent under Financial information.",
      fields: [
        field("employer", "Current employer", "text", { required: true }),
        field("job_title", "Job title", "text", { half: true }),
        field("length_of_employment", "Length of employment", "text", { half: true }),
        field("gross_weekly_income", "Gross weekly income ($)", "number", { required: true }),
        field("employer_contact", "Employer contact name", "text", { half: true }),
        field("employer_phone", "Employer phone", "tel", { half: true }),
        field("employer_email", "Employer email", "email"),
      ],
    },
    {
      id: "financial",
      title: "7. Financial information",
      intro: "Documents the property manager or owner has requested to check your ability to pay rent.",
      note: "If you do not receive regular income (for example self-employed, casual or between jobs), you can provide previous pay slips, bank statements without transaction details, Centrelink statements or letters, or proof of savings or assets.",
      fields: [
        documentAck("financial_ack_1", "Requested document 1"),
        documentAck("financial_ack_2", "Requested document 2"),
      ],
    },
    {
      id: "identity",
      title: "8. Verification of identity",
      note: "You can show the original or give a copy. The property manager or owner must not keep a copy of an original you show them unless you agree.",
      fields: [
        documentAck("identity_ack_1", "Requested document 1"),
        documentAck("identity_ack_2", "Requested document 2"),
      ],
    },
    {
      id: "suitability",
      title: "9. Applicant suitability",
      fields: [
        documentAck("suitability_ack_1", "Requested document 1"),
        documentAck("suitability_ack_2", "Requested document 2"),
      ],
    },
    {
      id: "history",
      title: "10. Rental history",
      fields: [
        ...historyFields(1),
        ...historyFields(2),
        field("living_arrangements", "If you have no rental history, you may describe your prior living arrangements (optional)", "textarea", {
          help: "For example: living with family, previous homeowner.",
        }),
      ],
    },
    {
      id: "references",
      title: "11. References",
      intro: "Two referees who can verify your ability to care for the premises.",
      fields: [...refereeFields(1), ...refereeFields(2)],
    },
    {
      id: "pets",
      title: "12. Pet details",
      fields: [
        field("pets_intend", "Do you intend to keep pets at the premises?", "yesno", { required: true }),
        field("pets_types", "Type or types of pets", "text", { half: true }),
        field("pets_number", "Number of pets", "number", { half: true }),
        field("pets_other", "Other information about the pets (optional)", "textarea", {
          help: "For example: age, temperament, training, indoors or outdoors.",
        }),
      ],
    },
    {
      id: "vehicles",
      title: "13. Vehicle details",
      fields: [
        field("vehicles_any", "Will any vehicles be parked at the premises?", "yesno"),
        field("veh_cars", "Cars", "number", { half: true }),
        field("veh_trailers", "Trailers", "number", { half: true }),
        field("veh_caravans", "Caravans", "number", { half: true }),
        field("veh_heavy", "Heavy vehicles", "number", { half: true }),
        field("veh_boats", "Boats", "number", { half: true }),
        field("veh_other", "Other motor vehicles", "number", { half: true }),
      ],
    },
    {
      id: "term",
      title: "14. Term of tenancy",
      fields: [
        field("move_in_date", "Preferred move-in date", "date", { required: true, half: true }),
        field("lease_term", "Desired lease term", "select", {
          required: true,
          half: true,
          options: options("6 months", "12 months", "24 months", "Other"),
        }),
      ],
    },
    {
      id: "consent",
      title: "16. Personal consent and submission confirmation",
      fields: [
        field("consent_agree", "I agree to the statement below", "checkbox", { required: true }),
        field("consent_name", "Print name", "text", { required: true }),
      ],
    },
  ],
  notices: [
    { title: "No fee", body: "You cannot be charged to apply, and applying must not cost you anything." },
    { title: "Only the information on this form", body: "You can only be asked for the information on this form. You cannot be asked about legal actions or tribunal matters, rental bond claims, breach notices, or bank or credit statements showing transactions." },
    { title: "How your information is used", body: "It is used only to assess your suitability as a tenant, and it must be stored securely." },
    { title: "Two ways to apply", body: "You must be offered at least two ways to apply, one of which does not use someone else's online platform. Open Home Hero is one of them. See the agent's other way above." },
    { title: "Discrimination", body: "If you think you have been unlawfully discriminated against, you can contact the Queensland Human Rights Commission." },
  ],
  consent:
    "By signing and submitting this rental application, the applicant confirms that the property manager/owner may contact the applicant's current employer, current or previous property manager/owner and referees listed in this form for the purpose of assessing the rental application. Your application will not be processed unless all required documents are submitted.",
};
