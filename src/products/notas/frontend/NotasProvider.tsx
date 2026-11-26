'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { Espaco, PaginaResumo } from '@/products/notas/shared/arvore'
import { notasApi, type Arvore, type Pagina } from './api'
import { useLocal } from './local'

type Estado = {
  arvore: Arvore | null
  erro: string
  recarregar: () => Promise<void>
  /** Atualiza a página na árvore sem ir ao servidor (título e ícone enquanto a pessoa digita). */
  ajustarLocal: (id: string, campos: Partial<PaginaResumo>) => void
  criar: (destino: { parent_id?: string | null; espaco?: Espaco }) => Promise<void>
  arquivar: (id: string) => Promise<void>
  duplicar: (id: string) => Promise<void>
  mover: (id: string, destino: { parent_id: string | null; espaco: Espaco; posicao: number }) => Promise<void>
  favoritar: (id: string, favorita: boolean) => Promise<void>
  aviso: string
  avisar: (texto: string) => void
  buscaAberta: boolean
  setBuscaAberta: (aberta: boolean) => void
  /** Barra lateral recolhida (o botão de mostrar fica no topo da página, como no Notion). */
  recolhida: boolean
  setRecolhida: (recolhida: boolean) => void
}

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
  const [aviso, setAviso] = useState('')
  const [buscaAberta, setBuscaAberta] = useState(false)
  const [recolhida, setRecolhida] = useLocal('notas:recolhida', false)

  const recarregar = useCallback(async () => {
    try { setArvore(await notasApi<Arvore>('/arvore')); setErro('') } catch (e) { setErro((e as Error).message) }
  }, [])
  useEffect(() => {
    let ativo = true
    notasApi<Arvore>('/arvore').then(a => { if (ativo) { setArvore(a); setErro('') } }).catch(e => { if (ativo) setErro((e as Error).message) })
    return () => { ativo = false }
  }, [])
  useEffect(() => { if (!aviso) return; const t = setTimeout(() => setAviso(''), 2800); return () => clearTimeout(t) }, [aviso])

  // Ctrl+K / Cmd+K abre a busca, como no Notion.
  useEffect(() => {
    const atalho = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setBuscaAberta(true) } }
    window.addEventListener('keydown', atalho)
    return () => window.removeEventListener('keydown', atalho)
  }, [])

  const ajustarLocal = useCallback((id: string, campos: Partial<PaginaResumo>) => {
    setArvore(a => a && { ...a, paginas: a.paginas.map(p => p.id === id ? { ...p, ...campos } : p) })
  }, [])

  const acao = useCallback(async (fazer: () => Promise<unknown>, depois?: () => void) => {
    try { await fazer(); depois?.(); await recarregar() } catch (e) { setAviso((e as Error).message) }
  }, [recarregar])

  const valor = useMemo<Estado>(() => ({
    arvore, erro, recarregar, ajustarLocal, aviso, avisar: setAviso, buscaAberta, setBuscaAberta, recolhida, setRecolhida,
    criar: async destino => {
      try {
        const nova = await notasApi<Pagina>('/paginas', { method: 'POST', json: destino })
        await recarregar(); router.push(`/notas/${nova.id}`)
      } catch (e) { setAviso((e as Error).message) }
    },
    arquivar: id => acao(() => notasApi(`/paginas/${id}`, { method: 'DELETE' }), () => setAviso('Página movida para a lixeira.')),
    duplicar: async id => {
      try { const copia = await notasApi<Pagina>(`/paginas/${id}/duplicar`, { method: 'POST' }); await recarregar(); router.push(`/notas/${copia.id}`) }
      catch (e) { setAviso((e as Error).message) }
    },
    mover: (id, destino) => acao(() => notasApi(`/paginas/${id}/mover`, { method: 'POST', json: destino })),
    favoritar: (id, favorita) => acao(() => notasApi(`/paginas/${id}/favorito`, { method: favorita ? 'PUT' : 'DELETE' })),
  }), [arvore, erro, recarregar, ajustarLocal, aviso, buscaAberta, recolhida, setRecolhida, router, acao])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
