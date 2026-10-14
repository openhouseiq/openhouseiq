import { ImageResponse } from "next/og";
import { getPublicListing } from "@/lib/publicListing";
import { getAgentPhotoUrl } from "@/lib/agent-photo";
import { LogoMarkImage } from "@/components/LogoMarkImage";

export const alt = "Open Home Hero listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getPublicListing(id);

  const agentPhotoUrl = listing ? await getAgentPhotoUrl(listing.agent_id) : null;

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
          padding: 60,
        }}
      >
        {agentPhotoUrl ? (
          <img
            src={agentPhotoUrl}
            alt=""
            width={168}
            height={168}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border: "4px solid #B08D57",
            }}
          />
        ) : null}

        <div
          style={{
            display: "flex",
            marginTop: agentPhotoUrl ? 32 : 0,
            fontSize: 56,
            fontWeight: 600,
            color: "#EFEAE0",
            textAlign: "center",
          }}
        >
          {listing?.address ?? "Open Home Hero"}
        </div>

        {listing?.agent_name ? (
          <div style={{ display: "flex", marginTop: 16, fontSize: 32, color: "#B08D57" }}>
            Hosted by {listing.agent_name}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 48,
            fontSize: 26,
            color: "#EFEAE0",
            opacity: 0.8,
          }}
        >
          <div style={{ display: "flex", marginRight: 14 }}>
            <LogoMarkImage height={34} />
          </div>
          Open Home Hero
        </div>
      </div>
    ),
    { ...size },
  );
}
