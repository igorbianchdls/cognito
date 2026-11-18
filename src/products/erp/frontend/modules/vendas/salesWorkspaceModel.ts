// Types and helpers shared by the sales workspace files.



import { erpClientToday } from '@/products/erp/frontend/services/erpTimeZone';


export type Option = {
  id: string;
  nome: string;
  codigo?: string;
  unidade?: string;
  valor_padrao?: number;
  padrao?: boolean;
};
export type Customer = Option & {
  documento?: string;
  email?: string;
  celular?: string;
  telefone?: string;
  contato_cobranca_emails?: string[];
  contato_cobranca_whatsapp?: string;
};
export type Catalogs = {
  customers: Customer[];
  responsibles: Option[];
  products: Option[];
  services: Option[];
  categories: Option[];
  costCenters: Option[];
  financialAccounts: Option[];
  paymentMethods: Option[];
};
export type SaleRecord = {
  descricao: string;
  categoria: string;
  id: string;
  numero: string;
  cliente: string;
  data: string;
  total: number;
  status: string;
  atendimento_status: string;
  fiscal_status: string;
  situacao: string;
  validade?: string;
  versao: number;
};
export type SaleItem = {
  rowId: string;
  tipo: "produto" | "servico";
  itemId: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
  desconto: string;
};
export type Installment = {
  numero: number;
  vencimento: string;
  valor: string;
  contaFinanceiraId: string;
  metodoPagamentoId: string;
};
export type FulfillItem = {
  id: string;
  descricao: string;
  pendente: number;
  quantidade: string;
};

export const emptyCatalogs: Catalogs = {
  customers: [],
  responsibles: [],
  products: [],
  services: [],
  categories: [],
  costCenters: [],
  financialAccounts: [],
  paymentMethods: [],
};
export const today = () => erpClientToday();
export const money = (value: string | number) =>
  Number(String(value || 0).replace(",", ".")) || 0;
export const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

export function addMonthsClamped(value: string, months: number) {
  const [year, month, day] = value.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1, 12));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

export function newItem(): SaleItem {
  return {
    rowId: crypto.randomUUID(),
    tipo: "produto",
    itemId: "",
    descricao: "",
    unidade: "UN",
    quantidade: "1",
    valorUnitario: "0",
    desconto: "0",
  };
}

export async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: string | { message?: string };
  };
  if (!response.ok)
    throw new Error(
      typeof body.error === "string"
        ? body.error
        : body.error?.message || "Não foi possível concluir a operação.",
    );
  return body as T;
}
