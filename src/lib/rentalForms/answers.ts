// Server-side checks for rental form submissions and agent settings. Every
// value is checked against the state's form definition: a field that is not in
// the definition is rejected, never silently stored (both Queensland and
// Victoria make asking for anything beyond the official form an offence).

import { ValidationError, isoDate } from "@/lib/validate";
import type { FormField, FormSection, RentalFormDefinition } from "./types";

export type CleanAnswers = Record<string, string | number | boolean>;

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

function fail(field: string): never {
  throw new ValidationError(`Invalid ${field}`);
}

function flatten(sections: FormSection[]): FormField[] {
  return sections.flatMap((s) => s.fields);
}

function cleanValue(f: FormField, raw: unknown): string | number | boolean | null {
  if (raw === undefined || raw === null || raw === "") return null;
  switch (f.type) {
    case "checkbox":
      return raw === true ? true : raw === false ? false : fail(f.id);
    case "yesno":
      return typeof raw === "boolean" ? raw : fail(f.id);
    case "number": {
      const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
      return Number.isFinite(n) && n >= 0 && n <= 1_000_000_000 ? n : fail(f.id);
    }
    case "date":
      return isoDate(raw, f.id);
    case "select": {
      if (typeof raw !== "string") return fail(f.id);
      return f.options?.some((o) => o.value === raw) ? raw : fail(f.id);
    }
    case "email": {
      if (typeof raw !== "string") return fail(f.id);
      const v = raw.trim();
      return v.length <= 254 && EMAIL.test(v) ? v.toLowerCase() : fail(f.id);
    }
    case "tel": {
      if (typeof raw !== "string") return fail(f.id);
      const v = raw.trim();
      return v.length <= 40 && /^[0-9+()\-\s.]*$/.test(v) ? v : fail(f.id);
    }
    case "textarea": {
      if (typeof raw !== "string") return fail(f.id);
      const v = raw.trim();
      return v.length <= 2000 ? v : fail(f.id);
    }
    default: {
      if (typeof raw !== "string") return fail(f.id);
      const v = raw.trim();
      return v.length <= 500 ? v : fail(f.id);
    }
  }
}

function cleanAgainst(sections: FormSection[], input: Record<string, unknown>): CleanAnswers {
  const fields = flatten(sections);
  const known = new Set(fields.map((f) => f.id));
  for (const key of Object.keys(input)) {
    if (!known.has(key)) fail("field");
  }
  const out: CleanAnswers = {};
  for (const f of fields) {
    const v = cleanValue(f, input[f.id]);
    if (v === null || v === "") {
      if (f.required) fail(f.id);
      continue;
    }
    if (f.required && f.type === "checkbox" && v !== true) fail(f.id);
    out[f.id] = v;
  }
  return out;
}

/** Applicant answers: only the form's applicant fields, required ones present. */
export function cleanApplicantAnswers(
  form: RentalFormDefinition,
  input: Record<string, unknown>,
): CleanAnswers {
  return cleanAgainst(form.applicantSections, input);
}

/** Agent settings for a listing: only the form's agent fields. */
export function cleanAgentConfig(
  form: RentalFormDefinition,
  input: Record<string, unknown>,
): CleanAnswers {
  return cleanAgainst(form.agentSections, input);
}

/** True when every required agent field is present, so the form may accept applications. */
export function agentConfigComplete(form: RentalFormDefinition, config: unknown): boolean {
  if (typeof config !== "object" || config === null || Array.isArray(config)) return false;
  try {
    cleanAgentConfig(form, config as Record<string, unknown>);
    return true;
  } catch {
    return false;
  }
}

export function contactFrom(answers: CleanAnswers) {
  const str = (k: string) => (typeof answers[k] === "string" ? (answers[k] as string) : null);
  return {
    name: str("full_name"),
    email: str("email"),
    phone: str("phone") ?? str("phone_1") ?? str("phone_mobile"),
  };
}
