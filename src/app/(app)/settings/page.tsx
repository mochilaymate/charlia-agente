export default function SettingsPage() {
  return (
    <div className="p-8 max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Configuración</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Gestioná todos los ajustes de tu workspace de Charlia desde el menú lateral.
        </p>
      </div>

      <div className="grid gap-3">
        {[
          { title: "Info del negocio", desc: "Nombre, descripción, servicios, FAQs y tono de marca que usa la IA.", href: "/settings/business-info" },
          { title: "Prompts IA", desc: "System prompt global, por número, campaña, etiqueta o modo.", href: "/settings/prompts" },
          { title: "Plantillas WhatsApp", desc: "Gestión de plantillas Meta para mensajes fuera de la ventana de 24h.", href: "/settings/templates" },
          { title: "Base de conocimiento", desc: "Documentos, FAQs y URLs que usa la IA para responder.", href: "/settings/knowledge-base" },
          { title: "Tools / Conectores", desc: "Activa herramientas: búsqueda en KB, CRM, agendamiento y más.", href: "/settings/tools" },
          { title: "Canales (YCloud)", desc: "Credenciales de WhatsApp Business via YCloud.", href: "/settings/channels" },
          { title: "Equipo", desc: "Invitá agentes y managers al workspace.", href: "/settings/team" },
        ].map((item) => (
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
