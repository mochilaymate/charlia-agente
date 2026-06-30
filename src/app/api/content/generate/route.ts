import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

const POSTING_TIMES: Record<string, Record<string, string[]>> = {
  instagram: {
    wellness: ["Lun 6-8am", "Mié 12pm", "Vie 5-7pm"],
    "real estate": ["Mar 9-11am", "Jue 6-8pm", "Sáb 10am"],
    restaurant: ["Mar-Jue 11am", "Vie-Sáb 5-7pm", "Dom 12pm"],
    fitness: ["Lun-Mié 6-8am", "Vie 5pm", "Sáb 8am"],
    coaching: ["Lun 9am", "Mié 12pm", "Jue 6pm"],
    default: ["Lun-Jue 9am-11am", "Mar-Jue 7-9pm", "Sáb 10am-12pm"],
  },
  linkedin: {
    coaching: ["Mar 8-10am", "Mié 12pm", "Jue 9-11am"],
    "real estate": ["Lun 7-9am", "Mié 10am", "Jue 6pm"],
    default: ["Mar-Jue 7-8am", "Mar-Jue 12pm", "Mar-Jue 5-6pm"],
  },
  tiktok: {
    fitness: ["6-10am", "7-11pm"],
    wellness: ["7-9am", "3-5pm", "8-10pm"],
    restaurant: ["11am-1pm", "5-7pm"],
    default: ["6-10am", "7-11pm"],
  },
  facebook: {
    default: ["Mié 1-4pm", "Jue-Vie 12-3pm", "Sáb 12-1pm"],
  },
  twitter: {
    default: ["Lun-Vie 8am", "Lun-Vie 12pm", "Vie 3pm"],
  },
};

function getPostingTimes(platform: string, niche: string): string[] {
  const p = POSTING_TIMES[platform.toLowerCase()] ?? POSTING_TIMES.instagram;
  const nicheKey = Object.keys(p).find(k => niche.toLowerCase().includes(k)) ?? "default";
  return p[nicheKey] ?? p.default ?? [];
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { platform, niche, topic, tone, language = "es", imageBase64 } = body;

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) return NextResponse.json({ error: "No OpenRouter key" }, { status: 500 });

  const today = new Date().toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const systemPrompt = `Sos un experto en marketing digital y creación de contenido para redes sociales. Hoy es ${today}.
Creás contenido auténtico, atractivo y adaptado a cada plataforma. Conocés las tendencias actuales del mercado hispanohablante.
Respondés siempre en JSON válido con el formato exacto solicitado.`;

  const textPrompt = `Creá un post para ${platform} para un negocio de ${niche}.

${imageBase64 ? "IMPORTANTE: Analizá la imagen adjunta y escribí el copy basándote en lo que ves en ella." : ""}
Tema/idea: ${topic || "contenido relevante y trending para el nicho"}
Tono: ${tone}
Idioma: ${language === "es" ? "español" : language}

Devolvé SOLO este JSON (sin markdown, sin explicaciones):
{
  "post": "texto completo del post, adaptado al límite de caracteres de ${platform}, con emojis estratégicos",
  "hashtags": ["hashtag1", "hashtag2"],
  "image_prompt": "descripción en inglés para generar una imagen que acompañe este post (fotorrealista, profesional)",
  "trending_ideas": [
    {"idea": "idea de contenido trending", "why": "por qué funciona ahora"},
    {"idea": "segunda idea", "why": "razón"},
    {"idea": "tercera idea", "why": "razón"}
  ],
  "tips": "un tip específico para maximizar el alcance de este post en ${platform}"
}`;

  // Build message content — use vision if image provided
  const userContent = imageBase64
    ? [
        { type: "text", text: textPrompt },
        { type: "image_url", image_url: { url: imageBase64 } },
      ]
    : textPrompt;

  // Use vision model when image is attached, otherwise text model
  const textModel = process.env.OPENROUTER_DEFAULT_MODEL ?? "meta-llama/llama-3.1-8b-instruct:free";
  const visionModel = "meta-llama/llama-3.2-11b-vision-instruct:free";

  const models = imageBase64
    ? [visionModel, "google/gemma-3-4b-it:free"]
    : [textModel, "mistralai/mistral-7b-instruct:free"];

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://whatsappagente.vercel.app",
        "X-Title": "Charlia Content",
      },
      body: JSON.stringify({
        model: models[0],
        models,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: 1000,
        usage: { include: true },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `OpenRouter: ${res.status} — ${errText}` }, { status: 500 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";

    let parsed: Record<string, unknown> = {};
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? raw);
    } catch {
      parsed = { post: raw, hashtags: [], trending_ideas: [], tips: "", image_prompt: "" };
    }

    return NextResponse.json({
      ...parsed,
      posting_times: getPostingTimes(platform, niche),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
