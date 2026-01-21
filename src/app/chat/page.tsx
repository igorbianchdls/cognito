import ChatPanel from "@/components/chat/ChatPanel";
import SandboxPanel from "@/components/chat/SandboxPanel";

export default function ChatRoutePage() {
  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Main content area */}
      <main className="flex-1 p-4 md:p-6">
        <div className="h-full w-full bg-white rounded-xl shadow-sm overflow-hidden p-4 md:p-6">
          <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-full min-h-0">
              <ChatPanel />
            </div>
            <div className="h-full min-h-0">
              <SandboxPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

