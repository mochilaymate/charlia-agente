"use client";

import { useState } from "react";

export default function TeamPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "agent" | "viewer">("agent");
  const [status, setStatus] = useState<{ ok?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const res = await fetch("/api/auth/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setStatus({ error: data.error ?? "Error al enviar invitación" });
    } else {
      setStatus({ ok: data.message });
      setEmail("");
    }
  }

  return (
    <div className="p-8 max-w-lg space-y-8">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Gestión de equipo</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Invitá usuarios por email. Recibirán sus credenciales de acceso con una contraseña temporal.
        </p>
      </div>

      <form onSubmit={handleInvite} className="space-y-4">
        {status?.ok && (
          <div className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--success)20", color: "var(--success)", border: "1px solid var(--success)40" }}>
            {status.ok}
          </div>
        )}
        {status?.error && (
          <div className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--destructive)20", color: "var(--destructive)", border: "1px solid var(--destructive)40" }}>
            {status.error}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Email del usuario
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@empresa.com"
            className="w-full px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#6c4cf6]"
            style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Rol
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="w-full px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#6c4cf6]"
            style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <option value="agent">Agente</option>
            <option value="manager">Manager</option>
            <option value="viewer">Viewer (solo lectura)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg font-medium text-sm transition-opacity disabled:opacity-60"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          {loading ? "Enviando…" : "Enviar invitación"}
        </button>
      </form>
    </div>
  );
}
