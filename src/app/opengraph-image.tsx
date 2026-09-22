import { ImageResponse } from "next/og";

export const alt = "CueProperty";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B2430",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 600 }}>
          <span style={{ color: "#EFEAE0" }}>OpenHouse</span>
          <span style={{ color: "#B08D57" }}>IQ</span>
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 32, color: "#EFEAE0" }}>
          Open house feedback, offers, and listings for real estate agents
        </div>
      </div>
    ),
    { ...size },
  );
}
