import { NextResponse } from "next/server";
import { siteOrigin } from "@/lib/siteUrl";
import { ValidationError, readJsonObject, requiredText } from "@/lib/validate";
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

  let message: string;
  try {
    const body = await readJsonObject(request);
    message = requiredText(body.message, "message", 4000);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: "Please enter a message of up to 4000 characters." },
        { status: 400 },
      );
    }
    throw error;
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_messages").insert({
    user_id: user.id,
    message,
  });

  if (error) {
    console.error("Contact message insert failed:", error.message);
    return NextResponse.json({ error: "Could not send your message. Please try again." }, { status: 500 });
  }

  const agentName = (user.user_metadata?.full_name as string | undefined) ?? "";

  await notifyAdminOfContactMessage({
    agentName,
    agentEmail: user.email ?? "",
    message,
    baseUrl: siteOrigin(request),
  });

  return NextResponse.json({ success: true });
}
