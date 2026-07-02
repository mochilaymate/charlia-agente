"use client";
import { useLanguage } from "@/lib/i18n";

export default function SettingsPage() {
  const { t, lang } = useLanguage();

  const items = lang === "en"
    ? [
        { title: "Business Info", desc: "Name, description, services, FAQs and brand tone used by AI.", href: "/settings/business-info" },
        { title: "AI Prompts", desc: "Global system prompt, by number, campaign, label or mode.", href: "/settings/prompts" },
        { title: "WhatsApp Templates", desc: "Meta template management for messages outside the 24h window.", href: "/settings/templates" },
        { title: "Knowledge Base", desc: "Documents, FAQs and URLs the AI uses to respond.", href: "/settings/knowledge-base" },
        { title: "Tools / Connectors", desc: "Enable tools: KB search, CRM, scheduling and more.", href: "/settings/tools" },
        { title: "Channels (YCloud)", desc: "WhatsApp Business credentials via YCloud.", href: "/settings/channels" },
        { title: "Team", desc: "Invite agents and managers to the workspace.", href: "/settings/team" },
      ]
    : [
        { title: "Info del negocio", desc: "Nombre, descripción, servicios, FAQs y tono de marca que usa la IA.", href: "/settings/business-info" },
        { title: "Prompts IA", desc: "System prompt global, por número, campaña, etiqueta o modo.", href: "/settings/prompts" },
        { title: "Plantillas WhatsApp", desc: "Gestión de plantillas Meta para mensajes fuera de la ventana de 24h.", href: "/settings/templates" },
        { title: "Base de conocimiento", desc: "Documentos, FAQs y URLs que usa la IA para responder.", href: "/settings/knowledge-base" },
        { title: "Tools / Conectores", desc: "Activa herramientas: búsqueda en KB, CRM, agendamiento y más.", href: "/settings/tools" },
        { title: "Canales (YCloud)", desc: "Credenciales de WhatsApp Business via YCloud.", href: "/settings/channels" },
        { title: "Equipo", desc: "Invitá agentes y managers al workspace.", href: "/settings/team" },
      ];

  return (
    <div className="p-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{t.settings.title}</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          {lang === "en"
            ? "Manage all Charlia workspace settings from the side menu."
            : "Gestioná todos los ajustes de tu workspace de Charlia desde el menú lateral."}
        </p>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <a key={item.href} href={item.href}
            className="block p-4 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.title}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
