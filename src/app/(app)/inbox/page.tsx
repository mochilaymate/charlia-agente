export default function InboxEmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "var(--muted)" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "var(--primary)" }}>
        c°
      </div>
      <p className="text-sm">Seleccioná una conversación para empezar</p>
    </div>
  );
}
