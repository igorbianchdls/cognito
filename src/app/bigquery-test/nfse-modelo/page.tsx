'use client'

type NfsePrestadorTomador = {
  cpfCnpj: string
  inscricaoMunicipal?: string
  nomeRazao: string
  endereco: string
  municipio: string
  uf: string
  email?: string
}

type NfseModeloParams = {
  numeroNota: string
  dataHoraEmissao: string
  codigoVerificacao: string
  prestador: NfsePrestadorTomador
  tomador: NfsePrestadorTomador
  discriminacao: string[]
  valorTotalNota: number
  codigoServico: string
  tributos: {
    valorTotalDeducoes: number
    baseCalculo: number
    aliquota: string
    valorIss: number
    credito: number
  }
  outrasInformacoes: string[]
}

const nfseExemplo: NfseModeloParams = {
  numeroNota: '00000001',
  dataHoraEmissao: '01/06/2006 12:01:40',
  codigoVerificacao: 'TPUG-7K2J',
  prestador: {
    cpfCnpj: '64.167.648/0001-33',
    inscricaoMunicipal: '1.131.306-8',
    nomeRazao: 'FACULDADE DE MEDICINA APLICADA LTDA',
    endereco: 'AV SAPOPEMBA 0520 - VILA GUARANI - CEP: 03374-001',
    municipio: 'SAO PAULO',
    uf: 'SP',
  },
  tomador: {
    cpfCnpj: '007.785.327-03',
    nomeRazao: 'SANDRO MUNIZ ROCHA',
    endereco: 'R JORNALISTA MOACIR PADILHA, 70 APTO 306 BLC 2 - CEP: 05020-000',
    municipio: 'SAO PAULO',
    uf: 'SP',
    email: 'sandromunizrocha@internet.com.br',
  },
  discriminacao: [
    '- Faculdade de Medicina Aplicada',
    'Mensalidade referente ao mes de junho: R$ 1.500,00 (hum mil e quinhentos reais)',
    'Disciplinas Especificas, conforme discriminacao abaixo:',
    '8845 - Anatomia III',
    '8872 - Endocrino',
    '8810 - Angiologia e Cirurgia Vascular',
    '8815 - Cirurgia Cardiovascular',
  ],
  valorTotalNota: 1500,
  codigoServico: '0690 - ENSINO SUPERIOR, CURSOS DE GRADUACAO E DEMAIS CURSOS',
  tributos: {
    valorTotalDeducoes: 0,
    baseCalculo: 1500,
    aliquota: '5,00%',
    valorIss: 75,
    credito: 22.5,
  },
  outrasInformacoes: [
    '- O credito gerado estara disponivel somente apos o recolhimento do ISS desta NFS-e.',
    '- Data de vencimento do ISS desta NFS-e: 10/07/2006.',
  ],
}

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function BoxLabel({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[11px] leading-[1.2]">
      <span className="font-semibold">{label}: </span>
      <span>{value}</span>
    </div>
  )
}

export default function NfseModeloPage() {
  const n = nfseExemplo

  return (
    <div className="min-h-screen bg-zinc-200 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="nfse-toolbar flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-zinc-900">Modelo NFS-e (fiel ao layout da imagem)</h1>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Baixar PDF
          </button>
        </div>

        <div className="nfse-canvas overflow-auto rounded-md border border-zinc-400 bg-zinc-300 p-4">
          <div className="mx-auto w-[794px] min-h-[1123px] border-[1.5px] border-black bg-white text-black">
            <div className="border-b border-black px-2 py-1 text-[10px] leading-tight">
              Os dados da NFS-e abaixo sao ficticios. Documento visual de simulacao para interface.
            </div>

            <div className="grid grid-cols-[94px_1fr_220px] border-b border-black">
              <div className="flex items-center justify-center border-r border-black p-2">
                <img
                  src="/brasaoSP.png"
                  alt="Brasao da Prefeitura de Sao Paulo"
                  className="h-[84px] w-[72px] object-contain"
                />
              </div>

              <div className="border-r border-black p-2 text-center">
                <div className="text-[25px] font-bold leading-none">PREFEITURA DO MUNICIPIO DE SAO PAULO</div>
                <div className="mt-1 text-[13px] font-semibold">SECRETARIA MUNICIPAL DE FINANCAS</div>
                <div className="mt-1 text-[23px] font-bold">NOTA FISCAL ELETRONICA DE SERVICOS - NFS-e</div>
              </div>

              <div className="grid grid-rows-3 text-[11px]">
                <div className="border-b border-black p-1">
                  <div className="font-semibold">Numero da Nota</div>
                  <div className="text-[22px] font-bold leading-none">{n.numeroNota}</div>
                </div>
                <div className="border-b border-black p-1">
                  <div className="font-semibold">Data e Hora de Emissao</div>
                  <div className="font-semibold">{n.dataHoraEmissao}</div>
                </div>
                <div className="p-1">
                  <div className="font-semibold">Codigo de Verificacao</div>
                  <div className="text-[18px] font-bold leading-none">{n.codigoVerificacao}</div>
                </div>
              </div>
            </div>

            <div className="border-b border-black bg-zinc-100 px-2 py-1 text-center text-[19px] font-bold">PRESTADOR DE SERVICOS</div>
            <div className="grid grid-cols-[110px_1fr] border-b border-black">
              <div className="flex items-center justify-center border-r border-black p-2">
                <div className="h-[62px] w-[86px] border border-black bg-[#0b6170] p-1 text-center text-[26px] font-bold text-white">FMA</div>
              </div>
              <div className="space-y-1 p-2">
                <div className="grid grid-cols-[1fr_220px] gap-2">
                  <BoxLabel label="CPF/CNPJ" value={n.prestador.cpfCnpj} />
                  <BoxLabel label="Inscricao Municipal" value={n.prestador.inscricaoMunicipal || '-'} />
                </div>
                <BoxLabel label="Nome/Razao Social" value={n.prestador.nomeRazao} />
                <div className="grid grid-cols-[1fr_60px] gap-2">
                  <BoxLabel label="Endereco" value={n.prestador.endereco} />
                  <BoxLabel label="UF" value={n.prestador.uf} />
                </div>
                <BoxLabel label="Municipio" value={n.prestador.municipio} />
              </div>
            </div>

            <div className="border-b border-black bg-zinc-100 px-2 py-1 text-center text-[19px] font-bold">TOMADOR DE SERVICOS</div>
            <div className="space-y-1 border-b border-black p-2">
              <BoxLabel label="Nome/Razao Social" value={n.tomador.nomeRazao} />
              <BoxLabel label="CPF/CNPJ" value={n.tomador.cpfCnpj} />
              <BoxLabel label="Endereco" value={n.tomador.endereco} />
              <div className="grid grid-cols-[1fr_60px_1fr] gap-2">
                <BoxLabel label="Municipio" value={n.tomador.municipio} />
                <BoxLabel label="UF" value={n.tomador.uf} />
                <BoxLabel label="E-mail" value={n.tomador.email || '-'} />
              </div>
            </div>

            <div className="relative min-h-[255px] border-b border-black">
              <div className="border-b border-black bg-zinc-100 px-2 py-1 text-center text-[19px] font-bold">DISCRIMINACAO DOS SERVICOS</div>
              <div className="space-y-[2px] p-2 text-[14px] leading-[1.25]">
                {n.discriminacao.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>

            <div className="border-b border-black px-2 py-1 text-center text-[30px] font-bold">
              VALOR TOTAL DA NOTA = {formatCurrency(n.valorTotalNota)}
            </div>

            <div className="border-b border-black">
              <div className="border-b border-black px-2 py-1 text-[13px] font-semibold">Codigo do Servico</div>
              <div className="border-b border-black px-2 py-1 text-[17px] font-bold">{n.codigoServico}</div>
              <div className="grid grid-cols-5 border-b border-black text-center text-[11px] font-semibold">
                <div className="border-r border-black p-1">Valor Total das Deducoes (R$)</div>
                <div className="border-r border-black p-1">Base de Calculo (R$)</div>
                <div className="border-r border-black p-1">Aliquota (%)</div>
                <div className="border-r border-black p-1">Valor do ISS (R$)</div>
                <div className="p-1">Credito p/ Abatimento do IPTU</div>
              </div>
              <div className="grid grid-cols-5 text-center text-[18px] font-bold">
                <div className="border-r border-black p-1">{n.tributos.valorTotalDeducoes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="border-r border-black p-1">{n.tributos.baseCalculo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="border-r border-black p-1">{n.tributos.aliquota}</div>
                <div className="border-r border-black p-1">{n.tributos.valorIss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div className="p-1">{n.tributos.credito.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

            <div className="border-b border-black bg-zinc-100 px-2 py-1 text-center text-[18px] font-bold">OUTRAS INFORMACOES</div>
            <div className="space-y-1 p-2 pb-4 text-[13px]">
              {n.outrasInformacoes.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="nfse-params rounded-md border border-zinc-300 bg-white p-3">
          <div className="mb-2 text-sm font-semibold text-zinc-800">Parametros do exemplo da nota fiscal</div>
          <pre className="overflow-auto rounded bg-zinc-100 p-3 text-xs text-zinc-800">
            <code>{JSON.stringify(nfseExemplo, null, 2)}</code>
          </pre>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .nfse-toolbar {
            display: none !important;
          }
          .nfse-params {
            display: none !important;
          }
          .nfse-canvas {
            border: none !important;
            background: #fff !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          body {
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  )
}
