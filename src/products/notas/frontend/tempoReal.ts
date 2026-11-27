'use client'

// Tempo real das Notas no navegador: o transporte das mensagens (Supabase Realtime, em canal privado com a sessão do
// Clerk; ou BroadcastChannel nos testes de tela) e o gancho da edição simultânea de uma página.
import { useEffect, useState } from 'react'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { deBase64, Sincronizador, type Transporte } from '@/products/notas/shared/colaboracao'

type ClerkGlobal = { session?: { getToken: () => Promise<string | null> } | null }
let cliente: SupabaseClient | undefined
function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !chave) return null
  cliente ??= createClient(url, chave, {
    async accessToken() {
      const clerk = (globalThis as { Clerk?: ClerkGlobal }).Clerk
      try { return (await clerk?.session?.getToken()) ?? null } catch { return null }
    },
  })
  return cliente
}

/** Um canal de mensagens. Sem Realtime configurado, devolve um canal mudo (a página continua salvando normalmente). */
export function abrirCanal(topico: string): Transporte {
  if (process.env.NEXT_PUBLIC_NOTAS_TEMPO_REAL === 'local' && typeof BroadcastChannel !== 'undefined') {
    const canal = new BroadcastChannel(topico)
    return {
      enviar: (evento, dados) => canal.postMessage({ evento, dados }),
      ouvir: f => { const ouvir = (e: MessageEvent) => f(e.data.evento, e.data.dados); canal.addEventListener('message', ouvir); return () => canal.removeEventListener('message', ouvir) },
      fechar: () => canal.close(),
    }
  }
  const db = supabase()
  if (!db) return { enviar: () => undefined, ouvir: () => () => undefined, fechar: () => undefined }
  // "notas-<chave>": canal cujo nome só o servidor sabe gerar (entregue a quem pode editar); os demais, privados.
  const canal = db.channel(topico, { config: { private: !topico.startsWith('notas-'), broadcast: { self: false } } })
  const fila: [string, string][] = []
  let conectado = false
  let ouvinte: ((e: string, d: string) => void) | null = null
  canal.on('broadcast', { event: '*' }, ({ event, payload }) => ouvinte?.(event, (payload as { d: string }).d))
  canal.subscribe(situacao => {
    if (situacao !== 'SUBSCRIBED') return
    conectado = true
    for (const [evento, dados] of fila.splice(0)) void canal.send({ type: 'broadcast', event: evento, payload: { d: dados } })
  })
  return {
    enviar: (evento, dados) => {
      if (conectado) void canal.send({ type: 'broadcast', event: evento, payload: { d: dados } })
      else if (fila.length < 50) fila.push([evento, dados])
    },
    ouvir: f => { ouvinte = f; return () => { ouvinte = null } },
    fechar: () => { void db.removeChannel(canal) },
  }
}

export type Presente = { id: string; nome: string; cor: string; clientId: number }
const CORES = ['#e03e3e', '#d9730d', '#dfab01', '#0f7b6c', '#0b6e99', '#6940a5', '#ad1a72', '#64473a']
export const corDaPessoa = (id: string) => CORES[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % CORES.length]

/**
 * Edição simultânea de uma página: o documento (começa com o estado salvo no servidor), a presença e o sincronizador
 * ligado ao canal da página nesta geração do documento.
 */
export function useColaboracao(paginaId: string, geracao: number, estado: string | null | undefined, pessoa: { id: string; nome: string }, canal?: string | null) {
  const [base] = useState(() => {
    const doc = new Y.Doc()
    if (estado) Y.applyUpdate(doc, deBase64(estado))
    return { doc, awareness: new Awareness(doc) }
  })
  const [sincronizador, setSincronizador] = useState<Sincronizador | null>(null)
  const [presentes, setPresentes] = useState<Presente[]>([])

  useEffect(() => {
    base.awareness.setLocalStateField('user', { id: pessoa.id, name: pessoa.nome, color: corDaPessoa(pessoa.id) })
  }, [base, pessoa.id, pessoa.nome])

  useEffect(() => {
    // Sem canal (quem só visualiza): documento sem tempo real; as mudanças aparecem ao abrir de novo.
    const transporte: Transporte = canal ? abrirCanal(canal) : { enviar: () => undefined, ouvir: () => () => undefined, fechar: () => undefined }
    const s = new Sincronizador(base.doc, transporte, base.awareness)
    const atualizar = () => setPresentes([...base.awareness.getStates().entries()]
      .filter(([id, estado]) => id !== base.doc.clientID && (estado as { user?: unknown }).user)
      .map(([clientId, estado]) => { const u = (estado as { user: { id: string; name: string; color: string } }).user; return { id: u.id, nome: u.name, cor: u.color, clientId } }))
    base.awareness.on('change', atualizar)
    const t = setTimeout(() => setSincronizador(s), 0)
    return () => { clearTimeout(t); base.awareness.off('change', atualizar); s.destruir() }
  }, [base, paginaId, geracao, canal])

  useEffect(() => () => base.awareness.destroy(), [base])
  return { doc: base.doc, awareness: base.awareness, fragment: base.doc.getXmlFragment('conteudo'), sincronizador, presentes }
}
export type Colaboracao = ReturnType<typeof useColaboracao>
