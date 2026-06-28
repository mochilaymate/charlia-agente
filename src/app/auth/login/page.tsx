"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/inbox");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md p-8 rounded-2xl space-y-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white text-lg font-bold" style={{ background: "var(--primary)" }}>
            c°
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Iniciar sesión</h1>
          <p style={{ color: "var(--muted)" }}>Charlia · WhatsApp AI Inbox</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--destructive)20", color: "var(--destructive)", border: "1px solid var(--destructive)40" }}>
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#6c4cf6]"
              style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#6c4cf6]"
              style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium transition-opacity disabled:opacity-60"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>

      </div>
    </div>
  );
}
