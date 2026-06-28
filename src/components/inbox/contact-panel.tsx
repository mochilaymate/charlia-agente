"use client";

interface Contact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  stage?: string;
  source?: string;
  tags: string[];
  last_interaction?: string;
  consent?: boolean;
}

interface Props { contact: Contact; onClose: () => void; }

const STAGES = ["lead", "qualified", "customer", "churned", "lost"];

export function ContactPanel({ contact, onClose }: Props) {
  return (
    <div className="w-72 flex flex-col h-full border-l" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Contacto</h3>
        <button onClick={onClose} style={{ color: "var(--muted)" }} className="hover:opacity-70">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ background: "var(--primary)" }}>
            {(contact.name ?? contact.phone)[0]?.toUpperCase()}
          </div>
          <p className="font-semibold text-sm text-center" style={{ color: "var(--foreground)" }}>
            {contact.name ?? contact.phone}
          </p>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {[
            { label: "Teléfono", value: contact.phone },
            { label: "Email", value: contact.email },
            { label: "Etapa", value: contact.stage },
            { label: "Fuente", value: contact.source },
          ].map(({ label, value }) => value ? (
            <div key={label}>
              <p className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>{label}</p>
              <p className="text-sm" style={{ color: "var(--foreground)" }}>{value}</p>
            </div>
          ) : null)}

          {contact.tags?.length > 0 && (
            <div>
              <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>Tags</p>
              <div className="flex flex-wrap gap-1">
                {contact.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--surface-elevated)", color: "var(--muted)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${contact.consent ? "bg-green-500" : "bg-red-400"}`} />
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {contact.consent ? "Consentimiento dado" : "Sin consentimiento"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
        <a
          href={`/crm/${contact.id}`}
          className="block text-center text-sm py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}
        >
          Ver perfil completo →
        </a>
      </div>
    </div>
  );
}
