import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { notifyAdminOfContactMessage } from "@/lib/notify";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const allowed = await checkRateLimit("contact", clientIp(request));
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again shortly." },
      { status: 429 },
    );
  }

  const body = await request.json();
  const message = String(body.message ?? "").trim();

  if (!message) {
    return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_messages").insert({
    user_id: user.id,
    message,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const host = request.headers.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const agentName = (user.user_metadata?.full_name as string | undefined) ?? "";

  await notifyAdminOfContactMessage({
    agentName,
    agentEmail: user.email ?? "",
    message,
    baseUrl: `${protocol}://${host}`,
  });

  return NextResponse.json({ success: true });
}
