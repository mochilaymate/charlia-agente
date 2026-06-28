"use client";

import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md p-8 rounded-2xl space-y-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white text-lg font-bold" style={{ background: "var(--primary)" }}>
            c°
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Acceso por invitación</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            El registro en Charlia es solo por invitación del administrador.
            Si ya recibiste un email de invitación, hacé clic en el enlace de ese correo.
          </p>
        </div>

        <div className="space-y-2 text-sm" style={{ color: "var(--muted)" }}>
          <p>¿No recibiste invitación?</p>
          <p>Contactá al administrador de tu workspace para que te envíe el acceso.</p>
        </div>

        <Link
          href="/auth/login"
          className="inline-block px-6 py-2.5 rounded-lg font-medium text-sm transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Ir al login
        </Link>
      </div>
    </div>
  );
}
