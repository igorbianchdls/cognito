import ChatPanel from "@/components/chat/ChatPanel";
import SandboxPanel from "@/components/chat/SandboxPanel";

export default function ChatRoutePage() {
  return (
    <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="h-full min-h-0">
        <ChatPanel />
      </div>
      <div className="h-full min-h-0">
        <SandboxPanel />
      </div>
    </div>
  );
}
