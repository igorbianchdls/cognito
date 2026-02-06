'use client'

import { useMemo, useState } from 'react'

type Parte = {
  nome: string
  nacionalidade: string
  profissao: string
  rg: string
  cpf: string
  endereco: string
  cidade: string
  uf: string
}

type ContratoParams = {
  titulo: string
  objeto: string
  sessoesPacote: number
  frequenciaSemanal: number
  prazoDias: number
  valorTotal: number
  formaPagamento: string
  inicioVigencia: string
  fimVigencia: string
  foroCidade: string
  foroUF: string
  contratante: Parte
  contratado: Parte
}

const initialParams: ContratoParams = {
  titulo: 'CONTRATO DE PRESTACAO DE SERVICOS DE COACHING',
  objeto: 'servicos de Coaching, consistindo na facilitacao de criacao de metas profissionais e/ou pessoais',
  sessoesPacote: 10,
  frequenciaSemanal: 1,
  prazoDias: 30,
  valorTotal: 2400,
  formaPagamento: 'PIX, em 3 parcelas mensais iguais de R$ 800,00',
  inicioVigencia: '2026-02-10',
  fimVigencia: '2026-05-10',
  foroCidade: 'Sao Paulo',
  foroUF: 'SP',
  contratante: {
    nome: 'ANA BEATRIZ ALMEIDA',
    nacionalidade: 'brasileira',
    profissao: 'empresaria',
    rg: '12.345.678-9',
    cpf: '123.456.789-01',
    endereco: 'Rua das Flores, 120, Apto 45',
    cidade: 'Sao Paulo',
    uf: 'SP',
  },
  contratado: {
    nome: 'MARCOS VINICIUS LIMA',
    nacionalidade: 'brasileiro',
    profissao: 'coach profissional',
    rg: '45.678.123-0',
    cpf: '987.654.321-00',
    endereco: 'Av. Paulista, 1000, Sala 301',
    cidade: 'Sao Paulo',
    uf: 'SP',
  },
}

function safe(value: string) {
  const v = String(value || '').trim()
  return v || '________________'
}

function formatDateBr(dateIso: string) {
  if (!dateIso) return '____/____/______'
  const d = new Date(`${dateIso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return '____/____/______'
  return d.toLocaleDateString('pt-BR')
}

function formatMoneyBr(value: number) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function qualificacao(label: string, p: Parte) {
  return `${label}: ${safe(p.nome)}, ${safe(p.nacionalidade)}, profissao ${safe(p.profissao)}, Carteira de Identidade n ${safe(p.rg)}, C.P.F. n ${safe(p.cpf)}, residente e domiciliado na ${safe(p.endereco)}, ${safe(p.cidade)}/${safe(p.uf)}.`
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
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

function SectionTitle({ children }: { children: string }) {
  return <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600">{children}</div>
}

export default function ContratosModeloPage() {
  const [params, setParams] = useState<ContratoParams>(initialParams)
  const [copyStatus, setCopyStatus] = useState('')

  const updateParte = (tipo: 'contratante' | 'contratado', key: keyof Parte, value: string) => {
    setParams((prev) => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [key]: value,
      },
    }))
  }

  const plainTextContrato = useMemo(() => {
    return [
      params.titulo,
      '',
      'IDENTIFICACAO DAS PARTES CONTRATANTES',
      qualificacao('CONTRATANTE', params.contratante),
      qualificacao('CONTRATADO', params.contratado),
      '',
      'As partes acima identificadas tem, entre si, justo e acertado o presente Contrato de Prestacao de Servicos de Coaching, que se regera pelas clausulas seguintes e pelas condicoes descritas no presente.',
      '',
      'DO OBJETO DO CONTRATO',
      `Clausula 1a. O presente contrato tem como OBJETO a prestacao, pelo CONTRATADO a CONTRATANTE, de ${safe(params.objeto)}.`,
      `Clausula 2a. A prestacao de servico feita por este instrumento sera composta por ate ${Number(params.sessoesPacote || 0)} sessoes, a serem realizadas no prazo maximo de ${Number(params.prazoDias || 0)} dias.`,
      `Paragrafo unico. O contrato podera ser renovado ao seu termino, caso haja interesse de ambas as partes.`,
      `Clausula 3a. O CONTRATANTE devera realizar, ao termino do presente contrato, avaliacao acerca do trabalho desempenhado pelo CONTRATADO.`,
      `Clausula 4a. O compartilhamento das informacoes do CONTRATANTE dar-se-a exclusivamente entre este e o CONTRATADO, obrigando-se este a nao as compartilhar com terceiros sem a devida anuencia.`,
      '',
      'DO HORARIO',
      `Clausula 5a. O CONTRATADO prestara os servicos totalizando ${Number(params.frequenciaSemanal || 0)} vez(es) por semana, correspondente ao pacote de ${Number(params.sessoesPacote || 0)} sessoes.`,
      '',
      'DO VALOR E FORMA DE PAGAMENTO',
      `Clausula 6a. Pelos servicos ora contratados, o CONTRATANTE pagara ao CONTRATADO o valor total de ${formatMoneyBr(params.valorTotal)}.`,
      `Paragrafo unico. Forma de pagamento acordada: ${safe(params.formaPagamento)}.`,
      '',
      'DA VIGENCIA E RESCISAO',
      `Clausula 7a. Este contrato vigorara de ${formatDateBr(params.inicioVigencia)} ate ${formatDateBr(params.fimVigencia)}.`,
      'Clausula 8a. O presente instrumento podera ser rescindido por qualquer das partes, mediante comunicacao previa, respeitando-se as obrigacoes ja assumidas.',
      '',
      'DO FORO',
      `Clausula 9a. Fica eleito o foro da comarca de ${safe(params.foroCidade)}/${safe(params.foroUF)}, com renuncia de qualquer outro, por mais privilegiado que seja.`,
      '',
      `${safe(params.foroCidade)}/${safe(params.foroUF)}, ${formatDateBr(params.inicioVigencia)}.`,
      '',
      '________________________________________',
      `CONTRATANTE: ${safe(params.contratante.nome)}`,
      '',
      '________________________________________',
      `CONTRATADO: ${safe(params.contratado.nome)}`,
    ].join('\n')
  }, [params])

  const copyContrato = async () => {
    try {
      await navigator.clipboard.writeText(plainTextContrato)
      setCopyStatus('Copiado')
      setTimeout(() => setCopyStatus(''), 2000)
    } catch {
      setCopyStatus('Falha ao copiar')
      setTimeout(() => setCopyStatus(''), 2000)
    }
  }

  return (
    <div className="contract-root min-h-screen bg-neutral-200 p-4">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 xl:flex-row">
        <aside className="contract-editor-panel w-full shrink-0 xl:w-[380px]">
          <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-neutral-900">Parametros do Contrato</div>

            <div className="space-y-4">
              <div>
                <SectionTitle>Dados Gerais</SectionTitle>
                <div className="space-y-2">
                  <TextInput label="Titulo" value={params.titulo} onChange={(v) => setParams((p) => ({ ...p, titulo: v }))} />
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-neutral-700">Objeto</span>
                    <textarea
                      value={params.objeto}
                      onChange={(e) => setParams((p) => ({ ...p, objeto: e.target.value }))}
                      className="min-h-[90px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <TextInput label="Sessoes" type="number" value={params.sessoesPacote} onChange={(v) => setParams((p) => ({ ...p, sessoesPacote: Number(v || 0) }))} />
                    <TextInput label="Freq./semana" type="number" value={params.frequenciaSemanal} onChange={(v) => setParams((p) => ({ ...p, frequenciaSemanal: Number(v || 0) }))} />
                    <TextInput label="Prazo (dias)" type="number" value={params.prazoDias} onChange={(v) => setParams((p) => ({ ...p, prazoDias: Number(v || 0) }))} />
                    <TextInput label="Valor total (R$)" type="number" value={params.valorTotal} onChange={(v) => setParams((p) => ({ ...p, valorTotal: Number(v || 0) }))} />
                  </div>
                  <TextInput label="Forma de pagamento" value={params.formaPagamento} onChange={(v) => setParams((p) => ({ ...p, formaPagamento: v }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <TextInput label="Inicio vigencia" type="date" value={params.inicioVigencia} onChange={(v) => setParams((p) => ({ ...p, inicioVigencia: v }))} />
                    <TextInput label="Fim vigencia" type="date" value={params.fimVigencia} onChange={(v) => setParams((p) => ({ ...p, fimVigencia: v }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TextInput label="Foro cidade" value={params.foroCidade} onChange={(v) => setParams((p) => ({ ...p, foroCidade: v }))} />
                    <TextInput label="Foro UF" value={params.foroUF} onChange={(v) => setParams((p) => ({ ...p, foroUF: v.toUpperCase() }))} />
                  </div>
                </div>
              </div>

              <div>
                <SectionTitle>Contratante</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput label="Nome" value={params.contratante.nome} onChange={(v) => updateParte('contratante', 'nome', v)} />
                  <TextInput label="Nacionalidade" value={params.contratante.nacionalidade} onChange={(v) => updateParte('contratante', 'nacionalidade', v)} />
                  <TextInput label="Profissao" value={params.contratante.profissao} onChange={(v) => updateParte('contratante', 'profissao', v)} />
                  <TextInput label="RG" value={params.contratante.rg} onChange={(v) => updateParte('contratante', 'rg', v)} />
                  <TextInput label="CPF" value={params.contratante.cpf} onChange={(v) => updateParte('contratante', 'cpf', v)} />
                  <TextInput label="Cidade" value={params.contratante.cidade} onChange={(v) => updateParte('contratante', 'cidade', v)} />
                  <TextInput label="UF" value={params.contratante.uf} onChange={(v) => updateParte('contratante', 'uf', v.toUpperCase())} />
                </div>
                <div className="mt-2">
                  <TextInput label="Endereco" value={params.contratante.endereco} onChange={(v) => updateParte('contratante', 'endereco', v)} />
                </div>
              </div>

              <div>
                <SectionTitle>Contratado</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  <TextInput label="Nome" value={params.contratado.nome} onChange={(v) => updateParte('contratado', 'nome', v)} />
                  <TextInput label="Nacionalidade" value={params.contratado.nacionalidade} onChange={(v) => updateParte('contratado', 'nacionalidade', v)} />
                  <TextInput label="Profissao" value={params.contratado.profissao} onChange={(v) => updateParte('contratado', 'profissao', v)} />
                  <TextInput label="RG" value={params.contratado.rg} onChange={(v) => updateParte('contratado', 'rg', v)} />
                  <TextInput label="CPF" value={params.contratado.cpf} onChange={(v) => updateParte('contratado', 'cpf', v)} />
                  <TextInput label="Cidade" value={params.contratado.cidade} onChange={(v) => updateParte('contratado', 'cidade', v)} />
                  <TextInput label="UF" value={params.contratado.uf} onChange={(v) => updateParte('contratado', 'uf', v.toUpperCase())} />
                </div>
                <div className="mt-2">
                  <TextInput label="Endereco" value={params.contratado.endereco} onChange={(v) => updateParte('contratado', 'endereco', v)} />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyContrato}
                className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm text-neutral-800 hover:bg-neutral-50"
              >
                Copiar texto
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm text-neutral-800 hover:bg-neutral-50"
              >
                Imprimir / PDF
              </button>
              <button
                type="button"
                onClick={() => setParams(initialParams)}
                className="inline-flex h-9 items-center rounded-md bg-black px-3 text-sm text-white"
              >
                Resetar exemplo
              </button>
              {copyStatus ? <span className="inline-flex h-9 items-center text-xs text-neutral-600">{copyStatus}</span> : null}
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="contract-topbar mb-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-600">
            Visualizacao estilo documento (A4). Margens, tipografia e fluxo de texto no padrao de contrato.
          </div>

          <div className="contract-paper-wrap overflow-auto rounded-xl border border-neutral-300 bg-neutral-300 p-4">
            <article
              className="contract-paper mx-auto bg-white text-black shadow-[0_10px_28px_rgba(0,0,0,0.15)]"
              style={{
                width: '210mm',
                minHeight: '297mm',
                fontFamily: '"Times New Roman", Times, serif',
              }}
            >
              <div className="border border-neutral-800 px-[24mm] py-[24mm] text-[16px] leading-[1.5]">
                <h1 className="text-center text-[30px] font-bold uppercase leading-[1.15]">
                  {safe(params.titulo)}
                </h1>

                <h2 className="mt-8 text-[19px] font-bold uppercase">Identificacao das Partes Contratantes</h2>

                <p className="mt-3 text-justify">{qualificacao('CONTRATANTE', params.contratante)}</p>
                <p className="mt-2 text-justify">{qualificacao('CONTRATADO', params.contratado)}</p>

                <p className="mt-4 text-justify font-semibold italic">
                  As partes acima identificadas tem, entre si, justo e acertado o presente Contrato de Prestacao de Servicos de Coaching, que se regera pelas clausulas seguintes e pelas condicoes descritas no presente.
                </p>

                <h2 className="mt-8 text-center text-[18px] font-bold uppercase">Do Objeto do Contrato</h2>

                <p className="mt-4 text-justify">
                  <strong>Clausula 1a.</strong> O presente contrato tem como OBJETO a prestacao, pelo CONTRATADO ao CONTRATANTE, de {safe(params.objeto)}.
                </p>
                <p className="mt-3 text-justify">
                  <strong>Clausula 2a.</strong> A prestacao de servico feita por este instrumento sera composta por ate <strong>{Number(params.sessoesPacote || 0)} sessoes</strong>, a serem realizadas no prazo maximo de <strong>{Number(params.prazoDias || 0)} dias</strong>, totalizando ate <strong>{Number(params.frequenciaSemanal || 0)} vez(es)</strong> por semana.
                </p>
                <p className="mt-3 text-justify">
                  <strong>Paragrafo unico.</strong> O contrato de prestacao de servico podera ser renovado ao seu termino, caso haja interesse de ambas as partes.
                </p>
                <p className="mt-3 text-justify">
                  <strong>Clausula 3a.</strong> O CONTRATANTE devera realizar, ao termino do presente contrato, avaliacao acerca do trabalho desempenhado pelo CONTRATADO, no tocante a sua atuacao, seriedade e comprometimento com as questoes trabalhadas durante as sessoes.
                </p>
                <p className="mt-3 text-justify">
                  <strong>Clausula 4a.</strong> O compartilhamento das informacoes do CONTRATANTE dar-se-a exclusivamente entre este e o CONTRATADO, obrigando-se este a nao as compartilhar com terceiros sem a devida anuencia.
                </p>

                <h2 className="mt-8 text-center text-[18px] font-bold uppercase">Do Horario</h2>
                <p className="mt-4 text-justify">
                  <strong>Clausula 5a.</strong> O CONTRATADO prestara os servicos no horario compreendido entre as partes, totalizando <strong>{Number(params.frequenciaSemanal || 0)} vez(es)</strong> na semana, correspondente ao pacote de <strong>{Number(params.sessoesPacote || 0)} sessoes</strong>.
                </p>

                <h2 className="mt-8 text-center text-[18px] font-bold uppercase">Do Valor e Forma de Pagamento</h2>
                <p className="mt-4 text-justify">
                  <strong>Clausula 6a.</strong> Pelos servicos contratados, o CONTRATANTE pagara ao CONTRATADO o valor total de <strong>{formatMoneyBr(params.valorTotal)}</strong>.
                </p>
                <p className="mt-3 text-justify">
                  <strong>Paragrafo unico.</strong> A forma de pagamento acordada entre as partes sera: <strong>{safe(params.formaPagamento)}</strong>.
                </p>

                <h2 className="mt-8 text-center text-[18px] font-bold uppercase">Da Vigencia e Rescisao</h2>
                <p className="mt-4 text-justify">
                  <strong>Clausula 7a.</strong> Este contrato vigorara de <strong>{formatDateBr(params.inicioVigencia)}</strong> ate <strong>{formatDateBr(params.fimVigencia)}</strong>, podendo ser encerrado antecipadamente mediante comunicacao previa entre as partes.
                </p>

                <h2 className="mt-8 text-center text-[18px] font-bold uppercase">Do Foro</h2>
                <p className="mt-4 text-justify">
                  <strong>Clausula 8a.</strong> Para dirimir quaisquer controversias oriundas deste contrato, as partes elegem o foro da comarca de <strong>{safe(params.foroCidade)}/{safe(params.foroUF)}</strong>, com renuncia expressa de qualquer outro.
                </p>

                <p className="mt-8 text-center">{safe(params.foroCidade)}/{safe(params.foroUF)}, {formatDateBr(params.inicioVigencia)}.</p>

                <div className="mt-14 grid grid-cols-2 gap-10 text-center">
                  <div>
                    <div className="border-t border-black pt-2 text-sm">CONTRATANTE</div>
                    <div className="mt-1 text-sm font-semibold">{safe(params.contratante.nome)}</div>
                  </div>
                  <div>
                    <div className="border-t border-black pt-2 text-sm">CONTRATADO</div>
                    <div className="mt-1 text-sm font-semibold">{safe(params.contratado.nome)}</div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <div className="contract-json mt-3 rounded-lg border border-neutral-300 bg-white p-3">
            <div className="mb-1 text-xs font-semibold text-neutral-700">Parametros do exemplo do contrato</div>
            <pre className="max-h-56 overflow-auto rounded bg-neutral-100 p-2 text-xs text-neutral-800">
              <code>{JSON.stringify(params, null, 2)}</code>
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
            background: white !important;
            overflow: visible !important;
          }
          .contract-editor-panel,
          .contract-topbar,
          .contract-json {
            display: none !important;
          }
          .contract-root,
          .contract-root > div {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            gap: 0 !important;
          }
          .contract-paper-wrap {
            border: none !important;
            background: white !important;
            padding: 0 !important;
            overflow: visible !important;
            border-radius: 0 !important;
          }
          .contract-paper {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  )
}
