"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function ContactSection({ userId }: { userId: string }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from("contact_messages")
      .insert({ user_id: userId, message: message.trim() });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setMessage("");
    setSent(true);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        Need help with something the assistant couldn&apos;t answer — a bug,
        a billing question, anything? Send us a message directly.
      </p>

      {sent ? (
        <p className="text-sm text-ink">
          Thanks — we&apos;ve got your message and will get back to you.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setSent(false);
          }}
          rows={4}
          required
          placeholder="How can we help?"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
        />

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <Button type="submit" variant="secondary" disabled={loading || !message.trim()}>
          {loading ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
}
