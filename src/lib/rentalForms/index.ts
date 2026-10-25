import type { RentalFormDefinition, RentalState } from "./types";
import { qldForm } from "./qld";
import { vicForm } from "./vic";

export type { RentalFormDefinition, RentalState } from "./types";

export const RENTAL_FORMS: Record<RentalState, RentalFormDefinition> = {
  QLD: qldForm,
  VIC: vicForm,
};

export const RENTAL_STATES = Object.values(RENTAL_FORMS).map((f) => ({
  value: f.state,
  label: f.stateName,
}));

/** A state may collect rental applications only if its form has been built. */
export function getRentalForm(state: string | null | undefined): RentalFormDefinition | null {
  return state && state in RENTAL_FORMS ? RENTAL_FORMS[state as RentalState] : null;
}
