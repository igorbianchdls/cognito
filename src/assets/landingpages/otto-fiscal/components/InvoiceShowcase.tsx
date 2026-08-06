import {
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Download,
  FileCheck2,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Search,
  Settings2,
} from 'lucide-react'

const invoices = [
  { number: 'NF-e 000184', customer: 'Mercado Horizonte Ltda.', date: 'Hoje, 10:42', value: 'R$ 4.890,00', status: 'Autorizada', tone: 'success' },
  { number: 'NFS-e 000072', customer: 'Studio Norte Arquitetura', date: 'Hoje, 09:18', value: 'R$ 1.750,00', status: 'Processando', tone: 'warning' },
  { number: 'NF-e 000183', customer: 'Casa Lima Comércio', date: 'Ontem, 16:35', value: 'R$ 820,40', status: 'Autorizada', tone: 'success' },
]

export function InvoiceShowcase() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#dce3de] bg-white shadow-[0_24px_70px_rgba(30,65,43,0.12)]" role="img" aria-label="Interface do emissor de notas fiscais Otto">
      <div className="flex h-14 items-center justify-between border-b border-[#e5e9e6] px-4 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-[#17653a] text-white"><ReceiptText className="h-4 w-4" /></div>
          <div>
            <p className="text-xs font-semibold text-[#202521]">Otto Fiscal</p>
            <p className="text-[10px] text-[#7b827c]">Ambiente de produção</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Ajuda" className="grid h-8 w-8 place-items-center rounded-md text-[#69716b] hover:bg-[#f2f4f2]"><CircleHelp className="h-4 w-4" /></button>
          <button type="button" aria-label="Notificações" className="grid h-8 w-8 place-items-center rounded-md text-[#69716b] hover:bg-[#f2f4f2]"><Bell className="h-4 w-4" /></button>
          <button type="button" className="hidden h-8 items-center gap-2 rounded-md border border-[#dde2de] px-3 text-[11px] font-medium text-[#434a45] sm:flex">
            Vértice Comercial <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid min-h-[510px] md:grid-cols-[176px_1fr]">
        <aside className="hidden border-r border-[#e5e9e6] bg-[#f8faf8] p-3 md:block">
          <p className="px-2 pb-2 pt-1 text-[10px] font-medium uppercase text-[#8a918b]">Fiscal</p>
          <nav className="grid gap-1">
            <div className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-xs text-[#5d655f]"><LayoutDashboard className="h-4 w-4" />Visão geral</div>
            <div className="flex h-9 items-center gap-2.5 rounded-md bg-[#e8f3eb] px-2.5 text-xs font-medium text-[#155f35]"><ReceiptText className="h-4 w-4" />Notas fiscais</div>
            <div className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-xs text-[#5d655f]"><FileCheck2 className="h-4 w-4" />Certificados</div>
            <div className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-xs text-[#5d655f]"><Settings2 className="h-4 w-4" />Configurações</div>
          </nav>
          <div className="mt-8 border-t border-[#e0e5e1] px-2 pt-4">
            <div className="flex items-center gap-2 text-[11px] text-[#69716b]"><span className="h-2 w-2 rounded-full bg-[#45a565]" />Serviços fiscais operando</div>
          </div>
        </aside>

        <div className="min-w-0 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-medium text-[#788079]">DOCUMENTOS FISCAIS</p>
              <h2 className="mt-1 [--ui-title-font-size:20px] font-semibold text-[#1c211d]">Notas fiscais</h2>
            </div>
            <button type="button" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#17653a] px-4 text-xs font-medium text-white">
              <Plus className="h-4 w-4" /> Nova nota fiscal
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 border-y border-[#e4e8e5] sm:grid-cols-4">
            <div className="border-b border-r border-[#e4e8e5] px-3 py-4 sm:border-b-0"><p className="text-[10px] text-[#7b827c]">Emitidas no mês</p><p className="mt-1.5 text-xl font-semibold text-[#202521]">48</p></div>
            <div className="border-b border-[#e4e8e5] px-3 py-4 sm:border-b-0 sm:border-r"><p className="text-[10px] text-[#7b827c]">Autorizadas</p><p className="mt-1.5 text-xl font-semibold text-[#17653a]">45</p></div>
            <div className="border-r border-[#e4e8e5] px-3 py-4"><p className="text-[10px] text-[#7b827c]">Processando</p><p className="mt-1.5 text-xl font-semibold text-[#8a631d]">2</p></div>
            <div className="px-3 py-4"><p className="text-[10px] text-[#7b827c]">Ação necessária</p><p className="mt-1.5 text-xl font-semibold text-[#a34435]">1</p></div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[280px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8c938d]" />
              <div className="flex h-9 items-center rounded-md border border-[#dfe4e0] pl-9 text-[11px] text-[#929892]">Buscar nota ou cliente</div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="h-9 rounded-md border border-[#dfe4e0] px-3 text-[11px] text-[#5f6761]">Todas</button>
              <button type="button" aria-label="Baixar documentos" className="grid h-9 w-9 place-items-center rounded-md border border-[#dfe4e0] text-[#5f6761]"><Download className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-md border border-[#e1e5e2]">
            <div className="grid grid-cols-[1fr_auto] bg-[#f7f9f7] px-4 py-2.5 text-[10px] font-medium text-[#7c837d] sm:grid-cols-[130px_1fr_100px_105px_90px]">
              <span>Documento</span><span className="hidden sm:block">Cliente</span><span className="hidden sm:block">Emissão</span><span className="hidden text-right sm:block">Valor</span><span className="text-right">Situação</span>
            </div>
            {invoices.map((invoice) => (
              <div key={invoice.number} className="grid min-h-16 grid-cols-[1fr_auto] items-center border-t border-[#e7eae8] px-4 py-3 sm:grid-cols-[130px_1fr_100px_105px_90px]">
                <div><p className="text-xs font-medium text-[#272d28]">{invoice.number}</p><p className="mt-1 text-[10px] text-[#838a84] sm:hidden">{invoice.customer}</p></div>
                <span className="hidden truncate pr-3 text-[11px] text-[#515952] sm:block">{invoice.customer}</span>
                <span className="hidden text-[10px] text-[#747c75] sm:block">{invoice.date}</span>
                <span className="hidden text-right text-[11px] font-medium text-[#343a35] sm:block">{invoice.value}</span>
                <span className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ${invoice.tone === 'success' ? 'bg-[#e8f4eb] text-[#21673a]' : 'bg-[#f8f0df] text-[#7d5a19]'}`}>
                  {invoice.tone === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}{invoice.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
