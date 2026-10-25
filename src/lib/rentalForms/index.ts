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

/**
 * States that may collect applications right now. Defaults to every built
 * state; set RENTAL_STATES_ENABLED (comma separated, for example "QLD,VIC")
 * to switch states off without a deploy of new code.
 */
export function enabledRentalStates(): RentalState[] {
  const raw = process.env.RENTAL_STATES_ENABLED;
  const all = Object.keys(RENTAL_FORMS) as RentalState[];
  if (raw === undefined || raw.trim() === "") return all;
  const wanted = raw.split(",").map((s) => s.trim().toUpperCase());
  return all.filter((s) => wanted.includes(s));
}

export function getEnabledRentalForm(
  state: string | null | undefined,
): RentalFormDefinition | null {
  const form = getRentalForm(state);
  return form && enabledRentalStates().includes(form.state) ? form : null;
}
