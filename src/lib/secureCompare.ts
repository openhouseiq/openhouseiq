import { timingSafeEqual } from "node:crypto";

/** Compares two secrets without leaking, through timing, how much of them matched. */
export function secureEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** True when the request carries `Authorization: Bearer <secret>`. */
export function hasBearer(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return secureEqual(header, `Bearer ${secret}`);
}
