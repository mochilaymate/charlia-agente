"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTimeAgo } from "@/lib/utils";

interface Contact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  stage?: string;
  tags: string[];
  created_at: string;
  last_interaction?: string;
}

const STAGE_COLORS: Record<string, string> = {
  lead: "#6c4cf6", qualified: "#22c55e", customer: "#3b82f6",
  churned: "#f59e0b", lost: "#ef4444",
};

export default function CrmPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", stage: "lead" });
  const [saving, setSaving] = useState(false);

  async function fetchContacts(q = "") {
    const res = await fetch(`/api/contacts?q=${encodeURIComponent(q)}`);
    if (res.ok) setContacts(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchContacts(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchContacts(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  async function createContact(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowNew(false);
      setForm({ name: "", phone: "", email: "", stage: "lead" });
      fetchContacts(search);
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>CRM · Contactos</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{contacts.length} contactos</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar…"
            className="px-3 py-1.5 text-sm rounded-lg outline-none"
            style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          />
          <button
            onClick={() => setShowNew(true)}
            className="px-4 py-1.5 text-sm rounded-lg font-medium"
            style={{ background: "var(--primary)", color: "white" }}
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* New contact modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <form onSubmit={createContact} className="w-full max-w-md p-6 rounded-2xl space-y-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Nuevo contacto</h2>
            {[
              { key: "name", label: "Nombre", type: "text", required: false },
              { key: "phone", label: "Teléfono (E.164)", type: "tel", required: true },
              { key: "email", label: "Email", type: "email", required: false },
            ].map(({ key, label, type, required }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs" style={{ color: "var(--muted)" }}>{label}</label>
                <input
                  type={type}
                  required={required}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={key === "phone" ? "+5491100000000" : ""}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>Etapa</label>
              <select
                value={form.stage}
                onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                {Object.keys(STAGE_COLORS).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowNew(false)}
                className="px-4 py-2 text-sm rounded-lg" style={{ background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-60"
                style={{ background: "var(--primary)", color: "white" }}>
                {saving ? "Guardando…" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48"><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg></div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2" style={{ color: "var(--muted)" }}>
            <p className="text-sm">{search ? "Sin resultados para esa búsqueda" : "No hay contactos todavía"}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--border)" }}>
                {["Nombre", "Teléfono", "Email", "Etapa", "Última actividad", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 font-medium text-xs" style={{ color: "var(--muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b hover:opacity-80 transition-opacity"
                  style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: "var(--primary)" }}>
                        {(c.name ?? c.phone)[0]?.toUpperCase()}
                      </div>
                      <span style={{ color: "var(--foreground)" }}>{c.name ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{c.phone}</td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{c.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    {c.stage ? (
                      <span className="px-2 py-0.5 rounded-full text-xs text-white"
                        style={{ background: STAGE_COLORS[c.stage] ?? "var(--muted)" }}>
                        {c.stage}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                    {c.last_interaction ? formatTimeAgo(c.last_interaction) : formatTimeAgo(c.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/crm/${c.id}`} className="text-xs hover:underline" style={{ color: "var(--primary)" }}>
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
