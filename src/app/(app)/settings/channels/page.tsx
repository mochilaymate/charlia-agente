"use client";
import { useState, useEffect } from "react";

export default function ChannelsPage() {
  const [form, setForm] = useState({ ycloud_api_key: "", phone_number: "", webhook_secret: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/channels").then(r => r.ok ? r.json() : null).then(d => {
      if (d) setForm({ ycloud_api_key: d.ycloud_api_key ?? "", phone_number: d.phone_number ?? "", webhook_secret: d.webhook_secret ?? "" });
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings/channels", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function testConnection() {
    if (!form.ycloud_api_key || !form.phone_number) {
      setTestResult({ ok: false, message: "Completá API Key y número de WhatsApp antes de probar" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/channels/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ycloud_api_key: form.ycloud_api_key, phone_number: form.phone_number }),
      });
      const data = await res.json();
      setTestResult({ ok: res.ok, message: data.message || (res.ok ? "✓ Conexión exitosa" : "✗ Error de conexión") });
    } catch (err) {
      setTestResult({ ok: false, message: `Error: ${err instanceof Error ? err.message : "Desconocido"}` });
    }
    setTesting(false);
  }

  return (
    <form onSubmit={save} className="p-8 max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Canal WhatsApp (YCloud)</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Credenciales para enviar y recibir mensajes via YCloud.</p>
        </div>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-60"
          style={{ background: saved ? "var(--success)" : "var(--primary)", color: "white" }}>
          {saving ? "Guardando…" : saved ? "Guardado ✓" : "Guardar"}
        </button>
      </div>

      <div className="space-y-4 rounded-xl p-6" style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
        {[
          { key: "ycloud_api_key", label: "YCloud API Key", type: "password", placeholder: "ycloud_..." },
          { key: "phone_number", label: "Número de WhatsApp (E.164)", type: "text", placeholder: "+5491100000000" },
          { key: "webhook_secret", label: "Webhook Secret (para validar firma)", type: "password", placeholder: "tu-secreto-ycloud" },
        ].map(({ key, label, type, placeholder }) => (
          <div key={key} className="space-y-1">
            <label className="block text-xs font-medium" style={{ color: "var(--muted)" }}>{label}</label>
            <input type={type} value={(form as Record<string, string>)[key]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              placeholder={placeholder}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none"
              style={{ background: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-medium" style={{ color: "var(--foreground)" }}>URL del webhook para YCloud</p>
        <code className="text-xs block px-3 py-2 rounded-lg" style={{ background: "var(--surface)", color: "var(--primary)", border: "1px solid var(--border)" }}>
          {typeof window !== "undefined" ? window.location.origin : "https://tu-dominio.com"}/api/webhooks/ycloud
        </code>
        <p className="text-xs" style={{ color: "var(--muted)" }}>Configurá esta URL en el panel de YCloud como webhook de eventos.</p>
      </div>

      <button type="button" onClick={testConnection} disabled={testing}
        className="w-full px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-60"
        style={{ background: "var(--surface-elevated)", color: "var(--primary)", border: "1px solid var(--primary)" }}>
        {testing ? "Probando…" : "🔗 Probar conexión"}
      </button>

      {testResult && (
        <div className="rounded-xl p-4" style={{ background: testResult.ok ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", border: `1px solid ${testResult.ok ? "var(--success)" : "var(--destructive)"}` }}>
          <p className="text-sm" style={{ color: testResult.ok ? "var(--success)" : "var(--destructive)" }}>{testResult.message}</p>
        </div>
      )}
    </form>
  );
}
