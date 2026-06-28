"use client";
import { formatTimeAgo } from "@/lib/utils";

interface Props {
  content: string;
  senderType: "contact" | "ai" | "human";
  createdAt: string;
  mediaType?: string;
}

const SENDER_LABEL: Record<string, string> = { ai: "IA", human: "Agente", contact: "" };

export function MessageBubble({ content, senderType, createdAt, mediaType }: Props) {
  const isOutbound = senderType !== "contact";

  return (
    <div className={`flex ${isOutbound ? "justify-end" : "justify-start"} mb-2`}>
      <div className="max-w-[70%] space-y-1">
        {isOutbound && (
          <p className="text-right text-xs px-1" style={{ color: "var(--muted)" }}>
            {SENDER_LABEL[senderType]}
          </p>
        )}
        <div
          className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
          style={isOutbound
            ? { background: "var(--bubble-outbound)", color: "var(--bubble-outbound-text)", borderBottomRightRadius: "4px" }
            : { background: "var(--bubble-inbound)", color: "var(--bubble-inbound-text)", borderBottomLeftRadius: "4px" }
          }
        >
          {mediaType && mediaType !== "text" && (
            <span className="text-xs opacity-60 block mb-1">[{mediaType}]</span>
          )}
          <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{content}</span>
        </div>
        <p className={`text-xs px-1 ${isOutbound ? "text-right" : "text-left"}`} style={{ color: "var(--muted)" }}>
          {formatTimeAgo(createdAt)}
        </p>
      </div>
    </div>
  );
}
