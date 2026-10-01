import { NextResponse } from "next/server";

// Read-only performance stats for posts the Content Queue has published.
// Uses the same shared secret as /api/facebook/publish.

const GRAPH = "https://graph.facebook.com/v21.0";
const MAX_POSTS = 25;
const POST_ID_PATTERN = /^\d+_\d+$/;
// Each metric is fetched on its own so one Meta deprecation or missing
// permission doesn't hide the rest.
const INSIGHT_METRICS = ["post_impressions_unique", "post_clicks"] as const;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CONTENT_QUEUE_PUBLISH_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function graphGet(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  const response = await fetch(`${GRAPH}/${path}?${query}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? "Facebook API error.");
  }
  return data;
}

async function statsFor(postId: string, accessToken: string) {
  const result: Record<string, unknown> = { postId };

  try {
    const post = await graphGet(postId, {
      access_token: accessToken,
      fields:
        "created_time,permalink_url,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0),shares",
    });
    result.permalink = post.permalink_url ?? null;
    result.reactions = post.reactions?.summary?.total_count ?? 0;
    result.comments = post.comments?.summary?.total_count ?? 0;
    result.shares = post.shares?.count ?? 0;
  } catch (error) {
    result.error = (error as Error).message;
    return result;
  }

  const unavailable: string[] = [];
  for (const metric of INSIGHT_METRICS) {
    try {
      const insights = await graphGet(`${postId}/insights`, {
        access_token: accessToken,
        metric,
      });
      const value = insights.data?.[0]?.values?.[0]?.value;
      if (typeof value === "number") {
        result[metric === "post_impressions_unique" ? "reach" : "clicks"] = value;
      } else {
        unavailable.push(metric);
      }
    } catch {
      unavailable.push(metric);
    }
  }
  if (unavailable.length) result.unavailableMetrics = unavailable;

  return result;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: "Facebook is not configured." },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => ({}));

  // Health check: which Page will /api/facebook/publish post to?
  if (body.check === "page") {
    const pageId = process.env.FACEBOOK_PAGE_ID;
    try {
      const [configured, tokenOwner] = await Promise.all([
        pageId ? graphGet(pageId, { access_token: accessToken, fields: "id,name,link" }) : null,
        graphGet("me", { access_token: accessToken, fields: "id,name" }),
      ]);
      return NextResponse.json({ success: true, configured, tokenOwner });
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 502 });
    }
  }

  const postIds: string[] = Array.isArray(body.postIds)
    ? body.postIds.filter(
        (id: unknown): id is string =>
          typeof id === "string" && POST_ID_PATTERN.test(id),
      )
    : [];

  if (!postIds.length) {
    return NextResponse.json({ error: "Missing postIds." }, { status: 400 });
  }
  if (postIds.length > MAX_POSTS) {
    return NextResponse.json(
      { error: `At most ${MAX_POSTS} postIds per request.` },
      { status: 400 },
    );
  }

  const posts = await Promise.all(postIds.map((id) => statsFor(id, accessToken)));
  return NextResponse.json({ success: true, posts });
}
