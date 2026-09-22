import type { InputHTMLAttributes } from "react";

export function FormField({
  label,
  id,
  ...inputProps
}: { label: string; id: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-paper">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-paper placeholder:text-[#3b4657]/60 focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        {...inputProps}
      />
    </div>
  );
}
