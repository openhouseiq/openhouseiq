export const HONEYPOT_FIELD_NAME = "ohq_confirm_hp";

export function HoneypotField() {
  return (
    <input
      type="text"
      name={HONEYPOT_FIELD_NAME}
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        width: 1,
        height: 1,
        opacity: 0,
      }}
    />
  );
}
