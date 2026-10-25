export type RentalState = "QLD" | "VIC";

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "number"
  | "textarea"
  | "select"
  | "yesno"
  | "checkbox";

export type FormField = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Show beside the next field on wide screens. */
  half?: boolean;
};

export type FormSection = {
  id: string;
  title: string;
  intro?: string;
  note?: string;
  fields: FormField[];
};

export type FormNotice = { title: string; body: string };

/**
 * One definition per state. It mirrors the official form exactly: nothing may
 * be asked that is not listed here, and submissions are validated against it.
 */
export type RentalFormDefinition = {
  state: RentalState;
  stateName: string;
  formName: string;
  version: string;
  authority: string;
  sourceUrl: string;
  /** Items the agent completes once per listing (not the applicant). */
  agentSections: FormSection[];
  /** Items the applicant completes. */
  applicantSections: FormSection[];
  notices: FormNotice[];
  consent: string;
};
