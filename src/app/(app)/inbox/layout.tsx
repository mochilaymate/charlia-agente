import { ConversationList } from "@/components/inbox/conversation-list";

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <div className="w-80 shrink-0 flex flex-col h-full">
        <ConversationList />
      </div>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
}
