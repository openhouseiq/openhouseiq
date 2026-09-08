import {
  PRICE_OPTIONS,
  SETTLEMENT_OPTIONS,
  LEVEL_OPTIONS,
} from "./sellerPreferences";

const selectClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine";

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

export function SellerPreferenceFields({
  defaults,
}: {
  defaults?: {
    sellerPrefPrice?: string | null;
    sellerPrefSettlement?: string | null;
    sellerPrefWaiveInspection?: string | null;
    sellerPrefFinanceApproved?: string | null;
    sellerPrefCashBuyer?: string | null;
  };
}) {
  return (
    <div className="space-y-4 rounded-md border border-line p-4">
      <div>
        <p className="text-sm font-medium text-ink">Seller preferences</p>
        <p className="mt-1 text-xs text-ink-soft">
          What matters most to the seller, used to judge offers against.
        </p>
      </div>

      <PreferenceSelect
        id="sellerPrefPrice"
        label="Price"
        options={PRICE_OPTIONS}
        defaultValue={defaults?.sellerPrefPrice}
      />
      <PreferenceSelect
        id="sellerPrefSettlement"
        label="Settlement period"
        options={SETTLEMENT_OPTIONS}
        defaultValue={defaults?.sellerPrefSettlement}
      />
      <PreferenceSelect
        id="sellerPrefWaiveInspection"
        label="Waive building & pest inspection"
        options={LEVEL_OPTIONS}
        defaultValue={defaults?.sellerPrefWaiveInspection}
      />
      <PreferenceSelect
        id="sellerPrefFinanceApproved"
        label="Finance approved"
        options={LEVEL_OPTIONS}
        defaultValue={defaults?.sellerPrefFinanceApproved}
      />
      <PreferenceSelect
        id="sellerPrefCashBuyer"
        label="Cash buyer"
        options={LEVEL_OPTIONS}
        defaultValue={defaults?.sellerPrefCashBuyer}
      />
    </div>
  );
}
