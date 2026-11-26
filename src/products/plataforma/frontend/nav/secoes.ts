// The sections of the Otto menu and the shortcuts of "Novo". Each ERP item shows only to profiles with its capability.
import {
  IconArchiveFilled, IconArrowsExchange, IconArticleFilled, IconBasketFilled, IconBookFilled, IconBriefcaseFilled,
  IconCalendarFilled, IconCashBanknoteFilled, IconClockFilled, IconStarFilled, IconTrashFilled, IconChartAreaLineFilled, IconBoltFilled, IconSpeakerphone, IconFilterFilled, IconChartAreaFilled, IconWorldFilled, IconAdjustmentsFilled, IconMessageCircleFilled, IconClipboardListFilled, IconCoinFilled,
  IconCreditCardFilled, IconFileTextFilled, IconFolderFilled,
  IconReceiptFilled, IconSendFilled, IconShoppingCartFilled,
  IconBriefcase2Filled, IconCategoryFilled, IconFileImport, IconHeadphonesFilled, IconTagFilled, IconTruckFilled, IconUserFilled, IconVideoFilled, IconSparkles2Filled,
} from "@tabler/icons-react"

import type { ErpCapability } from "@/products/erp/shared/professionalContracts"
import type { Categoria, SecaoId } from "../../shared/categorias"
import { RECURSOS } from "../../shared/recursos"

export type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>
export type NavigationItem = {
  title: string
  url: string
  icon?: IconComponent
  /** Other pages that belong to this item and keep it highlighted. */
  activePaths?: string[]
  /** Pages under the item's url that belong to another item. */
  excludePaths?: string[]
  /** Pages shown as tabs inside the item: found by the search, not listed in the menu. */
  tabs?: { title: string; url: string }[]
  exactActive?: boolean
  capability?: ErpCapability
  children?: NavigationItem[]
}
/** alwaysOpen: the section has no open/close arrow; its items always show. */
export type Section = { id: SecaoId; title: string; items: NavigationItem[]; alwaysOpen?: boolean }

/** The sections that open and close. Each ERP item shows only to profiles with its capability. */
export const sections: Section[] = [
  {
    id: "marketing", title: "Marketing", items: [
      { title: "Editor", url: "/editor", icon: IconVideoFilled },
      ...(RECURSOS.videos ? [{ title: "Vídeos", url: "/marketing/videos", icon: IconSparkles2Filled }] : []),
      { title: "Postar", url: "/marketing/postar", icon: IconSendFilled },
      { title: "Agendados", url: "/marketing/posts", icon: IconCalendarFilled },
      { title: "Sound effects", url: "/marketing/sound-effects", icon: IconHeadphonesFilled },
    ],
  },
  {
    id: "analytics", title: "Analytics", items: [
      { title: "Painéis", url: "/analytics", icon: IconChartAreaLineFilled, exactActive: true },
      { title: "Eventos", url: "/analytics/eventos", icon: IconBoltFilled },
      { title: "Sites e apps", url: "/analytics/sites", icon: IconWorldFilled },
    ],
  },
  {
    id: "automacao", title: "Automação", items: [
      { title: "Automações", url: "/automacoes", icon: IconBoltFilled },
      { title: "Disparos", url: "/disparos", icon: IconSpeakerphone },
      { title: "Segmentos", url: "/segmentos", icon: IconFilterFilled },
    ],
  },
  {
    id: "vendas", title: "Vendas", items: [
      { title: "Orçamentos", url: "/erp/vendas/orcamentos", icon: IconFileTextFilled, capability: "erp.vendas.visualizar" },
      { title: "Pedidos", url: "/erp/vendas/pedidos", icon: IconShoppingCartFilled, capability: "erp.vendas.visualizar" },
      { title: "Ordens de serviço", url: "/erp/vendas/ordens-servico", icon: IconClipboardListFilled, capability: "erp.vendas.visualizar" },
      { title: "Contratos", url: "/erp/vendas/contratos", icon: IconArticleFilled, capability: "erp.vendas.visualizar" },
      { title: "Notas de serviço", url: "/erp/vendas/notas-fiscais", icon: IconReceiptFilled, capability: "erp.vendas.visualizar" },
      { title: "Clientes", url: "/erp/cadastros/clientes", icon: IconUserFilled, capability: "erp.cadastros.visualizar" },
      { title: "Vendedores", url: "/erp/cadastros/vendedores", icon: IconBriefcaseFilled, capability: "erp.cadastros.visualizar" },
      { title: "Produtos", url: "/erp/cadastros/produtos", icon: IconTagFilled, capability: "erp.cadastros.visualizar" },
      { title: "Serviços", url: "/erp/cadastros/servicos", icon: IconBriefcase2Filled, capability: "erp.cadastros.visualizar" },
    ],
  },
  {
    id: "financeiro", title: "Financeiro", alwaysOpen: true, items: [
      { title: "Contas a pagar", url: "/erp/financeiro/contas-a-pagar", icon: IconCreditCardFilled, capability: "erp.financeiro.visualizar" },
      { title: "Contas a receber", url: "/erp/financeiro/contas-a-receber", icon: IconCoinFilled, capability: "erp.financeiro.visualizar" },
      {
        title: "Contas bancárias", url: "/erp/financeiro/contas-financeiras", icon: IconCashBanknoteFilled, capability: "erp.financeiro.visualizar",
        activePaths: ["/erp/financeiro/contas-financeiras", "/erp/financeiro/transferencias-financeiras", "/erp/financeiro/conciliacao-bancaria"],
        tabs: [{ title: "Transferências", url: "/erp/financeiro/transferencias-financeiras" }, { title: "Conciliação", url: "/erp/financeiro/conciliacao-bancaria" }],
      },
      {
        title: "Contabilidade", url: "/erp/cadastros/contas-contabeis", icon: IconBookFilled, capability: "erp.financeiro.visualizar",
        activePaths: ["/erp/cadastros/contas-contabeis", "/erp/financeiro/fechamentos"],
        tabs: [{ title: "Plano de contas", url: "/erp/cadastros/contas-contabeis" }, { title: "Fechamentos", url: "/erp/financeiro/fechamentos" }],
      },
      {
        title: "Compras", url: "/erp/compras/pedidos-compra", icon: IconBasketFilled, activePaths: ["/erp/compras"], capability: "erp.compras.visualizar",
        children: [
          { title: "Pedidos de compra", url: "/erp/compras/pedidos-compra" },
          { title: "Parcelas a pagar", url: "/erp/compras/parcelas-a-pagar" },
          { title: "Notas de compra", url: "/erp/compras/notas-compra" },
        ],
      },
      {
        title: "Estoque", url: "/erp/estoque/posicao-estoque", icon: IconArchiveFilled, activePaths: ["/erp/estoque"], capability: "erp.estoque.visualizar",
        children: [
          { title: "Situação", url: "/erp/estoque/posicao-estoque" },
          { title: "Movimentações", url: "/erp/estoque/movimentacoes" },
          { title: "Inventários", url: "/erp/estoque/inventarios" },
          { title: "Transferências", url: "/erp/estoque/transferencias" },
        ],
      },
      { title: "Fornecedores", url: "/erp/cadastros/fornecedores", icon: IconTruckFilled, capability: "erp.cadastros.visualizar" },
      { title: "Categorias financeiras", url: "/erp/cadastros/categorias", icon: IconCategoryFilled, capability: "erp.cadastros.visualizar" },
      {
        title: "Importar e exportar", url: "/erp/cadastros/importacoes", icon: IconFileImport, capability: "erp.cadastros.visualizar",
        activePaths: ["/erp/cadastros/importacoes", "/erp/cadastros/automacoes"],
        tabs: [{ title: "Rotinas e recorrências", url: "/erp/cadastros/automacoes" }],
      },
    ],
  },
  ...(RECURSOS.notas ? [{
    id: "notas" as const, title: "Notas", items: [
      { title: "Notas", url: "/notas", icon: IconFileTextFilled },
    ],
  }] : []),
  {
    id: "drive", title: "Drive", items: [
      { title: "Início", url: "/drive", icon: IconFolderFilled, excludePaths: ["/drive/recentes", "/drive/favoritos", "/drive/lixeira"] },
      { title: "Recentes", url: "/drive/recentes", icon: IconClockFilled },
      { title: "Favoritos", url: "/drive/favoritos", icon: IconStarFilled },
      { title: "Lixeira", url: "/drive/lixeira", icon: IconTrashFilled },
    ],
  },
  {
    id: "inbox", title: "Atendimento", items: [
      { title: "Caixa de entrada", url: "/inbox", icon: IconMessageCircleFilled, exactActive: true },
      { title: "Contatos", url: "/inbox/contatos", icon: IconUserFilled },
      { title: "Canais", url: "/inbox/canais", icon: IconArrowsExchange },
      { title: "Configurações", url: "/inbox/configuracoes", icon: IconAdjustmentsFilled },
    ],
  },
  {
    id: "crm", title: "CRM", items: [
      { title: "Negócios", url: "/negocios", icon: IconBriefcaseFilled },
      { title: "Relatórios", url: "/relatorios", icon: IconChartAreaFilled },
    ],
  },
]

/** "Novo" in the header: the most common records, for the categories that have them. */
export const createActions: { title: string; url: string; capability?: ErpCapability; categorias: Categoria[] }[] = [
  { title: "Novo pedido de venda", url: "/erp/vendas/pedidos", capability: "erp.vendas.visualizar", categorias: ["gestao", "completo"] },
  { title: "Novo orçamento", url: "/erp/vendas/orcamentos", capability: "erp.vendas.visualizar", categorias: ["gestao", "completo"] },
  { title: "Nova conta a pagar", url: "/erp/financeiro/contas-a-pagar", capability: "erp.financeiro.visualizar", categorias: ["gestao", "completo"] },
  { title: "Nova conta a receber", url: "/erp/financeiro/contas-a-receber", capability: "erp.financeiro.visualizar", categorias: ["gestao", "completo"] },
  { title: "Novo vídeo", url: "/editor", categorias: ["marketing", "completo"] },
  { title: "Novo post", url: "/marketing/postar", categorias: ["marketing", "completo"] },
  ...(RECURSOS.videos ? [{ title: "Gerar vídeo com IA", url: "/marketing/videos", categorias: ["marketing", "completo"] as Categoria[] }] : []),
]

const matches = (pathname: string, path: string) => pathname === path || pathname.startsWith(path + "/")
export function isActive(item: NavigationItem, pathname: string): boolean {
  if (item.excludePaths?.some((path) => matches(pathname, path))) return false
  if (item.activePaths?.some((path) => matches(pathname, path))) return true
  if (item.children?.some((child) => isActive(child, pathname))) return true
  return item.exactActive ? pathname === item.url : matches(pathname, item.url)
}
