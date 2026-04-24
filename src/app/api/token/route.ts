import { NextRequest, NextResponse } from "next/server";

const TOKEN_ENDPOINT = "https://auth.sitecorecloud.io/oauth/token";
const TOKEN_AUDIENCE = "https://api.sitecorecloud.io";

export async function POST(req: NextRequest) {
  let clientId: string;
  let clientSecret: string;

  try {
    const body = await req.json();
    clientId = body.client_id;
    clientSecret = body.client_secret;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "client_id and client_secret are required." }, { status: 400 });
  }

  const formBody = new URLSearchParams({
    grant_type: "client_credentials",
    audience: TOKEN_AUDIENCE,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody.toString(),
  });

  const text = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { error: `Auth server error ${res.status}: ${text}` },
      { status: res.status }
    );
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "Unexpected response from auth server." }, { status: 502 });
  }

  return NextResponse.json(json);
}
