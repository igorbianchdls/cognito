'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { novoId, type Item, type Opcao, type Propriedade, type Visao } from '@/products/notas/shared/bases'
import { notasApi, type BaseCompleta } from '../api'
import { useNotas } from '../NotasProvider'

/** Item mudou em outro lugar da tela (painel lateral, página do item): a base atualiza sem recarregar. */
export const EVENTO_ITEM = 'notas:item'
export type MudancaItem = { id: string; base_id: string; titulo?: string; icone?: string | null; propriedades?: Record<string, unknown>; arquivado?: boolean; comentarios?: number }
export const avisarItem = (mudanca: MudancaItem) => window.dispatchEvent(new CustomEvent(EVENTO_ITEM, { detail: mudanca }))

/** Estado de uma base: carrega, salva visões e esquema, cria e edita itens (a tela muda na hora; o servidor confirma). */
export function useBase(id: string) {
  const { avisar, recarregar: recarregarArvore } = useNotas()
  const [dados, setDados] = useState<BaseCompleta | null>(null)
  const [erro, setErro] = useState('')
  const atual = useRef<BaseCompleta | null>(null)
  const fila = useRef<Promise<void>>(Promise.resolve())
  const pendentes = useRef(0)
  // Fechar a aba com mudança de coluna ainda gravando: o navegador pergunta antes de sair (senão ela se perde).
  useEffect(() => {
    const antesDeSair = (e: BeforeUnloadEvent) => { if (pendentes.current > 0) e.preventDefault() }
    window.addEventListener('beforeunload', antesDeSair)
    return () => window.removeEventListener('beforeunload', antesDeSair)
  }, [])
  useEffect(() => { atual.current = dados }, [dados])

  // Dois carregamentos ao mesmo tempo (fechar o item e outra mudança): vale só a resposta do pedido mais novo.
  const pedido = useRef(0)
  const carregar = useCallback(() => {
    const n = ++pedido.current
    return notasApi<BaseCompleta>(`/bases/${id}`).then(d => { if (n === pedido.current) setDados(d) }).catch(e => { if (n === pedido.current) setErro((e as Error).message) })
  }, [id])
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
          ...(m.propriedades ? { propriedades: m.propriedades } : {}), ...(m.comentarios !== undefined ? { comentarios: m.comentarios } : {}),
        }),
      })
    }
    window.addEventListener(EVENTO_ITEM, ouvir)
    return () => window.removeEventListener(EVENTO_ITEM, ouvir)
  }, [id])

  const falhar = useCallback((e: unknown) => { avisar((e as Error).message); void carregar() }, [avisar, carregar])

  /** Esquema e/ou visões. Mudança de esquema volta com os itens convertidos pelo servidor. */
  const salvarBase = useCallback(async (mudanca: { esquema?: Propriedade[]; visoes?: Visao[] }) => {
    if (mudanca.esquema?.some(p => p.reciproca === '__nova__')) {
      mudanca = { ...mudanca, esquema: await prepararRelacoes(mudanca.esquema, id, atual.current?.base.titulo ?? '', avisar) }
    }
    setDados(d => d && { ...d, base: { ...d.base, ...mudanca } })
    // Mudanças nas colunas vão em fila; células esperam a fila (uma coluna recém-criada já existe no servidor).
    const envio = fila.current.then(async () => {
      try { setDados(await notasApi<BaseCompleta>(`/bases/${id}`, { method: 'PATCH', json: mudanca })) } catch (e) { falhar(e) }
    })
    fila.current = envio
    pendentes.current++
    try { await envio } finally { pendentes.current-- }
  }, [id, falhar, avisar])

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
      await fila.current
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
      await fila.current
      const salvo = await notasApi<Item>(`/itens/${itemId}`, { method: 'PATCH', json: mudanca })
      setDados(d => d && { ...d, itens: d.itens.map(i => i.id === itemId ? { ...i, ...salvo } : i) })
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

/**
 * Relação nova "nos dois sentidos" (reciproca = "__nova__"): cria antes a propriedade espelho, na outra base ou nesta
 * (se a relação é com ela mesma), e devolve o esquema com os ids das duas pontas.
 */
export async function prepararRelacoes(esquemaNovo: Propriedade[], baseId: string, tituloBase: string, avisar: (t: string) => void) {
  const esquema: Propriedade[] = []
  for (const p of esquemaNovo) {
    if (p.reciproca !== '__nova__' || !p.baseRelacionada) { esquema.push(p); continue }
    const espelho: Propriedade = { id: novoId(), nome: p.baseRelacionada === baseId ? `${p.nome} (volta)` : tituloBase || 'Itens ligados', tipo: 'relacao', baseRelacionada: baseId, reciproca: p.id }
    if (p.baseRelacionada === baseId) { esquema.push({ ...p, reciproca: espelho.id }, espelho); continue }
    try {
      const outra = await notasApi<BaseCompleta>(`/bases/${p.baseRelacionada}?sem_itens=1`)
      let nome = espelho.nome
      while (outra.base.esquema.some(q => q.nome.toLowerCase() === nome.toLowerCase())) nome = `${nome} (2)`
      await notasApi(`/bases/${p.baseRelacionada}`, { method: 'PATCH', json: { esquema: [...outra.base.esquema, { ...espelho, nome }] } })
      esquema.push({ ...p, reciproca: espelho.id })
    } catch (e) { avisar(`A relação foi criada só nesta base: ${(e as Error).message}`); esquema.push({ ...p, reciproca: undefined }) }
  }
  return esquema
}
