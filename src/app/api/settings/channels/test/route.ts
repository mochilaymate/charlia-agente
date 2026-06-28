import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ycloud_api_key, phone_number } = await req.json();
  if (!ycloud_api_key || !phone_number) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  try {
    // Test by listing WhatsApp phone numbers registered on the account
    const res = await fetch("https://api.ycloud.com/v2/whatsapp/phoneNumbers?pageSize=5", {
      headers: { "X-API-Key": ycloud_api_key },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { message: `✗ YCloud error ${res.status}: ${errorText.slice(0, 150)}` },
        { status: 400 }
      );
    }

    const data = await res.json();
    const numbers = (data.items ?? []) as Array<{ phoneNumber: string; displayName?: string }>;
    const match = numbers.find(n => n.phoneNumber === phone_number);

    if (numbers.length === 0) {
      return NextResponse.json({ message: "✓ API Key válida pero sin números registrados en YCloud" });
    }

    return NextResponse.json({
      message: match
        ? `✓ Conectado. Número ${phone_number} verificado en tu cuenta YCloud`
        : `✓ API Key válida. Números disponibles: ${numbers.map(n => n.phoneNumber).join(", ")}`,
    });
  } catch (err) {
    return NextResponse.json(
      { message: `✗ Error de red: ${err instanceof Error ? err.message : "Desconocido"}` },
      { status: 500 }
    );
  }
}
