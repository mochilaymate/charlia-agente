"use client";
import { useEffect, useState } from "react";

interface Tool { id?: string; tool_type: string; enabled: boolean; config?: Record<string, string>; }

const TOOL_DESCRIPTIONS: Record<string, { label: string; desc: string }> = {
  kb_search: { label: "Búsqueda en KB", desc: "La IA busca en la base de conocimiento antes de responder." },
  contact_crud: { label: "Gestión de contactos", desc: "La IA puede crear y actualizar contactos en el CRM." },
  scheduling: { label: "Agendamiento", desc: "La IA puede consultar disponibilidad y agendar citas." },
  tagging: { label: "Etiquetado", desc: "La IA puede agregar/quitar etiquetas a contactos." },
  handoff: { label: "Handoff a humano", desc: "La IA puede escalar conversaciones a un agente humano." },
  db_query: { label: "Consulta DB (vista)", desc: "La IA puede consultar vistas de datos predefinidas." },
  custom_webhook: { label: "Webhook personalizado", desc: "La IA puede llamar webhooks externos configurados." },
};

export default function ToolsPage() {
  const [tools, setTools] = useState<Tool[]>([]);

  useEffect(() => {
    fetch("/api/settings/tools").then(r => r.json()).then(d => {
      const toolTypes = Object.keys(TOOL_DESCRIPTIONS);
      const existing = d as Tool[];
      const merged = toolTypes.map(type => existing.find(t => t.tool_type === type) ?? { tool_type: type, enabled: false });
      setTools(merged);
    });
  }, []);

  async function toggle(type: string, enabled: boolean) {
    const res = await fetch("/api/settings/tools", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool_type: type, enabled: !enabled }),
    });
    if (res.ok) setTools(t => t.map(x => x.tool_type === type ? { ...x, enabled: !enabled } : x));
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Tools / Conectores</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Activá las herramientas que puede usar la IA.</p>
      </div>
      <div className="space-y-3">
        {tools.map(t => {
          const meta = TOOL_DESCRIPTIONS[t.tool_type] ?? { label: t.tool_type, desc: "" };
          return (
            <div key={t.tool_type} className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{meta.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{meta.desc}</p>
              </div>
              <button onClick={() => toggle(t.tool_type, t.enabled)}
                className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                style={{ background: t.enabled ? "var(--primary)" : "var(--border)" }}>
                <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ transform: t.enabled ? "translateX(20px)" : "translateX(0)" }} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
