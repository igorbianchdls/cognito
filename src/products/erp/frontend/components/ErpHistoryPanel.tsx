'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useErpResource } from '@/products/erp/frontend/hooks/useErpResource'
import { Button } from '@/components/ui/button'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'
import { operationalStateLabel } from '@/products/erp/shared/operationalStates'

type Row = Record<string, unknown>
const labels: Record<string, string> = {
  id: 'Identificação',
  evento: 'Evento',
  criado_em: 'Registrado em',
  responsavel_id: 'Responsável (identificação)',
  status_anterior: 'Situação anterior',
  status_novo: 'Nova situação',
  motivo: 'Motivo',
  versao: 'Versão',
  pagamento_id: 'Pagamento',
  parcela_id: 'Parcela',
  tipo: 'Tipo',
  provedor: 'Origem',
  estado_externo: 'Estado externo',
  valor: 'Valor',
  data_vencimento: 'Vencimento',
  cobranca_id: 'Cobrança',
  evento_externo_id: 'Identificação externa',
  ocorrido_em: 'Ocorrido em',
  recebido_em: 'Recebido em',
  processado_em: 'Conclusão do evento',
  processamento: 'Processamento',
  erro_mensagem: 'Motivo registrado',
  evento_cobranca_id: 'Evento recebido',
  status: 'Situação',
  tentativas: 'Tentativas',
  iniciado_em: 'Início',
  finalizado_em: 'Conclusão',
  resultado: 'Resultado',
  erro: 'Motivo registrado',
  historico_estados: 'Histórico de transições',
  canal: 'Canal',
  destinatario: 'Destinatário',
  agendada_em: 'Agendada para',
  enviada_em: 'Enviada em',
  entregue_em: 'Entregue em',
  visualizada_em: 'Visualizada em',
  numero_linha: 'Linha do arquivo',
  dados_normalizados: 'Dados reconhecidos',
  erros: 'Erros',
  registro_id: 'Registro criado',
  inicio_em: 'Início',
  termino_em: 'Término',
  termino_tipo: 'Condição de término',
  quantidade_ocorrencias: 'Quantidade prevista',
  proxima_competencia: 'Próxima ocorrência',
  gerado_ate: 'Gerado até',
  ativa: 'Ativa',
  pausada_em: 'Pausa',
  encerrada_em: 'Encerramento',
  frequencia: 'Frequência',
  intervalo: 'Intervalo',
  descricao: 'Descrição',
  data_competencia: 'Competência',
  conta_id: 'Título',
  lado: 'Lado',
  ocorrencias: 'Ocorrências',
  venda_id: 'Venda',
  compra_id: 'Compra',
  competencia: 'Competência',
  periodo_inicio: 'Início do período',
  periodo_fim: 'Fim do período',
  contrato_id: 'Contrato',
  recorrencia_id: 'Recorrência',
  nome_arquivo: 'Arquivo',
  total_linhas: 'Linhas',
  total_importadas: 'Importadas',
  total_erros: 'Erros',
  total_validas: 'Válidas',
  concluido_em: 'Conclusão',
}
export function historyValue(value: unknown): string {
  if (value == null || value === '') return 'Não registrado'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  const text = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text.split('-').reverse().join('/')
  if (/^\d{4}-\d{2}-\d{2}T/.test(text) && Number.isFinite(Date.parse(text)))
    return new Date(text).toLocaleString('pt-BR', { timeZone: 'America/Fortaleza' })
  return text.replaceAll('_', ' ')
}
export function HistoryRows({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section className="grid gap-3">
      <h3 className="font-semibold">{title}</h3>
      {rows.length ? (
        rows.map((row, index) => (
          <article key={`${row.id ?? index}-${row.lado ?? index}`} className="rounded border p-3">
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {Object.entries(row)
                .filter(([, v]) => v != null)
                .map(([key, value]) => (
                  <div key={key} className={typeof value === 'object' ? 'sm:col-span-2' : ''}>
                    <dt className="text-xs text-gray-500">
                      {labels[key] || key.replaceAll('_', ' ')}
                    </dt>
                    <dd className="whitespace-pre-wrap break-words">
                      <RecordedValue field={key} value={value} />
                    </dd>
                  </div>
                ))}
            </dl>
            {['receber','pagar'].includes(String(row.lado)) && row.id ? <Link className="mt-2 inline-block text-sm underline" href={`/erp/documentos/contas-${row.lado}/${row.id}`}>Histórico e anexos do título</Link> : null}
          </article>
        ))
      ) : (
        <p className="text-sm text-gray-500">Nenhum registro disponível.</p>
      )}
    </section>
  )
}

function RecordedValue({ field, value }: { field: string; value: unknown }) {
  const linkedKinds:Record<string,string>={venda_id:'vendas',saleId:'vendas',compra_id:'compras',purchaseId:'compras',contrato_id:'contratos',contractId:'contratos'}
  if(linkedKinds[field] && /^[1-9]\d*$/.test(String(value)))return <Link className="underline" href={`/erp/documentos/${linkedKinds[field]}/${value}`}>{String(value)} — histórico e anexos</Link>
  if (value !== null && typeof value === 'object')
    return (
      <details>
        <summary className="cursor-pointer">Ver detalhes registrados</summary>
        {Array.isArray(value) ? (
          value.length ? (
            <ol className="mt-2 grid list-inside list-decimal gap-2">
              {value.map((item, index) => (
                <li key={index}>
                  <RecordedValue field={field} value={item} />
                </li>
              ))}
            </ol>
          ) : (
            <p>Nenhum registro.</p>
          )
        ) : (
          <dl className="ml-3 grid gap-2 border-l pl-3">
            {Object.entries(value).map(([key, item]) => (
              <div key={key}>
                <dt className="text-gray-500">{labels[key] || key.replaceAll('_', ' ')}</dt>
                <dd>
                  <RecordedValue field={key} value={item} />
                </dd>
              </div>
            ))}
          </dl>
        )}
      </details>
    )
  return (
    <>
      {['status', 'status_anterior', 'status_novo', 'estado_externo', 'processamento'].includes(
        field,
      )
        ? operationalStateLabel(value)
        : historyValue(value)}
    </>
  )
}

export function ErpHistoryPanel({ kind, id }: { kind: string; id: string }) {
  return <DocumentHistoryContent key={`${kind}:${id}`} kind={kind} id={id} />
}
function DocumentHistoryContent({ kind, id }: { kind: string; id: string }) {
  const [page, setPage] = useState(1),
    [retry, setRetry] = useState(0),
    [fileError, setFileError] = useState('')
  const { data, error, loading } = useErpResource<{
    events: Row[]
    files: Row[]
    hasMore: boolean
  }>(`/api/erp/historicos/${kind}/${id}?page=${page}&retry=${retry}`)
  async function openFile(file: Row, download: boolean) {
    setFileError('')
    try {
      const result = await parseErpResponse<{ url: string }>(
        await fetch(
          `/api/erp/historicos/${kind}/${id}?arquivo=${file.id}&download=${download ? 1 : 0}`,
          { cache: 'no-store' },
        ),
      )
      const a = document.createElement('a')
      a.href = result.url
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      a.click()
    } catch (e) {
      setFileError(e instanceof Error ? e.message : 'Anexo indisponível.')
    }
  }
  return (
    <div className="grid gap-5 border-t pt-4" aria-busy={loading}>
      {loading ? (
        <p role="status">Carregando histórico e anexos…</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => setRetry((v) => v + 1)}>
            Tentar novamente
          </Button>
        </div>
      ) : data ? (
        <>
          <HistoryRows title="Histórico do documento" rows={data.events} />
          <section className="grid gap-3">
            <h3 className="font-semibold">Anexos</h3>
            {fileError ? (
              <p role="alert" className="text-red-700">
                {fileError}
              </p>
            ) : null}
            {data.files.length ? (
              data.files.map((file) => (
                <article key={String(file.id)} className="rounded border p-3 text-sm">
                  <p className="font-medium">{String(file.nome)}</p>
                  <p>
                    {String(file.mime_type || 'Tipo não informado')} ·{' '}
                    {file.tamanho_bytes == null
                      ? 'Tamanho não registrado'
                      : `${Number(file.tamanho_bytes).toLocaleString('pt-BR')} bytes`}
                  </p>
                  <p>
                    {historyValue(file.criado_em)}
                    {file.descricao ? ` · ${file.descricao}` : ''}
                  </p>
                  {file.disponivel ? (
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void openFile(file, false)}
                      >
                        Visualizar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void openFile(file, true)}>
                        Baixar
                      </Button>
                    </div>
                  ) : (
                    <p>Anexo indisponível.</p>
                  )}
                </article>
              ))
            ) : (
              <p className="text-sm text-gray-500">Nenhum anexo registrado.</p>
            )}
          </section>
          <div className="flex items-center gap-3">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span>Página {page}</span>
            <Button
              variant="outline"
              disabled={!data.hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </>
      ) : null}
    </div>
  )
}

export function ErpBillingHistory({ installmentId }: { installmentId: string }) {
  const [page, setPage] = useState(1),
    [retry, setRetry] = useState(0)
  const { data, error } = useErpResource<{
    charges: Row[]
    events: Row[]
    executions: Row[]
    notifications: Row[]
    hasMore: boolean
  }>(`/api/erp/historicos/cobrancas/${installmentId}?page=${page}&retry=${retry}`)
  return (
    <section className="grid gap-4 border-t pt-4">
      <h3 className="font-semibold">Cobranças e notificações</h3>
      <p className="text-sm text-gray-500">
        O estado externo da cobrança é separado da liquidação financeira. Esta consulta não envia
        notificações.
      </p>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
            Tentar novamente
          </Button>
        </div>
      ) : data ? (
        <>
          <HistoryRows title="Cobranças" rows={data.charges} />
          <HistoryRows title="Eventos recebidos" rows={data.events} />
          <HistoryRows title="Processamento interno" rows={data.executions} />
          <HistoryRows title="Notificações e tentativas" rows={data.notifications} />
          <div className="flex gap-3">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span>Página {page}</span>
            <Button
              variant="outline"
              disabled={!data.hasMore}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </>
      ) : (
        <p role="status">Carregando cobranças…</p>
      )}
    </section>
  )
}
