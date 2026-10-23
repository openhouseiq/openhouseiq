import type { ReactNode } from "react";
import { Wordmark } from "@/components/Wordmark";

// Static, non-interactive previews of the public visitor forms, shown on the
// home page so prospective agents can see what their visitors will see. They
// mirror the real forms under src/app/visit/[id] but never submit anything.

function Phone({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <figure className="mx-auto w-full max-w-[280px]">
      <div className="relative overflow-hidden rounded-[2.25rem] border-[10px] border-navy bg-paper shadow-lg">
        <div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-navy/30" />
        <div aria-hidden="true" className="h-[440px] select-none px-4 pb-6 pt-3">
          <p className="mb-3 text-center font-serif text-sm tracking-tight">
            <Wordmark tone="dark" />
          </p>
          <div className="rounded-md border border-line bg-paper-card p-3">
            <p className="text-center text-[10px] text-ink-soft">Open home at</p>
            <p className="text-center font-serif text-sm font-medium text-ink">
              24 Grandview Terrace
            </p>
            <h3 className="mb-3 mt-3 text-center text-xs font-semibold text-ink">
              {title}
            </h3>
            <div className="space-y-2.5 text-[11px]">{children}</div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-paper to-transparent" />
      </div>
      <figcaption className="mt-4 text-center text-sm text-ink-soft">{caption}</figcaption>
    </figure>
  );
}

export function FieldMock({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="mb-0.5 font-medium text-ink">{label}</p>
      <div className="rounded border border-line bg-white px-2 py-1.5 text-ink-soft">
        {value ?? " "}
      </div>
    </div>
  );
}

export function Choice({ label, selected }: { label: string; selected?: boolean }) {
  return (
    <div
      className={`rounded border px-2 py-1.5 ${
        selected ? "border-brass bg-brass/5 text-ink" : "border-line text-ink-soft"
      }`}
    >
      {label}
    </div>
  );
}

export function Stars({ label, filled }: { label: string; filled: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-ink">{label}</span>
      <span className="text-sm leading-none tracking-wider">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= filled ? "text-brass" : "text-line"}>
            ★
          </span>
        ))}
      </span>
    </div>
  );
}

export function Check({ label, checked }: { label: string; checked?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-ink">
      <span
        className={`flex h-3 w-3 items-center justify-center rounded-sm border text-[8px] leading-none ${
          checked ? "border-brass bg-brass text-ink" : "border-line bg-white"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      {label}
    </div>
  );
}

export function PhoneMockups() {
  return (
    <section id="visitors" className="border-t border-line px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-medium text-ink">
            What your visitors see
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-soft">
            Scan the QR code and the form opens on their phone, with no app and no
            account. Here are the three forms, using a sample listing.
          </p>
        </div>

        <div className="mt-12 grid gap-12 sm:grid-cols-3 sm:gap-6">
          <Phone
            title="Provide feedback"
            caption="Feedback: interest level, star ratings and contact details"
          >
            <p className="font-medium text-ink">How interested are you?</p>
            <div className="space-y-1">
              <Choice label="Considering" />
              <Choice label="Very interested" selected />
              <Choice label="Ready to make an offer" />
            </div>
            <div className="space-y-1.5 rounded border border-line p-2">
              <Stars label="Price" filled={4} />
              <Stars label="Condition" filled={5} />
              <Stars label="Location" filled={5} />
            </div>
            <Check label="I'm pre-approved for finance" checked />
            <FieldMock label="Name" />
          </Phone>

          <Phone
            title="Submit an offer"
            caption="Offers: amount, finance and settlement, ranked for your seller"
          >
            <FieldMock label="Name" />
            <FieldMock label="Email" />
            <FieldMock label="Offer amount" value="$ 1,250,000" />
            <div>
              <p className="mb-0.5 font-medium text-ink">Finance</p>
              <div className="rounded border border-line bg-white px-2 py-1.5 text-ink-soft">
                Pre-approved financing
              </div>
            </div>
            <FieldMock label="Preferred settlement term" value="45 days" />
            <Check label="Willing to waive building & pest inspection" />
            <FieldMock label="Notes (optional)" />
          </Phone>

          <Phone
            title="Apply to rent"
            caption="Rental applications: income, references and move-in date"
          >
            <FieldMock label="Name" />
            <FieldMock label="Email" />
            <div className="grid grid-cols-2 gap-2">
              <FieldMock label="Employer" />
              <FieldMock label="Occupation" />
            </div>
            <div>
              <p className="mb-0.5 font-medium text-ink">Household income</p>
              <div className="rounded border border-line bg-white px-2 py-1.5 text-ink-soft">
                $100k–$150k
              </div>
            </div>
            <FieldMock label="Desired move-in date" value="1 Nov 2026" />
            <Check label="Can provide proof of income if asked" checked />
            <FieldMock label="Reference name" />
          </Phone>
        </div>

        <p className="mt-10 text-center text-xs text-ink-soft">
          Sample forms for illustration. The live forms are protected by a CAPTCHA.
        </p>
      </div>
    </section>
  );
}
