import type { InputHTMLAttributes } from "react";

export function FormField({
  label,
  id,
  ...inputProps
}: { label: string; id: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
        {...inputProps}
      />
    </div>
  );
}
