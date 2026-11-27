'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Espaco, PaginaResumo } from '@/products/notas/shared/arvore'
import { ErroNotas, notasApi, type Arvore, type Pagina } from './api'
import { ABRIR_GAVETA_NOTAS } from './eventos'
import { useLocal } from './local'

type Estado = {
  arvore: Arvore | null
  erro: string
  /** O banco ainda não tem as tabelas das Notas: a tela mostra "em preparação". */
  preparacao: boolean
  recarregar: () => Promise<void>
  /** Atualiza a página na árvore sem ir ao servidor (título e ícone enquanto a pessoa digita). */
  ajustarLocal: (id: string, campos: Partial<PaginaResumo>) => void
  criar: (destino: { parent_id?: string | null; espaco?: Espaco }) => Promise<void>
  arquivar: (id: string) => Promise<void>
  duplicar: (id: string) => Promise<void>
  mover: (id: string, destino: { parent_id: string | null; espaco: Espaco; posicao: number }) => Promise<void>
  favoritar: (id: string, favorita: boolean) => Promise<void>
  /** Renomeia pela barra lateral. Se a página está aberta, quem grava é ela (mesma fila de salvamento, sem conflito). */
  renomear: (id: string, titulo: string) => Promise<void>
  aviso: Aviso | null
  /** Mensagem rápida no canto; com ação ("Desfazer"), fica um pouco mais na tela. */
  avisar: (texto: string, acao?: { rotulo: string; fazer: () => void }) => void
  buscaAberta: boolean
  setBuscaAberta: (aberta: boolean) => void
  /** Barra lateral recolhida (o botão de mostrar fica no topo da página, como no Notion). */
  recolhida: boolean
  setRecolhida: (recolhida: boolean) => void
}

export type Aviso = { texto: string; acao?: { rotulo: string; fazer: () => void }; n: number }

/** A página aberta escuta este evento para renomear pela própria fila de salvamento. */
export const EVENTO_RENOMEAR = 'notas:renomear'

const CELULAR = '(max-width: 700px)'
const assinarCelular = (avisar: () => void) => { const m = window.matchMedia(CELULAR); m.addEventListener('change', avisar); return () => m.removeEventListener('change', avisar) }

const Contexto = createContext<Estado | null>(null)
export const useNotas = () => {
  const estado = useContext(Contexto)
  if (!estado) throw new Error('useNotas fora do NotasProvider')
  return estado
}

/** Estado das Notas compartilhado entre a barra lateral e a página: a árvore, favoritos, recentes e as ações. */
export function NotasProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [arvore, setArvore] = useState<Arvore | null>(null)
  const [erro, setErro] = useState('')
  const [preparacao, setPreparacao] = useState(false)
  const falhou = useCallback((e: unknown) => { setErro((e as Error).message); if (e instanceof ErroNotas && e.preparacao) setPreparacao(true) }, [])
  const [aviso, setAvisoBruto] = useState<Aviso | null>(null)
  const setAviso = useCallback((texto: string, acao?: Aviso['acao']) => setAvisoBruto(a => texto ? { texto, acao, n: (a?.n ?? 0) + 1 } : null), [])
  const [buscaAberta, setBuscaAberta] = useState(false)
  // No computador, recolher a barra é uma preferência guardada; no celular a barra é uma gaveta que começa fechada.
  const [recolhidaSalva, salvarRecolhida] = useLocal('notas:recolhida', false)
  const celular = useSyncExternalStore(assinarCelular, () => window.matchMedia(CELULAR).matches, () => false)
  const [gaveta, setGaveta] = useState(false)
  const recolhida = celular ? !gaveta : recolhidaSalva
  const setRecolhida = useCallback((v: boolean) => { if (celular) setGaveta(!v); else salvarRecolhida(v) }, [celular, salvarRecolhida])
  useEffect(() => {
    const abrir = () => setGaveta(true)
    window.addEventListener(ABRIR_GAVETA_NOTAS, abrir)
    return () => window.removeEventListener(ABRIR_GAVETA_NOTAS, abrir)
  }, [])

  const recarregar = useCallback(async () => {
    try { setArvore(await notasApi<Arvore>('/arvore')); setErro('') } catch (e) { falhou(e) }
  }, [falhou])
  useEffect(() => {
    let ativo = true
    notasApi<Arvore>('/arvore').then(a => { if (ativo) { setArvore(a); setErro('') } }).catch(e => { if (ativo) falhou(e) })
    return () => { ativo = false }
  }, [falhou])
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAvisoBruto(null), aviso.acao ? 6000 : 2800); return () => clearTimeout(t) }, [aviso])

  const ajustarLocal = useCallback((id: string, campos: Partial<PaginaResumo>) => {
    setArvore(a => a && { ...a, paginas: a.paginas.map(p => p.id === id ? { ...p, ...campos } : p) })
  }, [])

  const acao = useCallback(async (fazer: () => Promise<unknown>, depois?: () => void) => {
    try { await fazer(); depois?.(); await recarregar() } catch (e) { setAviso((e as Error).message) }
  }, [recarregar, setAviso])

  const valor = useMemo<Estado>(() => ({
    arvore, erro, preparacao, recarregar, ajustarLocal, aviso, avisar: setAviso, buscaAberta, setBuscaAberta, recolhida, setRecolhida,
    criar: async destino => {
      try {
        const nova = await notasApi<Pagina>('/paginas', { method: 'POST', json: destino })
        await recarregar(); router.push(`/notas/${nova.id}`)
      } catch (e) { setAviso((e as Error).message) }
    },
    arquivar: id => acao(() => notasApi(`/paginas/${id}`, { method: 'DELETE' }), () => setAviso('Página movida para a lixeira.', {
      rotulo: 'Desfazer',
      fazer: () => void acao(() => notasApi(`/paginas/${id}/restaurar`, { method: 'POST' }), () => { setAviso('Página restaurada.'); router.refresh() }),
    })),
    duplicar: async id => {
      try { const copia = await notasApi<Pagina>(`/paginas/${id}/duplicar`, { method: 'POST' }); await recarregar(); router.push(`/notas/${copia.id}`) }
      catch (e) { setAviso((e as Error).message) }
    },
    mover: (id, destino) => acao(() => notasApi(`/paginas/${id}/mover`, { method: 'POST', json: destino })),
    renomear: async (id, titulo) => {
      ajustarLocal(id, { titulo })
      const aberta = new CustomEvent<{ id: string; titulo: string; tratado: boolean }>(EVENTO_RENOMEAR, { detail: { id, titulo, tratado: false } })
      window.dispatchEvent(aberta)
      if (!aberta.detail.tratado) await acao(() => notasApi(`/paginas/${id}`, { method: 'PATCH', json: { titulo } }))
    },
    favoritar: (id, favorita) => acao(() => notasApi(`/paginas/${id}/favorito`, { method: favorita ? 'PUT' : 'DELETE' })),
  }), [arvore, erro, preparacao, recarregar, ajustarLocal, aviso, setAviso, buscaAberta, recolhida, setRecolhida, router, acao])

  // Atalhos do Notion: Ctrl+K busca, Ctrl+\\ mostra/esconde a barra lateral, Ctrl+Alt+N nova página.
  // (Ctrl+Shift+N é do navegador — janela anônima —, por isso a nova página usa Ctrl+Alt+N.)
  useEffect(() => {
    const atalho = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const tecla = e.key.toLowerCase()
      if (tecla === 'k' && !e.altKey) { e.preventDefault(); setBuscaAberta(true) }
      else if (e.key === '\\') { e.preventDefault(); setRecolhida(!recolhida) }
      else if (e.altKey && (tecla === 'n' || e.code === 'KeyN')) { e.preventDefault(); void valor.criar({ espaco: arvore?.pode_editar_equipe === false ? 'particular' : 'equipe' }) }
    }
    // Na captura: roda antes do atalho do Otto (busca geral), que vê o evento já tratado e não abre uma segunda busca.
    window.addEventListener('keydown', atalho, true)
    return () => window.removeEventListener('keydown', atalho, true)
  }, [recolhida, setRecolhida, valor, arvore?.pode_editar_equipe])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
