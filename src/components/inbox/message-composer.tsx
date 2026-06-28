"use client";
import { useState, useRef } from "react";

interface Props {
  conversationId: string;
  windowOpen: boolean;
  onSent: () => void;
}

export function MessageComposer({ conversationId, windowOpen, onSent }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    const res = await fetch(`/api/conversations/${conversationId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.trim() }),
    });
    setSending(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.message ?? d.error ?? "Error al enviar");
      return;
    }
    setText("");
    onSent();
    ref.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="p-4 border-t space-y-2" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      {!windowOpen && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "var(--warning)15", color: "var(--warning)", border: "1px solid var(--warning)30" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          Ventana de 24h cerrada — solo se pueden enviar plantillas aprobadas
        </div>
      )}
      {error && (
        <p className="text-xs px-1" style={{ color: "var(--destructive)" }}>{error}</p>
      )}
      <div className="flex gap-2 items-end">
        <textarea
          ref={ref}
          rows={1}
          value={text}
          onChange={(e) => { setText(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
          onKeyDown={handleKeyDown}
          disabled={!windowOpen || sending}
          placeholder={windowOpen ? "Escribe un mensaje… (Enter para enviar)" : "Ventana cerrada"}
          className="flex-1 px-4 py-2 rounded-xl text-sm resize-none outline-none disabled:opacity-50"
          style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)", minHeight: "40px", maxHeight: "120px" }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending || !windowOpen}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
          style={{ background: "var(--primary)", color: "white" }}
        >
          {sending ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
