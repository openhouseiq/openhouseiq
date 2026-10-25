import { RENTAL_FORMS, UNBUILT_STATES, type RentalState } from "@/lib/rentalForms";

const selectClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass";

/** The property's state or territory: it decides which official form applicants see. */
export function StateSelect({ defaultValue }: { defaultValue?: string | null }) {
  return (
    <div>
      <label htmlFor="rentalState" className="mb-1.5 block text-sm font-medium text-ink">
        State or territory <span className="text-error">*</span>
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
        {(Object.keys(RENTAL_FORMS) as RentalState[]).map((s) => (
          <option key={s} value={s}>
            {RENTAL_FORMS[s].stateName}
          </option>
        ))}
        {UNBUILT_STATES.map((u) => (
          <option key={u.value} value="other">
            {u.label} (applications off for now)
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-ink-soft">
        Each state has its own official application rules. Applications can only be taken in a
        state whose form is built.
      </p>
    </div>
  );
}
