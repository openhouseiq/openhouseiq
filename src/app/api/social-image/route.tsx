import { createHmac, timingSafeEqual } from "node:crypto";
import { ImageResponse } from "next/og";

// Branded square graphics for social posts. URLs are signed with
// CONTENT_QUEUE_PUBLISH_SECRET so only the content task can mint them —
// otherwise anyone could render arbitrary text under the CueProperty brand.

const SIZE = 1080;

const THEMES = {
  navy: { bg: "#1B2430", text: "#EFEAE0", soft: "#C7C2B4", accent: "#B08D57" },
  paper: { bg: "#EFEAE0", text: "#1B2430", soft: "#5B6472", accent: "#8C6D3F" },
  brass: { bg: "#B08D57", text: "#1B2430", soft: "#2E3644", accent: "#EFEAE0" },
} as const;

type Theme = keyof typeof THEMES;

function canonical(params: URLSearchParams): string {
  return [...params.entries()]
    .filter(([key]) => key !== "sig")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function isSigned(params: URLSearchParams): boolean {
  const secret = process.env.CONTENT_QUEUE_PUBLISH_SECRET;
  const sig = params.get("sig");
  if (!secret || !sig) return false;
  const expected = createHmac("sha256", secret)
    .update(canonical(params))
    .digest("hex")
    .slice(0, 32);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function headlineSize(text: string): number {
  if (text.length <= 40) return 88;
  if (text.length <= 70) return 72;
  if (text.length <= 100) return 60;
  return 50;
}

function Wordmark({ theme }: { theme: Theme }) {
  const t = THEMES[theme];
  return (
    <div style={{ display: "flex", fontSize: 40, fontWeight: 600 }}>
      <span style={{ color: t.accent }}>C</span>
      <span style={{ color: t.text }}>ue</span>
      <span style={{ color: t.accent }}>P</span>
      <span style={{ color: t.text }}>roperty</span>
    </div>
  );
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (!isSigned(params)) {
    return new Response("Invalid signature.", { status: 403 });
  }

  const headline = (params.get("headline") ?? "").slice(0, 140);
  const kicker = (params.get("kicker") ?? "").slice(0, 40);
  const sub = (params.get("sub") ?? "").slice(0, 160);
  const stat = (params.get("stat") ?? "").slice(0, 12);
  const themeParam = params.get("theme") ?? "navy";
  const theme: Theme = themeParam in THEMES ? (themeParam as Theme) : "navy";
  const t = THEMES[theme];

  if (!headline) {
    return new Response("Missing headline.", { status: 400 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: t.bg,
          padding: 90,
        }}
      >
        <div style={{ display: "flex", width: 120, height: 10, background: t.accent }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {kicker ? (
            <div
              style={{
                display: "flex",
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: t.accent,
                marginBottom: 28,
              }}
            >
              {kicker}
            </div>
          ) : null}
          {stat ? (
            <div
              style={{
                display: "flex",
                fontSize: 220,
                fontWeight: 700,
                lineHeight: 1,
                color: t.accent,
                marginBottom: 24,
              }}
            >
              {stat}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              fontSize: stat ? 56 : headlineSize(headline),
              fontWeight: 700,
              lineHeight: 1.12,
              color: t.text,
            }}
          >
            {headline}
          </div>
          {sub ? (
            <div
              style={{
                display: "flex",
                fontSize: 34,
                lineHeight: 1.35,
                color: t.soft,
                marginTop: 32,
              }}
            >
              {sub}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <Wordmark theme={theme} />
          <div style={{ display: "flex", fontSize: 26, color: t.soft }}>
            cueproperty.com.au
          </div>
        </div>
      </div>
    ),
    {
      width: SIZE,
      height: SIZE,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        // Netlify's cache ignores the query string by default, which would
        // serve one cached image for every headline/signature.
        "Netlify-Vary": "query",
      },
    },
  );
}
