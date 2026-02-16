'use client'

import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import useAutomacaoSandboxChat from '@/products/automacao/frontend/hooks/useAutomacaoSandboxChat'

export default function AutomacaoChatPage() {
  const {
    chatId,
    starting,
    sending,
    input,
    setInput,
    messages,
    events,
    error,
    eventsEndRef,
    autoPrompt,
    setAutoPrompt,
    autoDelaySec,
    setAutoDelaySec,
    scheduledAt,
    countdownMs,
    handleStart,
    handleStop,
    handleSend,
    sendText,
    scheduleRun,
    cancelSchedule,
  } = useAutomacaoSandboxChat()

  return (
    <SidebarProvider>
      <SidebarShadcn showHeaderTrigger={false} />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="h-full grid grid-rows-[auto_1fr]">
          <div className="border-b border-gray-200 bg-white px-4 py-2 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Automação • Chat (Sandbox)</div>
              <div className="text-xs text-gray-500">Claude Agent SDK rodando dentro da Vercel Sandbox</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStart}
                disabled={starting || Boolean(chatId)}
                className={`px-3 py-1.5 rounded text-white ${
                  !chatId && !starting
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gray-400'
                }`}
              >
                {starting ? 'Aguarde…' : 'Iniciar'}
              </button>
              <button
                onClick={handleStop}
                disabled={starting || !chatId}
                className={`px-3 py-1.5 rounded text-white ${
                  chatId ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400'
                }`}
              >
                Parar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full min-h-0">
            <div className="h-full flex flex-col bg-white border-r border-gray-200">
              <div className="px-4 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">
                Automação
              </div>
              <div className="p-3 space-y-3 overflow-auto">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Prompt</label>
                  <textarea
                    value={autoPrompt}
                    onChange={(event) => setAutoPrompt(event.target.value)}
                    className="w-full h-28 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Atraso (segundos)</label>
                  <input
                    type="number"
                    min={1}
                    value={autoDelaySec}
                    onChange={(event) =>
                      setAutoDelaySec(Math.max(1, Number(event.target.value) || 10))
                    }
                    className="w-32 p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={scheduleRun}
                    disabled={sending || starting}
                    className="px-3 py-1.5 rounded text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    Agendar
                  </button>
                  <button
                    onClick={async () => {
                      await sendText(autoPrompt)
                    }}
                    disabled={sending || starting}
                    className="px-3 py-1.5 rounded text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Executar agora
                  </button>
                  <button
                    onClick={cancelSchedule}
                    disabled={!scheduledAt}
                    className={`px-3 py-1.5 rounded text-white ${
                      scheduledAt ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-400'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
                <div className="text-xs text-gray-600">
                  <div>Status: {chatId ? 'Sandbox ativa' : 'Sandbox inativa'}</div>
                  <div>
                    Próxima execução: {scheduledAt ? new Date(scheduledAt).toLocaleTimeString() : '—'}
                    {scheduledAt ? ` (em ${Math.ceil(countdownMs / 1000)}s)` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-full flex flex-col bg-white border-r border-gray-200">
              <div className="flex-1 overflow-auto p-4 space-y-2">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[90%] rounded-lg px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-auto'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-200 flex gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void handleSend()
                    }
                  }}
                  disabled={!chatId || sending}
                  placeholder={chatId ? 'Digite sua mensagem…' : 'Inicie o chat para enviar'}
                  className="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    void handleSend()
                  }}
                  disabled={!chatId || sending || !input.trim()}
                  className={`px-4 py-2 rounded text-white ${
                    !chatId || sending ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {sending ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
              {error && <div className="px-3 pb-2 text-sm text-red-600">{error}</div>}
            </div>

            <div className="h-full flex flex-col bg-white">
              <div className="px-4 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">
                Eventos do Sandbox
              </div>
              <div className="flex-1 overflow-auto p-3 text-xs text-gray-800 space-y-1">
                {events.map((line, index) => (
                  <div key={`event-${index}`} className="whitespace-pre-wrap break-all">
                    {line}
                  </div>
                ))}
                <div ref={eventsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
