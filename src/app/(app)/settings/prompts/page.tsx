"use client";
import { useEffect, useState } from "react";

interface Prompt { id?: string; scope: string; system_prompt: string; status: string; version_number?: number; }

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [active, setActive] = useState<Prompt | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/prompts").then(r => r.json()).then(d => {
      setPrompts(d);
      if (d.length > 0) setActive(d[0]);
      else setActive({ scope: "global", system_prompt: "", status: "draft" });
    });
  }, []);

  async function save() {
    if (!active) return;
    setSaving(true);
    const method = active.id ? "PUT" : "POST";
    const url = active.id ? `/api/settings/prompts/${active.id}` : "/api/settings/prompts";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(active) });
    if (res.ok) { const d = await res.json(); setActive(d); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  }

  const SCOPES = ["global", "by_number", "by_campaign", "by_label", "by_mode"];

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Prompts IA</h1>
        <div className="flex gap-2">
          <button onClick={() => setActive({ scope: "global", system_prompt: "", status: "draft" })}
            className="px-3 py-1.5 text-sm rounded-lg" style={{ background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>
            + Nuevo
          </button>
          <button onClick={save} disabled={saving || !active}
            className="px-4 py-1.5 text-sm rounded-lg font-medium disabled:opacity-60"
            style={{ background: saved ? "var(--success)" : "var(--primary)", color: "white" }}>
            {saving ? "Guardando…" : saved ? "Guardado ✓" : "Guardar"}
          </button>
        </div>
      </div>

      {prompts.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {prompts.map((p, i) => (
            <button key={p.id ?? i} onClick={() => setActive(p)}
              className="px-3 py-1 text-xs rounded-full transition-all"
              style={active?.id === p.id
                ? { background: "var(--primary)", color: "white" }
                : { background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              {p.scope}{p.status === "published" ? " ✓" : " (borrador)"}
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>Scope</label>
              <select value={active.scope} onChange={e => setActive(a => a ? { ...a, scope: e.target.value } : a)}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>Estado</label>
              <select value={active.status} onChange={e => setActive(a => a ? { ...a, status: e.target.value } : a)}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs" style={{ color: "var(--muted)" }}>
              System Prompt — Variables disponibles: {"{name}"}, {"{phone}"}, {"{stage}"}, {"{source}"}
            </label>
            <textarea rows={16} value={active.system_prompt}
              onChange={e => setActive(a => a ? { ...a, system_prompt: e.target.value } : a)}
              placeholder="Sos un asistente de ventas de [empresa]. Tu objetivo es..."
              className="w-full px-4 py-3 text-sm rounded-xl outline-none resize-none font-mono"
              style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
          </div>
          {active.version_number && (
            <p className="text-xs" style={{ color: "var(--muted)" }}>Versión {active.version_number}</p>
          )}
        </div>
      )}
    </div>
  );
}
