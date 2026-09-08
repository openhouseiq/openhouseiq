import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

async function uploadAsset(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  kind: "logo" | "photo",
  file: File,
) {
  const path = `${userId}/${kind}-${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage
    .from("agent-assets")
    .upload(path, file);

  if (error) {
    return null;
  }

  return supabase.storage.from("agent-assets").getPublicUrl(path).data.publicUrl;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const userId = String(formData.get("userId") ?? "");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  const fullName = String(formData.get("fullName") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const logo = formData.get("logo");
  const photo = formData.get("photo");

  const supabase = createServiceClient();

  const { data: userData, error: userError } =
    await supabase.auth.admin.getUserById(userId);

  if (userError || !userData.user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const createdRecently =
    Date.now() - new Date(userData.user.created_at).getTime() < 15 * 60 * 1000;

  if (!createdRecently) {
    return NextResponse.json(
      { error: "This can only be used right after signing up." },
      { status: 403 },
    );
  }

  const [logoUrl, photoUrl] = await Promise.all([
    logo instanceof File && logo.size > 0
      ? uploadAsset(supabase, userId, "logo", logo)
      : Promise.resolve(null),
    photo instanceof File && photo.size > 0
      ? uploadAsset(supabase, userId, "photo", photo)
      : Promise.resolve(null),
  ]);

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      full_name: fullName,
      phone,
      ...(logoUrl ? { logo_url: logoUrl } : {}),
      ...(photoUrl ? { photo_url: photoUrl } : {}),
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
