import { describe, expect, it } from "vitest";
import { RENTAL_FORMS } from "./index";
import { cleanApplicantAnswers, contactFrom, agentConfigComplete } from "./answers";
import { rankApplicants } from "./ranking";
import { rankingContext, toRankable } from "./rankable";
import type { RentalFormDefinition } from "./types";

const forms = Object.values(RENTAL_FORMS);

function sample(form: RentalFormDefinition) {
  const out: Record<string, string | boolean | number> = {};
  for (const f of form.applicantSections.flatMap((s) => s.fields)) {
    if (!f.required) continue;
    out[f.id] =
      f.type === "checkbox" || f.type === "yesno"
        ? true
        : f.type === "email"
          ? "a@example.com"
          : f.type === "tel"
            ? "0400 000 000"
            : f.type === "date"
            ? "2026-12-01"
            : f.type === "number"
              ? 2
              : f.type === "select"
                ? (f.options?.[0]?.value ?? "")
                : "Sample";
  }
  return out;
}

describe.each(forms.map((f) => [f.state, f] as const))("%s form", (_state, form) => {
  it("has unique field ids across agent and applicant sections", () => {
    const ids = [...form.agentSections, ...form.applicantSections].flatMap((s) => s.fields.map((f) => f.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("asks for a name and email, which the dashboard needs", () => {
    const ids = form.applicantSections.flatMap((s) => s.fields.map((f) => f.id));
    expect(ids).toContain("full_name");
    expect(ids).toContain("email");
  });

  it("never asks for smoking or free-text notes", () => {
    const ids = form.applicantSections.flatMap((s) => s.fields.map((f) => f.id.toLowerCase()));
    expect(ids.some((id) => id.includes("smok") || id === "notes")).toBe(false);
  });

  it("accepts a complete submission and rejects a field that is not on the form", () => {
    const answers = sample(form);
    expect(() => cleanApplicantAnswers(form, answers)).not.toThrow();
    expect(() => cleanApplicantAnswers(form, { ...answers, is_smoker: true })).toThrow();
    expect(() => cleanApplicantAnswers(form, { ...answers, notes: "hello" })).toThrow();
  });

  it("rejects a submission missing a required field", () => {
    const answers = sample(form);
    delete answers.full_name;
    expect(() => cleanApplicantAnswers(form, answers)).toThrow();
  });

  it("rejects a select value that is not an option", () => {
    const select = form.applicantSections.flatMap((s) => s.fields).find((f) => f.type === "select");
    if (!select) return;
    expect(() => cleanApplicantAnswers(form, { ...sample(form), [select.id]: "made_up" })).toThrow();
  });

  it("is not open for applications until the agent's required items are saved", () => {
    expect(agentConfigComplete(form, {})).toBe(false);
  });

  it("reads the contact details from a submission", () => {
    const clean = cleanApplicantAnswers(form, sample(form));
    expect(contactFrom(clean).email).toBe("a@example.com");
    expect(contactFrom(clean).name).toBe("Sample");
  });
});

describe("ranking", () => {
  const qld = RENTAL_FORMS.QLD;
  const base = {
    full_name: "A",
    gross_weekly_income: 1500,
    history_1_start: "2023-01-01",
    history_1_end: "2025-12-01",
    referee_1_name: "R1",
    referee_2_name: "R2",
    move_in_date: "2026-12-01",
    lease_term: "12_months",
    pets_intend: false,
  };
  const ctx = rankingContext(qld, 520, { preferredMoveIn: "2026-12-01", minLeaseMonths: 12 });

  it("ignores age, family size, smoking, and free text", () => {
    const a = rankApplicants([toRankable(qld, "1", base, {})], ctx)[0];
    const b = rankApplicants(
      [
        toRankable(
          qld,
          "1",
          {
            ...base,
            date_of_birth: "1950-01-01",
            occupants_total: 9,
            occupants_under_18: 7,
            is_smoker: true,
            living_arrangements: "anything at all",
          },
          {},
        ),
      ],
      ctx,
    )[0];
    expect(b.score).toBe(a.score);
    expect(b.positives).toEqual(a.positives);
    expect(b.concerns).toEqual(a.concerns);
  });

  it("does not mark South Australian applicants down for income or history the form never asks for", () => {
    const sa = RENTAL_FORMS.SA;
    const r = rankApplicants(
      [toRankable(sa, "1", { full_name: "A", referee_1_name: "R1", referee_2_name: "R2" }, {})],
      rankingContext(sa, 520, {}),
    )[0];
    expect(r.concerns.join(" ")).not.toMatch(/income|history/i);
    expect(r.score).toBe(100);
  });

  it("does not treat pets as a condition in states whose form has no pet question", () => {
    const vic = RENTAL_FORMS.VIC;
    const ctxVic = rankingContext(vic, 520, { petsAllowed: false });
    const r = rankApplicants([toRankable(vic, "1", { full_name: "A", has_pets: true }, {})], ctxVic)[0];
    expect(r.unmet).toEqual([]);
  });
});
