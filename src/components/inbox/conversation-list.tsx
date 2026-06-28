"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConversationItem } from "./conversation-item";

interface ConvRow {
  id: string;
  ai_enabled: boolean;
  window_open: boolean;
  state: string;
  last_message_at: string;
  contact: { name?: string; phone: string };
}

export function ConversationList() {
  const params = useParams();
  const activeId = params?.id as string | undefined;
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchConvs = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.ok) setConversations(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConvs();
    const supabase = createClient();
    const channel = supabase
      .channel("conversations-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, fetchConvs)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, fetchConvs)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchConvs]);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.contact.name ?? "").toLowerCase().includes(q) || c.contact.phone.includes(q);
  });

  return (
    <div className="flex flex-col h-full" style={{ borderRight: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-base font-semibold mb-2" style={{ color: "var(--foreground)" }}>Inbox</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar conversación…"
          className="w-full px-3 py-1.5 text-sm rounded-lg outline-none"
          style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2" style={{ color: "var(--muted)" }}>
            <p className="text-sm">{search ? "Sin resultados" : "No hay conversaciones"}</p>
            <p className="text-xs">Los mensajes entrantes de WhatsApp aparecerán aquí</p>
          </div>
        ) : (
          filtered.map((c) => (
            <ConversationItem
              key={c.id}
              id={c.id}
              contact={c.contact}
              lastMessageAt={c.last_message_at}
              aiEnabled={c.ai_enabled}
              windowOpen={c.window_open}
              state={c.state}
              isActive={c.id === activeId}
            />
          ))
        )}
      </div>
    </div>
  );
}
