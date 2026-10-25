import type { RentalFormDefinition, RentalState } from "./types";
import { qldForm } from "./qld";
import { vicForm } from "./vic";
import { saForm } from "./sa";
import { waForm } from "./wa";
import { ntForm } from "./nt";
import { nswForm } from "./nsw";

export type { RentalFormDefinition, RentalState } from "./types";

export const RENTAL_FORMS: Record<RentalState, RentalFormDefinition> = {
  QLD: qldForm,
  VIC: vicForm,
  SA: saForm,
  WA: waForm,
  NT: ntForm,
  NSW: nswForm,
};

/** States researched but not built: no verified rules yet, so applications stay off. */
export const UNBUILT_STATES = [
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "TAS", label: "Tasmania" },
] as const;

export const RENTAL_STATES = Object.values(RENTAL_FORMS).map((f) => ({
  value: f.state,
  label: f.stateName,
}));

/** A state may collect rental applications only if its form has been built. */
export function getRentalForm(state: string | null | undefined): RentalFormDefinition | null {
  return state && state in RENTAL_FORMS ? RENTAL_FORMS[state as RentalState] : null;
}
