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

type RoleMap = Record<Role, InboxRef>

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
    {
      to: ["compras"],
      subject: "Aprovacao de pagamentos da semana - fornecedores criticos",
      text: "Time de Compras,\n\nRevisei o lote de contas com vencimento entre quarta e sexta e liberei os pagamentos dos fornecedores criticos (energia, internet e transporte).\n\nPor favor executar os pagamentos na sequencia abaixo:\n1. SulLog Transportes - R$ 4.820,00\n2. Energia Centro - R$ 2.145,34\n3. Link Business Internet - R$ 689,90\n\nApos liquidacao, anexar os comprovantes no drive da pasta Financeiro > Pagamentos > Semana 06.",
      labels: ["fiscal", "financeiro"],
    },
    {
      to: ["vendas"],
      subject: "Janela de emissao de NF-e para pedidos confirmados hoje",
      text: "Equipe Comercial,\n\nConseguimos abrir uma janela de emissao hoje entre 15h e 17h. Se houver pedidos com cadastro completo (CNPJ, IE e endereco fiscal), enviem no formato padrao ate 14h30.\n\nTudo que entrar nesse horario vai faturar no mesmo dia. Pedidos incompletos ficam para o proximo lote.",
      labels: ["fiscal", "vendas"],
    },
    {
      to: ["compras", "vendas"],
      subject: "Fechamento mensal: pendencias obrigatorias ate 17h",
      text: "Pessoal,\n\nPara fecharmos o mes sem retrabalho, preciso dos itens pendentes ate 17h de hoje:\n- Compras: XML e DANFE das notas de servico\n- Vendas: confirmacao de recebimentos e descontos aplicados fora da tabela\n\nSem esse material, o fechamento contabil fica parcial e pode impactar DRE e fluxo de caixa da semana que vem.",
      labels: ["fiscal", "fechamento"],
    },
    {
      to: ["compras"],
      subject: "Divergencia tributaria em nota do fornecedor Orion",
      text: "Compras,\n\nA nota 9811 do fornecedor Orion veio com base de calculo diferente da combinada em contrato e gerou imposto acima do previsto.\n\nAntes de pagar, peço contato com o fornecedor para carta de correcao ou nova emissao. Se precisarem, envio a memoria de calculo para apoiar a negociacao.",
      labels: ["fiscal", "compras"],
    },
    {
      to: ["vendas"],
      cc: ["compras"],
      subject: "Margem minima para descontos na campanha de fim de mes",
      text: "Vendas,\n\nValidei a margem por linha de produto e precisamos manter desconto maximo de 12% nos itens da campanha para preservar contribuicao.\n\nCompras foi copiada para ajudar em eventual renegociacao com fornecedores de maior giro.",
      labels: ["fiscal", "vendas"],
    },
    {
      to: ["vendas"],
      cc: ["compras"],
      subject: "Fluxo de caixa projetado e prioridade de cobranca",
      text: "Times,\n\nNo fluxo projetado dos proximos 10 dias teremos concentracao de saidas na proxima segunda. Para equilibrar caixa, precisamos priorizar cobranca de 5 clientes com boletos vencendo ate sexta.\n\nComercial: focar follow-up de recebimento.\nCompras: evitar novas compras nao urgentes ate atualizar o saldo de sexta.",
      labels: ["fiscal", "financeiro"],
    },
  ]

  const compras: Omit<ScenarioTemplate, "from">[] = [
    {
      to: ["fiscal"],
      subject: "Solicitacao de aprovacao - lote de NFs com vencimento na sexta",
      text: "Fiscal,\n\nMontei um lote com 7 notas para pagamento na sexta, totalizando R$ 18.430,22. Ja conferi pedido, recebimento e condicoes comerciais.\n\nSe estiver ok, preciso da aprovacao ate 12h para processar no banco ainda hoje.",
      labels: ["compras", "financeiro"],
    },
    {
      to: ["vendas"],
      subject: "Status de reposicao de itens de alto giro",
      text: "Comercial,\n\nAtualizando o estoque de apoio da operacao:\n- Etiquetas logisticas: entrega amanha ate 11h\n- Caixas P e M: entrega parcial hoje\n- Toner preto: fornecedor confirmou embarque para sexta\n\nSe houver campanha extra no fim de semana, me avisem para antecipar pedido.",
      labels: ["compras", "operacao"],
    },
    {
      to: ["fiscal"],
      subject: "Comprovantes de pagamento de frete e armazenagem",
      text: "Fiscal,\n\nSeguem pagamentos executados hoje:\n- Frete SulLog: R$ 4.820,00\n- Armazenagem CD Norte: R$ 1.970,00\n\nComprovantes ja anexados no drive. Se faltar algum documento para conciliacao, sinalizo ainda hoje.",
      labels: ["compras", "financeiro"],
    },
    {
      to: ["vendas"],
      subject: "Fornecedor homologado para embalagem premium",
      text: "Comercial,\n\nFinalizamos homologacao da EmbalaMais para linha premium. O contrato ficou 9% abaixo do fornecedor atual e com SLA melhor para reposicao.\n\nPodemos usar no proximo ciclo de pedidos sem risco de ruptura.",
      labels: ["compras"],
    },
    {
      to: ["fiscal"],
      subject: "Reajuste contratual - manutencao de equipamentos",
      text: "Fiscal,\n\nA empresa TecService pediu reajuste de 6,3% no contrato mensal de manutencao. Nosso limite orcado era 4,5%.\n\nAntes de fechar, queria sua avaliacao de impacto e eventual aprovacao para excecao.",
      labels: ["compras", "fiscal"],
    },
    {
      to: ["vendas"],
      cc: ["fiscal"],
      subject: "Compra emergencial de notebook para representante",
      text: "Comercial,\n\nAbrimos compra emergencial de 1 notebook para o representante da regiao Sul, devido falha no equipamento atual durante visitas externas.\n\nFiscal em copia para validar classificacao contabil e depreciacao correta.",
      labels: ["compras", "vendas"],
    },
  ]

  const vendas: Omit<ScenarioTemplate, "from">[] = [
    {
      to: ["fiscal"],
      subject: "Pedido corporativo confirmado - faturamento solicitado para hoje",
      text: "Fiscal,\n\nFechamos o pedido do cliente Nova Horizonte no valor de R$ 28.740,00, com pagamento em 21 dias. O cliente pediu emissao da nota ainda hoje para liberar recebimento no centro de distribuicao.\n\nDados fiscais completos ja conferidos no CRM.",
      labels: ["vendas", "fiscal"],
    },
    {
      to: ["compras"],
      subject: "Reposicao para kits de campanha regional",
      text: "Compras,\n\nA campanha da regional Sudeste acelerou acima do previsto. Precisamos de reposicao de 300 kits (caixa, etiqueta e folder) para nao quebrar entrega no inicio da proxima semana.\n\nSe conseguir, priorizar os itens com maior giro no CD principal.",
      labels: ["vendas", "compras"],
    },
    {
      to: ["fiscal"],
      subject: "Recebimento de boleto - cliente Horizonte",
      text: "Fiscal,\n\nConfirmamos recebimento do boleto do cliente Horizonte hoje as 10h12 no valor de R$ 9.480,00.\n\nPode registrar na conciliacao e liberar o status financeiro no pedido para seguirmos com nova venda.",
      labels: ["vendas", "financeiro"],
    },
    {
      to: ["compras"],
      subject: "Solicitacao de amostras para rodada comercial",
      text: "Compras,\n\nNosso time externo vai visitar 4 contas estrategicas semana que vem e precisa de amostras de 3 linhas novas.\n\nSe der, separar e enviar ate quinta no fim da tarde para embarque conjunto.",
      labels: ["vendas", "compras"],
    },
    {
      to: ["fiscal"],
      cc: ["compras"],
      subject: "Previsao de faturamento da semana e risco de atraso",
      text: "Times,\n\nA previsao de faturamento da semana esta em R$ 146 mil, mas 2 pedidos dependem de confirmacao de estoque e documentacao final.\n\nSe conseguirmos resolver ate amanha 14h, mantemos meta sem impacto no caixa.",
      labels: ["vendas", "financeiro"],
    },
    {
      to: ["fiscal"],
      subject: "Cancelamento parcial de pedido e necessidade de ajuste fiscal",
      text: "Fiscal,\n\nO cliente Atlas pediu cancelamento parcial de 12 unidades por mudanca de escopo interno. Precisamos ajustar a base do pedido original e confirmar qual o procedimento fiscal correto para evitar retrabalho na faturacao.\n\nAssim que orientarem, o time atualiza o pedido no ERP.",
      labels: ["vendas", "fiscal"],
    },
  ]

  const templates: ScenarioTemplate[] = []
  for (const t of fiscal) templates.push({ from: "fiscal", ...t })
  for (const t of compras) templates.push({ from: "compras", ...t })
  for (const t of vendas) templates.push({ from: "vendas", ...t })
  return templates
}

function buildSeedInboxItems() {
  const suffix = Date.now().toString().slice(-6)
  return [
    { username: `fiscal-smb-${suffix}`, displayName: "Fiscal ACME" },
    { username: `compras-smb-${suffix}`, displayName: "Compras ACME" },
    { username: `vendas-smb-${suffix}`, displayName: "Vendas ACME" },
  ]
}

function isManagedSmbInbox(inbox: any): boolean {
  const text = norm([inbox?.displayName, inbox?.username, inbox?.email, inbox?.inboxId].filter(Boolean).join(" "))
  const hasRole = text.includes("fiscal") || text.includes("compras") || text.includes("vendas")
  const hasTag = text.includes("acme") || text.includes("-smb-")
  return hasRole && hasTag
}

function resolveRoleMap(rawInboxes: any[]): RoleMap | null {
  const { byRole, missing } = pickScenarioInboxes(rawInboxes)
  if (missing.length > 0) return null
  return {
    fiscal: byRole.fiscal as InboxRef,
    compras: byRole.compras as InboxRef,
    vendas: byRole.vendas as InboxRef,
  }
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

  const runSimulation = async (templates: ScenarioTemplate[], modeLabel: string, fixedRoleMap?: RoleMap, extraMeta?: JsonValue) => {
    setStatus(`Preparando ${modeLabel}...`)
    const inboxes = await listAllInboxes()
    const roleMap = fixedRoleMap || resolveRoleMap(inboxes)
    if (!roleMap) {
      throw new Error("Faltam inboxes para a simulacao (Fiscal/Compras/Vendas). Clique em 'Criar 3 inboxes' primeiro.")
    }

    const { fiscal, compras, vendas } = roleMap
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
      ...(extraMeta && typeof extraMeta === "object" ? { meta: extraMeta } : {}),
      messages: sent,
    })
    setStatus(`${modeLabel} finalizada: ${success}/${sent.length} emails enviados.`)
  }

  const simulateSMBEmails = async () => {
    await call(async () => {
      await runSimulation(buildSmbTemplates(), "simulação SMB")
    })
  }

  const resetAndRebuildScenario = async () => {
    await call(async () => {
      setStatus("Resetando inboxes da simulacao...")
      const current = await listAllInboxes()
      let candidates = current.filter((inbox: any) => isManagedSmbInbox(inbox))

      if (candidates.length === 0) {
        const fallback = resolveRoleMap(current)
        if (fallback) candidates = [fallback.fiscal, fallback.compras, fallback.vendas]
      }

      const deleted: string[] = []
      const deleteErrors: Array<{ inboxId: string; error: string }> = []
      for (let i = 0; i < candidates.length; i += 1) {
        const id = getInboxId(candidates[i])
        if (!id) continue
        setStatus(`Apagando inboxes antigas... ${i + 1}/${candidates.length}`)
        try {
          await fetchJson("/api/email/inboxes", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inboxId: id }),
          })
          deleted.push(id)
        } catch (e: any) {
          deleteErrors.push({ inboxId: id, error: e?.message || String(e) })
        }
      }

      setStatus("Criando 3 novas inboxes...")
      const createdPayload = await fetchJson("/api/email/inboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: buildSeedInboxItems() }),
      })
      const createdRaw = Array.isArray(createdPayload?.created) ? createdPayload.created : []
      let roleMap = resolveRoleMap(createdRaw)
      if (!roleMap) {
        const afterCreate = await listAllInboxes()
        roleMap = resolveRoleMap(afterCreate)
      }
      if (!roleMap) {
        throw new Error("Nao consegui resolver as 3 novas inboxes apos criacao.")
      }

      await runSimulation(buildSmbTemplates(), "cenario SMB completo", roleMap, {
        reset: {
          deletedCount: deleted.length,
          deleteErrors,
          createdCount: createdRaw.length,
        },
      })
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
            Use esta pagina para resetar e popular um cenario de email SMB brasileira.
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
              onClick={resetAndRebuildScenario}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 disabled:opacity-60"
            >
              Resetar tudo + gerar 18 emails
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
            Cenario alvo: 3 inboxes (Fiscal, Compras, Vendas) e 18 emails realistas (6 por inbox).
          </p>
          {status ? <p className="mt-2 text-xs text-gray-600">{status}</p> : null}
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <div className="rounded-xl border bg-white p-4">
          <div className="mb-3 text-xs font-medium text-gray-600">Preview por inbox</div>
          {previews.length === 0 ? (
            <div className="text-xs text-gray-500">Sem preview ainda. Clique em "Resetar tudo + gerar 18 emails" para montar o cenario completo.</div>
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
