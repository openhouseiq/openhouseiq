// How long unsuccessful applicants' information may be kept. These are the
// dates the research found on the official forms. Where a state's form gives
// none (WA, NSW, NT) a conservative default applies until a lawyer confirms.

import type { RentalState } from "./types";

/** Days after the property is leased (or the tenancy starts) that unsuccessful applications are removed. */
export const UNSUCCESSFUL_DAYS_AFTER_LEASED: Record<RentalState, number> = {
  VIC: 30, // CAV form: within 30 days after the property is leased
  SA: 30, // Form A1: 30 days after the successful tenant signs
  QLD: 90, // Form 22: within 3 months of the tenancy commencing
  WA: 30, // not stated on Form 18: conservative default
  NSW: 30, // not stated in the Commissioner's guidance: conservative default
  NT: 30, // sections 18A(4) and 18B not read in full: conservative default
};

/** If the agent never records a leased date, applications are removed after this many days. */
export const MAX_DAYS_WITHOUT_LEASED_DATE = 180;

/** Successful applications may be kept up to this long after the lease is recorded as ended (Victoria: 3 years). */
export const SUCCESSFUL_KEEP_YEARS = 3;

export function retentionCutoffs(now = new Date()) {
  const day = 86_400_000;
  return {
    neverLeasedBefore: new Date(now.getTime() - MAX_DAYS_WITHOUT_LEASED_DATE * day),
    leasedBefore: (state: RentalState) =>
      new Date(now.getTime() - UNSUCCESSFUL_DAYS_AFTER_LEASED[state] * day),
  };
}
