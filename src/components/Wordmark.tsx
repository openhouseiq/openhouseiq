import { BRAND_NAME } from "@/lib/brand";
import { LogoMark } from "@/components/LogoMark";

/**
 * The product logo: the mark followed by the name in two tones. Put it
 * inside an element that sets the font and size; the mark scales with the
 * text. Use tone="light" on dark backgrounds and tone="dark" on light ones.
 */
export function Wordmark({ tone, showMark = true }: { tone: "light" | "dark"; showMark?: boolean }) {
  const base = tone === "light" ? "text-paper" : "text-ink";
  const words = BRAND_NAME.split(" ");
  const first = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];
  return (
    <>
      {showMark ? (
        <LogoMark tone={tone} className="mr-[0.45em] inline-block h-[1.15em] w-auto align-[-0.22em]" />
      ) : null}
      <span className={base}>{first} </span>
      <span className="text-brass">{last}</span>
    </>
  );
}
