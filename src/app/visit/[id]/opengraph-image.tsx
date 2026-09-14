import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getAgentPhotoUrl } from "@/lib/agent-photo";
import type { Listing } from "@/lib/types";

export const alt = "OpenHouseIQ listing";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .returns<Listing[]>()
    .maybeSingle();

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
          {listing?.address ?? "OpenHouseIQ"}
        </div>

        {listing?.agent_name ? (
          <div style={{ display: "flex", marginTop: 16, fontSize: 32, color: "#B08D57" }}>
            Hosted by {listing.agent_name}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            marginTop: 48,
            fontSize: 24,
            color: "#EFEAE0",
            opacity: 0.6,
          }}
        >
          OpenHouseIQ
        </div>
      </div>
    ),
    { ...size },
  );
}
