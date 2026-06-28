export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md p-8 rounded-2xl text-center space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl text-white text-lg font-bold" style={{ background: "var(--primary)" }}>
          c°
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Revisa tu email</h1>
        <p style={{ color: "var(--muted)" }}>
          Te enviamos un enlace de confirmación. Haz clic en él para activar tu cuenta de Charlia.
        </p>
      </div>
    </div>
  );
}
