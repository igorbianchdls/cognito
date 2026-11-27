'use client'

// Avisos das Notas (menção, comentário, atribuição, lembrete), num lugar só: a caixa de entrada das Notas, o sino do
// topo e a tela de Notificações leem daqui, então o número é o mesmo em todo lugar. Confere a cada minuto enquanto
// alguém na tela usa os avisos, e quando a aba volta a ficar visível.
import { useSyncExternalStore } from 'react'
import { tituloExibido } from '@/products/notas/shared/arvore'
import type { Pessoa } from './base/pessoas'
import { notasApi } from './api'

export type AvisoNotas = {
  id: string; tipo: 'mencao' | 'comentario' | 'atribuicao' | 'lembrete'; pagina_id: string | null; autor: string | null
  texto: string; lida_em: string | null; created_at: string; titulo: string | null; icone: string | null
}
type Caixa = { notificacoes: AvisoNotas[]; nao_lidas: number }

const VAZIA: Caixa = { notificacoes: [], nao_lidas: 0 }
let caixa: Caixa = VAZIA
let usando = 0
let relogio: ReturnType<typeof setInterval> | null = null
let pedido: Promise<void> | null = null
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach(o => o())

/** Busca de novo (pedidos ao mesmo tempo viram um só). Sem acesso às Notas, fica vazia e quieta. */
export function recarregarAvisos() {
  pedido ??= notasApi<Caixa>('/notificacoes').then(c => { caixa = c; avisar() }).catch(() => undefined).finally(() => { pedido = null })
  return pedido
}

const aoVoltar = () => { if (document.visibilityState === 'visible') void recarregarAvisos() }
function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  if (usando++ === 0) {
    void recarregarAvisos()
    relogio = setInterval(() => void recarregarAvisos(), 60_000)
    document.addEventListener('visibilitychange', aoVoltar)
  }
  return () => {
    ouvintes.delete(ouvinte)
    if (--usando === 0) { if (relogio) clearInterval(relogio); relogio = null; document.removeEventListener('visibilitychange', aoVoltar) }
  }
}

export const useAvisosNotas = () => useSyncExternalStore(assinar, () => caixa, () => VAZIA)

/** Marca como lidos (na hora na tela; o servidor confirma em seguida). */
export async function lerAvisos(ids: string[] | 'todas') {
  const agora = new Date().toISOString()
  const todas = ids === 'todas'
  caixa = {
    notificacoes: caixa.notificacoes.map(n => !n.lida_em && (todas || ids.includes(n.id)) ? { ...n, lida_em: agora } : n),
    nao_lidas: todas ? 0 : Math.max(0, caixa.nao_lidas - caixa.notificacoes.filter(n => !n.lida_em && ids.includes(n.id)).length),
  }
  avisar()
  await notasApi('/notificacoes', { method: 'PATCH', json: todas ? { todas: true } : { ids } }).catch(() => undefined)
  void recarregarAvisos()
}

/** "Ana mencionou você", "Bia comentou"… (o nome vem das pessoas da empresa). */
export function fraseDoAviso(n: AvisoNotas, pessoas: Pessoa[]) {
  const nome = pessoas.find(p => p.id === n.autor)?.nome ?? 'Alguém da equipe'
  return n.tipo === 'mencao' ? `${nome} mencionou você` : n.tipo === 'comentario' ? `${nome} comentou`
    : n.tipo === 'atribuicao' ? `${nome} atribuiu um item a você` : n.texto
}

/** Texto curto do aviso, para listas de notificações fora das Notas. */
export function resumoDoAviso(n: AvisoNotas) {
  const pagina = `${n.icone ? `${n.icone} ` : ''}${tituloExibido(n.titulo)}`
  return n.tipo === 'lembrete' || n.tipo === 'mencao' || !n.texto ? pagina : `${pagina}: “${n.texto}”`
}

