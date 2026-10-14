export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  if (!token || token.length > 4096) return false;

  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return false;

  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}
