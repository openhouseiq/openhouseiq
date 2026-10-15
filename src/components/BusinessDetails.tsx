import { BRAND_NAME, BUSINESS_ABN, CONTACT_EMAIL, LEGAL_ENTITY_NAME } from "@/lib/brand";

// Who is behind the product. Lines with no value set are left out entirely.
export function BusinessDetails({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="font-medium text-ink">{BRAND_NAME}</p>
      {LEGAL_ENTITY_NAME ? (
        <p>Trading name of {LEGAL_ENTITY_NAME}</p>
      ) : null}
      {BUSINESS_ABN ? <p>ABN {BUSINESS_ABN}</p> : null}
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-brass underline">
          {CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
