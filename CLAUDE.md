@AGENTS.md

# Exact constraints on spend, publish and send actions

When the owner states an explicit value (amount, currency, dates, audience, recipients) and a tool or account cannot match it exactly, stop and ask before acting. Never substitute, convert or approximate silently.

This applies to anything that spends money, publishes publicly, or sends messages: ads and boosts, Stripe charges or prices, emails, posts, and database migrations.

- Before acting, restate the exact requested values and check them against what is about to be submitted.
- If a conversion or approximation is unavoidable (for example AUD to USD), get the owner's confirmation first.
- After acting, read the saved result back from the system, not just the form field, and report it against the original request. Name any mismatch plainly.
- Background: a Meta campaign was published at $7.14 USD/day when the owner had asked for $50 AUD/week. The substitution was only mentioned after publishing. This must not happen again.
