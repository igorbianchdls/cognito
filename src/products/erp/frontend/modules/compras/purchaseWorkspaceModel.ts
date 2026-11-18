// Types and helpers shared by the purchase workspace files.



import { erpClientToday } from '@/products/erp/frontend/services/erpTimeZone';


export type CatalogItem = {
  id: string;
  nome: string;
  codigo?: string;
  documento?: string;
  unidade?: string;
  valor_padrao?: string | number;
  gera_financeiro_padrao?: boolean;
};

export type PurchaseCatalogs = {
  suppliers: CatalogItem[];
  products: CatalogItem[];
  services: CatalogItem[];
  categories: CatalogItem[];
  costCenters: CatalogItem[];
  financialAccounts: CatalogItem[];
  paymentMethods: CatalogItem[];
  operationNatures: CatalogItem[];
  locations: CatalogItem[];
};

export type PurchaseRecord = {
  descricao: string;
  categoria: string;
  id: string;
  numero: string;
  fornecedor: string;
  data: string;
  entrega: string;
  total: number;
  tipo_compra: string;
  tipo_movimento: string;
  financeiro: string;
  status: string;
  versao: number;
  devolvida: boolean;
};

export type PurchaseItem = {
  rowId: string;
  kind: "produto" | "servico";
  itemId: string;
  descricao: string;
  detalhes: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
  percentualDesconto: string;
};

export type PlannedInstallment = {
  numero: number;
  vencimento: string;
  valor: string;
  observacoes: string;
};

export type ReceiveItem = {
  id: string;
  descricao: string;
  pendente: number;
  quantidade: string;
  localEstoqueId: string;
};

export const emptyCatalogs: PurchaseCatalogs = {
  suppliers: [],
  products: [],
  services: [],
  categories: [],
  costCenters: [],
  financialAccounts: [],
  paymentMethods: [],
  operationNatures: [],
  locations: [],
};

export function today() {
  return erpClientToday();
}

export function money(value: string | number) {
  const parsed = Number(String(value || 0).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function newItem(): PurchaseItem {
  return {
    rowId: crypto.randomUUID(),
    kind: "produto",
    itemId: "",
    descricao: "",
    detalhes: "",
    unidade: "UN",
    quantidade: "1",
    valorUnitario: "0",
    percentualDesconto: "0",
  };
}

export function datePlusMonths(dateText: string, months: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

export function movementLabel(value: string) {
  return (
    {
      cotacao: "Cotacao",
      pedido_recorrente: "Pedido recorrente",
      pedido_compra: "Pedido de compra",
      compra: "Compra",
      cancelada: "Cancelada",
    }[value] || value
  );
}

export async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string | { message?: string };
  };
  if (!response.ok)
    throw new Error(
      typeof body.error === "string"
        ? body.error
        : body.error?.message || "Não foi possível completar a operação.",
    );
  return body as T;
}
