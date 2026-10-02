export const LAND_SIZE_UNIT_OPTIONS: { value: string; label: string }[] = [
  { value: "sqm", label: "sqm" },
  { value: "ha", label: "ha" },
  { value: "acres", label: "acres" },
];

export function LandSizeField({
  defaultValue,
  defaultUnit,
}: {
  defaultValue?: number | null;
  defaultUnit?: string | null;
}) {
  return (
    <>
      <div>
        <label htmlFor="landSize" className="mb-1.5 block text-sm font-medium text-ink">
          Land size
        </label>
        <input
          id="landSize"
          name="landSize"
          type="number"
          min={0}
          step="0.01"
          defaultValue={defaultValue ?? undefined}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        />
      </div>
      <div>
        <label htmlFor="landSizeUnit" className="mb-1.5 block text-sm font-medium text-ink">
          Unit
        </label>
        <select
          id="landSizeUnit"
          name="landSizeUnit"
          defaultValue={defaultUnit ?? "sqm"}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          {LAND_SIZE_UNIT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
