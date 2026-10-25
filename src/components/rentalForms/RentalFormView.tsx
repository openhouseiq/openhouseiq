"use client";

import type { FormField, FormSection } from "@/lib/rentalForms/types";

const inputClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass";

function FieldInput({ f }: { f: FormField }) {
  const id = `f-${f.id}`;
  if (f.type === "checkbox") {
    return (
      <label className="flex items-start gap-2 text-sm text-ink">
        <input type="checkbox" id={id} className="mt-0.5 h-4 w-4 rounded border-line text-brass" />
        <span>
          {f.label}
          {f.required ? <span className="text-error"> *</span> : null}
        </span>
      </label>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {f.label}
        {f.required ? <span className="text-error"> *</span> : null}
      </label>
      {f.type === "textarea" ? (
        <textarea id={id} rows={3} className={inputClasses} placeholder={f.placeholder} />
      ) : f.type === "select" ? (
        <select id={id} className={inputClasses} defaultValue="">
          <option value="" disabled>
            Select
          </option>
          {f.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : f.type === "yesno" ? (
        <div className="flex gap-4 text-sm text-ink">
          {["Yes", "No"].map((v) => (
            <label key={v} className="flex items-center gap-1.5">
              <input type="radio" name={id} className="h-4 w-4 text-brass" /> {v}
            </label>
          ))}
        </div>
      ) : (
        <input id={id} type={f.type} className={inputClasses} placeholder={f.placeholder} />
      )}
      {f.help ? <p className="mt-1 text-xs text-ink-soft">{f.help}</p> : null}
    </div>
  );
}

export function RentalFormSections({ sections }: { sections: FormSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <section key={s.id} className="rounded-md border border-line bg-paper-card p-5">
          <h3 className="font-serif text-lg font-medium text-ink">{s.title}</h3>
          {s.intro ? <p className="mt-1 text-sm text-ink-soft">{s.intro}</p> : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {s.fields.map((f) => (
              <div key={f.id} className={f.half ? "" : "sm:col-span-2"}>
                <FieldInput f={f} />
              </div>
            ))}
          </div>
          {s.note ? <p className="mt-4 rounded bg-paper p-3 text-xs text-ink-soft">{s.note}</p> : null}
        </section>
      ))}
    </div>
  );
}
