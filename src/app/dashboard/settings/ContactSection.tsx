"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ContactMessage } from "@/lib/types";

export function ContactSection({
  initialMessages,
}: {
  initialMessages: ContactMessage[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmed = text.trim();

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }

      setMessages((prev) => [
        {
          id: crypto.randomUUID(),
          user_id: "",
          message: trimmed,
          read_at: null,
          reply_text: null,
          replied_at: null,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setText("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          required
          placeholder="How can we help?"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
        />

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <Button type="submit" variant="secondary" disabled={loading || !text.trim()}>
          {loading ? "Sending…" : "Send message"}
        </Button>
      </form>

      {messages.length > 0 ? (
        <div className="space-y-3 border-t border-line pt-4">
          <p className="text-xs font-medium text-ink-soft">Previous messages</p>
          {messages.map((m) => (
            <div
              key={m.id}
              className="rounded-md border border-line bg-white p-3"
            >
              <p className="text-xs text-ink-soft">
                {new Date(m.created_at).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-ink">{m.message}</p>
              {m.reply_text ? (
                <div className="mt-2 rounded-md bg-pine/5 p-2">
                  <p className="text-xs font-medium text-pine">Reply</p>
                  <p className="mt-0.5 text-sm text-ink">{m.reply_text}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink-soft">Awaiting reply…</p>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
