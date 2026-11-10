"use client";

import { Field } from "@/components/ui/Field";
import type { useVisitorDetails } from "@/lib/visitorDetails";

/** Name, email and phone with the right phone keyboards and autofill, pre-filled for returning visitors. */
export function VisitorDetailsFields({
  visitor,
  phoneRequired = true,
}: {
  visitor: ReturnType<typeof useVisitorDetails>;
  phoneRequired?: boolean;
}) {
  const { details, remembered, set, forget } = visitor;
  return (
    <div className="space-y-4">
      {remembered ? (
        <p className="rounded-md bg-paper px-3 py-2 text-xs text-ink-soft">
          Welcome back{details.name ? `, ${details.name.split(" ")[0]}` : ""}. We&apos;ve filled in
          your details from last time.{" "}
          <button type="button" onClick={forget} className="underline hover:text-brass">
            Not you?
          </button>
        </p>
      ) : null}
      <Field
        label="Name"
        id="name"
        type="text"
        autoComplete="name"
        autoCapitalize="words"
        enterKeyHint="next"
        value={details.name}
        onChange={(e) => set("name", e.target.value)}
        required
      />
      <Field
        label="Email"
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        value={details.email}
        onChange={(e) => set("email", e.target.value)}
        required
      />
      <Field
        label={phoneRequired ? "Mobile" : "Mobile (optional)"}
        id="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        enterKeyHint="done"
        value={details.phone}
        onChange={(e) => set("phone", e.target.value)}
        required={phoneRequired}
      />
    </div>
  );
}
