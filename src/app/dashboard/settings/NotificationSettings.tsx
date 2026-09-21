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

export function NotificationSettings({ userId }: { userId: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

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

  if (status === "checking") return null;

  if (status === "unsupported") {
    return (
      <p className="text-sm text-ink-soft">
        Push notifications aren&apos;t supported in this browser.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">
        Get notified on this device the moment an offer, applicant, or
        feedback comes in.
      </p>

      {status === "denied" ? (
        <p className="text-sm text-error">
          Notifications are blocked for this site — enable them in your
          browser settings to turn this on.
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
          {status === "loading" ? "Enabling…" : "Enable notifications on this device"}
        </Button>
      )}
    </div>
  );
}
