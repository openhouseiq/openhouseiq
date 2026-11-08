import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// CRM access tokens are stored encrypted (AES-256-GCM). The key lives only in
// the CRM_TOKEN_KEY environment variable: 32 random bytes, base64 encoded.
// Generate one with:  openssl rand -base64 32

function key(): Buffer {
  const raw = process.env.CRM_TOKEN_KEY;
  if (!raw) throw new Error("CRM_TOKEN_KEY is not set.");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("CRM_TOKEN_KEY must be 32 bytes, base64 encoded.");
  return buf;
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
