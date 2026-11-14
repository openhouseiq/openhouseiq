// The sample open home shown under the hero: buyer feedback, offers sorted by
// seller match, and visitor interest. All names and figures are sample data.

const FEEDBACK = [
  { name: "Alex T.", stars: 5, tag: "Ready to offer", strong: true },
  { name: "Sam K.", stars: 4, tag: "Very interested", strong: true },
  { name: "Jordan P.", stars: 3, tag: "Considering", strong: false },
  { name: "Priya M.", stars: 4, tag: "Pre-approved", strong: false },
];

const OFFERS = [
  { amount: "$1,285,000", name: "Alex T.", terms: "Pre-approved · 45 days · Waives inspection", match: "94% match", level: "top" },
  { amount: "$1,260,000", name: "Sam K.", terms: "Cash buyer · 30 days · Subject to inspection", match: "81% match", level: "good" },
  { amount: "$1,300,000", name: "Jordan P.", terms: "Financing not yet approved · 90+ days", match: "Missing finance", level: "miss" },
] as const;

const INTEREST = [
  { label: "Considering", height: "45%", color: "bg-[#e3d2b5]" },
  { label: "Very keen", height: "80%", color: "bg-[#c9a978]" },
  { label: "Ready", height: "100%", color: "bg-navy" },
];

function Stars({ count }: { count: number }) {
  return (
    <span className="text-xs tracking-[0.15em] text-ink-soft" aria-label={`${count} out of 5 stars`}>
      {"★".repeat(count)}
      <span className="text-line">{"★".repeat(5 - count)}</span>
    </span>
  );
}

export function HeroPanel() {
  return (
    <div className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-2xl border border-line bg-white text-left shadow-[0_30px_70px_-40px_rgba(27,36,48,0.45)]">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-paper px-5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="h-2 w-2 rounded-full bg-green-600" aria-hidden="true" />
          24 Grandview Terrace · Open home
        </span>
        <span className="text-xs tracking-[0.08em] text-ink-soft">SAMPLE DATA</span>
      </div>
      <div className="grid md:grid-cols-[1fr_1.15fr_0.9fr]">
        <div className="border-b border-line p-5 md:border-b-0 md:border-r">
          <p className="text-xs tracking-[0.08em] text-ink-soft">BUYER FEEDBACK</p>
          <ul className="mt-4 space-y-3">
            {FEEDBACK.map((f) => (
              <li key={f.name} className="flex items-center justify-between gap-2 text-sm text-ink">
                <span>
                  {f.name} <Stars count={f.stars} />
                </span>
                <span
                  className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs ${
                    f.strong ? "bg-brass/15 text-brass-deep" : "bg-paper text-ink-soft"
                  }`}
                >
                  {f.tag}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-green-700">✓ Feedback sent to your CRM</p>
        </div>
        <div className="border-b border-line p-5 md:border-b-0 md:border-r">
          <p className="text-xs tracking-[0.08em] text-ink-soft">OFFERS (3) · SIDE BY SIDE</p>
          <ul className="mt-4 space-y-2.5">
            {OFFERS.map((o) => (
              <li key={o.name} className="flex items-center justify-between gap-3 rounded-lg border border-line p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {o.amount} <span className="font-normal text-ink-soft">{o.name}</span>
                  </p>
                  <p className="text-xs text-ink-soft">{o.terms}</p>
                </div>
                <span
                  className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                    o.level === "top"
                      ? "bg-navy text-paper"
                      : o.level === "good"
                        ? "bg-brass/15 text-brass-deep"
                        : "bg-paper text-ink-soft"
                  }`}
                >
                  {o.match}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-5">
          <p className="text-xs tracking-[0.08em] text-ink-soft">VISITOR INTEREST</p>
          <div className="mt-4 flex h-32 items-end gap-3 border-b border-line">
            {INTEREST.map((bar) => (
              <div key={bar.label} className={`flex-1 rounded-t ${bar.color}`} style={{ height: bar.height }} />
            ))}
          </div>
          <div className="mt-2 flex gap-3">
            {INTEREST.map((bar) => (
              <span key={bar.label} className="flex-1 text-center text-[11px] text-ink-soft">
                {bar.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
