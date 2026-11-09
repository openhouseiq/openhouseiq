@AGENTS.md

# Exact constraints on spend, publish and send actions

When the owner states an explicit value (amount, currency, dates, audience, recipients) and a tool or account cannot match it exactly, stop and ask before acting. Never substitute, convert or approximate silently.

This applies to anything that spends money, publishes publicly, or sends messages: ads and boosts, Stripe charges or prices, emails, posts, and database migrations.

- Before acting, restate the exact requested values and check them against what is about to be submitted.
- If a conversion or approximation is unavoidable (for example AUD to USD), get the owner's confirmation first.
- After acting, read the saved result back from the system, not just the form field, and report it against the original request. Name any mismatch plainly.
- Background: a Meta campaign was published at $7.14 USD/day when the owner had asked for $50 AUD/week. The substitution was only mentioned after publishing. This must not happen again.

# Emails and messages to partners: check every word before and after sending

Emails go to prospective partners (MRI/VaultRE, Rex, Reapit, agencies). A garbled or incomplete email is costly and must not happen again.

- Before clicking Send, read the full body back from the editor (for example the compose iframe's `innerText`) and compare it word for word with the approved text, from greeting to signature. Check the To, Cc and Subject fields too. If anything differs, fix it in the editor and read it back again. Never send on the strength of a screenshot of part of the message.
- When typing into a webmail editor, click directly on the first text line of the message box (not empty space below it), type a short first piece, and confirm it appeared before typing the rest. Rich editors can drop text typed before they have focus.
- Don't patch an editor's content with JavaScript DOM edits. The editor may not pick them up and will send its own copy. Retype the text instead.
- After sending, open the sent copy and read the whole body again. Report any difference to the owner straight away.
- Background: on 8 and 9 Nov 2026, two emails to VaultRE/PropTech went out with their opening lines missing, because the Hostinger Mail editor dropped the first text typed and a JavaScript fix wasn't picked up.
