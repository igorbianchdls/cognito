'use client'

import { useEffect, useState } from 'react'
import { erpJson } from './commercialUi'
import { currency } from './salesWorkspaceModel'

type Credito = { em_aberto: number; vencido: number; limite_credito: number | null; disponivel: number | null; bloqueado: boolean; motivo_bloqueio: string | null }

// Crédito do cliente escolhido (VD-21, VD-22): o vendedor vê em aberto, vencido e disponível antes de confirmar,
// sem acesso aos títulos do financeiro.
export function CustomerCreditHint({ customerId }: { customerId: string }) {
  // Guarda o cliente junto do resultado: ao trocar de cliente, o resumo antigo some sem precisar limpar o estado.
  const [loaded, setLoaded] = useState<{ id: string; credito: Credito | null } | null>(null)
  useEffect(() => {
    if (!customerId) return
    let active = true
    erpJson<{ credito: Credito }>(`/api/erp/catalogos/credito-cliente?cliente_id=${encodeURIComponent(customerId)}`)
      .then(result => { if (active) setLoaded({ id: customerId, credito: result.credito }) })
      .catch(() => { if (active) setLoaded({ id: customerId, credito: null }) })
    return () => { active = false }
  }, [customerId])
  const credito = loaded && loaded.id === customerId ? loaded.credito : null
  if (!credito) return null
  const partes = [`Em aberto ${currency(credito.em_aberto)}`]
  if (credito.vencido > 0) partes.push(`vencido ${currency(credito.vencido)}`)
  partes.push(credito.limite_credito == null ? 'sem limite de crédito' : `limite ${currency(credito.limite_credito)} · disponível ${currency(credito.disponivel ?? 0)}`)
  const alerta = credito.bloqueado || credito.vencido > 0 || (credito.disponivel != null && credito.disponivel <= 0)
  return <p className={`text-xs ${alerta ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`} role="status">
    {credito.bloqueado ? `Cliente bloqueado${credito.motivo_bloqueio ? `: ${credito.motivo_bloqueio}` : ''}. ` : ''}{partes.join(' · ')}
  </p>
}
