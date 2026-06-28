import crypto from "crypto";

const BASE_URL = "https://api.ycloud.com/v2";

function headers(apiKey: string) {
  return { "X-API-Key": apiKey, "Content-Type": "application/json" };
}

export function verifyYCloudSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const parts = signatureHeader.split(",");
  const tPart = parts.find(p => p.startsWith("t="));
  const sPart = parts.find(p => p.startsWith("s="));
  if (!tPart || !sPart) return false;
  const t = tPart.slice(2);
  const s = sPart.slice(2);
  const mac = crypto.createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  // Constant-time compare (guard for unequal length)
  const a = Buffer.from(mac);
  const b = Buffer.from(s);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function sendText(apiKey: string, from: string, to: string, text: string) {
  const res = await fetch(`${BASE_URL}/whatsapp/messages`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ from, to, type: "text", text: { body: text } }),
  });
  if (!res.ok) throw new Error(`YCloud sendText ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function sendTemplate(
  apiKey: string, from: string, to: string,
  templateName: string, language: string, variables: string[]
) {
  const components = variables.length > 0
    ? [{ type: "body", parameters: variables.map(v => ({ type: "text", text: v })) }]
    : [];
  const res = await fetch(`${BASE_URL}/whatsapp/messages`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({
      from, to, type: "template",
      template: { name: templateName, language: { code: language }, components },
    }),
  });
  if (!res.ok) throw new Error(`YCloud sendTemplate ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function sendMedia(
  apiKey: string, from: string, to: string,
  type: "image" | "audio" | "document" | "video",
  link: string, caption?: string, filename?: string
) {
  const mediaObj: Record<string, string> = { link };
  if (caption) mediaObj.caption = caption;
  if (filename) mediaObj.filename = filename;
  const res = await fetch(`${BASE_URL}/whatsapp/messages`, {
    method: "POST",
    headers: headers(apiKey),
    body: JSON.stringify({ from, to, type, [type]: mediaObj }),
  });
  if (!res.ok) throw new Error(`YCloud sendMedia ${res.status}: ${await res.text()}`);
  return res.json();
}

export function parseInboundWebhook(payload: Record<string, unknown>) {
  const type = payload.type as string;
  if (type !== "whatsapp.inbound_message.received") return null;
  // YCloud v2 wraps inbound messages in `whatsappInboundMessage`
  const msg = (payload.whatsappInboundMessage ?? payload.data ?? payload) as Record<string, unknown>;
  return {
    wamid: (msg.wamid ?? msg.id) as string,
    from: msg.from as string,
    to: msg.to as string,
    timestamp: new Date((msg.sendTime ?? msg.createTime ?? msg.timestamp) as string),
    type: (msg.type as string) ?? "text",
    text: (msg.text as Record<string, string> | undefined)?.body,
    mediaLink: (msg.image ?? msg.audio ?? msg.video ?? msg.document ?? msg.sticker) as Record<string, string> | undefined,
  };
}

export function parseStatusWebhook(payload: Record<string, unknown>) {
  const type = payload.type as string;
  if (type !== "whatsapp.message.updated") return null;
  // YCloud v2 wraps in `whatsappMessage`
  const msg = (payload.whatsappMessage ?? payload.data) as Record<string, unknown>;
  return {
    wamid: (msg.wamid ?? msg.id) as string,
    status: msg.status as string,
    to: msg.to as string,
    error: msg.error as Record<string, unknown> | undefined,
  };
}
