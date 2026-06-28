import { NextResponse, type NextRequest } from "next/server";

// Temporary debug endpoint — remove after confirming webhooks work
// Accepts ANY POST from YCloud without signature verification
// Shows exactly what YCloud is sending
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });

  console.log("[ycloud-debug] headers:", JSON.stringify(headers));
  console.log("[ycloud-debug] body:", rawBody);

  return NextResponse.json({ received: true, body: JSON.parse(rawBody || "{}") });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "ycloud-debug" });
}
