import { PETS_OPTIONS, LEASE_TERM_OPTIONS } from "./landlordPreferences";

const selectClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass";

function PreferenceSelect({
  id,
  label,
  options,
  defaultValue,
}: {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={defaultValue ?? ""}
        className={selectClasses}
      >
        <option value="">No preference set</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LandlordPreferenceFields({
  defaults,
}: {
  defaults?: {
    landlordPrefPets?: string | null;
    landlordPrefMinLeaseTerm?: string | null;
  };
}) {
  return (
    <div
      id="landlord-preferences"
      className="scroll-mt-6 space-y-4 rounded-md border border-line p-4"
    >
      <div>
        <p className="text-sm font-medium text-ink">Landlord preferences</p>
        <p className="mt-1 text-xs text-ink-soft">
          Used to rank applicants. Smoking and employer questions are not on the official forms, so they are not asked.
        </p>
      </div>

      <PreferenceSelect
        id="landlordPrefPets"
        label="Pets"
        options={PETS_OPTIONS}
        defaultValue={defaults?.landlordPrefPets}
      />
      <PreferenceSelect
        id="landlordPrefMinLeaseTerm"
        label="Minimum lease term"
        options={LEASE_TERM_OPTIONS}
        defaultValue={defaults?.landlordPrefMinLeaseTerm}
      />
    </div>
  );
}
