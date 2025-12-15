import { CheckCircle2, AlertTriangle, FileText, User, Calendar, Hash, Landmark } from 'lucide-react'

type OCRData = {
  fornecedor_nome?: string
  fornecedor_cnpj?: string
  numero_documento?: string
  data_emissao?: string
  data_vencimento?: string
  valor_total?: number
}

type FornecedorInfo = { found: boolean; id?: string; nome?: string; cnpj?: string }
type ContaInfo = { id?: string; descricao?: string; data_vencimento?: string; valor?: number }

export default function AutomationResultCard({
  ocr,
  fornecedor,
  contaAPagar,
  warnings = [],
}: {
  ocr?: OCRData
  fornecedor?: FornecedorInfo
  contaAPagar?: ContaInfo
  warnings?: string[]
}) {
  return (
    <div className="border rounded-lg bg-white">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <span className="font-semibold">Automação de Fatura → Contas a Pagar</span>
        </div>
        <div className="text-sm text-muted-foreground">Resumo</div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="text-xs uppercase text-gray-500">Dados extraídos (OCR)</div>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> {ocr?.fornecedor_nome || '—'}</div>
            <div className="flex items-center gap-2"><Landmark className="w-3.5 h-3.5" /> {ocr?.fornecedor_cnpj || '—'}</div>
            <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5" /> {ocr?.numero_documento || '—'}</div>
            <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Emissão: {ocr?.data_emissao || '—'}</div>
            <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Vencimento: {ocr?.data_vencimento || '—'}</div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 inline-block rounded bg-emerald-500" />
              Valor: {ocr?.valor_total != null ? Number(ocr.valor_total).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase text-gray-500">Fornecedor</div>
          <div className="text-sm space-y-1">
            {fornecedor?.found ? (
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Encontrado
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" /> Criado novo
              </div>
            )}
            <div>ID: {fornecedor?.id || '—'}</div>
            <div>Nome: {fornecedor?.nome || '—'}</div>
            <div>CNPJ: {fornecedor?.cnpj || '—'}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs uppercase text-gray-500">Conta a Pagar</div>
          <div className="text-sm space-y-1">
            <div>ID: {contaAPagar?.id || '—'}</div>
            <div>Descrição: {contaAPagar?.descricao || '—'}</div>
            <div>Vencimento: {contaAPagar?.data_vencimento || '—'}</div>
            <div>Valor: {contaAPagar?.valor != null ? Number(contaAPagar.valor).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—'}</div>
          </div>
        </div>
      </div>

      {warnings?.length ? (
        <div className="px-4 py-3 border-t bg-amber-50 text-amber-800 text-sm">
          <div className="font-medium mb-1">Avisos</div>
          <ul className="list-disc pl-5 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

