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

type ScenarioTemplate = {
  from: Role
  to: Role[]
  cc?: Role[]
  subject: string
  text: string
  labels?: string[]
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

function buildSmbTemplates(): ScenarioTemplate[] {
  const fiscal: Omit<ScenarioTemplate, "from">[] = [
    { to: ["compras"], subject: "Aprovacao de pagamento - NF 4587", text: "Pagamento aprovado. Programar liquidacao para 12/02.", labels: ["fiscal", "financeiro"] },
    { to: ["vendas"], subject: "Emissao de NF-e - Pedido PV-932", text: "NF-e emitida. Chave final 3124. Pode seguir com expedicao.", labels: ["fiscal", "vendas"] },
    { to: ["compras", "vendas"], subject: "Fechamento mensal - documentos pendentes", text: "Enviar notas e comprovantes pendentes ate 17h para fechamento.", labels: ["fiscal", "fechamento"] },
    { to: ["compras"], subject: "Conferencia de boletos do fornecedor Alfa", text: "Identifiquei divergencia de R$ 42,90. Revisar boleto de fevereiro.", labels: ["fiscal", "compras"] },
    { to: ["vendas"], subject: "Tributacao de novo produto", text: "Validado NCM e aliquota para o item lancado nesta semana.", labels: ["fiscal", "vendas"] },
    { to: ["compras"], subject: "Reembolso aprovado - viagem comercial", text: "Reembolso aprovado no valor de R$ 860,00. Seguir com pagamento.", labels: ["fiscal", "financeiro"] },
    { to: ["vendas"], cc: ["compras"], subject: "Conciliacao de recebiveis - carteira fevereiro", text: "Conciliacao parcial concluida. Confirmar 3 recebimentos em aberto.", labels: ["fiscal", "financeiro"] },
    { to: ["compras"], subject: "Retencoes de servico - validacao", text: "Aplicar retencoes no proximo pagamento de prestador PJ.", labels: ["fiscal", "compras"] },
    { to: ["vendas"], subject: "Prazo de envio de XML para cliente", text: "Cliente solicitou XML ate 14h. Priorizar envio ainda hoje.", labels: ["fiscal", "vendas"] },
    { to: ["compras", "vendas"], subject: "Checklist de auditoria interna", text: "Compartilhar contratos, pedidos e notas para auditoria trimestral.", labels: ["fiscal"] },
  ]

  const compras: Omit<ScenarioTemplate, "from">[] = [
    { to: ["fiscal"], subject: "Solicitacao de aprovacao - NF 7721", text: "Preciso da aprovacao da NF 7721 para pagamento na sexta.", labels: ["compras", "financeiro"] },
    { to: ["vendas"], subject: "Status de reposicao de estoque", text: "Toner, etiquetas e caixas com entrega prevista para amanha.", labels: ["compras", "operacao"] },
    { to: ["fiscal"], subject: "Comprovante de pagamento - frete fevereiro", text: "Pagamento do frete realizado. Segue para conciliacao.", labels: ["compras", "financeiro"] },
    { to: ["vendas"], subject: "Fornecedor homologado - embalagens", text: "Novo fornecedor homologado com custo 8% menor.", labels: ["compras"] },
    { to: ["fiscal"], subject: "Pedido de adiantamento - material de escritorio", text: "Solicito adiantamento de R$ 1.200,00 para compra emergencial.", labels: ["compras", "financeiro"] },
    { to: ["vendas"], cc: ["fiscal"], subject: "Atualizacao de prazo - pedido interno", text: "Entrega parcial hoje e saldo restante em 48h.", labels: ["compras", "vendas"] },
    { to: ["fiscal"], subject: "Divergencia em nota de servico", text: "Valor de ISS veio acima do esperado. Preciso de orientacao.", labels: ["compras", "fiscal"] },
    { to: ["vendas"], subject: "Cotacao aprovada - material promocional", text: "Aprovamos cotacao para panfletos e brindes do mes.", labels: ["compras", "marketing"] },
    { to: ["fiscal"], subject: "Envio de XML - fornecedor Beta", text: "XML e DANFE enviados para arquivo fiscal.", labels: ["compras", "fiscal"] },
    { to: ["vendas"], subject: "Reposicao urgente - etiquetas logisticas", text: "Solicitacao emergencial registrada com prioridade maxima.", labels: ["compras", "operacao"] },
  ]

  const vendas: Omit<ScenarioTemplate, "from">[] = [
    { to: ["fiscal"], subject: "Pedido PV-1054 confirmado", text: "Cliente confirmou pedido de R$ 12.450,00. Emitir nota fiscal.", labels: ["vendas", "fiscal"] },
    { to: ["compras"], subject: "Reposicao de itens para kit promocional", text: "Precisamos de 200 unidades extras para campanha de fevereiro.", labels: ["vendas", "compras"] },
    { to: ["fiscal"], subject: "Boleto recebido - cliente Horizonte", text: "Boleto recebido hoje. Favor registrar no financeiro.", labels: ["vendas", "financeiro"] },
    { to: ["compras"], subject: "Solicitacao de amostras - novo fornecedor", text: "Equipe comercial precisa de amostras ate quarta-feira.", labels: ["vendas", "compras"] },
    { to: ["fiscal"], subject: "Ajuste de cadastro fiscal - cliente Nova Era", text: "Cliente alterou IE estadual. Atualizar cadastro antes da emissao.", labels: ["vendas", "fiscal"] },
    { to: ["compras"], subject: "Material de apoio para time externo", text: "Solicito reposicao de folders e banners para visitas comerciais.", labels: ["vendas", "operacao"] },
    { to: ["fiscal"], cc: ["compras"], subject: "Recebimento parcial - pedido corporativo", text: "Recebemos sinal de 30%. Saldo previsto para 15 dias.", labels: ["vendas", "financeiro"] },
    { to: ["compras"], subject: "Follow-up de prazo - embalagem personalizada", text: "Confirmar prazo final para envio ao cliente premium.", labels: ["vendas", "compras"] },
    { to: ["fiscal"], subject: "Cancelamento de pedido PV-1041", text: "Cliente cancelou por duplicidade. Necessario estorno fiscal.", labels: ["vendas", "fiscal"] },
    { to: ["compras"], subject: "Urgente: reposicao de caixa de envio", text: "Estoque de caixas acabou no CD. Repor hoje se possivel.", labels: ["vendas", "operacao"] },
  ]

  const templates: ScenarioTemplate[] = []
  for (const t of fiscal) templates.push({ from: "fiscal", ...t })
  for (const t of compras) templates.push({ from: "compras", ...t })
  for (const t of vendas) templates.push({ from: "vendas", ...t })
  return templates
}

function buildSmbTemplatesFollowup(): ScenarioTemplate[] {
  const runTag = new Date().toLocaleString("pt-BR")
  return buildSmbTemplates().map((t, idx) => ({
    ...t,
    subject: `Follow-up ${idx + 1} - ${t.subject}`,
    text: `Atualizacao automatica (${runTag}).\n\n${t.text}`,
    labels: [...(t.labels || []), "followup"],
  }))
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
      const json = await fetchJson(`/api/email/messages?inboxId=${encodeURIComponent(info.inboxId)}&limit=12`, { cache: "no-store" })
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

  const runSimulation = async (templates: ScenarioTemplate[], modeLabel: string) => {
    setStatus(`Preparando ${modeLabel}...`)
    const inboxes = await listAllInboxes()
    const { byRole, missing } = pickScenarioInboxes(inboxes)
    if (missing.length > 0) {
      throw new Error("Faltam inboxes para a simulação (Fiscal/Compras/Vendas). Clique em 'Criar 3 inboxes' primeiro.")
    }

    const fiscal = byRole.fiscal as InboxRef
    const compras = byRole.compras as InboxRef
    const vendas = byRole.vendas as InboxRef

    const roleMap: Record<Role, InboxRef> = { fiscal, compras, vendas }
    const sent: Array<{
      ok: boolean
      index: number
      fromRole: Role
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
      setStatus(`Enviando ${modeLabel}... ${i + 1}/${templates.length}`)
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
          fromRole: t.from,
          from: from.address,
          to,
          subject: t.subject,
          id: messageId,
        })
      } catch (e: any) {
        sent.push({
          ok: false,
          index: i + 1,
          fromRole: t.from,
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
    const plannedBySender: Record<Role, number> = { fiscal: 0, compras: 0, vendas: 0 }
    const successBySender: Record<Role, number> = { fiscal: 0, compras: 0, vendas: 0 }
    for (const t of templates) plannedBySender[t.from] += 1
    for (const item of sent) {
      if (item.ok) successBySender[item.fromRole] += 1
    }
    setResult({
      ok: failed === 0,
      mode: modeLabel,
      summary: {
        requested: sent.length,
        success,
        failed,
        plannedBySender,
        successBySender,
      },
      participants: {
        fiscal: { inboxId: fiscal.inboxId, email: fiscal.address, label: fiscal.label },
        compras: { inboxId: compras.inboxId, email: compras.address, label: compras.label },
        vendas: { inboxId: vendas.inboxId, email: vendas.address, label: vendas.label },
      },
      messages: sent,
    })
    setStatus(`${modeLabel} finalizada: ${success}/${sent.length} emails enviados.`)
  }

  const simulateSMBEmails = async () => {
    await call(async () => {
      await runSimulation(buildSmbTemplates(), "simulação SMB")
    })
  }

  const simulateNewSMBEmails = async () => {
    await call(async () => {
      await runSimulation(buildSmbTemplatesFollowup(), "novos emails SMB")
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
              onClick={simulateNewSMBEmails}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 disabled:opacity-60"
            >
              Simular novos emails SMB
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
