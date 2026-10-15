import { Wordmark } from "@/components/Wordmark";
import { OFFERS, OfferCard } from "@/components/landing/DashboardMockup";
import { Check, Choice, Stars } from "@/components/landing/PhoneMockups";

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
          <div className="h-[400px] px-3 pb-6 pt-2">
            <p className="mb-2 text-center font-serif text-sm tracking-tight">
              <Wordmark tone="dark" />
            </p>
            <div className="rounded-md border border-line bg-paper-card p-2.5">
              <p className="text-center text-[10px] text-ink-soft">Open home at</p>
              <p className="text-center font-serif text-sm font-medium text-ink">
                24 Grandview Terrace
              </p>
              <h3 className="mb-2 mt-2 text-center text-xs font-semibold text-ink">
                Provide feedback
              </h3>
              <div className="space-y-2 text-[11px]">
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
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-paper to-transparent" />
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
