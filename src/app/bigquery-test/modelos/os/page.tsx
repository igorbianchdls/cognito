'use client'

import { useMemo, useState } from 'react'

type LinhaItem = {
  descricao: string
  quantidade: number
  valorUnitario: number
}

type OsParams = {
  numero: string
  dataAbertura: string
  dataExecucao: string
  status: string
  prioridade: string
  tecnicoResponsavel: string
  solicitante: string
  clienteNome: string
  clienteDocumento: string
  clienteEndereco: string
  clienteContato: string
  equipamento: string
  marcaModelo: string
  serie: string
  defeitoRelatado: string
  servicosTexto: string
  pecasTexto: string
  observacoes: string
  garantiaDias: number
}

const initial: OsParams = {
  numero: 'OS-2026-00192',
  dataAbertura: '2026-02-06',
  dataExecucao: '2026-02-08',
  status: 'Concluida',
  prioridade: 'Alta',
  tecnicoResponsavel: 'Carlos Henrique Souza',
  solicitante: 'Fernanda Nogueira',
  clienteNome: 'Clinica Mais Saude Ltda',
  clienteDocumento: '23.998.110/0001-44',
  clienteEndereco: 'Rua dos Jacarandas, 55 - Centro - Sao Paulo/SP',
  clienteContato: '(11) 97777-8899 | financeiro@maissaude.com',
  equipamento: 'Servidor de Aplicacao',
  marcaModelo: 'Dell PowerEdge R550',
  serie: 'SN-R550-88423',
  defeitoRelatado: 'Queda de desempenho e reinicializacoes intermitentes no horario comercial.',
  servicosTexto: 'Diagnostico completo da infraestrutura|1|450.00\nSubstituicao de memoria RAM|1|320.00\nAtualizacao de firmware e testes de estabilidade|1|280.00',
  pecasTexto: 'Memoria ECC 32GB|2|410.00\nPasta termica industrial|1|35.00',
  observacoes: 'Servico executado em janela noturna. Sistema normalizado apos testes de carga por 2 horas.',
  garantiaDias: 90,
}

function parseItens(texto: string): LinhaItem[] {
  return String(texto || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [descricaoRaw, qtdRaw, valorRaw] = line.split('|')
      const quantidade = Number(String(qtdRaw || '0').replace(',', '.'))
      const valorUnitario = Number(String(valorRaw || '0').replace(',', '.'))
      return {
        descricao: (descricaoRaw || '').trim(),
        quantidade: Number.isFinite(quantidade) ? quantidade : 0,
        valorUnitario: Number.isFinite(valorUnitario) ? valorUnitario : 0,
      }
    })
}

function money(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dateBr(value: string) {
  if (!value) return '____/____/______'
  const d = new Date(`${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return '____/____/______'
  return d.toLocaleDateString('pt-BR')
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: 'text' | 'number' | 'date'
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-700">{label}</span>
      <input
        type={type}
        value={String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
      />
    </label>
  )
}

export default function OsModeloPage() {
  const [p, setP] = useState<OsParams>(initial)
  const [copyStatus, setCopyStatus] = useState('')

  const servicos = useMemo(() => parseItens(p.servicosTexto), [p.servicosTexto])
  const pecas = useMemo(() => parseItens(p.pecasTexto), [p.pecasTexto])

  const totalServicos = useMemo(
    () => servicos.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0),
    [servicos]
  )
  const totalPecas = useMemo(
    () => pecas.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0),
    [pecas]
  )
  const totalGeral = totalServicos + totalPecas

  const textoCopiavel = useMemo(() => {
    return [
      `ORDEM DE SERVICO ${p.numero}`,
      `Status: ${p.status}`,
      `Prioridade: ${p.prioridade}`,
      `Abertura: ${dateBr(p.dataAbertura)} | Execucao: ${dateBr(p.dataExecucao)}`,
      '',
      `Cliente: ${p.clienteNome} (${p.clienteDocumento})`,
      `Endereco: ${p.clienteEndereco}`,
      `Contato: ${p.clienteContato}`,
      '',
      `Equipamento: ${p.equipamento} - ${p.marcaModelo} - Serie ${p.serie}`,
      `Defeito relatado: ${p.defeitoRelatado}`,
      '',
      'Servicos:',
      ...servicos.map((s) => `- ${s.descricao} (${s.quantidade} x ${money(s.valorUnitario)}) = ${money(s.quantidade * s.valorUnitario)}`),
      '',
      'Pecas:',
      ...pecas.map((s) => `- ${s.descricao} (${s.quantidade} x ${money(s.valorUnitario)}) = ${money(s.quantidade * s.valorUnitario)}`),
      '',
      `Total Servicos: ${money(totalServicos)}`,
      `Total Pecas: ${money(totalPecas)}`,
      `Total Geral: ${money(totalGeral)}`,
      '',
      `Observacoes: ${p.observacoes}`,
      `Garantia: ${p.garantiaDias} dias`,
    ].join('\n')
  }, [p, pecas, servicos, totalServicos, totalPecas, totalGeral])

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(textoCopiavel)
      setCopyStatus('Copiado')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch {
      setCopyStatus('Falha ao copiar')
      setTimeout(() => setCopyStatus(''), 2000)
    }
  }

  return (
    <div className="os-root min-h-screen bg-neutral-200 p-4">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-4 xl:flex-row">
        <aside className="os-panel w-full shrink-0 xl:w-[390px]">
          <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-neutral-900">Parametros da Ordem de Servico</div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Numero da OS" value={p.numero} onChange={(v) => setP((s) => ({ ...s, numero: v }))} />
                <InputField label="Status" value={p.status} onChange={(v) => setP((s) => ({ ...s, status: v }))} />
                <InputField label="Data abertura" type="date" value={p.dataAbertura} onChange={(v) => setP((s) => ({ ...s, dataAbertura: v }))} />
                <InputField label="Data execucao" type="date" value={p.dataExecucao} onChange={(v) => setP((s) => ({ ...s, dataExecucao: v }))} />
                <InputField label="Prioridade" value={p.prioridade} onChange={(v) => setP((s) => ({ ...s, prioridade: v }))} />
                <InputField label="Tecnico" value={p.tecnicoResponsavel} onChange={(v) => setP((s) => ({ ...s, tecnicoResponsavel: v }))} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <InputField label="Solicitante" value={p.solicitante} onChange={(v) => setP((s) => ({ ...s, solicitante: v }))} />
                <InputField label="Cliente documento" value={p.clienteDocumento} onChange={(v) => setP((s) => ({ ...s, clienteDocumento: v }))} />
              </div>
              <InputField label="Cliente nome" value={p.clienteNome} onChange={(v) => setP((s) => ({ ...s, clienteNome: v }))} />
              <InputField label="Cliente endereco" value={p.clienteEndereco} onChange={(v) => setP((s) => ({ ...s, clienteEndereco: v }))} />
              <InputField label="Cliente contato" value={p.clienteContato} onChange={(v) => setP((s) => ({ ...s, clienteContato: v }))} />

              <div className="grid grid-cols-2 gap-2">
                <InputField label="Equipamento" value={p.equipamento} onChange={(v) => setP((s) => ({ ...s, equipamento: v }))} />
                <InputField label="Marca/Modelo" value={p.marcaModelo} onChange={(v) => setP((s) => ({ ...s, marcaModelo: v }))} />
              </div>
              <InputField label="Serie" value={p.serie} onChange={(v) => setP((s) => ({ ...s, serie: v }))} />

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Defeito relatado</span>
                <textarea
                  value={p.defeitoRelatado}
                  onChange={(e) => setP((s) => ({ ...s, defeitoRelatado: e.target.value }))}
                  className="min-h-[72px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Servicos (descricao|qtd|valor)</span>
                <textarea
                  value={p.servicosTexto}
                  onChange={(e) => setP((s) => ({ ...s, servicosTexto: e.target.value }))}
                  className="min-h-[110px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Pecas (descricao|qtd|valor)</span>
                <textarea
                  value={p.pecasTexto}
                  onChange={(e) => setP((s) => ({ ...s, pecasTexto: e.target.value }))}
                  className="min-h-[96px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Observacoes</span>
                <textarea
                  value={p.observacoes}
                  onChange={(e) => setP((s) => ({ ...s, observacoes: e.target.value }))}
                  className="min-h-[72px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
              </label>

              <InputField label="Garantia (dias)" type="number" value={p.garantiaDias} onChange={(v) => setP((s) => ({ ...s, garantiaDias: Number(v || 0) }))} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={copyText} className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm text-neutral-800 hover:bg-neutral-50">
                Copiar texto
              </button>
              <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm text-neutral-800 hover:bg-neutral-50">
                Baixar PDF
              </button>
              <button type="button" onClick={() => setP(initial)} className="inline-flex h-9 items-center rounded-md bg-black px-3 text-sm text-white">
                Resetar
              </button>
              {copyStatus ? <span className="inline-flex h-9 items-center text-xs text-neutral-600">{copyStatus}</span> : null}
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="os-toolbar mb-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-600">
            Modelo de Ordem de Servico em folha A4 para impressao/PDF.
          </div>

          <div className="os-canvas overflow-auto rounded-xl border border-neutral-300 bg-neutral-300 p-4">
            <article className="os-paper mx-auto bg-white text-black shadow-[0_10px_28px_rgba(0,0,0,0.15)]" style={{ width: '210mm', minHeight: '297mm' }}>
              <div className="border border-black px-[14mm] py-[12mm] font-['Arial'] text-[12px] leading-[1.35]">
                <div className="flex items-start justify-between border-b border-black pb-2">
                  <div>
                    <div className="text-[20px] font-bold uppercase">Ordem de Servico</div>
                    <div className="text-xs">Documento operacional de atendimento tecnico</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold">Numero</div>
                    <div className="text-[20px] font-bold">{p.numero}</div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-2 border-b border-black pb-2 text-[11px]">
                  <div><span className="font-semibold">Abertura:</span> {dateBr(p.dataAbertura)}</div>
                  <div><span className="font-semibold">Execucao:</span> {dateBr(p.dataExecucao)}</div>
                  <div><span className="font-semibold">Status:</span> {p.status}</div>
                  <div><span className="font-semibold">Prioridade:</span> {p.prioridade}</div>
                </div>

                <div className="mt-2 border-b border-black pb-2">
                  <div className="mb-1 text-[11px] font-bold uppercase">Dados do Cliente</div>
                  <div><span className="font-semibold">Nome/Razao:</span> {p.clienteNome}</div>
                  <div><span className="font-semibold">Documento:</span> {p.clienteDocumento}</div>
                  <div><span className="font-semibold">Endereco:</span> {p.clienteEndereco}</div>
                  <div><span className="font-semibold">Contato:</span> {p.clienteContato}</div>
                </div>

                <div className="mt-2 border-b border-black pb-2">
                  <div className="mb-1 text-[11px] font-bold uppercase">Dados do Atendimento</div>
                  <div><span className="font-semibold">Solicitante:</span> {p.solicitante}</div>
                  <div><span className="font-semibold">Tecnico responsavel:</span> {p.tecnicoResponsavel}</div>
                  <div><span className="font-semibold">Equipamento:</span> {p.equipamento}</div>
                  <div><span className="font-semibold">Marca/Modelo:</span> {p.marcaModelo}</div>
                  <div><span className="font-semibold">Serie:</span> {p.serie}</div>
                  <div className="mt-1"><span className="font-semibold">Defeito relatado:</span> {p.defeitoRelatado}</div>
                </div>

                <div className="mt-2 border-b border-black pb-2">
                  <div className="mb-1 text-[11px] font-bold uppercase">Servicos Executados</div>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr>
                        <th className="border border-black px-2 py-1 text-left">Descricao</th>
                        <th className="border border-black px-2 py-1 text-right">Qtd</th>
                        <th className="border border-black px-2 py-1 text-right">Vlr Unit.</th>
                        <th className="border border-black px-2 py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servicos.map((item, idx) => (
                        <tr key={`${item.descricao}-${idx}`}>
                          <td className="border border-black px-2 py-1">{item.descricao}</td>
                          <td className="border border-black px-2 py-1 text-right">{item.quantidade}</td>
                          <td className="border border-black px-2 py-1 text-right">{money(item.valorUnitario)}</td>
                          <td className="border border-black px-2 py-1 text-right">{money(item.quantidade * item.valorUnitario)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 border-b border-black pb-2">
                  <div className="mb-1 text-[11px] font-bold uppercase">Pecas Utilizadas</div>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr>
                        <th className="border border-black px-2 py-1 text-left">Descricao</th>
                        <th className="border border-black px-2 py-1 text-right">Qtd</th>
                        <th className="border border-black px-2 py-1 text-right">Vlr Unit.</th>
                        <th className="border border-black px-2 py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pecas.map((item, idx) => (
                        <tr key={`${item.descricao}-${idx}`}>
                          <td className="border border-black px-2 py-1">{item.descricao}</td>
                          <td className="border border-black px-2 py-1 text-right">{item.quantidade}</td>
                          <td className="border border-black px-2 py-1 text-right">{money(item.valorUnitario)}</td>
                          <td className="border border-black px-2 py-1 text-right">{money(item.quantidade * item.valorUnitario)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded border border-black p-2"><span className="font-semibold">Total Servicos:</span> {money(totalServicos)}</div>
                  <div className="rounded border border-black p-2"><span className="font-semibold">Total Pecas:</span> {money(totalPecas)}</div>
                  <div className="rounded border border-black bg-neutral-100 p-2 font-bold"><span>Total Geral:</span> {money(totalGeral)}</div>
                </div>

                <div className="mt-2 border border-black p-2 text-[11px]">
                  <div className="font-semibold">Observacoes:</div>
                  <div>{p.observacoes}</div>
                  <div className="mt-1"><span className="font-semibold">Garantia do servico:</span> {p.garantiaDias} dias.</div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-8 text-center text-[11px]">
                  <div>
                    <div className="mt-12 border-t border-black pt-1">Assinatura do Cliente</div>
                  </div>
                  <div>
                    <div className="mt-12 border-t border-black pt-1">Assinatura do Tecnico</div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="os-json mt-3 rounded-lg border border-neutral-300 bg-white p-3">
            <div className="mb-1 text-xs font-semibold text-neutral-700">Parametros do exemplo da OS</div>
            <pre className="max-h-56 overflow-auto rounded bg-neutral-100 p-2 text-xs text-neutral-800">
              <code>{JSON.stringify(p, null, 2)}</code>
            </pre>
          </div>
        </main>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
          }
          .os-panel,
          .os-toolbar,
          .os-json {
            display: none !important;
          }
          .os-root,
          .os-root > div {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .os-canvas {
            border: none !important;
            background: #fff !important;
            padding: 0 !important;
            overflow: visible !important;
            border-radius: 0 !important;
          }
          .os-paper {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  )
}

