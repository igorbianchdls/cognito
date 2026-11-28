'use client'

// Falar com as rotas do Analytics: erros viram a mensagem do servidor; listas e consultas como ganchos.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Consulta, Resultado } from '../shared/consulta'

export async function api<T>(caminho: string, init: { method?: string; json?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/analytics/${caminho}`, { method: init.method ?? (init.json ? 'POST' : 'GET'), cache: 'no-store',
    ...(init.json !== undefined ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(init.json) } : {}) })
  const corpo = await res.json().catch(() => ({})) as T & { erro?: string }
  if (!res.ok) throw new Error(corpo.erro ?? 'Não foi possível concluir.')
  return corpo
}

/** Uma lista salva (insights, painéis, coortes, flags, experimentos) do site. */
export function useLista<T>(recurso: string, propriedade: string | null | undefined) {
  const [itens, setItens] = useState<T[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const recarregar = useCallback(async () => {
    if (!propriedade) return
    try { setItens((await api<{ itens: T[] }>(`dados/${recurso}?propriedade=${propriedade}`)).itens); setErro(null) } catch (e) { setErro((e as Error).message) }
  }, [recurso, propriedade])
  useEffect(() => { const t = setTimeout(() => void recarregar(), 0); return () => clearTimeout(t) }, [recarregar])
  return { itens, erro, recarregar, setItens }
}

export const salvar = <T,>(recurso: string, dados: Record<string, unknown>, id?: string) =>
  api<T>(id ? `dados/${recurso}/${id}` : `dados/${recurso}`, { method: id ? 'PATCH' : 'POST', json: dados })
export const apagar = (recurso: string, id: string) => api(`dados/${recurso}/${id}`, { method: 'DELETE' })

/** Roda uma consulta (com uma pausa curta enquanto a pessoa monta) e guarda o último resultado. */
export function useConsulta(propriedade: string | null | undefined, consulta: Consulta | null, espera = 350) {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const chave = consulta ? JSON.stringify(consulta) : ''
  const ultimo = useRef(0)
  useEffect(() => {
    if (!propriedade || !chave) return
    const n = ++ultimo.current
    const t = setTimeout(() => {
      setCarregando(true)
      api<Resultado>('consulta', { json: { propriedade, consulta: JSON.parse(chave) } })
        .then(r => { if (n === ultimo.current) { setResultado(r); setErro(null) } })
        .catch(e => { if (n === ultimo.current) setErro((e as Error).message) })
        .finally(() => { if (n === ultimo.current) setCarregando(false) })
    }, espera)
    return () => clearTimeout(t)
  }, [propriedade, chave, espera])
  return { resultado, erro, carregando }
}

/** Uma leitura simples (catálogo, pessoas, mapa…), refeita quando o caminho muda. */
export function useLeitura<T>(caminho: string | null) {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    if (!caminho) return
    let vivo = true
    api<T>(caminho).then(d => { if (vivo) { setDados(d); setErro(null) } }).catch(e => { if (vivo) setErro((e as Error).message) })
    return () => { vivo = false }
  }, [caminho, versao])
  return { dados, erro, recarregar: () => setVersao(v => v + 1) }
}

/** Período dos últimos N dias até o fim de hoje, em ISO (o que as consultas pedem). */
export function ultimosDias(dias: number) {
  const ate = new Date(); ate.setHours(24, 0, 0, 0)
  const de = new Date(ate); de.setDate(de.getDate() - dias)
  return { de: de.toISOString(), ate: ate.toISOString() }
}
