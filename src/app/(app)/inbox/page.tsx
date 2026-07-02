"use client";
import { useLanguage } from "@/lib/i18n";

export default function InboxEmptyState() {
  const { lang } = useLanguage();
  const msg = lang === "en" ? "Select a conversation to start" : "Seleccioná una conversación para empezar";
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ color: "var(--muted)" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: "var(--primary)" }}>
        c°
      </div>
      <p className="text-sm">{msg}</p>
    </div>
  );
}
