import {
  BadgeCheck,
  Check,
  CheckCircle2,
  FileSearch,
  MessageSquareText,
  ReceiptText,
  Send,
  WalletCards,
} from 'lucide-react'

const invoiceStages = [
  {
    detail: 'ChatGPT ou Claude',
    icon: MessageSquareText,
    label: 'Pedido recebido',
  },
  {
    detail: 'Venda e cliente',
    icon: FileSearch,
    label: 'Dados encontrados',
  },
  {
    detail: 'Antes de transmitir',
    icon: BadgeCheck,
    label: 'Sua confirmação',
  },
  {
    detail: 'Documento fiscal',
    icon: ReceiptText,
    label: 'Nota autorizada',
  },
  {
    detail: 'Cliente e financeiro',
    icon: Send,
    label: 'Tudo atualizado',
  },
]

const invoiceDetails = [
  ['Cliente', 'Bruna Schmitz'],
  ['Serviço', 'Consultoria financeira'],
  ['Município', 'Recife, PE'],
  ['Valor', 'R$ 375,00'],
]

export function InvoiceShowcase() {
  return (
    <div
      aria-label="Demonstração da emissão de uma nota fiscal por conversa"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
      role="img"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            <MessageSquareText aria-hidden="true" className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">ChatGPT ou Claude</p>
            <p className="text-xs text-slate-500">Otto conectada</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Pronta para emitir
        </div>
      </div>

      <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border-b border-slate-200 bg-slate-50 p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase text-slate-500">Pedido por conversa</p>

          <div className="mt-5 ml-auto max-w-sm rounded-lg bg-slate-950 px-4 py-3 text-sm leading-6 text-white">
            Emita a nota fiscal da venda 317.
          </div>

          <div className="mt-5 max-w-md">
            <p className="text-sm leading-6 text-slate-700">
              Encontrei a venda e preparei os dados fiscais. Revise o valor antes de eu emitir.
            </p>
            <div className="mt-4 space-y-2.5">
              {['Venda identificada', 'Cliente localizado', 'Dados fiscais preenchidos'].map((item) => (
                <div className="flex items-center gap-2 text-sm text-slate-600" key={item}>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check aria-hidden="true" className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Nota preparada</p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">Revise e confirme a emissão</h3>
            </div>
            <ReceiptText aria-hidden="true" className="h-6 w-6 shrink-0 text-slate-400" />
          </div>

          <dl className="mt-6 divide-y divide-slate-100 border-y border-slate-200">
            {invoiceDetails.map(([label, value]) => (
              <div className="flex items-center justify-between gap-5 py-3 text-sm" key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-medium text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-700" />
            <p className="text-xs leading-5 text-emerald-900">
              Nenhum dado é transmitido sem a sua confirmação.
            </p>
          </div>

          <button
            className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white"
            type="button"
          >
            <BadgeCheck aria-hidden="true" className="h-4 w-4" />
            Confirmar emissão
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white p-5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-5">
          {invoiceStages.map((stage, index) => {
            const Icon = stage.icon

            return (
              <div className="relative min-w-0" key={stage.label}>
                {index < invoiceStages.length - 1 ? (
                  <span className="absolute top-4 left-8 hidden h-px w-[calc(100%-1rem)] bg-slate-200 sm:block" />
                ) : null}
                <div className="relative flex items-center gap-3 sm:block">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
                    <Icon aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 sm:mt-3">
                    <p className="text-xs font-semibold text-slate-950">{stage.label}</p>
                    <p className="mt-0.5 text-xs leading-4 text-slate-500">{stage.detail}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <WalletCards aria-hidden="true" className="h-4 w-4" />
          Após a autorização, a Otto registra o documento e atualiza o financeiro.
        </div>
      </div>
    </div>
  )
}
