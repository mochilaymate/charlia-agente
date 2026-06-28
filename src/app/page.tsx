import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <main className="max-w-lg w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white text-2xl font-bold" style={{ background: "var(--primary)" }}>
            c°
          </div>
          <h1 className="text-4xl font-bold" style={{ color: "var(--foreground)" }}>Charlia</h1>
          <p style={{ color: "var(--muted)" }}>
            Inbox conversacional para WhatsApp con IA, handoff humano y cumplimiento Meta.
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/auth/login"
            className="px-6 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            Iniciar sesión
          </Link>
        </div>
      </main>
    </div>
  );
}
