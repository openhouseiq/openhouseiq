import { RENTAL_FORMS, UNBUILT_STATES, type RentalState } from "@/lib/rentalForms";

const selectClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass";

/** The property's state or territory: it decides which official form applicants see. */
export function StateSelect({ defaultValue }: { defaultValue?: string | null }) {
  return (
    <div>
      <label htmlFor="rentalState" className="mb-1.5 block text-sm font-medium text-ink">
        State, territory or country <span className="text-error">*</span>
      </label>
      <select
        id="rentalState"
        name="rentalState"
        required
        defaultValue={defaultValue ?? ""}
        className={selectClasses}
      >
        <option value="" disabled>
          Select
        </option>
        <optgroup label="Australia">
          {(Object.keys(RENTAL_FORMS) as RentalState[])
            .filter((s) => s !== "OTHER")
            .map((s) => (
              <option key={s} value={s}>
                {RENTAL_FORMS[s].stateName}
              </option>
            ))}
          {UNBUILT_STATES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label} (applications off for now)
            </option>
          ))}
        </optgroup>
        <optgroup label="Outside Australia">
          <option value="OTHER">Other: New Zealand, USA, Canada and elsewhere</option>
        </optgroup>
      </select>
      <p className="mt-1 text-xs text-ink-soft">
        Each Australian state has its own official application form. Outside Australia, choose
        Other for a general application form.
      </p>
    </div>
  );
}
