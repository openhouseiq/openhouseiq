// Strict input checks for routes that anyone on the internet can call.
// Every helper either returns a clean value or throws ValidationError, so a
// route can build its whole row inside one try block and answer 400 with a
// generic message. Nothing here echoes raw input or database errors back.

export class ValidationError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function fail(field: string): never {
  throw new ValidationError(`Invalid ${field}`);
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export function uuid(value: unknown, field: string): string {
  return isUuid(value) ? value : fail(field);
}

/** Trimmed text, null when empty. Rejects non-strings and anything over `max` characters. */
export function text(value: unknown, field: string, max: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return fail(field);
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (trimmed.length > max) return fail(field);
  return trimmed;
}

export function requiredText(value: unknown, field: string, max: number): string {
  return text(value, field, max) ?? fail(field);
}

export function email(value: unknown, field = "email"): string {
  const v = requiredText(value, field, 254);
  return EMAIL.test(v) ? v.toLowerCase() : fail(field);
}

export function optionalEmail(value: unknown, field = "email"): string | null {
  return text(value, field, 254) === null ? null : email(value, field);
}

export function bool(value: unknown): boolean {
  return value === true;
}

export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
): T | null {
  if (value === null || value === undefined || value === "") return null;
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fail(field);
}

export function integer(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value)) return fail(field);
  return value >= min && value <= max ? value : fail(field);
}

export function positiveAmount(value: unknown, field: string, max = 1_000_000_000_000): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fail(field);
  return value > 0 && value <= max ? value : fail(field);
}

export function isoDate(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !ISO_DATE.test(value)) return fail(field);
  return Number.isNaN(Date.parse(value)) ? fail(field) : value;
}

/** Reads a JSON object body, or throws ValidationError when it isn't one. */
export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("body");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return fail("body");
  return body as Record<string, unknown>;
}
