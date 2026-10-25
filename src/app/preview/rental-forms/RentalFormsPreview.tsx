"use client";

import { useMemo, useState } from "react";
import { RentalFormSections } from "@/components/rentalForms/RentalFormView";
import { RENTAL_FORMS, type RentalState } from "@/lib/rentalForms";
import {
  rankApplicants,
  type RankableApplicant,
  type RankingContext,
} from "@/lib/rentalForms/ranking";

// Sample data for illustration only. Nothing on this page is saved.
const WEEKLY_RENT = 520;
const CONTEXT: RankingContext = {
  weeklyRent: WEEKLY_RENT,
  maxRentShare: 0.3,
  preferredMoveIn: "2026-12-01",
  minLeaseMonths: 12,
  petsAllowed: false,
};

const SAMPLE: RankableApplicant[] = [
  { id: "a", name: "Priya S.", weeklyIncome: 1850, historyMonths: 36, referees: 2, moveInDate: "2026-12-01", leaseMonths: 12, intendsPets: false, documentsRequested: 2, documentsProvided: 2 },
  { id: "b", name: "Sam R.", weeklyIncome: 1700, historyMonths: 26, referees: 0, moveInDate: "2026-12-01", leaseMonths: 12, intendsPets: false, documentsRequested: 2, documentsProvided: 1 },
  { id: "c", name: "Daniel M.", weeklyIncome: 1500, historyMonths: 20, referees: 2, moveInDate: "2026-12-20", leaseMonths: 12, intendsPets: true, documentsRequested: 2, documentsProvided: 2 },
  { id: "d", name: "Mia T.", weeklyIncome: 1300, historyMonths: 0, referees: 2, moveInDate: "2026-12-30", leaseMonths: 12, intendsPets: false, documentsRequested: 2, documentsProvided: 2 },
  { id: "e", name: "Aisha K.", weeklyIncome: 1250, historyMonths: 14, referees: 1, moveInDate: "2026-12-05", leaseMonths: 6, intendsPets: false, documentsRequested: 2, documentsProvided: 1 },
  { id: "f", name: "Chris W.", weeklyIncome: 980, historyMonths: 48, referees: 2, moveInDate: "2026-12-01", leaseMonths: 12, intendsPets: false, documentsRequested: 2, documentsProvided: 2 },
];

const TABS = [
  { id: "listing", label: "1. New listing" },
  { id: "agent", label: "2. Agent settings" },
  { id: "applicant", label: "3. What applicants see" },
  { id: "shortlist", label: "4. Ranked shortlist" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const selectClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass";

export function RentalFormsPreview() {
  const [state, setState] = useState<RentalState>("QLD");
  const [tab, setTab] = useState<TabId>("listing");
  const [listingState, setListingState] = useState<string>("QLD");
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({});
  const form = RENTAL_FORMS[state];
  const ranked = useMemo(() => rankApplicants(SAMPLE, CONTEXT), []);
  const listingForm = RENTAL_FORMS[listingState as RentalState] ?? null;

  return (
    <div>
      <div className="rounded-md border border-brass bg-brass/10 p-3 text-sm text-ink">
        <strong>Design preview.</strong> Sample data only. Nothing here is saved, and no database
        is touched. Not live for customers.
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-ink">State:</span>
        {(Object.keys(RENTAL_FORMS) as RentalState[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setState(s)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              state === s ? "border-brass bg-brass text-ink" : "border-line bg-white text-ink-soft"
            }`}
          >
            {RENTAL_FORMS[s].stateName}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-line pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === t.id ? "bg-navy text-paper" : "text-ink-soft hover:bg-paper-card"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "listing" ? (
        <div className="mt-6 max-w-xl space-y-4">
          <p className="text-sm text-ink-soft">
            When an agent creates a rental, they now choose the state. It decides which official
            form visitors see.
          </p>
          <div className="rounded-md border border-line bg-paper-card p-5">
            <div className="flex gap-2 text-sm">
              <span className="rounded-md border border-line px-3 py-1.5 text-ink-soft">Sale</span>
              <span className="rounded-md bg-navy px-3 py-1.5 text-paper">Rental</span>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Address</label>
                <input className={selectClasses} defaultValue="12 Example Street, Sample Suburb" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Weekly rent</label>
                <input className={selectClasses} defaultValue="520" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  State or territory <span className="text-error">*</span>
                </label>
                <select
                  className={selectClasses}
                  value={listingState}
                  onChange={(e) => setListingState(e.target.value)}
                >
                  <option value="QLD">Queensland</option>
                  <option value="VIC">Victoria</option>
                  <option value="NSW">New South Wales</option>
                  <option value="WA">Western Australia</option>
                </select>
              </div>
            </div>
          </div>
          {listingForm ? (
            <p className="rounded-md border border-line bg-white p-3 text-sm text-ink">
              Visitors will see the <strong>{listingForm.formName}</strong> ({listingForm.version}).
              Next, complete the agent settings before applications switch on.
            </p>
          ) : (
            <p className="rounded-md border border-error bg-error/5 p-3 text-sm text-ink">
              Rental applications are <strong>switched off</strong> for this state while its form is
              being reviewed. Visitors can leave their contact details only.
            </p>
          )}
        </div>
      ) : null}

      {tab === "agent" ? (
        <div className="mt-6 max-w-3xl">
          <p className="mb-4 text-sm text-ink-soft">
            Items the official {form.stateName} form says the property manager, owner or agent
            completes. They are saved once per listing and shown to applicants.
          </p>
          <RentalFormSections sections={form.agentSections} />
        </div>
      ) : null}

      {tab === "applicant" ? (
        <div className="mt-6 max-w-3xl">
          <div className="rounded-md border border-line bg-paper-card p-5">
            <p className="text-xs uppercase tracking-wide text-ink-soft">{form.authority}</p>
            <h2 className="mt-1 font-serif text-2xl font-medium text-ink">{form.formName}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Version: {form.version} · For 12 Example Street, Sample Suburb
            </p>
          </div>
          <div className="mt-4 rounded-md border border-line bg-paper-card p-5">
            <h3 className="font-serif text-lg font-medium text-ink">Before you apply</h3>
            <ul className="mt-2 space-y-2 text-sm text-ink-soft">
              {form.notices.map((n) => (
                <li key={n.title}>
                  <strong className="text-ink">{n.title}.</strong> {n.body}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-soft">
              The wording shown here is a summary. The final version uses the official wording
              from {form.authority}.
            </p>
          </div>
          <div className="mt-4">
            <RentalFormSections sections={form.applicantSections} />
          </div>
          <div className="mt-4 rounded-md border border-line bg-paper-card p-5 text-sm text-ink-soft">
            <p>{form.consent}</p>
            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-md bg-brass/50 px-4 py-2.5 text-sm font-medium text-ink"
            >
              Submit application (preview only)
            </button>
          </div>
        </div>
      ) : null}

      {tab === "shortlist" ? (
        <div className="mt-6 max-w-3xl">
          <p className="text-sm text-ink-soft">
            Applicants for 12 Example Street at ${WEEKLY_RENT} a week, ranked for the landlord. The
            agent decides, and the ranking is a guide.
          </p>
          <div className="mt-3 rounded-md border border-line bg-paper-card p-4 text-xs text-ink-soft">
            Landlord settings used: rent up to {Math.round(CONTEXT.maxRentShare * 100)}% of weekly
            income · move in around 1 Dec 2026 · lease of {CONTEXT.minLeaseMonths}+ months · no pets.
          </div>
          <ol className="mt-4 space-y-3">
            {ranked.map((a, i) => (
              <li key={a.id} className="rounded-md border border-line bg-paper-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg text-ink">
                      {i + 1}. {a.name}
                    </p>
                    <p className="text-xs text-ink-soft">
                      ${a.weeklyIncome}/week · {a.historyMonths} months history · {a.referees} referee(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-brass px-3 py-1 text-sm font-semibold text-ink">
                      {a.score}% match
                    </span>
                  </div>
                </div>
                <div className="mt-2 h-2 rounded bg-line">
                  <div className="h-2 rounded bg-brass" style={{ width: `${a.score}%` }} />
                </div>
                {a.unmet.map((u) => (
                  <p key={u} className="mt-2 rounded bg-error/10 px-2 py-1 text-xs text-error">
                    Landlord condition not met: {u}
                  </p>
                ))}
                <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-ink">Why they rank well</p>
                    <ul className="mt-1 list-disc pl-4 text-ink-soft">
                      {a.positives.length ? a.positives.map((p) => <li key={p}>{p}</li>) : <li>None yet</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-ink">Things to check</p>
                    <ul className="mt-1 list-disc pl-4 text-ink-soft">
                      {a.concerns.length ? a.concerns.map((c) => <li key={c}>{c}</li>) : <li>Nothing flagged</li>}
                    </ul>
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={!!shortlisted[a.id]}
                    onChange={(e) => setShortlisted((s) => ({ ...s, [a.id]: e.target.checked }))}
                    className="h-4 w-4 rounded border-line text-brass"
                  />
                  Add to the shortlist for the landlord
                </label>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-md border border-line bg-paper-card p-4 text-sm text-ink">
            <strong>Shortlist for the landlord:</strong>{" "}
            {Object.values(shortlisted).some(Boolean)
              ? ranked.filter((a) => shortlisted[a.id]).map((a) => a.name).join(", ")
              : "no one selected yet"}
          </div>
          <div className="mt-4 rounded-md border border-error/40 bg-error/5 p-4 text-xs text-ink-soft">
            <strong className="text-ink">Never used in the ranking:</strong> age or date of birth,
            gender, ethnicity, disability, family status or number of children, smoking, bank
            transactions, or any free text.
          </div>
        </div>
      ) : null}
    </div>
  );
}
