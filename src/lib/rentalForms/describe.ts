import type { RentalFormDefinition } from "./types";

export type DescribedSection = {
  title: string;
  rows: { label: string; value: string }[];
};

/** The agent's saved items, as read-only rows, for the applicant to see. */
export function describeAgentItems(
  form: RentalFormDefinition,
  config: Record<string, unknown>,
): DescribedSection[] {
  const out: DescribedSection[] = [];
  for (const s of form.agentSections) {
    const rows: DescribedSection["rows"] = [];
    for (const f of s.fields) {
      const v = config[f.id];
      if (v === undefined || v === null || v === "" || v === "not_requested") continue;
      if (f.type === "checkbox") continue;
      let value: string;
      if (f.type === "select") {
        value = f.options?.find((o) => o.value === v)?.label ?? String(v);
      } else if (typeof v === "boolean") {
        value = v ? "Yes" : "No";
      } else {
        value = String(v);
      }
      rows.push({ label: f.label, value });
    }
    if (rows.length > 0) out.push({ title: s.title, rows });
  }
  return out;
}

/** An applicant's answers as labelled rows, grouped by the form's sections. */
export function describeAnswers(
  form: RentalFormDefinition,
  answers: Record<string, unknown>,
): DescribedSection[] {
  const out: DescribedSection[] = [];
  for (const s of form.applicantSections) {
    const rows: DescribedSection["rows"] = [];
    for (const f of s.fields) {
      const v = answers[f.id];
      if (v === undefined || v === null || v === "") continue;
      let value: string;
      if (f.type === "select") value = f.options?.find((o) => o.value === v)?.label ?? String(v);
      else if (typeof v === "boolean") value = v ? "Yes" : "No";
      else value = String(v);
      rows.push({ label: f.label, value });
    }
    if (rows.length > 0) out.push({ title: s.title, rows });
  }
  return out;
}
