"use client";
import Link from "next/link";
import { cn, formatTimeAgo } from "@/lib/utils";

interface Props {
  id: string;
  contact: { name?: string; phone: string };
  lastMessage?: string;
  lastMessageAt?: string;
  aiEnabled: boolean;
  windowOpen: boolean;
  state: string;
  isActive: boolean;
}

export function ConversationItem({ id, contact, lastMessage, lastMessageAt, aiEnabled, windowOpen, state, isActive }: Props) {
  const initials = (contact.name ?? contact.phone)
    .split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  return (
    <Link href={`/inbox/${id}`}>
      <div className={cn(
        "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
        isActive ? "border-l-2" : "border-l-2 border-transparent hover:opacity-80"
      )}
        style={isActive
          ? { background: "var(--surface-elevated)", borderLeftColor: "var(--primary)" }
          : { borderLeftColor: "transparent" }
        }
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 text-white"
          style={{ background: "var(--primary)" }}>
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
              {contact.name ?? contact.phone}
            </span>
            {lastMessageAt && (
              <span className="text-xs shrink-0" style={{ color: "var(--muted)" }}>
                {formatTimeAgo(lastMessageAt)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs truncate flex-1" style={{ color: "var(--muted)" }}>
              {lastMessage ?? "Sin mensajes aún"}
            </p>
            <div className="flex gap-1 shrink-0">
              {!windowOpen && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--warning)20", color: "var(--warning)", fontSize: "10px" }}>
                  24h
                </span>
              )}
              {aiEnabled && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--primary)20", color: "var(--primary)", fontSize: "10px" }}>
                  IA
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
