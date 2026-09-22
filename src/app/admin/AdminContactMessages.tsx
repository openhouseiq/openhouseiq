"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ContactMessage } from "@/lib/types";

type Agent = { id: string; fullName: string; email: string };

export function AdminContactMessages({
  messages,
  agentRows,
}: {
  messages: ContactMessage[];
  agentRows: Agent[];
}) {
  const [items, setItems] = useState(messages);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function sendReply(messageId: string) {
    const replyText = (drafts[messageId] ?? "").trim();
    if (!replyText) return;

    setSendingId(messageId);
    setErrors((prev) => ({ ...prev, [messageId]: "" }));

    try {
      const res = await fetch("/api/admin/reply-contact-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, replyText }),
      });
      const result = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          [messageId]: result.error ?? "Something went wrong.",
        }));
        return;
      }

      setItems((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, reply_text: replyText, replied_at: new Date().toISOString() }
            : m,
        ),
      );
    } catch {
      setErrors((prev) => ({
        ...prev,
        [messageId]: "Something went wrong. Please try again.",
      }));
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {items.map((m) => {
        const agent = agentRows.find((a) => a.id === m.user_id);
        return (
          <div
            key={m.id}
            className="rounded-md border border-line bg-paper-card p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-ink">
                {agent?.fullName || agent?.email || m.user_id}
              </p>
              <p className="text-xs text-ink-soft">
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
            {agent?.email ? (
              <a
                href={`mailto:${agent.email}?subject=${encodeURIComponent(
                  "Re: your CueProperty message",
                )}`}
                className="text-xs text-brass underline"
              >
                {agent.email}
              </a>
            ) : null}
            <p className="mt-2 text-sm text-ink">{m.message}</p>

            {m.reply_text ? (
              <div className="mt-3 rounded-md bg-brass/5 p-3">
                <p className="text-xs font-medium text-brass">
                  Replied {m.replied_at ? new Date(m.replied_at).toLocaleString() : ""}
                </p>
                <p className="mt-1 text-sm text-ink">{m.reply_text}</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <textarea
                  value={drafts[m.id] ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))
                  }
                  rows={2}
                  placeholder="Write a reply…"
                  className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
                />
                {errors[m.id] ? (
                  <p className="text-sm text-error">{errors[m.id]}</p>
                ) : null}
                <Button
                  variant="secondary"
                  onClick={() => sendReply(m.id)}
                  disabled={sendingId === m.id || !(drafts[m.id] ?? "").trim()}
                >
                  {sendingId === m.id ? "Sending…" : "Send reply"}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
