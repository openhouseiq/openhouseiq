import type { ButtonHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: {
  variant?: "primary" | "secondary" | "danger";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "rounded-md px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60";
  const variants = {
    primary: "bg-pine text-paper",
    secondary: "border border-line bg-white text-ink",
    danger: "border border-error text-error hover:bg-error/5",
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
