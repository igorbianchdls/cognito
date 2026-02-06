"use client"

import { useMemo, useState } from "react"

type JsonValue = any
type Role = "fiscal" | "compras" | "vendas"

type InboxRef = {
  roleHint: Role | null
  inboxId: string
  address: string
  label: string
  search: string
}

type MessagePreview = {
  id: string
  from: string
  subject: string
  date: string
}

type InboxPreview = {
  role: Role
  label: string
  address: string
  total: number
  messages: MessagePreview[]
}

function extractList(data: any): any[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== "object") return []
  const direct = [data.items, data.inboxes, data.messages, data.results, data.rows]
  for (const candidate of direct) {
    if (Array.isArray(candidate)) return candidate
  }
  if (data.data && typeof data.data === "object") {
    const nested = [data.data.items, data.data.inboxes, data.data.messages, data.data.results, data.data.rows]
    for (const candidate of nested) {
      if (Array.isArray(candidate)) return candidate
    }
  }
  return []
}

function norm(value: string): string {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function getInboxId(inbox: any): string {
  return String(inbox?.inboxId || inbox?.id || "").trim()
}

function getInboxAddress(inbox: any): string {
  const direct = String(inbox?.email || inbox?.address || "").trim()
  if (direct) return direct
  const fallback = String(inbox?.inboxId || "").trim()
  return fallback.includes("@") ? fallback : ""
}

function getInboxLabel(inbox: any): string {
  return String(inbox?.displayName || inbox?.username || inbox?.email || inbox?.inboxId || "Inbox").trim()
}

function inferRole(inbox: any): Role | null {
  const haystack = norm([inbox?.displayName, inbox?.username, inbox?.email].filter(Boolean).join(" "))
  if (haystack.includes("fiscal")) return "fiscal"
  if (haystack.includes("compras") || haystack.includes("compra")) return "compras"
  if (haystack.includes("vendas") || haystack.includes("venda") || haystack.includes("comercial")) return "vendas"
  return null
}

function toInboxRef(inbox: any): InboxRef | null {
  const inboxId = getInboxId(inbox)
  const address = getInboxAddress(inbox)
  if (!inboxId || !address) return null
  return {
    roleHint: inferRole(inbox),
    inboxId,
    address,
    label: getInboxLabel(inbox),
    search: norm([inbox?.displayName, inbox?.username, inbox?.email, inbox?.inboxId].filter(Boolean).join(" ")),
  }
}

function pickScenarioInboxes(rawInboxes: any[]) {
  const refs = rawInboxes.map(toInboxRef).filter(Boolean) as InboxRef[]
  const byRole: Record<Role, InboxRef | null> = { fiscal: null, compras: null, vendas: null }
  const used = new Set<string>()

  for (const role of ["fiscal", "compras", "vendas"] as Role[]) {
    const found = refs.find((r) => r.roleHint === role && !used.has(r.inboxId)) || null
    if (found) {
      byRole[role] = found
      used.add(found.inboxId)
    }
  }

  for (const role of ["fiscal", "compras", "vendas"] as Role[]) {
    if (byRole[role]) continue
    const fallback = refs.find((r) => !used.has(r.inboxId)) || null
    if (fallback) {
      byRole[role] = fallback
      used.add(fallback.inboxId)
    }
  }

  const missing = (["fiscal", "compras", "vendas"] as Role[]).filter((r) => !byRole[r])
  return { byRole, missing }
}

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(path, init)
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || `Falha: ${res.status}`)
  }
  return json
}

export default function InboxesSeedPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const [result, setResult] = useState<JsonValue>(null)
  const [previews, setPreviews] = useState<InboxPreview[]>([])

  const disabled = useMemo(() => loading, [loading])

  const listAllInboxes = async () => {
    const json = await fetchJson("/api/email/inboxes", { cache: "no-store" })
    return extractList(json?.data ?? json)
  }

  const loadPreviews = async (rawInboxes?: any[]) => {
    const inboxes = Array.isArray(rawInboxes) ? rawInboxes : await listAllInboxes()
    const { byRole, missing } = pickScenarioInboxes(inboxes)
    if (missing.length > 0) {
      setPreviews([])
      throw new Error("Não encontrei 3 inboxes válidas (Fiscal/Compras/Vendas) com email. Crie novamente as inboxes padrão.")
    }

    const nextPreviews: InboxPreview[] = []
    for (const role of ["fiscal", "compras", "vendas"] as Role[]) {
      const info = byRole[role] as InboxRef
      const json = await fetchJson(`/api/email/messages?inboxId=${encodeURIComponent(info.inboxId)}&limit=8`, { cache: "no-store" })
      const rows = extractList(json?.data ?? json)
      const messages = rows.map((m: any) => ({
        id: String(m?.id || m?.messageId || "").trim(),
        from: String(m?.from?.name || m?.from?.email || m?.from || "Sem remetente"),
        subject: String(m?.subject || "Sem assunto"),
        date: String(m?.receivedAt || m?.sentAt || m?.createdAt || ""),
      }))
      nextPreviews.push({
        role,
        label: info.label,
        address: info.address,
        total: rows.length,
        messages,
      })
    }
    setPreviews(nextPreviews)
  }

  const call = async (fn: () => Promise<void>) => {
    setLoading(true)
    setError("")
    setStatus("")
    try {
      await fn()
    } catch (e: any) {
      setError(e?.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const createThreeInboxes = async () => {
    await call(async () => {
      setStatus("Criando inboxes padrão...")
      const json = await fetchJson("/api/email/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      setResult(json)
      const inboxes = await listAllInboxes()
      await loadPreviews(inboxes)
      setStatus("Inboxes criadas e preview atualizado.")
    })
  }

  const listInboxes = async () => {
    await call(async () => {
      setStatus("Buscando inboxes...")
      const inboxes = await listAllInboxes()
      setResult({ ok: true, total: inboxes.length, inboxes })
      await loadPreviews(inboxes)
      setStatus(`${inboxes.length} inbox(es) carregada(s).`)
    })
  }

  const simulateSMBEmails = async () => {
    await call(async () => {
      setStatus("Preparando simulação SMB...")
      const inboxes = await listAllInboxes()
      const { byRole, missing } = pickScenarioInboxes(inboxes)
      if (missing.length > 0) {
        throw new Error("Faltam inboxes para a simulação (Fiscal/Compras/Vendas). Clique em 'Criar 3 inboxes' primeiro.")
      }

      const fiscal = byRole.fiscal as InboxRef
      const compras = byRole.compras as InboxRef
      const vendas = byRole.vendas as InboxRef

      const templates: Array<{
        from: Role
        to: Role[]
        cc?: Role[]
        subject: string
        text: string
        labels?: string[]
      }> = [
        {
          from: "compras",
          to: ["fiscal"],
          subject: "Aprovacao de pagamento - NF 4587 (Papelaria Alfa)",
          text: "Bom dia, Fiscal. Preciso da aprovacao da NF 4587 no valor de R$ 1.280,00 para vencimento em 12/02.",
          labels: ["financeiro", "compras"],
        },
        {
          from: "fiscal",
          to: ["compras"],
          subject: "Re: Aprovacao de pagamento - NF 4587 (Papelaria Alfa)",
          text: "Aprovado. Pode programar o pagamento para 12/02 e anexar o comprovante na pasta do mes.",
          labels: ["financeiro", "fiscal"],
        },
        {
          from: "vendas",
          to: ["fiscal"],
          subject: "Solicitacao de emissao de NF-e - Pedido PV-932",
          text: "Cliente Nova Era confirmou o pedido PV-932. Favor emitir NF-e com vencimento para 15 dias.",
          labels: ["vendas", "fiscal"],
        },
        {
          from: "fiscal",
          to: ["vendas"],
          subject: "Re: Solicitacao de emissao de NF-e - Pedido PV-932",
          text: "NF-e emitida com sucesso. Chave final 3124. Pode seguir com o envio.",
          labels: ["fiscal", "vendas"],
        },
        {
          from: "vendas",
          to: ["compras"],
          subject: "Pedido interno - reposicao de toner e etiquetas",
          text: "Precisamos de reposicao de toner preto e etiquetas para expedicao ate sexta-feira.",
          labels: ["vendas", "compras"],
        },
        {
          from: "compras",
          to: ["vendas"],
          subject: "Re: Pedido interno - reposicao de toner e etiquetas",
          text: "Cotacao recebida e aprovada. Entrega prevista para amanha no periodo da tarde.",
          labels: ["compras"],
        },
        {
          from: "fiscal",
          to: ["compras", "vendas"],
          subject: "Fechamento mensal - pendencias de documentos",
          text: "Pessoal, enviar ate 17h os comprovantes e notas pendentes para fechamento contabil do mes.",
          labels: ["fiscal", "fechamento"],
        },
        {
          from: "compras",
          to: ["fiscal"],
          subject: "Comprovante de pagamento - Frete fevereiro",
          text: "Pagamento do frete de fevereiro realizado. Segue confirmacao para conciliacao.",
          labels: ["compras", "financeiro"],
        },
        {
          from: "vendas",
          to: ["fiscal"],
          cc: ["compras"],
          subject: "Boleto recebido - Cliente Horizonte",
          text: "Recebemos hoje o boleto do cliente Horizonte. Favor registrar no financeiro e confirmar conciliacao.",
          labels: ["vendas", "financeiro"],
        },
      ]

      const roleMap: Record<Role, InboxRef> = { fiscal, compras, vendas }
      const sent: Array<{
        ok: boolean
        index: number
        from: string
        to: string[]
        subject: string
        id?: string
        error?: string
      }> = []

      for (let i = 0; i < templates.length; i += 1) {
        const t = templates[i]
        const from = roleMap[t.from]
        const to = t.to.map((r) => roleMap[r].address)
        const cc = t.cc?.map((r) => roleMap[r].address)
        setStatus(`Enviando emails simulados... ${i + 1}/${templates.length}`)
        try {
          const json = await fetchJson("/api/email/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inboxId: from.inboxId,
              to,
              cc,
              subject: t.subject,
              text: t.text,
              labels: t.labels,
            }),
          })
          const messageId = String(json?.data?.id || json?.data?.messageId || "").trim() || undefined
          sent.push({
            ok: true,
            index: i + 1,
            from: from.address,
            to,
            subject: t.subject,
            id: messageId,
          })
        } catch (e: any) {
          sent.push({
            ok: false,
            index: i + 1,
            from: from.address,
            to,
            subject: t.subject,
            error: e?.message || String(e),
          })
        }
      }

      await loadPreviews(inboxes)
      const success = sent.filter((s) => s.ok).length
      const failed = sent.length - success
      setResult({
        ok: failed === 0,
        summary: {
          requested: sent.length,
          success,
          failed,
        },
        participants: {
          fiscal: { inboxId: fiscal.inboxId, email: fiscal.address, label: fiscal.label },
          compras: { inboxId: compras.inboxId, email: compras.address, label: compras.label },
          vendas: { inboxId: vendas.inboxId, email: vendas.address, label: vendas.label },
        },
        messages: sent,
      })
      setStatus(`Simulacao finalizada: ${success}/${sent.length} emails enviados.`)
    })
  }

  const refreshPreview = async () => {
    await call(async () => {
      setStatus("Atualizando preview das caixas...")
      const inboxes = await listAllInboxes()
      await loadPreviews(inboxes)
      setResult({ ok: true, total: inboxes.length, message: "Preview atualizado com sucesso." })
      setStatus("Preview atualizado.")
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Seed de Inboxes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Esta página cria 3 inboxes padrão para simulação SMB brasileira.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={createThreeInboxes}
              className="rounded-md bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60"
            >
              Criar 3 inboxes
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={listInboxes}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 disabled:opacity-60"
            >
              Listar inboxes
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={simulateSMBEmails}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 disabled:opacity-60"
            >
              Simular emails SMB
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={refreshPreview}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 disabled:opacity-60"
            >
              Atualizar preview
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Padrão: Fiscal ACME, Compras ACME e Vendas ACME.
          </p>
          {status ? <p className="mt-2 text-xs text-gray-600">{status}</p> : null}
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 text-xs font-medium text-gray-600">Preview por inbox</div>
          {previews.length === 0 ? (
            <div className="text-xs text-gray-500">Sem preview ainda. Clique em "Listar inboxes" ou "Simular emails SMB".</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {previews.map((box) => (
                <section key={box.role} className="rounded-lg border border-gray-200 p-3">
                  <div className="text-sm font-semibold text-gray-900">{box.label}</div>
                  <div className="mt-0.5 truncate text-xs text-gray-500">{box.address}</div>
                  <div className="mt-1 text-xs text-gray-500">Ultimos itens: {box.total}</div>
                  <div className="mt-3 space-y-2">
                    {box.messages.length === 0 ? (
                      <div className="text-xs text-gray-500">Sem mensagens.</div>
                    ) : (
                      box.messages.map((m) => (
                        <article key={`${box.role}-${m.id || m.subject}`} className="rounded bg-gray-50 p-2">
                          <div className="truncate text-xs font-medium text-gray-900">{m.subject}</div>
                          <div className="truncate text-[11px] text-gray-600">De: {m.from}</div>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 text-xs font-medium text-gray-600">Resultado</div>
          {result ? (
            <pre className="max-h-[460px] overflow-auto rounded-lg bg-gray-50 p-3 text-xs">
              <code>{JSON.stringify(result, null, 2)}</code>
            </pre>
          ) : (
            <div className="text-xs text-gray-500">Sem resultado ainda.</div>
          )}
        </div>
      </div>
    </div>
  )
}
