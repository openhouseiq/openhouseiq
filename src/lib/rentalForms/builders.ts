import type { FormField, FieldType } from "./types";

export const field = (
  id: string,
  label: string,
  type: FieldType = "text",
  extra: Partial<FormField> = {},
): FormField => ({ id, label, type, ...extra });

export const options = (...labels: string[]) =>
  labels.map((label) => ({ value: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label }));

/** Rental history for property n (the official forms ask for two). */
export function historyFields(n: 1 | 2) {
  const p = `history_${n}`;
  const where = n === 1 ? "Current or most recent address" : "Previous address";
  return [
    field(`${p}_address`, where, "text", { required: n === 1 }),
    field(`${p}_postcode`, "Postcode", "text", { half: true }),
    field(`${p}_start`, "Rental period: start", "date", { half: true }),
    field(`${p}_end`, "Rental period: end (leave blank if current)", "date"),
    field(`${p}_manager_name`, "Property manager or owner name", "text"),
    field(`${p}_manager_email`, "Property manager or owner email", "email", { half: true }),
    field(`${p}_manager_phone`, "Property manager or owner phone", "tel", { half: true }),
  ];
}

/** Referee n (the official forms ask for two). */
export function refereeFields(n: 1 | 2) {
  const p = `referee_${n}`;
  return [
    field(`${p}_name`, `Referee ${n}: name`, "text", { required: n === 1 }),
    field(`${p}_phone`, "Phone", "tel", { half: true }),
    field(`${p}_email`, "Email", "email", { half: true }),
    field(`${p}_connection`, "Connection to you", "text"),
  ];
}

/** "I will provide / show" confirmation for a document the agent has requested. */
export function documentAck(id: string, label: string) {
  return field(id, label, "select", {
    options: [
      { value: "provide", label: "I will provide a copy" },
      { value: "show", label: "I will show the original" },
      { value: "discuss", label: "I don't have this: I'll discuss alternatives" },
    ],
  });
}
