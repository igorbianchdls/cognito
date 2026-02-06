'use client'

import { useMemo, useState } from 'react'

type ItemFatura = {
  descricao: string
  quantidade: number
  valorUnitario: number
}

type FaturaParams = {
  numero: string
  emissao: string
  vencimento: string
  status: string
  pedidoRef: string
  emissorNome: string
  emissorDocumento: string
  emissorEndereco: string
  clienteNome: string
  clienteDocumento: string
  clienteEndereco: string
  clienteContato: string
  itensTexto: string
  desconto: number
  juros: number
  observacoes: string
  instrucoesPagamento: string
  bancoFavorecido: string
  chavePix: string
}

const initial: FaturaParams = {
  numero: 'FAT-2026-00481',
  emissao: '2026-02-06',
  vencimento: '2026-02-20',
  status: 'Em aberto',
  pedidoRef: 'PED-33192',
  emissorNome: 'Creatto Solucoes Empresariais Ltda',
  emissorDocumento: '31.440.550/0001-11',
  emissorEndereco: 'Av. Paulista, 1500 - Bela Vista - Sao Paulo/SP',
  clienteNome: 'Vita Clinicas Integradas S/A',
  clienteDocumento: '12.998.004/0001-70',
  clienteEndereco: 'Rua do Comercio, 92 - Centro - Campinas/SP',
  clienteContato: 'financeiro@vita.com | (19) 3222-6677',
  itensTexto: 'Assinatura plataforma Cognito - plano corporativo|1|1890.00\nConfiguracao inicial de automacoes|1|1200.00\nTreinamento da equipe (4h)|1|650.00',
  desconto: 150,
  juros: 0,
  observacoes: 'Pagamento apos vencimento sujeito a multa contratual de 2% e juros de 1% ao mes.',
  instrucoesPagamento: 'Efetuar pagamento via PIX ou transferencia. Enviar comprovante para financeiro@creatto.ai.',
  bancoFavorecido: 'Banco 341 - Itau | Ag. 1234 | C/C 77881-9',
  chavePix: 'financeiro@creatto.ai',
}

function parseItens(texto: string): ItemFatura[] {
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

export default function FaturaModeloPage() {
  const [p, setP] = useState<FaturaParams>(initial)
  const [copyStatus, setCopyStatus] = useState('')

  const itens = useMemo(() => parseItens(p.itensTexto), [p.itensTexto])
  const subtotal = useMemo(
    () => itens.reduce((acc, item) => acc + item.quantidade * item.valorUnitario, 0),
    [itens]
  )
  const total = Math.max(0, subtotal - Number(p.desconto || 0) + Number(p.juros || 0))

  const textoCopiavel = useMemo(() => {
    return [
      `FATURA ${p.numero}`,
      `Emissao: ${dateBr(p.emissao)} | Vencimento: ${dateBr(p.vencimento)} | Status: ${p.status}`,
      '',
      `Emitente: ${p.emissorNome} (${p.emissorDocumento})`,
      `Cliente: ${p.clienteNome} (${p.clienteDocumento})`,
      `Ref.: ${p.pedidoRef}`,
      '',
      'Itens faturados:',
      ...itens.map((i) => `- ${i.descricao} (${i.quantidade} x ${money(i.valorUnitario)}) = ${money(i.quantidade * i.valorUnitario)}`),
      '',
      `Subtotal: ${money(subtotal)}`,
      `Desconto: ${money(p.desconto)}`,
      `Juros/Acrescimos: ${money(p.juros)}`,
      `Total da fatura: ${money(total)}`,
      '',
      `Banco: ${p.bancoFavorecido}`,
      `PIX: ${p.chavePix}`,
      `Instrucoes: ${p.instrucoesPagamento}`,
      `Observacoes: ${p.observacoes}`,
    ].join('\n')
  }, [itens, p, subtotal, total])

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
    <div className="fatura-root min-h-screen bg-neutral-200 p-4">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-4 xl:flex-row">
        <aside className="fatura-panel w-full shrink-0 xl:w-[390px]">
          <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-neutral-900">Parametros da Fatura</div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Numero" value={p.numero} onChange={(v) => setP((s) => ({ ...s, numero: v }))} />
                <InputField label="Status" value={p.status} onChange={(v) => setP((s) => ({ ...s, status: v }))} />
                <InputField label="Emissao" type="date" value={p.emissao} onChange={(v) => setP((s) => ({ ...s, emissao: v }))} />
                <InputField label="Vencimento" type="date" value={p.vencimento} onChange={(v) => setP((s) => ({ ...s, vencimento: v }))} />
              </div>
              <InputField label="Referencia pedido" value={p.pedidoRef} onChange={(v) => setP((s) => ({ ...s, pedidoRef: v }))} />

              <InputField label="Emitente nome" value={p.emissorNome} onChange={(v) => setP((s) => ({ ...s, emissorNome: v }))} />
              <InputField label="Emitente documento" value={p.emissorDocumento} onChange={(v) => setP((s) => ({ ...s, emissorDocumento: v }))} />
              <InputField label="Emitente endereco" value={p.emissorEndereco} onChange={(v) => setP((s) => ({ ...s, emissorEndereco: v }))} />

              <InputField label="Cliente nome" value={p.clienteNome} onChange={(v) => setP((s) => ({ ...s, clienteNome: v }))} />
              <InputField label="Cliente documento" value={p.clienteDocumento} onChange={(v) => setP((s) => ({ ...s, clienteDocumento: v }))} />
              <InputField label="Cliente endereco" value={p.clienteEndereco} onChange={(v) => setP((s) => ({ ...s, clienteEndereco: v }))} />
              <InputField label="Cliente contato" value={p.clienteContato} onChange={(v) => setP((s) => ({ ...s, clienteContato: v }))} />

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Itens (descricao|qtd|valor)</span>
                <textarea
                  value={p.itensTexto}
                  onChange={(e) => setP((s) => ({ ...s, itensTexto: e.target.value }))}
                  className="min-h-[108px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs text-neutral-900"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <InputField label="Desconto (R$)" type="number" value={p.desconto} onChange={(v) => setP((s) => ({ ...s, desconto: Number(v || 0) }))} />
                <InputField label="Juros/Acrescimos (R$)" type="number" value={p.juros} onChange={(v) => setP((s) => ({ ...s, juros: Number(v || 0) }))} />
              </div>

              <InputField label="Banco favorecido" value={p.bancoFavorecido} onChange={(v) => setP((s) => ({ ...s, bancoFavorecido: v }))} />
              <InputField label="Chave PIX" value={p.chavePix} onChange={(v) => setP((s) => ({ ...s, chavePix: v }))} />

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Instrucoes de pagamento</span>
                <textarea
                  value={p.instrucoesPagamento}
                  onChange={(e) => setP((s) => ({ ...s, instrucoesPagamento: e.target.value }))}
                  className="min-h-[64px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Observacoes</span>
                <textarea
                  value={p.observacoes}
                  onChange={(e) => setP((s) => ({ ...s, observacoes: e.target.value }))}
                  className="min-h-[64px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
              </label>
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
          <div className="fatura-toolbar mb-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-600">
            Modelo de Fatura em folha A4 para cobranca e exportacao em PDF.
          </div>

          <div className="fatura-canvas overflow-auto rounded-xl border border-neutral-300 bg-neutral-300 p-4">
            <article className="fatura-paper mx-auto border border-black bg-white text-black shadow-[0_10px_28px_rgba(0,0,0,0.15)]" style={{ width: '210mm', height: '297mm' }}>
              <div className="h-full box-border px-[14mm] py-[12mm] font-['Arial'] text-[12px] leading-[1.4]">
                <div className="flex items-start justify-between border-b border-black pb-2">
                  <div>
                    <div className="text-[22px] font-bold uppercase">Fatura</div>
                    <div className="text-xs text-neutral-700">Documento de cobranca por servicos prestados</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold">Numero</div>
                    <div className="text-[22px] font-bold">{p.numero}</div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-2 border-b border-black pb-2 text-[11px]">
                  <div><span className="font-semibold">Emissao:</span> {dateBr(p.emissao)}</div>
                  <div><span className="font-semibold">Vencimento:</span> {dateBr(p.vencimento)}</div>
                  <div><span className="font-semibold">Status:</span> {p.status}</div>
                  <div><span className="font-semibold">Ref. Pedido:</span> {p.pedidoRef}</div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-3 border-b border-black pb-2">
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase">Emitente</div>
                    <div className="font-semibold">{p.emissorNome}</div>
                    <div>{p.emissorDocumento}</div>
                    <div>{p.emissorEndereco}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase">Cliente</div>
                    <div className="font-semibold">{p.clienteNome}</div>
                    <div>{p.clienteDocumento}</div>
                    <div>{p.clienteEndereco}</div>
                    <div>{p.clienteContato}</div>
                  </div>
                </div>

                <div className="mt-2 border-b border-black pb-2">
                  <div className="mb-1 text-[11px] font-bold uppercase">Itens Faturados</div>
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
                      {itens.map((item, idx) => (
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

                <div className="mt-2 ml-auto w-[95mm] border border-black">
                  <div className="grid grid-cols-2 border-b border-black text-[11px]">
                    <div className="border-r border-black px-2 py-1 font-semibold">Subtotal</div>
                    <div className="px-2 py-1 text-right">{money(subtotal)}</div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-black text-[11px]">
                    <div className="border-r border-black px-2 py-1 font-semibold">Desconto</div>
                    <div className="px-2 py-1 text-right">- {money(p.desconto)}</div>
                  </div>
                  <div className="grid grid-cols-2 border-b border-black text-[11px]">
                    <div className="border-r border-black px-2 py-1 font-semibold">Juros/Acrescimos</div>
                    <div className="px-2 py-1 text-right">{money(p.juros)}</div>
                  </div>
                  <div className="grid grid-cols-2 bg-neutral-100 text-[13px] font-bold">
                    <div className="border-r border-black px-2 py-1">Total da Fatura</div>
                    <div className="px-2 py-1 text-right">{money(total)}</div>
                  </div>
                </div>

                <div className="mt-3 border border-black p-2 text-[11px]">
                  <div className="font-semibold">Dados para Pagamento</div>
                  <div><span className="font-semibold">Banco:</span> {p.bancoFavorecido}</div>
                  <div><span className="font-semibold">PIX:</span> {p.chavePix}</div>
                  <div className="mt-1"><span className="font-semibold">Instrucoes:</span> {p.instrucoesPagamento}</div>
                </div>

                <div className="mt-2 border border-black p-2 text-[11px]">
                  <span className="font-semibold">Observacoes:</span> {p.observacoes}
                </div>
              </div>
            </article>
          </div>

          <div className="fatura-json mt-3 rounded-lg border border-neutral-300 bg-white p-3">
            <div className="mb-1 text-xs font-semibold text-neutral-700">Parametros do exemplo da Fatura</div>
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
          .fatura-panel,
          .fatura-toolbar,
          .fatura-json {
            display: none !important;
          }
          .fatura-root,
          .fatura-root > div {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .fatura-canvas {
            border: none !important;
            background: #fff !important;
            padding: 0 !important;
            overflow: visible !important;
            border-radius: 0 !important;
          }
          .fatura-paper {
            width: 210mm !important;
            height: 297mm !important;
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
