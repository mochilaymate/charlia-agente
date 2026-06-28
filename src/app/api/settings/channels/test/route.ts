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
    // Test YCloud API connection by getting account info
    const res = await fetch("https://api.ycloud.com/v2/whatsapp/account", {
      headers: { "X-API-Key": ycloud_api_key },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { message: `YCloud error ${res.status}: ${errorText.slice(0, 100)}` },
        { status: res.status }
      );
    }

    const account = await res.json();
    return NextResponse.json({
      message: `✓ Conectado a YCloud. Teléfono registrado: ${account.whatsappPhoneNumberId || phone_number}`,
    });
  } catch (err) {
    return NextResponse.json(
      { message: `Error de red: ${err instanceof Error ? err.message : "Desconocido"}` },
      { status: 500 }
    );
  }
}
