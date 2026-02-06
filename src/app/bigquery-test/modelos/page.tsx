'use client'

import Link from 'next/link'

const docs = [
  {
    title: 'NFS-e',
    description: 'Modelo de nota fiscal de servico eletronica em layout oficial.',
    href: '/bigquery-test/modelos/nfse',
  },
  {
    title: 'Contrato',
    description: 'Modelo de contrato de prestacao de servicos estilo Word/Docs.',
    href: '/bigquery-test/modelos/contrato',
  },
  {
    title: 'Ordem de Servico',
    description: 'Modelo operacional com servicos executados, pecas e assinaturas.',
    href: '/bigquery-test/modelos/os',
  },
  {
    title: 'Fatura',
    description: 'Modelo de cobranca com itens, vencimento e instrucoes de pagamento.',
    href: '/bigquery-test/modelos/fatura',
  },
  {
    title: 'Proposta Comercial',
    description: 'Modelo de proposta com escopo, cronograma e investimento.',
    href: '/bigquery-test/modelos/proposta',
  },
]

export default function ModelosPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Modelos de Documentos</h1>
        <p className="mb-6 text-sm text-gray-600">Colecao de modelos em formato A4 com exportacao para PDF.</p>

        <div className="grid gap-4 md:grid-cols-2">
          {docs.map((doc) => (
            <div key={doc.href} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-base font-semibold text-gray-900">{doc.title}</div>
              <p className="mt-1 text-sm text-gray-600">{doc.description}</p>
              <Link
                href={doc.href}
                className="mt-3 inline-flex rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
              >
                Abrir modelo
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

