"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export type CrmProviderView = {
  id: "vaultre" | "rex" | "agentbox" | "boxdice" | "followupboss" | "lofty" | "hubspot" | "pipedrive";
  name: string;
  available: boolean;
  oauth: boolean;
};

export type CrmConnectionView = {
  provider: CrmProviderView["id"];
  status: "active" | "error";
  lastError: string | null;
  lastSentAt: string | null;
} | null;

const NOTICES: Record<string, { text: string; good?: boolean }> = {
  connected: { text: "Connected. New visitors will now go straight into your CRM.", good: true },
  cancelled: { text: "Connection cancelled. Nothing was changed." },
  disconnected: { text: "Disconnected. New visitors won't be sent to a CRM until you connect one." },
  expired: { text: "That took too long. Please click Connect again." },
  "not-allowed": { text: "Only the agency owner can change the CRM connection." },
  unavailable: { text: "That CRM isn't available yet." },
  error: { text: "Something went wrong connecting your CRM. Please try again." },
};

const TOKEN_HELP: Record<string, string> = {
  vaultre:
    "In VaultRE, go to Office Integrations → Third-Party Access, choose Open Home Hero, click Create Token, then copy the token and paste it here.",
  followupboss:
    "In Follow Up Boss, go to Admin → API, click Create API Key, then copy the key and paste it here. (Only the account owner or an admin can do this.)",
  lofty:
    "In Lofty, go to Settings → Integrations → API, create an API key, then copy it and paste it here.",
  hubspot:
    "In HubSpot, go to Development → Keys → Service keys → Create service key. Name it Open Home Hero, click Add new scope and tick crm.objects.contacts.read and crm.objects.contacts.write, then Create. Copy the key and paste it here. (Older HubSpot accounts can use a private app's access token instead.)",
  pipedrive:
    "In Pipedrive, click your profile picture → Personal preferences → API, then copy your personal API token and paste it here.",
};

export function CrmSection({
  providers,
  connection,
  canManage,
  manageNote,
  scopeLabel,
  notice,
}: {
  providers: CrmProviderView[];
  connection: CrmConnectionView;
  canManage: boolean;
  manageNote: string | null;
  scopeLabel: string;
  notice: string | null;
}) {
  const router = useRouter();
  const [pasting, setPasting] = useState<CrmProviderView["id"] | null>(null);
  const [choice, setChoice] = useState<CrmProviderView["id"] | "">("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const banner = notice ? NOTICES[notice] : null;
  const connected = connection ? providers.find((p) => p.id === connection.provider) : null;
  const byName = (a: CrmProviderView, b: CrmProviderView) => a.name.localeCompare(b.name);
  const available = providers.filter((p) => p.available).sort(byName);
  const comingSoon = providers.filter((p) => !p.available).sort(byName);
  const chosen = choice ? (providers.find((p) => p.id === choice) ?? null) : null;

  async function saveToken(provider: CrmProviderView["id"]) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/crm/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, token }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't connect. Please try again.");
      return;
    }
    setPasting(null);
    setChoice("");
    setToken("");
    router.replace("/dashboard/settings?crm=connected#crm");
    router.refresh();
  }

  async function disconnect() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/crm/disconnect", { method: "POST" });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Couldn't disconnect. Please try again.");
      return;
    }
    router.replace("/dashboard/settings?crm=disconnected#crm");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#3b4657]">
        Send every open home visitor straight into your CRM: their name, email and phone, with
        their feedback or offer attached. No extra apps or subscriptions. {scopeLabel}
      </p>

      {banner ? (
        <p
          className={`rounded-md border px-3 py-2 text-sm ${
            banner.good ? "border-brass bg-brass/10 text-ink" : "border-line bg-paper text-ink"
          }`}
        >
          {banner.text}
        </p>
      ) : null}

      {connection && connected ? (
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-sm font-medium text-ink">
            {connection.status === "active" ? "✓ Connected to " : "⚠ Problem with "}
            {connected.name}
          </p>
          {connection.status === "error" ? (
            <p className="mt-1 text-sm text-error">
              {connected.name} stopped accepting our updates. Please reconnect. Visitors are being
              held and will be sent as soon as it&apos;s fixed.
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#3b4657]">
              {connection.lastSentAt
                ? `Last visitor sent ${new Date(connection.lastSentAt).toLocaleString("en-AU", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}.`
                : "Nothing sent yet. The next open home visitor will appear in your CRM."}
            </p>
          )}
          {canManage ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {connection.status === "error" ? (
                connected.oauth ? (
                  <a href={`/api/crm/${connected.id}/start`}>
                    <Button type="button">Reconnect {connected.name}</Button>
                  </a>
                ) : (
                  <Button type="button" onClick={() => setPasting(connected.id)}>
                    Reconnect {connected.name}
                  </Button>
                )
              ) : null}
              <Button type="button" variant="secondary" disabled={busy} onClick={disconnect}>
                Disconnect
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {!connection ? (
        <div className="space-y-3 rounded-md border border-line bg-white p-4">
          <label htmlFor="crm-choice" className="block text-sm font-medium text-ink">
            Which CRM do you use?
          </label>
          <select
            id="crm-choice"
            value={choice}
            onChange={(e) => {
              const id = e.target.value as CrmProviderView["id"] | "";
              setChoice(id);
              setToken("");
              setError(null);
              const p = providers.find((x) => x.id === id);
              setPasting(p && p.available && !p.oauth && canManage ? p.id : null);
            }}
            className="w-full rounded-md border border-line bg-paper-card px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none sm:w-80"
          >
            <option value="">Select your CRM…</option>
            {available.length ? (
              <optgroup label="Available now">
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {comingSoon.length ? (
              <optgroup label="Coming soon">
                {comingSoon.map((p) => (
                  <option key={p.id} value={p.id} disabled>
                    {p.name} (coming soon)
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>

          {chosen && !canManage ? (
            <p className="text-sm text-[#3b4657]">Ask your agency owner to connect {chosen.name}.</p>
          ) : null}
          {chosen && canManage && chosen.oauth ? (
            <a href={`/api/crm/${chosen.id}/start`}>
              <Button type="button">Connect {chosen.name}</Button>
            </a>
          ) : null}
        </div>
      ) : null}

      {pasting ? (
        <div className="rounded-md border border-line bg-white p-4">
          <label htmlFor="crm-token" className="block text-sm font-medium text-ink">
            Paste your {providers.find((p) => p.id === pasting)?.name} key
          </label>
          <p className="mt-1 text-xs text-[#3b4657]">{TOKEN_HELP[pasting]}</p>
          <textarea
            id="crm-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={3}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full rounded-md border border-line px-3 py-2 font-mono text-xs"
          />
          <div className="mt-2 flex gap-2">
            <Button type="button" disabled={busy || token.trim().length < 10} onClick={() => saveToken(pasting)}>
              {busy ? "Checking…" : "Connect"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPasting(null);
                setChoice("");
                setToken("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {manageNote ? <p className="text-xs text-[#3b4657]">{manageNote}</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}

      <p className="text-xs text-[#3b4657]">
        Anonymous feedback isn&apos;t sent, because there are no contact details. You can still
        export everything as a CSV from any listing.
      </p>
    </div>
  );
}
