import { NextResponse } from "next/server";
import { siteOrigin } from "@/lib/siteUrl";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { notifyAgentOfContactReply } from "@/lib/notify";

export async function POST(request: Request) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json();
  const messageId = String(body.messageId ?? "");
  const replyText = String(body.replyText ?? "").trim();

  if (!messageId || !replyText) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: contactMessage, error: updateError } = await service
    .from("contact_messages")
    .update({ reply_text: replyText, replied_at: new Date().toISOString() })
    .eq("id", messageId)
    .select("user_id")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  if (!contactMessage) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  const { data: agentData } = await service.auth.admin.getUserById(
    contactMessage.user_id,
  );


  await notifyAgentOfContactReply({
    agentId: contactMessage.user_id,
    agentEmail: agentData.user?.email ?? null,
    baseUrl: siteOrigin(request),
  });

  return NextResponse.json({ success: true });
}
