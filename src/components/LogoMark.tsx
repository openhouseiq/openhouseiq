import {
  LOGO_ASPECT,
  LOGO_COLORS,
  LOGO_H_PATH,
  LOGO_ROOF_PATH,
  LOGO_ROOF_STROKE,
  LOGO_VIEW_BOX,
} from "@/lib/logoMark";

/**
 * The Open Home Hero mark: an open roof over an H.
 * tone="light" is for dark backgrounds (cream H, brass roof);
 * tone="dark" is for light backgrounds (navy H, deep brass roof).
 */
export function LogoMark({ tone, className }: { tone: "light" | "dark"; className?: string }) {
  const h = tone === "light" ? LOGO_COLORS.paper : LOGO_COLORS.navy;
  const roof = tone === "light" ? LOGO_COLORS.brass : LOGO_COLORS.brassDeep;
  return (
    <svg
      viewBox={LOGO_VIEW_BOX}
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ aspectRatio: String(LOGO_ASPECT) }}
    >
      <path d={LOGO_H_PATH} fill={h} />
      <path
        d={LOGO_ROOF_PATH}
        fill="none"
        stroke={roof}
        strokeWidth={LOGO_ROOF_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
