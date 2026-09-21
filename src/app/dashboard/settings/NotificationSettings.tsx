"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type Status = "checking" | "unsupported" | "off" | "on" | "denied" | "loading";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0))).buffer as ArrayBuffer;
}

export function NotificationSettings({
  userId,
  initialEmailEnabled,
}: {
  userId: string;
  initialEmailEnabled: boolean;
}) {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  async function toggleEmail(next: boolean) {
    setEmailEnabled(next);
    setEmailSaving(true);
    setEmailError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      data: { email_notifications_enabled: next },
    });

    setEmailSaving(false);

    if (updateError) {
      setEmailEnabled(!next);
      setEmailError(updateError.message);
    }
  }

  useEffect(() => {
    async function check() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setStatus("unsupported");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setStatus(subscription ? "on" : "off");
    }
    check();
  }, []);

  async function enable() {
    setError(null);
    setStatus("loading");

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setError("Push notifications aren't set up yet.");
      setStatus("off");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();

      const supabase = createClient();
      const { error: upsertError } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            agent_id: userId,
            endpoint: json.endpoint,
            p256dh: json.keys?.p256dh,
            auth: json.keys?.auth,
          },
          { onConflict: "endpoint" },
        );

      if (upsertError) {
        setError(upsertError.message);
        setStatus("off");
        return;
      }

      setStatus("on");
    } catch {
      setError("Couldn't enable notifications. Please try again.");
      setStatus("off");
    }
  }

  async function disable() {
    setError(null);
    setStatus("loading");

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const supabase = createClient();
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscription.endpoint);
        await subscription.unsubscribe();
      }

      setStatus("off");
    } catch {
      setError("Couldn't turn off notifications. Please try again.");
      setStatus("on");
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Email</p>
        <p className="text-sm text-ink-soft">
          Get emailed the moment an offer, applicant, or feedback comes in.
        </p>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={emailEnabled}
            disabled={emailSaving}
            onChange={(e) => toggleEmail(e.target.checked)}
            className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
          />
          Email me on new submissions
        </label>
        {emailError ? <p className="text-sm text-error">{emailError}</p> : null}
      </div>

      <div className="space-y-3 border-t border-line pt-6">
        <p className="text-sm font-medium text-ink">Push</p>

        {status === "checking" ? null : status === "unsupported" ? (
          <p className="text-sm text-ink-soft">
            Push notifications aren&apos;t supported in this browser.
          </p>
        ) : (
          <>
            <p className="text-sm text-ink-soft">
              Get notified on this device the moment an offer, applicant, or
              feedback comes in.
            </p>

            {status !== "on" ? (
              <div className="rounded-md border border-line bg-white p-3 text-sm text-ink-soft">
                <p className="font-medium text-ink">
                  On your phone? Here&apos;s how to set it up:
                </p>
                <div className="mt-2">
                  <p className="font-medium text-ink">iPhone</p>
                  <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                    <li>
                      Open this site in <span className="font-medium">Safari</span>{" "}
                      — not Chrome. iPhone only supports notifications
                      through Safari.
                    </li>
                    <li>
                      Tap the Share icon, then{" "}
                      <span className="font-medium">Add to Home Screen</span>.
                    </li>
                    <li>Open the app from the new icon on your Home Screen.</li>
                    <li>
                      Come back to this page and tap{" "}
                      <span className="font-medium">
                        Enable notifications on this device
                      </span>{" "}
                      below.
                    </li>
                  </ol>
                  <p className="mt-1 text-xs">Requires iOS 16.4 or later.</p>
                </div>
                <div className="mt-3">
                  <p className="font-medium text-ink">Android</p>
                  <p className="mt-1">
                    Open this site in Chrome and tap{" "}
                    <span className="font-medium">
                      Enable notifications on this device
                    </span>{" "}
                    below — no extra setup needed.
                  </p>
                </div>
              </div>
            ) : null}

            {status === "denied" ? (
              <p className="text-sm text-error">
                Notifications are blocked for this site — enable them in
                your browser settings to turn this on.
              </p>
            ) : null}

            {error ? <p className="text-sm text-error">{error}</p> : null}

            {status === "on" ? (
              <Button variant="secondary" onClick={disable}>
                Turn off notifications on this device
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={enable}
                disabled={status === "loading"}
              >
                {status === "loading"
                  ? "Enabling…"
                  : "Enable notifications on this device"}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
