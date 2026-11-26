'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { novoId, type Item, type Opcao, type Propriedade, type Visao } from '@/products/notas/shared/bases'
import { notasApi, type BaseCompleta } from '../api'
import { useNotas } from '../NotasProvider'

/** Item mudou em outro lugar da tela (painel lateral, página do item): a base atualiza sem recarregar. */
export const EVENTO_ITEM = 'notas:item'
export type MudancaItem = { id: string; base_id: string; titulo?: string; icone?: string | null; propriedades?: Record<string, unknown>; arquivado?: boolean }
export const avisarItem = (mudanca: MudancaItem) => window.dispatchEvent(new CustomEvent(EVENTO_ITEM, { detail: mudanca }))

/** Estado de uma base: carrega, salva visões e esquema, cria e edita itens (a tela muda na hora; o servidor confirma). */
export function useBase(id: string) {
  const { avisar, recarregar: recarregarArvore } = useNotas()
  const [dados, setDados] = useState<BaseCompleta | null>(null)
  const [erro, setErro] = useState('')
  const atual = useRef<BaseCompleta | null>(null)
  useEffect(() => { atual.current = dados }, [dados])

  const carregar = useCallback(() => notasApi<BaseCompleta>(`/bases/${id}`).then(setDados).catch(e => setErro((e as Error).message)), [id])
  useEffect(() => {
    let ativo = true
    notasApi<BaseCompleta>(`/bases/${id}`).then(d => { if (ativo) setDados(d) }).catch(e => { if (ativo) setErro((e as Error).message) })
    return () => { ativo = false }
  }, [id])

  // Mudanças feitas no painel lateral ou na página do item.
  useEffect(() => {
    const ouvir = (e: Event) => {
      const m = (e as CustomEvent<MudancaItem>).detail
      if (m.base_id !== id) return
      setDados(d => d && {
        ...d, itens: m.arquivado ? d.itens.filter(i => i.id !== m.id) : d.itens.map(i => i.id !== m.id ? i : {
          ...i, ...(m.titulo !== undefined ? { titulo: m.titulo } : {}), ...(m.icone !== undefined ? { icone: m.icone } : {}),
          ...(m.propriedades ? { propriedades: m.propriedades } : {}),
        }),
      })
    }
    window.addEventListener(EVENTO_ITEM, ouvir)
    return () => window.removeEventListener(EVENTO_ITEM, ouvir)
  }, [id])

  const falhar = useCallback((e: unknown) => { avisar((e as Error).message); void carregar() }, [avisar, carregar])

  /** Esquema e/ou visões. Mudança de esquema volta com os itens convertidos pelo servidor. */
  const salvarBase = useCallback(async (mudanca: { esquema?: Propriedade[]; visoes?: Visao[] }) => {
    setDados(d => d && { ...d, base: { ...d.base, ...mudanca } })
    try { setDados(await notasApi<BaseCompleta>(`/bases/${id}`, { method: 'PATCH', json: mudanca })) } catch (e) { falhar(e) }
  }, [id, falhar])

  const mudarVisao = useCallback((visaoId: string, mudanca: Partial<Visao>) => {
    const d = atual.current; if (!d) return
    void salvarBase({ visoes: d.base.visoes.map(v => v.id === visaoId ? { ...v, ...mudanca } : v) })
  }, [salvarBase])

  const mudarPropriedade = useCallback((propId: string, mudanca: Partial<Propriedade>) => {
    const d = atual.current; if (!d) return
    void salvarBase({ esquema: d.base.esquema.map(p => p.id === propId ? { ...p, ...mudanca } : p) })
  }, [salvarBase])

  /** Nova opção numa seleção/status (digitada na célula); devolve o id para já marcar no item. */
  const criarOpcao = useCallback(async (propId: string, nome: string) => {
    const d = atual.current; if (!d) return null
    const prop = d.base.esquema.find(p => p.id === propId); if (!prop) return null
    const cores = ['cinza', 'marrom', 'laranja', 'amarelo', 'verde', 'azul', 'roxo', 'rosa', 'vermelho'] as const
    const opcao: Opcao = { id: novoId(), nome: nome.trim().slice(0, 100), cor: cores[Math.floor(Math.random() * cores.length)], ...(prop.tipo === 'status' ? { grupo: 'a_fazer' as const } : {}) }
    await salvarBase({ esquema: d.base.esquema.map(p => p.id === propId ? { ...p, opcoes: [...(p.opcoes ?? []), opcao] } : p) })
    return opcao.id
  }, [salvarBase])

  const novoItem = useCallback(async (valores: Record<string, unknown> = {}, posicao?: number, titulo = '', extra: { modelo_id?: string; e_modelo?: boolean } = {}) => {
    try {
      const item = await notasApi<Item>(`/bases/${id}/itens`, { method: 'POST', json: { propriedades: valores, ...(posicao !== undefined ? { posicao } : {}), titulo, ...extra } })
      setDados(d => d && { ...d, itens: [...d.itens, item] })
      return item
    } catch (e) { avisar((e as Error).message); return null }
  }, [id, avisar])

  const mudarItem = useCallback(async (itemId: string, mudanca: { titulo?: string; propriedades?: Record<string, unknown>; posicao?: number }) => {
    setDados(d => d && {
      ...d, itens: d.itens.map(i => i.id !== itemId ? i : {
        ...i, ...(mudanca.titulo !== undefined ? { titulo: mudanca.titulo } : {}), ...(mudanca.posicao !== undefined ? { posicao: mudanca.posicao } : {}),
        propriedades: Object.fromEntries(Object.entries({ ...i.propriedades, ...mudanca.propriedades }).filter(([, v]) => v !== null && v !== false && !(Array.isArray(v) && !v.length))),
      }),
    })
    try {
      const salvo = await notasApi<Item>(`/itens/${itemId}`, { method: 'PATCH', json: mudanca })
      setDados(d => d && { ...d, itens: d.itens.map(i => i.id === itemId ? salvo : i) })
      if (mudanca.titulo !== undefined) void recarregarArvore()
    } catch (e) { falhar(e) }
  }, [falhar, recarregarArvore])

  const arquivarItem = useCallback(async (itemId: string) => {
    setDados(d => d && { ...d, itens: d.itens.filter(i => i.id !== itemId) })
    try {
      await notasApi(`/paginas/${itemId}`, { method: 'DELETE' })
      avisar('Item movido para a lixeira.', { rotulo: 'Desfazer', fazer: () => void notasApi(`/paginas/${itemId}/restaurar`, { method: 'POST' }).then(carregar) })
    } catch (e) { falhar(e) }
  }, [avisar, carregar, falhar])

  return { dados, erro, carregar, salvarBase, mudarVisao, mudarPropriedade, criarOpcao, novoItem, mudarItem, arquivarItem }
}
export type BaseApi = ReturnType<typeof useBase>
