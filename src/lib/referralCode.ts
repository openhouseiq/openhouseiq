// Safe to use in the browser: no secrets here.

/** Referral codes are 6–12 capital letters and digits. */
export function isValidReferralCode(code: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(code);
}
