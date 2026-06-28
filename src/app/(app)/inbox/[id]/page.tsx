"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "@/components/inbox/message-bubble";
import { MessageComposer } from "@/components/inbox/message-composer";
import { ContactPanel } from "@/components/inbox/contact-panel";
import { formatTimeAgo } from "@/lib/utils";

interface Message {
  id: string;
  sender_type: "contact" | "ai" | "human";
  content: string;
  media_type?: string;
  created_at: string;
}

interface Conversation {
  id: string;
  ai_enabled: boolean;
  window_open: boolean;
  state: string;
  status: string;
  last_inbound_at?: string;
  contact: {
    id: string;
    name?: string;
    phone: string;
    email?: string;
    stage?: string;
    source?: string;
    tags: string[];
    last_interaction?: string;
    consent?: boolean;
  };
}

export default function ConversationPage() {
  const { id } = useParams() as { id: string };
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showContact, setShowContact] = useState(false);
  const [togglingAI, setTogglingAI] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConv = useCallback(async () => {
    const res = await fetch(`/api/conversations/${id}`);
    if (res.ok) setConv(await res.json());
  }, [id]);

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/conversations/${id}/messages`);
    if (res.ok) setMessages(await res.json());
  }, [id]);

  useEffect(() => {
    fetchConv();
    fetchMessages();

    const supabase = createClient();
    const channel = supabase
      .channel(`conv-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${id}` },
        () => fetchConv()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, fetchConv, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function toggleAI() {
    if (!conv || togglingAI) return;
    setTogglingAI(true);
    const res = await fetch(`/api/conversations/${id}/toggle-ai`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setConv((c) => c ? { ...c, ai_enabled: data.ai_enabled, state: data.state } : c);
    }
    setTogglingAI(false);
  }

  if (!conv) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: "var(--primary)" }}>
              {(conv.contact.name ?? conv.contact.phone)[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                {conv.contact.name ?? conv.contact.phone}
              </p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {conv.contact.phone} · {conv.state.replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 24h window badge */}
            <span className="text-xs px-2 py-1 rounded-full"
              style={conv.window_open
                ? { background: "var(--success)20", color: "var(--success)" }
                : { background: "var(--warning)20", color: "var(--warning)" }
              }>
              {conv.window_open ? "Ventana abierta" : "Ventana cerrada"}
            </span>

            {/* AI toggle */}
            <button
              onClick={toggleAI}
              disabled={togglingAI}
              title={conv.ai_enabled ? "IA activa — clic para desactivar" : "IA inactiva — clic para activar"}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
              style={conv.ai_enabled
                ? { background: "var(--primary)", color: "white" }
                : { background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }
              }
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
              </svg>
              {conv.ai_enabled ? "IA ON" : "IA OFF"}
            </button>

            {/* Contact info */}
            <button
              onClick={() => setShowContact(!showContact)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ background: showContact ? "var(--primary)20" : "var(--surface-elevated)", color: showContact ? "var(--primary)" : "var(--muted)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full" style={{ color: "var(--muted)" }}>
              <p className="text-sm">Sin mensajes aún</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                content={msg.content}
                senderType={msg.sender_type}
                createdAt={msg.created_at}
                mediaType={msg.media_type}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <MessageComposer
          conversationId={id}
          windowOpen={conv.window_open}
          onSent={fetchMessages}
        />
      </div>

      {/* Contact panel */}
      {showContact && (
        <ContactPanel contact={conv.contact} onClose={() => setShowContact(false)} />
      )}
    </div>
  );
}
