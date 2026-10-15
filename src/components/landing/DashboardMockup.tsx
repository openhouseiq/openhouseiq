// A static preview of the agent's offers screen, using made-up sample data. It
// mirrors the real report in src/app/dashboard/listings/[id]/FeedbackOffersReport.tsx
// so prospective agents can see how offers arrive ranked. Nothing here is live.

export const OFFERS = [
  {
    name: "Alex T.",
    amount: "$1,285,000",
    detail: "Pre-approved financing · 45 days · Waives inspection",
    match: "94% match",
    top: true,
  },
  {
    name: "Sam K.",
    amount: "$1,260,000",
    detail: "Cash buyer · 30 days · Subject to inspection",
    match: "81% match",
    top: false,
  },
  {
    name: "Jordan P.",
    amount: "$1,300,000",
    detail: "Financing (not yet approved) · 90+ days",
    match: "Missing: finance approval",
    top: false,
    warn: true,
  },
];

export type SampleOffer = (typeof OFFERS)[number];

export function OfferCard({ offer }: { offer: SampleOffer }) {
  return (
    <div className="rounded-md border border-line bg-paper-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{offer.name}</p>
          {offer.top ? (
            <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-medium text-ink">
              New
            </span>
          ) : null}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            "warn" in offer && offer.warn ? "bg-error/10 text-error" : "bg-brass text-ink"
          }`}
        >
          {offer.match}
        </span>
      </div>
      <p className="mt-1 font-serif text-lg text-ink">{offer.amount}</p>
      <p className="mt-0.5 text-xs text-ink-soft">{offer.detail}</p>
    </div>
  );
}

export function DashboardMockup() {
  return (
    <section className="border-t border-line bg-paper-card px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-medium text-ink">
            What you see
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-soft">
            Every offer lands in your dashboard the moment it&apos;s submitted,
            ranked against what your seller actually cares about, so the right
            call is the first one you make.
          </p>
        </div>

        <figure className="mx-auto mt-12 max-w-2xl">
          <div className="overflow-hidden rounded-lg border border-line bg-paper shadow-lg">
            <div className="flex items-center gap-1.5 border-b border-line bg-navy px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-navy-soft/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-navy-soft/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-navy-soft/40" />
              <span className="ml-3 text-xs text-navy-soft">
                24 Grandview Terrace, Bellview NSW
              </span>
            </div>

            <div aria-hidden="true" className="select-none p-5 text-left">
              <div className="flex items-baseline justify-between">
                <h3 className="font-serif text-xl font-medium text-ink">Offers (3)</h3>
                <span className="text-xs text-ink-soft">Export CSV</span>
              </div>
              <p className="mt-1 text-xs text-ink-soft">
                Ranked by match to the seller&apos;s preferences.
              </p>

              <div className="mt-4 space-y-3">
                {OFFERS.map((offer) => (
                  <OfferCard key={offer.name} offer={offer} />
                ))}
              </div>
            </div>
          </div>
          <figcaption className="mt-4 text-center text-xs text-ink-soft">
            Sample data for illustration.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
