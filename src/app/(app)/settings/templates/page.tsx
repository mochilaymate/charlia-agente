"use client";
import { useEffect, useState } from "react";

interface Template { id?: string; name: string; language: string; content: string; status: string; variables?: string[]; }

const STATUS_COLORS: Record<string, string> = {
  draft: "var(--muted)", submitted: "var(--warning)", approved: "var(--success)",
  rejected: "var(--destructive)", paused: "var(--muted)",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<Template>({ name: "", language: "es", content: "", status: "draft" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/templates").then(r => r.json()).then(setTemplates);
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const vars = (form.content.match(/\{\{(\d+)\}\}/g) ?? []).map(v => v.replace(/\{\{|\}\}/g, ""));
    const res = await fetch("/api/settings/templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, variables: vars }),
    });
    if (res.ok) { setTemplates(await fetch("/api/settings/templates").then(r => r.json())); setShowNew(false); }
    setSaving(false);
  }

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Plantillas WhatsApp</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Solo se pueden enviar plantillas APPROVED fuera de la ventana de 24h.
          </p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 text-sm rounded-lg font-medium"
          style={{ background: "var(--primary)", color: "white" }}>+ Nueva</button>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form onSubmit={create} className="w-full max-w-lg p-6 rounded-2xl space-y-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Nueva plantilla</h2>
            {[{ key: "name", label: "Nombre (snake_case)" }, { key: "language", label: "Idioma (es, en, pt)" }].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs" style={{ color: "var(--muted)" }}>{label}</label>
                <input required value={(form as unknown as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>Contenido (usá {"{{1}}"}, {"{{2}}"} para variables)</label>
              <textarea rows={5} required value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Hola {{1}}, tu cita está confirmada para el {{2}}."
                className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
                style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowNew(false)}
                className="px-4 py-2 text-sm rounded-lg" style={{ background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-60"
                style={{ background: "var(--primary)", color: "white" }}>
                {saving ? "Guardando…" : "Crear borrador"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {templates.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>No hay plantillas todavía</p>
        ) : templates.map((t) => (
          <div key={t.id} className="p-4 rounded-xl" style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm" style={{ color: "var(--foreground)" }}>{t.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface)", color: STATUS_COLORS[t.status] }}>
                  {t.status}
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{t.language}</span>
              </div>
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{t.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
