export function ContactLine({
  email,
  phone,
  suffix,
  className = "text-xs text-ink-soft",
}: {
  email?: string | null;
  phone?: string | null;
  suffix?: string | null;
  className?: string;
}) {
  if (!email && !phone) return null;

  return (
    <p className={className}>
      {email ? (
        <a href={`mailto:${email}`} className="underline hover:text-pine">
          {email}
        </a>
      ) : null}
      {email && phone ? " · " : ""}
      {phone ? (
        <a href={`tel:${phone}`} className="underline hover:text-pine">
          {phone}
        </a>
      ) : null}
      {suffix ? ` · ${suffix}` : ""}
    </p>
  );
}
