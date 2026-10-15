import { Wordmark } from "@/components/Wordmark";
import { OFFERS, OfferCard } from "@/components/landing/DashboardMockup";
import { Check, FieldMock } from "@/components/landing/PhoneMockups";

// The first thing an agent sees: a visitor's phone on one side, the ranked
// offers it produces on the other, and a "new offer" alert tying them together.
// Static and non-interactive, with made-up sample data.
export function HeroShowcase() {
  return (
    <div aria-hidden="true" className="relative mx-auto h-[430px] w-full max-w-[540px] select-none">
      {/* Ranked offers: the payoff */}
      <div className="absolute right-0 top-6 hidden w-[330px] rounded-lg border border-line bg-paper shadow-xl sm:block">
        <div className="rounded-t-lg border-b border-line bg-navy px-4 py-2 text-xs text-navy-soft">
          Offers (3) · ranked by match
        </div>
        <div className="space-y-2.5 p-3">
          {OFFERS.map((offer) => (
            <OfferCard key={offer.name} offer={offer} />
          ))}
        </div>
      </div>

      {/* The visitor's phone: the input */}
      <div className="absolute left-1/2 top-0 w-[225px] -translate-x-1/2 sm:left-0 sm:translate-x-0">
        <div className="relative overflow-hidden rounded-[2.25rem] border-[10px] border-navy bg-paper shadow-2xl">
          <div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-navy/30" />
          <div className="h-[392px] px-3 pb-4 pt-2">
            <p className="mb-2 text-center font-serif text-sm tracking-tight">
              <Wordmark tone="dark" />
            </p>
            <div className="rounded-md border border-line bg-paper-card p-2.5">
              <p className="text-center text-[10px] text-ink-soft">Open home at</p>
              <p className="text-center font-serif text-sm font-medium text-ink">
                24 Grandview Terrace
              </p>
              <h3 className="mb-2 mt-2 text-center text-xs font-semibold text-ink">
                Submit an offer
              </h3>
              <div className="space-y-2 text-[11px]">
                <FieldMock label="Name" value="Alex T." />
                <FieldMock label="Offer amount" value="$ 1,285,000" />
                <div>
                  <p className="mb-0.5 font-medium text-ink">Finance</p>
                  <div className="rounded border border-line bg-white px-2 py-1.5 text-ink">
                    Pre-approved financing
                  </div>
                </div>
                <FieldMock label="Preferred settlement term" value="45 days" />
                <Check label="Willing to waive inspection" checked />
                <div className="rounded-md bg-brass px-3 py-2 text-center text-xs font-medium text-ink">
                  Submit offer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alert tying the two together */}
      <div className="absolute -bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-line bg-white px-4 py-2.5 shadow-xl sm:left-auto sm:right-2 sm:translate-x-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brass opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brass" />
        </span>
        <span className="text-xs text-ink">
          <span className="font-semibold">New offer</span> · $1,285,000 ·{" "}
          <span className="font-semibold text-brass">94% match</span>
        </span>
      </div>
    </div>
  );
}
