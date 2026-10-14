import {
  LOGO_ASPECT,
  LOGO_COLORS,
  LOGO_H_PATH,
  LOGO_ROOF_PATH,
  LOGO_ROOF_STROKE,
  LOGO_VIEW_BOX,
} from "@/lib/logoMark";

/**
 * The logo mark with an explicit pixel height, for generated images
 * (share cards, social graphics), which can't size by text like the
 * website's LogoMark does.
 */
export function LogoMarkImage({
  height,
  hColor = LOGO_COLORS.paper,
  roofColor = LOGO_COLORS.brass,
}: {
  height: number;
  hColor?: string;
  roofColor?: string;
}) {
  return (
    <svg width={Math.round(height * LOGO_ASPECT)} height={height} viewBox={LOGO_VIEW_BOX}>
      <path d={LOGO_H_PATH} fill={hColor} />
      <path
        d={LOGO_ROOF_PATH}
        fill="none"
        stroke={roofColor}
        strokeWidth={LOGO_ROOF_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
