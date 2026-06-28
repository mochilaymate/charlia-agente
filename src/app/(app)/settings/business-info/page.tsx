"use client";
import { useEffect, useState } from "react";

interface BusinessInfo {
  name?: string; description?: string; brand_tone?: string;
  policies?: string; primary_cta?: string;
  services?: string[]; forbidden_claims?: string[]; allowed_claims?: string[];
}

export default function BusinessInfoPage() {
  const [info, setInfo] = useState<BusinessInfo>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/business-info").then(r => r.ok ? r.json() : null).then(d => { if (d) setInfo(d); setLoading(false); });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings/business-info", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(info) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  const field = (label: string, key: keyof BusinessInfo, multiline = false) => (
    <div className="space-y-1">
      <label className="block text-xs font-medium" style={{ color: "var(--muted)" }}>{label}</label>
      {multiline ? (
        <textarea rows={3} value={(info[key] as string) ?? ""}
          onChange={(e) => setInfo(f => ({ ...f, [key]: e.target.value }))}
          className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
          style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
      ) : (
        <input type="text" value={(info[key] as string) ?? ""}
          onChange={(e) => setInfo(f => ({ ...f, [key]: e.target.value }))}
          className="w-full px-3 py-2 text-sm rounded-lg outline-none"
          style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
      )}
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-48"><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></div>;

  return (
    <form onSubmit={save} className="p-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Info del negocio</h1>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-60"
          style={{ background: saved ? "var(--success)" : "var(--primary)", color: "white" }}>
          {saving ? "Guardando…" : saved ? "Guardado ✓" : "Guardar"}
        </button>
      </div>
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Esta información se inyecta dinámicamente en el contexto de la IA.
      </p>
      <div className="space-y-4">
        {field("Nombre del negocio", "name")}
        {field("Descripción", "description", true)}
        {field("Tono de marca", "brand_tone")}
        {field("CTA principal", "primary_cta")}
        {field("Políticas (devoluciones, garantías, etc.)", "policies", true)}
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-medium" style={{ color: "var(--muted)" }}>Servicios (uno por línea)</label>
        <textarea rows={4}
          value={(info.services ?? []).join("\n")}
          onChange={(e) => setInfo(f => ({ ...f, services: e.target.value.split("\n").filter(Boolean) }))}
          className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
          style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-medium" style={{ color: "var(--muted)" }}>Claims prohibidos (uno por línea)</label>
        <textarea rows={3}
          value={(info.forbidden_claims ?? []).join("\n")}
          onChange={(e) => setInfo(f => ({ ...f, forbidden_claims: e.target.value.split("\n").filter(Boolean) }))}
          className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none"
          style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
      </div>
    </form>
  );
}
