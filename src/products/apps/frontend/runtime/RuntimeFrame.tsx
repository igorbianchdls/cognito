'use client'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { AppsError, recordSchema, uuid, validateData, type App, type AppPackage, type DataRecord } from '../../shared/contracts'
import { send, type AppsApi } from '../client'
import { buildDocument } from './document'

export type RuntimeBundle = { app: App; pacote: AppPackage; versaoId: string; modo: string; token: string | null }
const messageSchema = z.object({ id: z.number().int().positive(), operacao: z.enum(['listar', 'salvar', 'excluir']), colecao: z.string().max(50), pagina: z.number().int().min(1).max(10000).optional(), registro: recordSchema.optional(), registroId: uuid.optional(), expectedVersion: z.number().int().positive().optional() }).strict()
// Tables requests are validated again on the server; here only the shape and size are checked.
const tablesMessageSchema = z.object({ id: z.number().int().positive(), canal: z.literal('tabelas'), fonte: z.string().max(50), operacao: z.enum(['campos', 'listar', 'obter', 'criar', 'editar', 'resumir']), registroId: uuid.optional(), valores: z.record(z.unknown()).optional(), expectedVersion: z.number().int().positive().optional(), busca: z.string().max(500).optional(), filtros: z.array(z.unknown()).max(30).optional(), ordenacao: z.array(z.unknown()).max(5).optional(), pagina: z.number().int().min(1).max(100000).optional(), tamanho: z.number().int().min(1).max(100).optional(), agrupar_por: z.string().max(200).optional(), periodo: z.enum(['dia', 'mes', 'ano']).optional(), metricas: z.array(z.unknown()).max(10).optional() }).strict()
export default function RuntimeFrame({ bundle, api }: { bundle: RuntimeBundle; api: AppsApi }) {
  const ref = useRef<HTMLIFrameElement>(null), [error, setError] = useState(''), [ready, setReady] = useState(false)
  useEffect(() => {
    const frame = ref.current; if (!frame) return
    const session = crypto.randomUUID(), nonce = crypto.randomUUID().replaceAll('-', '')
    let channel: MessageChannel | undefined, connected = false, disposed = false, requests = 0, windowStart = Date.now(), queue = Promise.resolve()
    const records = new Map<string, DataRecord[]>()
    const timeout = window.setTimeout(() => { if (!disposed && !connected) setError('A prévia não iniciou. Confira os arquivos do app.') }, 12000)
    async function preview(data: z.infer<typeof messageSchema>) {
      const collection = bundle.pacote.manifesto.colecoes.find(c => c.chave === data.colecao)
      if (!collection) throw new AppsError('NOT_FOUND', 'Coleção não encontrada.')
      const list = records.get(collection.id) ?? []; records.set(collection.id, list)
      if (data.operacao === 'listar') { const page = data.pagina ?? 1; return { registros: list.slice((page - 1) * 50, page * 50), total: list.length, pagina: page } }
      if (data.operacao === 'salvar') {
        if (!data.registro) throw Error('Informe os dados.')
        const values = validateData(collection, data.registro.dados)
        if (data.registro.id) {
          const r = list.find(v => v.id === data.registro!.id)
          if (!r || r.versao_concorrencia !== data.registro.expectedVersion) throw Error('O registro mudou.')
          r.dados = values; r.versao_concorrencia++; return { registro: r }
        }
        const record = { id: crypto.randomUUID(), dados: values, versao_concorrencia: 1 }; list.push(record); return { registro: record }
      }
      const index = list.findIndex(r => r.id === data.registroId && r.versao_concorrencia === data.expectedVersion)
      if (index < 0) throw Error('O registro mudou.')
      list.splice(index, 1); return { ok: true }
    }
    function connect(e: MessageEvent) {
      if (disposed || connected || e.source !== frame!.contentWindow || e.data?.type !== 'otto:ready' || e.data?.session !== session) return
      connected = true; clearTimeout(timeout); channel = new MessageChannel()
      channel.port1.onmessage = e => {
        if (e.data?.type === 'ready') { setReady(true); return }
        if (Date.now() - windowStart > 60_000) { requests = 0; windowStart = Date.now() }
        const tables = e.data?.canal === 'tabelas'
        const parsed = tables ? tablesMessageSchema.safeParse(e.data) : messageSchema.safeParse(e.data)
        if (!parsed.success || JSON.stringify(e.data).length > 64_000 || ++requests > 120) { channel?.port1.postMessage({ id: e.data?.id, error: 'Solicitação inválida ou muitas operações. Aguarde.' }); return }
        if (parsed.data && 'canal' in parsed.data) {
          const { id, canal, registroId, ...request } = parsed.data; void canal
          queue = queue.then(async () => {
            if (disposed) return
            try {
              // Preview reads and writes real Tables data with the editor's permissions.
              const result = await api(`/${bundle.app.id}/tabelas`, send('POST', { ...request, ...(registroId ? { id: registroId } : {}), ...(bundle.modo === 'previa' ? { versao: bundle.versaoId } : { token: bundle.token }) }))
              if (!disposed) channel?.port1.postMessage({ id, result })
            } catch (e) { if (!disposed) channel?.port1.postMessage({ id, error: e instanceof Error ? e.message : 'Falha na operação.' }) }
          })
          return
        }
        const data = parsed.data as z.infer<typeof messageSchema>
        queue = queue.then(async () => {
          if (disposed) return
          try {
            const result = bundle.modo === 'previa' ? await preview(data) : await api(`/${bundle.app.id}/dados`, send('POST', { token: bundle.token, colecao: data.colecao, operacao: data.operacao, pagina: data.pagina ?? 1, ...(data.registro ? { registro: data.registro } : {}), ...(data.registroId ? { id: data.registroId } : {}), ...(data.expectedVersion ? { expectedVersion: data.expectedVersion } : {}) }))
            if (!disposed) channel?.port1.postMessage({ id: data.id, result })
          } catch (e) { if (!disposed) channel?.port1.postMessage({ id: data.id, error: e instanceof Error ? e.message : 'Falha na operação.' }) }
        })
      }
      channel.port1.start(); frame!.contentWindow?.postMessage({ type: 'otto:connect', session }, '*', [channel.port2])
    }
    window.addEventListener('message', connect)
    frame.srcdoc = buildDocument(bundle.pacote, session, nonce)
    return () => { disposed = true; clearTimeout(timeout); window.removeEventListener('message', connect); channel?.port1.close(); channel?.port2.close(); frame.srcdoc = '' }
  }, [bundle, api])
  return <div className="apps-runtime"><div className="apps-runtime-status">{bundle.modo === 'previa' ? (bundle.pacote.manifesto.tabelas?.length ? 'Prévia · coleções do app são temporárias; as tabelas do Tables usam dados reais' : 'Prévia · os dados são temporários e serão descartados ao sair') : 'Versão publicada · dados da empresa'}<span role="status">{error || (ready ? 'Conectado' : 'Iniciando…')}</span></div><iframe ref={ref} title={bundle.app.nome} sandbox="allow-scripts allow-forms" referrerPolicy="no-referrer" className="apps-frame" /></div>
}
