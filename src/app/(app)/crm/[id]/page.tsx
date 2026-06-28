"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Contact {
  id: string; name?: string; phone: string; email?: string;
  stage?: string; source?: string; tags: string[]; consent?: boolean;
  custom_fields: Record<string, string>; created_at: string;
  last_interaction?: string;
}

export default function ContactDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Contact>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/contacts/${id}`).then(r => r.json()).then(d => { setContact(d); setForm(d); });
  }, [id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, stage: form.stage, source: form.source }),
    });
    if (res.ok) { setContact(await res.json()); setEditing(false); }
    setSaving(false);
  }

  if (!contact) return <div className="flex items-center justify-center h-full"><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></div>;

  const field = (label: string, key: keyof Contact, type = "text") => (
    <div className="space-y-1">
      <label className="text-xs" style={{ color: "var(--muted)" }}>{label}</label>
      {editing ? (
        <input type={type} value={(form[key] as string) ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="w-full px-3 py-2 text-sm rounded-lg outline-none"
          style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
      ) : (
        <p className="text-sm" style={{ color: "var(--foreground)" }}>{(contact[key] as string) ?? "—"}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/crm" className="text-xs hover:underline" style={{ color: "var(--muted)" }}>← Contactos</Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
            style={{ background: "var(--primary)" }}>
            {(contact.name ?? contact.phone)[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{contact.name ?? contact.phone}</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>{contact.phone}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm rounded-lg"
              style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
              Editar
            </button>
          ) : (
            <>
              <button onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm rounded-lg"
                style={{ background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                Cancelar
              </button>
              <button onClick={save} disabled={saving}
                className="px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-60"
                style={{ background: "var(--primary)", color: "white" }}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl p-6 grid grid-cols-2 gap-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {field("Nombre", "name")}
        {field("Email", "email", "email")}
        {field("Etapa", "stage")}
        {field("Fuente", "source")}
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--muted)" }}>Teléfono</label>
          <p className="text-sm" style={{ color: "var(--foreground)" }}>{contact.phone}</p>
        </div>
        <div className="space-y-1">
          <label className="text-xs" style={{ color: "var(--muted)" }}>Consentimiento</label>
          <p className="text-sm" style={{ color: contact.consent ? "var(--success)" : "var(--muted)" }}>
            {contact.consent ? "Dado" : "No dado"}
          </p>
        </div>
      </div>

      {contact.tags?.length > 0 && (
        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>Tags</p>
          <div className="flex flex-wrap gap-2">
            {contact.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 text-xs rounded-full" style={{ background: "var(--surface-elevated)", color: "var(--foreground)" }}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
