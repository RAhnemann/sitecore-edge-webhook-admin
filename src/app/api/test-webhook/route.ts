import { NextRequest, NextResponse } from "next/server";

const TIMEOUT_MS = 10_000;
const BODY_LIMIT = 4096;

export async function POST(req: NextRequest) {
  let uri: string;
  let method: string;
  let headers: Record<string, string>;
  let body: string | undefined;

  try {
    const payload = await req.json();
    uri = payload.uri;
    method = payload.method;
    headers = payload.headers ?? {};
    body = payload.body;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!uri || !method) {
    return NextResponse.json({ error: "uri and method are required." }, { status: 400 });
  }

  if (!/^https:\/\/.+/.test(uri)) {
    return NextResponse.json({ error: "uri must start with https://" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();

  try {
    const fetchHeaders: Record<string, string> = { ...headers };
    if (method === "POST" && body !== undefined && !fetchHeaders["Content-Type"] && !fetchHeaders["content-type"]) {
      fetchHeaders["Content-Type"] = "application/json";
    }

    const res = await fetch(uri, {
      method,
      headers: fetchHeaders,
      body: method === "POST" && body !== undefined ? body : undefined,
      signal: controller.signal,
    });

    console.log(`Webhook request ${method} to ${uri} completed with status ${res.status} in ${Date.now() - start}ms`);

    const durationMs = Date.now() - start;
    const rawBody = await res.text();

    console.log("Body:", rawBody.slice(0, BODY_LIMIT));
    
    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      durationMs,
      body: rawBody.slice(0, BODY_LIMIT),
    });
  } catch (err) {
    const durationMs = Date.now() - start;
    const message =
      err instanceof Error
        ? err.name === "AbortError"
          ? `Timed out after ${TIMEOUT_MS / 1000}s`
          : err.message
        : "Unknown error";

    return NextResponse.json({
      status: 0,
      statusText: "Network error",
      durationMs,
      body: message,
    });
  } finally {
    clearTimeout(timeout);
  }
}
