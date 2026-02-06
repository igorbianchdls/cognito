'use client'

import { useMemo, useState } from 'react'

type LinhaValor = { descricao: string; valor: number }
type LinhaCronograma = { etapa: string; prazo: string; resultado: string }

type PropostaParams = {
  numero: string
  dataEmissao: string
  validadeDias: number
  empresaNome: string
  empresaDocumento: string
  empresaEndereco: string
  empresaContato: string
  clienteNome: string
  clienteDocumento: string
  clienteContato: string
  clienteEndereco: string
  tituloProjeto: string
  objetivo: string
  escopoTexto: string
  entregaveisTexto: string
  cronogramaTexto: string
  investimentoTexto: string
  condicoesComerciais: string
  observacoes: string
  responsavelComercial: string
}

const initial: PropostaParams = {
  numero: 'PROP-2026-00027',
  dataEmissao: '2026-02-06',
  validadeDias: 15,
  empresaNome: 'Creatto Solucoes Empresariais Ltda',
  empresaDocumento: '31.440.550/0001-11',
  empresaEndereco: 'Av. Paulista, 1500 - Bela Vista - Sao Paulo/SP',
  empresaContato: 'contato@creatto.ai | (11) 3333-4400',
  clienteNome: 'Instituto Horizonte Educacional',
  clienteDocumento: '44.551.120/0001-08',
  clienteContato: 'diretoria@horizonte.edu.br | (11) 99222-0044',
  clienteEndereco: 'Rua Marechal Deodoro, 120 - Centro - Sao Paulo/SP',
  tituloProjeto: 'Implantacao de Operacao Digital e Automacoes',
  objetivo: 'Estruturar processos digitais, automatizar fluxos operacionais e elevar produtividade das equipes administrativa e comercial.',
  escopoTexto: 'Mapeamento de processos operacionais atuais\nDesenho de fluxos-alvo e indicadores\nImplantacao de automacoes com validacao conjunta\nTreinamento pratico para equipe interna',
  entregaveisTexto: 'Documento de diagnostico e plano de acao\nPlaybook operacional com fluxos aprovados\nAutomacoes implantadas e testadas em ambiente produtivo\nTreinamento da equipe e guia de sustentacao',
  cronogramaTexto: 'Kickoff e diagnostico|Semana 1|Levantamento completo de processos\nDesenho da solucao|Semana 2|Fluxos-alvo e priorizacao aprovados\nImplementacao|Semanas 3 e 4|Automacoes configuradas e validadas\nTreinamento e go-live|Semana 5|Time habilitado e operacao assistida',
  investimentoTexto: 'Diagnostico e planejamento|3800\nImplementacao e automacoes|7400\nTreinamento e suporte inicial|2200',
  condicoesComerciais: 'Pagamento em 40% na assinatura e 60% na entrega. Valores sem reajuste durante a vigencia desta proposta.',
  observacoes: 'Proposta considera acesso aos sistemas e disponibilidade de key-users do cliente para validacoes semanais.',
  responsavelComercial: 'Larissa Monteiro',
}

function parseLista(texto: string): string[] {
  return String(texto || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseCronograma(texto: string): LinhaCronograma[] {
  return String(texto || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [etapa, prazo, resultado] = line.split('|')
      return {
        etapa: (etapa || '').trim(),
        prazo: (prazo || '').trim(),
        resultado: (resultado || '').trim(),
      }
    })
}

function parseInvestimento(texto: string): LinhaValor[] {
  return String(texto || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [descricao, valorRaw] = line.split('|')
      const valor = Number(String(valorRaw || '0').replace(',', '.'))
      return {
        descricao: (descricao || '').trim(),
        valor: Number.isFinite(valor) ? valor : 0,
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

export default function PropostaModeloPage() {
  const [p, setP] = useState<PropostaParams>(initial)
  const [copyStatus, setCopyStatus] = useState('')

  const escopo = useMemo(() => parseLista(p.escopoTexto), [p.escopoTexto])
  const entregaveis = useMemo(() => parseLista(p.entregaveisTexto), [p.entregaveisTexto])
  const cronograma = useMemo(() => parseCronograma(p.cronogramaTexto), [p.cronogramaTexto])
  const investimento = useMemo(() => parseInvestimento(p.investimentoTexto), [p.investimentoTexto])
  const totalInvestimento = useMemo(
    () => investimento.reduce((acc, item) => acc + item.valor, 0),
    [investimento]
  )

  const validadeTexto = useMemo(() => {
    const base = new Date(`${p.dataEmissao}T00:00:00`)
    if (Number.isNaN(base.getTime())) return `${p.validadeDias} dias`
    base.setDate(base.getDate() + Number(p.validadeDias || 0))
    return `ate ${base.toLocaleDateString('pt-BR')}`
  }, [p.dataEmissao, p.validadeDias])

  const textoCopiavel = useMemo(() => {
    return [
      `PROPOSTA COMERCIAL ${p.numero}`,
      `Projeto: ${p.tituloProjeto}`,
      `Emissao: ${dateBr(p.dataEmissao)} | Validade: ${validadeTexto}`,
      '',
      `Empresa: ${p.empresaNome} (${p.empresaDocumento})`,
      `Cliente: ${p.clienteNome} (${p.clienteDocumento})`,
      '',
      `Objetivo: ${p.objetivo}`,
      '',
      'Escopo:',
      ...escopo.map((i) => `- ${i}`),
      '',
      'Entregaveis:',
      ...entregaveis.map((i) => `- ${i}`),
      '',
      'Cronograma:',
      ...cronograma.map((c) => `- ${c.etapa} | ${c.prazo} | ${c.resultado}`),
      '',
      'Investimento:',
      ...investimento.map((i) => `- ${i.descricao}: ${money(i.valor)}`),
      `Total: ${money(totalInvestimento)}`,
      '',
      `Condicoes: ${p.condicoesComerciais}`,
      `Observacoes: ${p.observacoes}`,
    ].join('\n')
  }, [p, validadeTexto, escopo, entregaveis, cronograma, investimento, totalInvestimento])

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
    <div className="prop-root min-h-screen bg-neutral-200 p-4">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-4 xl:flex-row">
        <aside className="prop-panel w-full shrink-0 xl:w-[390px]">
          <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-neutral-900">Parametros da Proposta</div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Numero" value={p.numero} onChange={(v) => setP((s) => ({ ...s, numero: v }))} />
                <InputField label="Validade (dias)" type="number" value={p.validadeDias} onChange={(v) => setP((s) => ({ ...s, validadeDias: Number(v || 0) }))} />
              </div>
              <InputField label="Data emissao" type="date" value={p.dataEmissao} onChange={(v) => setP((s) => ({ ...s, dataEmissao: v }))} />
              <InputField label="Titulo do projeto" value={p.tituloProjeto} onChange={(v) => setP((s) => ({ ...s, tituloProjeto: v }))} />

              <InputField label="Empresa nome" value={p.empresaNome} onChange={(v) => setP((s) => ({ ...s, empresaNome: v }))} />
              <InputField label="Empresa documento" value={p.empresaDocumento} onChange={(v) => setP((s) => ({ ...s, empresaDocumento: v }))} />
              <InputField label="Empresa endereco" value={p.empresaEndereco} onChange={(v) => setP((s) => ({ ...s, empresaEndereco: v }))} />
              <InputField label="Empresa contato" value={p.empresaContato} onChange={(v) => setP((s) => ({ ...s, empresaContato: v }))} />

              <InputField label="Cliente nome" value={p.clienteNome} onChange={(v) => setP((s) => ({ ...s, clienteNome: v }))} />
              <InputField label="Cliente documento" value={p.clienteDocumento} onChange={(v) => setP((s) => ({ ...s, clienteDocumento: v }))} />
              <InputField label="Cliente endereco" value={p.clienteEndereco} onChange={(v) => setP((s) => ({ ...s, clienteEndereco: v }))} />
              <InputField label="Cliente contato" value={p.clienteContato} onChange={(v) => setP((s) => ({ ...s, clienteContato: v }))} />

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Objetivo</span>
                <textarea
                  value={p.objetivo}
                  onChange={(e) => setP((s) => ({ ...s, objetivo: e.target.value }))}
                  className="min-h-[72px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Escopo (1 item por linha)</span>
                <textarea
                  value={p.escopoTexto}
                  onChange={(e) => setP((s) => ({ ...s, escopoTexto: e.target.value }))}
                  className="min-h-[84px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Entregaveis (1 item por linha)</span>
                <textarea
                  value={p.entregaveisTexto}
                  onChange={(e) => setP((s) => ({ ...s, entregaveisTexto: e.target.value }))}
                  className="min-h-[84px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Cronograma (etapa|prazo|resultado)</span>
                <textarea
                  value={p.cronogramaTexto}
                  onChange={(e) => setP((s) => ({ ...s, cronogramaTexto: e.target.value }))}
                  className="min-h-[96px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Investimento (descricao|valor)</span>
                <textarea
                  value={p.investimentoTexto}
                  onChange={(e) => setP((s) => ({ ...s, investimentoTexto: e.target.value }))}
                  className="min-h-[90px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs text-neutral-900"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Condicoes comerciais</span>
                <textarea
                  value={p.condicoesComerciais}
                  onChange={(e) => setP((s) => ({ ...s, condicoesComerciais: e.target.value }))}
                  className="min-h-[72px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
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

              <InputField label="Responsavel comercial" value={p.responsavelComercial} onChange={(v) => setP((s) => ({ ...s, responsavelComercial: v }))} />
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
          <div className="prop-toolbar mb-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-600">
            Modelo de Proposta Comercial em folha A4 para apresentacao ao cliente.
          </div>

          <div className="prop-canvas overflow-auto rounded-xl border border-neutral-300 bg-neutral-300 p-4">
            <article className="prop-paper mx-auto bg-white text-black shadow-[0_10px_28px_rgba(0,0,0,0.15)]" style={{ width: '210mm', minHeight: '297mm' }}>
              <div className="border border-black px-[18mm] py-[18mm] font-['Arial'] text-[12px] leading-[1.4]">
                <div className="flex items-start justify-between border-b border-black pb-3">
                  <div>
                    <div className="text-[22px] font-bold uppercase">Proposta Comercial</div>
                    <div className="text-sm font-semibold">{p.tituloProjeto}</div>
                  </div>
                  <div className="text-right text-[11px]">
                    <div><span className="font-semibold">Numero:</span> {p.numero}</div>
                    <div><span className="font-semibold">Emissao:</span> {dateBr(p.dataEmissao)}</div>
                    <div><span className="font-semibold">Validade:</span> {validadeTexto}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-b border-black pb-3 text-[11px]">
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase">Proponente</div>
                    <div className="font-semibold">{p.empresaNome}</div>
                    <div>{p.empresaDocumento}</div>
                    <div>{p.empresaEndereco}</div>
                    <div>{p.empresaContato}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-bold uppercase">Cliente</div>
                    <div className="font-semibold">{p.clienteNome}</div>
                    <div>{p.clienteDocumento}</div>
                    <div>{p.clienteEndereco}</div>
                    <div>{p.clienteContato}</div>
                  </div>
                </div>

                <section className="mt-3 border-b border-black pb-3">
                  <h2 className="mb-1 text-[13px] font-bold uppercase">1. Objetivo</h2>
                  <p className="text-justify">{p.objetivo}</p>
                </section>

                <section className="mt-3 border-b border-black pb-3">
                  <h2 className="mb-1 text-[13px] font-bold uppercase">2. Escopo</h2>
                  <ul className="list-disc space-y-1 pl-5">
                    {escopo.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="mt-3 border-b border-black pb-3">
                  <h2 className="mb-1 text-[13px] font-bold uppercase">3. Entregaveis</h2>
                  <ul className="list-disc space-y-1 pl-5">
                    {entregaveis.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="mt-3 border-b border-black pb-3">
                  <h2 className="mb-1 text-[13px] font-bold uppercase">4. Cronograma</h2>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr>
                        <th className="border border-black px-2 py-1 text-left">Etapa</th>
                        <th className="border border-black px-2 py-1 text-left">Prazo</th>
                        <th className="border border-black px-2 py-1 text-left">Resultado esperado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cronograma.map((c, idx) => (
                        <tr key={`${c.etapa}-${idx}`}>
                          <td className="border border-black px-2 py-1">{c.etapa}</td>
                          <td className="border border-black px-2 py-1">{c.prazo}</td>
                          <td className="border border-black px-2 py-1">{c.resultado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section className="mt-3 border-b border-black pb-3">
                  <h2 className="mb-1 text-[13px] font-bold uppercase">5. Investimento</h2>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr>
                        <th className="border border-black px-2 py-1 text-left">Descricao</th>
                        <th className="border border-black px-2 py-1 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {investimento.map((item, idx) => (
                        <tr key={`${item.descricao}-${idx}`}>
                          <td className="border border-black px-2 py-1">{item.descricao}</td>
                          <td className="border border-black px-2 py-1 text-right">{money(item.valor)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="border border-black bg-neutral-100 px-2 py-1 font-bold">Total do Projeto</td>
                        <td className="border border-black bg-neutral-100 px-2 py-1 text-right font-bold">{money(totalInvestimento)}</td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section className="mt-3 border-b border-black pb-3 text-[11px]">
                  <h2 className="mb-1 text-[13px] font-bold uppercase">6. Condicoes Comerciais</h2>
                  <p>{p.condicoesComerciais}</p>
                  <p className="mt-2"><span className="font-semibold">Observacoes:</span> {p.observacoes}</p>
                </section>

                <div className="mt-10 grid grid-cols-2 gap-10 text-center text-[11px]">
                  <div>
                    <div className="mt-12 border-t border-black pt-1">Aprovacao do Cliente</div>
                  </div>
                  <div>
                    <div className="mt-12 border-t border-black pt-1">Responsavel Comercial</div>
                    <div className="mt-1 font-semibold">{p.responsavelComercial}</div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="prop-json mt-3 rounded-lg border border-neutral-300 bg-white p-3">
            <div className="mb-1 text-xs font-semibold text-neutral-700">Parametros do exemplo da Proposta</div>
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
          .prop-panel,
          .prop-toolbar,
          .prop-json {
            display: none !important;
          }
          .prop-root,
          .prop-root > div {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .prop-canvas {
            border: none !important;
            background: #fff !important;
            padding: 0 !important;
            overflow: visible !important;
            border-radius: 0 !important;
          }
          .prop-paper {
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

