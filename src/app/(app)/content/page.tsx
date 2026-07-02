"use client";
import { useState, useRef } from "react";
import { useLanguage } from "@/lib/i18n";

const PLATFORMS_ES = [
  { id: "instagram", label: "Instagram", icon: "📸", limit: "2200 caracteres" },
  { id: "linkedin", label: "LinkedIn", icon: "💼", limit: "3000 caracteres" },
  { id: "tiktok", label: "TikTok", icon: "🎵", limit: "2200 caracteres" },
  { id: "facebook", label: "Facebook", icon: "👥", limit: "63.206 caracteres" },
  { id: "twitter", label: "Twitter/X", icon: "🐦", limit: "280 caracteres" },
];
const PLATFORMS_EN = [
  { id: "instagram", label: "Instagram", icon: "📸", limit: "2,200 characters" },
  { id: "linkedin", label: "LinkedIn", icon: "💼", limit: "3,000 characters" },
  { id: "tiktok", label: "TikTok", icon: "🎵", limit: "2,200 characters" },
  { id: "facebook", label: "Facebook", icon: "👥", limit: "63,206 characters" },
  { id: "twitter", label: "Twitter/X", icon: "🐦", limit: "280 characters" },
];

const NICHES = [
  "Bienestar y salud", "Real estate / Propiedades", "Restaurante / Gastronomía",
  "Fitness y entrenamiento", "Coaching y desarrollo personal", "E-commerce / Tienda online",
  "Servicios profesionales", "Tecnología", "Moda y belleza", "Educación / Cursos",
  "Turismo y viajes", "Finanzas y inversión",
];

interface GeneratedContent {
  post: string;
  hashtags: string[];
  image_prompt: string;
  trending_ideas: Array<{ idea: string; why: string }>;
  tips: string;
  posting_times: string[];
}

export default function ContentPage() {
  const { t, lang } = useLanguage();
  const PLATFORMS = lang === "en" ? PLATFORMS_EN : PLATFORMS_ES;
  const [platform, setPlatform] = useState("instagram");
  const [niche, setNiche] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("Profesional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function generate() {
    if (!niche) { setError(lang === "en" ? "Select your niche" : "Seleccioná tu nicho"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, niche, topic, tone, imageBase64: uploadedImage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error generando contenido");
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function copyPost() {
    if (!result) return;
    const text = `${result.post}\n\n${result.hashtags.map(h => `#${h}`).join(" ")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedPlatform = PLATFORMS.find(p => p.id === platform)!;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel — config */}
      <div className="w-80 shrink-0 flex flex-col overflow-y-auto p-5 space-y-5"
        style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }}>

        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--foreground)" }}>{lang === "en" ? "Create content" : "Crear contenido"}</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{lang === "en" ? "AI generates the post ready to publish" : "IA genera el post listo para publicar"}</p>
        </div>

        {/* Platform */}
        <div className="space-y-2">
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>{t.content.platform}</label>
          <div className="grid grid-cols-1 gap-1.5">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => setPlatform(p.id)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors"
                style={platform === p.id
                  ? { background: "var(--primary)", color: "white" }
                  : { background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                <span>{p.icon}</span>
                <div>
                  <p className="font-medium text-xs">{p.label}</p>
                  <p className={`text-[10px] ${platform === p.id ? "opacity-70" : ""}`} style={platform === p.id ? {} : { color: "var(--muted)" }}>{p.limit}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Niche */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>{t.content.niche}</label>
          <select value={niche} onChange={e => setNiche(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
            <option value="">{t.content.selectNiche}</option>
            {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Topic */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {lang === "en" ? "Topic or idea" : "Tema o idea"} <span style={{ color: "var(--muted)", fontWeight: 400 }}>{lang === "en" ? "(optional)" : "(opcional)"}</span>
          </label>
          <textarea value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="Ej: beneficios del ayuno intermitente, cómo elegir una propiedad, oferta de verano..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
            style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
        </div>

        {/* Tone */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>{t.content.tone}</label>
          <div className="flex flex-wrap gap-1.5">
            {t.content.tonesArray.map(toneOpt => (
              <button key={toneOpt} onClick={() => setTone(toneOpt)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                style={toneOpt === tone
                  ? { background: "var(--primary)", color: "white" }
                  : { background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                {toneOpt}
              </button>
            ))}
          </div>
        </div>

        {/* Image upload */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            {lang === "en" ? "Image" : "Imagen"} <span style={{ fontWeight: 400 }}>{lang === "en" ? "(optional — AI writes copy based on it)" : "(opcional — la IA escribe el copy basándose en ella)"}</span>
          </label>
          {uploadedImage ? (
            <div className="relative rounded-xl overflow-hidden">
              <img src={uploadedImage} alt="Imagen seleccionada" className="w-full max-h-36 object-cover" />
              <button onClick={() => setUploadedImage(null)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--destructive)", color: "white" }}>✕</button>
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] font-medium text-white"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
                {t.content.imageAI}
              </div>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              style={{ background: "var(--surface-elevated)", color: "var(--muted)", border: "2px dashed var(--border)" }}>
              {t.content.uploadFile}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>

        {error && <p className="text-xs" style={{ color: "var(--destructive)" }}>{error}</p>}

        <button onClick={generate} disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--primary)", color: "white" }}>
          {loading ? t.content.generating : uploadedImage ? t.content.generateCopy : t.content.generatePost}
        </button>
      </div>

      {/* Right panel — output */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <div className="text-5xl">✨</div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{t.content.emptyTitle}</p>
            <p className="text-xs text-center max-w-xs" style={{ color: "var(--muted)" }}>{t.content.emptyDesc}</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "var(--muted)" }}>{t.content.creatingFor} {selectedPlatform.label}…</p>
          </div>
        )}

        {result && (
          <div className="max-w-2xl space-y-5">
            {/* Post text */}
            <div className="rounded-2xl p-5 space-y-3"
              style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{selectedPlatform.icon}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{selectedPlatform.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface)", color: "var(--muted)" }}>{tone}</span>
                </div>
                <button onClick={copyPost}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: copied ? "var(--primary)" : "var(--surface)", color: copied ? "white" : "var(--muted)", border: "1px solid var(--border)" }}>
                  {copied ? `✓ ${t.content.copied}` : t.content.copyAll}
                </button>
              </div>
              <textarea
                value={result.post}
                onChange={e => setResult(r => r ? { ...r, post: e.target.value } : r)}
                rows={8}
                className="w-full text-sm rounded-lg px-3 py-2.5 resize-none outline-none"
                style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)", lineHeight: 1.6 }} />
              <div className="flex flex-wrap gap-1.5">
                {result.hashtags.map(h => (
                  <span key={h} className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
                    #{h}
                  </span>
                ))}
              </div>
            </div>

            {/* Image section */}
            <div className="rounded-2xl p-5 space-y-3"
              style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{t.content.image}</p>
              {uploadedImage && (
                <img src={uploadedImage} alt="Imagen del post" className="w-full max-h-64 object-cover rounded-xl" />
              )}
              {result.image_prompt && (
                <div className="rounded-xl p-3" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
                  <p className="text-[10px] font-medium mb-1" style={{ color: "var(--muted)" }}>{t.content.promptLabel}</p>
                  <p className="text-xs italic" style={{ color: "var(--foreground)" }}>{result.image_prompt}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()}
                  className="flex-1 py-2 text-xs rounded-xl font-medium"
                  style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                  📁 {uploadedImage ? t.content.changeImage : t.content.uploadImage2}
                </button>
                <button className="flex-1 py-2 text-xs rounded-xl font-medium opacity-40 cursor-not-allowed"
                  style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                  {t.content.generateAI}
                </button>
              </div>
            </div>

            {/* Posting times */}
            {result.posting_times.length > 0 && (
              <div className="rounded-2xl p-5 space-y-3"
                style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">🕐</span>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{t.content.postingTimes}</p>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{t.content.basedOn} {niche} {t.content.in} {selectedPlatform.label}</p>
                <div className="flex flex-wrap gap-2">
                  {result.posting_times.map((t, i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                      📅 {t}
                    </span>
                  ))}
                </div>
                {result.tips && (
                  <div className="mt-2 p-3 rounded-xl text-xs" style={{ background: "color-mix(in srgb, var(--primary) 8%, transparent)", color: "var(--foreground)", border: "1px solid color-mix(in srgb, var(--primary) 20%, transparent)" }}>
                    💡 {result.tips}
                  </div>
                )}
              </div>
            )}

            {/* Trending ideas */}
            {result.trending_ideas?.length > 0 && (
              <div className="rounded-2xl p-5 space-y-3"
                style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-base">🔥</span>
                  <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{t.content.trendingIdeas}</p>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{lang === "en" ? "AI suggestions for your niche right now" : "Sugerencias de la IA para tu nicho ahora"}</p>
                <div className="space-y-2">
                  {result.trending_ideas.map((item, i) => (
                    <div key={i} className="p-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                      onClick={() => { setTopic(item.idea); }}>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.idea}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.why}</p>
                      <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--primary)" }}>{t.content.useTrend}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regenerate */}
            <button onClick={generate} disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              {t.content.regenerate}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
