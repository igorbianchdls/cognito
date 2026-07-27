import type { ErpEntityRecord } from '@/products/erp/shared/types'

export const erpMockData: Record<string, ErpEntityRecord[]> = {
  clientes: [
    { id: 'CLI-001', nome: 'Norte Solar Ltda', documento: '18.492.883/0001-54', email: 'financeiro@nortesolar.com', cidade: 'Fortaleza', status: 'ativo', tipo: 'PJ' },
    { id: 'CLI-002', nome: 'Marina Costa', documento: '062.442.930-21', email: 'marina@costaconsultoria.com', cidade: 'Recife', status: 'ativo', tipo: 'PF' },
    { id: 'CLI-003', nome: 'Delta Foods Brasil', documento: '31.024.188/0001-90', email: 'compras@deltafoods.com', cidade: 'Sao Paulo', status: 'analise', tipo: 'PJ' },
    { id: 'CLI-004', nome: 'Araujo Varejo', documento: '09.518.473/0001-11', email: 'ops@araujovarejo.com', cidade: 'Natal', status: 'inativo', tipo: 'PJ' },
  ],
  fornecedores: [
    { id: 'FOR-001', nome: 'Prime Distribuidora', documento: '22.180.921/0001-44', email: 'pedidos@prime.com', cidade: 'Sao Paulo', status: 'ativo', categoria: 'Distribuicao' },
    { id: 'FOR-002', nome: 'Logis Nordeste', documento: '41.310.222/0001-09', email: 'contato@logisne.com', cidade: 'Fortaleza', status: 'ativo', categoria: 'Logistica' },
    { id: 'FOR-003', nome: 'Tecno Embalagens', documento: '19.009.210/0001-72', email: 'comercial@tecnoemb.com', cidade: 'Campinas', status: 'analise', categoria: 'Insumos' },
  ],
  produtos: [
    { id: 'SKU-1001', nome: 'Kit Energia Compacto', sku: 'KIT-ENE-001', categoria: 'Kits', preco: 1290, estoque: 42, status: 'ativo' },
    { id: 'SKU-1002', nome: 'Controlador Smart 20A', sku: 'CTL-SMT-20A', categoria: 'Eletronicos', preco: 340, estoque: 18, status: 'ativo' },
    { id: 'SKU-1003', nome: 'Cabo Solar 6mm', sku: 'CAB-SOL-6MM', categoria: 'Cabos', preco: 28, estoque: 0, status: 'pausado' },
    { id: 'SKU-1004', nome: 'Suporte Telhado Pro', sku: 'SUP-TEL-PRO', categoria: 'Estrutura', preco: 188, estoque: 76, status: 'ativo' },
  ],
  categorias: [
    { id: 'CAT-001', nome: 'Kits', descricao: 'Conjuntos prontos para venda.', itens: 12, status: 'ativo' },
    { id: 'CAT-002', nome: 'Eletronicos', descricao: 'Controladores, inversores e sensores.', itens: 27, status: 'ativo' },
    { id: 'CAT-003', nome: 'Cabos', descricao: 'Cabos e conectores eletricos.', itens: 8, status: 'ativo' },
    { id: 'CAT-004', nome: 'Estrutura', descricao: 'Suportes e fixadores.', itens: 15, status: 'ativo' },
  ],
}

