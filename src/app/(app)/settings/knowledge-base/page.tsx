"use client";
import { useEffect, useState } from "react";

interface KbDoc { id: string; title: string; content: string; document_type: string; active: boolean; created_at: string; }

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KbDoc[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", document_type: "snippet" });
  const [saving, setSaving] = useState(false);

  const fetch_ = () => fetch("/api/settings/knowledge-base").then(r => r.json()).then(setDocs);
  useEffect(() => { fetch_(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings/knowledge-base", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowNew(false); setForm({ title: "", content: "", document_type: "snippet" }); fetch_();
    setSaving(false);
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/settings/knowledge-base/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !active }) });
    fetch_();
  }

  const TYPE_COLORS: Record<string, string> = { faq: "#6c4cf6", url: "#3b82f6", snippet: "#22c55e", upload: "#f59e0b" };

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Base de conocimiento</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>La IA busca aquí antes de responder.</p>
        </div>
        <button onClick={() => setShowNew(true)} className="px-4 py-2 text-sm rounded-lg font-medium" style={{ background: "var(--primary)", color: "white" }}>+ Agregar</button>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form onSubmit={create} className="w-full max-w-lg p-6 rounded-2xl space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Nuevo documento</h2>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>Tipo</label>
              <select value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                {["faq", "url", "snippet", "upload"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>Título</label>
              <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            </div>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>Contenido</label>
              <textarea required rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
                style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-sm rounded-lg" style={{ background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-60" style={{ background: "var(--primary)", color: "white" }}>
                {saving ? "Guardando…" : "Agregar"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {docs.length === 0 ? <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>Sin documentos todavía</p>
          : docs.map(d => (
            <div key={d.id} className="p-4 rounded-xl flex items-start justify-between gap-4"
              style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)", opacity: d.active ? 1 : 0.5 }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: TYPE_COLORS[d.document_type] ?? "var(--muted)" }}>{d.document_type}</span>
                  <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{d.title}</span>
                </div>
                <p className="text-xs line-clamp-2" style={{ color: "var(--muted)" }}>{d.content}</p>
              </div>
              <button onClick={() => toggleActive(d.id, d.active)} className="text-xs px-2 py-1 rounded shrink-0"
                style={{ background: d.active ? "var(--success)20" : "var(--surface)", color: d.active ? "var(--success)" : "var(--muted)", border: "1px solid var(--border)" }}>
                {d.active ? "Activo" : "Inactivo"}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
