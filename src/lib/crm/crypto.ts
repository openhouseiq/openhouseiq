import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

// CRM access tokens are stored encrypted (AES-256-GCM).
//
// The key comes from the CRM_TOKEN_KEY environment variable if one is set
// (32 random bytes, base64: `openssl rand -base64 32`). Otherwise it is derived
// from the site's existing Supabase service-role secret, so no extra Netlify
// setting is needed. Note: if that Supabase secret is ever rotated (or
// CRM_TOKEN_KEY is added later), stored tokens can't be read any more and
// agencies will see "Reconnect" in Settings. Nothing else breaks.

function key(): Buffer {
  const raw = process.env.CRM_TOKEN_KEY;
  if (raw) {
    const buf = Buffer.from(raw, "base64");
    if (buf.length !== 32) throw new Error("CRM_TOKEN_KEY must be 32 bytes, base64 encoded.");
    return buf;
  }
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("No CRM encryption key available.");
  return Buffer.from(hkdfSync("sha256", secret, "open-home-hero", "crm-token-encryption-v1", 32));
}

export function crmEncryptionReady(): boolean {
  try {
    key();
    return true;
  } catch {
    return false;
  }
}

/** Returns "v1.<iv>.<tag>.<ciphertext>", all base64url. */
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv, tag, data].map((p) => (typeof p === "string" ? p : p.toString("base64url"))).join(".");
}

export function decryptToken(stored: string): string {
  const [version, iv, tag, data] = stored.split(".");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unrecognised token format.");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}
