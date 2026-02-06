'use client';

import Link from 'next/link'

export default function BigQueryTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">BigQuery Test</h1>
        <p className="text-gray-600 mb-6">Área de testes internos.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium text-gray-900 mb-2">AgentMail</div>
            <Link
              href="/bigquery-test/inboxes-seed"
              className="inline-flex rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
            >
              Abrir seed de inboxes
            </Link>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium text-gray-900 mb-2">Drive</div>
            <Link
              href="/bigquery-test/drive-finance-seed"
              className="inline-flex rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
            >
              Abrir seed financeiro (PDF)
            </Link>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="text-sm font-medium text-gray-900 mb-2">Modelos</div>
            <Link
              href="/bigquery-test/modelos"
              className="inline-flex rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-50"
            >
              Abrir modelos de documentos
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
