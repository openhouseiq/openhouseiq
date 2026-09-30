import { NextResponse } from "next/server";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CONTENT_QUEUE_PUBLISH_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;
  if (!accessToken || !pageId) {
    return NextResponse.json(
      { error: "Facebook publishing is not configured." },
      { status: 500 },
    );
  }

  const body = await request.json();
  const message = String(body.message ?? "");
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : null;

  if (!message) {
    return NextResponse.json({ error: "Missing message." }, { status: 400 });
  }

  const endpoint = imageUrl
    ? `https://graph.facebook.com/v21.0/${pageId}/photos`
    : `https://graph.facebook.com/v21.0/${pageId}/feed`;

  const params = new URLSearchParams({ access_token: accessToken });
  if (imageUrl) {
    params.set("url", imageUrl);
    params.set("caption", message);
  } else {
    params.set("message", message);
  }

  const fbResponse = await fetch(endpoint, { method: "POST", body: params });
  const fbData = await fbResponse.json();

  if (!fbResponse.ok) {
    return NextResponse.json(
      { error: fbData.error?.message ?? "Facebook API error." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    postId: fbData.post_id ?? fbData.id,
  });
}
