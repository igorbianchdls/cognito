import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { connection, project } from './evolution-db.mjs';

export const REFERENCE = '2026-10-06';
export const TAG = 'erp-demo-20261006';
const CATALOG = '.cache/erp-audit/demo-catalog-20261006.json';
const ident = s => '"' + s.replaceAll('"', '""') + '"';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const money = cents => (cents / 100).toFixed(2);
const cents = value => Math.round(Number(value) * 100);
const addDays = (day, n) => new Date(Date.parse(day + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const stamp = (day, hour = 12) => `${day}T${String(hour).padStart(2, '0')}:00:00-03:00`;
const businessDay = day => {
  while ([0, 6].includes(new Date(day + 'T12:00:00Z').getUTCDay())) day = addDays(day, 1);
  return day;
};
const split = (total, count) => Array.from({ length: count }, (_, i) => Math.floor(total / count) + (i < total % count ? 1 : 0));

// Deterministic fictional data. Money calculations use integer cents; IDs are
// symbolic until real sequence values are reserved inside the database transaction.
export function buildDemo(catalog, tenantId = 1, sample = false, actorId = null) {
  const rows = {};
  const columnSets = new Map(catalog.rls.filter(t => t.schema === 'erp' && t.relkind === 'r')
    .map(t => [t.relname, new Set(catalog.columns.filter(c => c.table_schema === 'erp' && c.table_name === t.relname).map(c => c.column_name))]));
  const add = (table, data) => {
    const columns = columnSets.get(table);
    assert(columns, table);
    const list = rows[table] ||= [];
    const row = { id: list.length + 1, empresa_id: tenantId };
    if (columns.has('metadata')) row.metadata = { demo: true, dataset: TAG, reference: REFERENCE };
    if (actorId && columns.has('criado_por')) row.criado_por = actorId;
    if (actorId && columns.has('atualizado_por')) row.atualizado_por = actorId;
    if (columns.has('criado_em')) row.criado_em = stamp('2026-07-01', 8);
    if (columns.has('atualizado_em')) row.atualizado_em = stamp(REFERENCE, 9);
    Object.assign(row, data);
    for (const key of Object.keys(row)) assert(columns.has(key), `Coluna inexistente: ${table}.${key}`);
    list.push(row);
    return row;
  };
  const categories = {};
  for (const [code, nome, tipo, dre, custo] of [
    ['hardware', 'Venda de equipamentos', 'receita', true, false],
    ['projetos', 'Projetos e implantação', 'receita', true, false],
    ['mensalidades', 'Suporte e contratos mensais', 'receita', true, false],
    ['revenda', 'Compra de equipamentos para revenda', 'despesa', true, true],
    ['terceiros', 'Serviços técnicos terceirizados', 'despesa', true, true],
    ['aluguel', 'Aluguel e condomínio', 'despesa', true, false],
    ['energia', 'Energia elétrica', 'despesa', true, false],
    ['internet', 'Internet e telefonia', 'despesa', true, false],
    ['software', 'Assinaturas de software', 'despesa', true, false],
    ['marketing', 'Marketing e publicidade', 'despesa', true, false],
    ['contabilidade', 'Assessoria contábil', 'despesa', true, false],
    ['deslocamentos', 'Deslocamentos e visitas técnicas', 'despesa', true, false],
    ['produtos', 'Equipamentos e acessórios de informática', 'produto', false, false],
    ['servicos', 'Serviços de tecnologia', 'servico', false, false],
  ]) categories[code] = add('categorias', { codigo: code.toUpperCase(), nome, tipo, entrada_dre: dre, considera_custo_dre: custo }).id;
  const centers = ['Administrativo', 'Comercial', 'Projetos', 'Suporte técnico'].map((nome, i) => add('centros_custo', { nome, codigo: `CC-${i + 1}` }).id);
  const accounts = [
    add('contas_financeiras', { nome: 'Conta operacional — demonstração', tipo: 'banco', banco: 'Banco demonstrativo', saldo_inicial: '160000.00', data_saldo_inicial: '2026-07-01', padrao: true }),
    add('contas_financeiras', { nome: 'Reserva financeira — demonstração', tipo: 'banco', banco: 'Banco demonstrativo', saldo_inicial: '25000.00', data_saldo_inicial: '2026-07-01' }),
    add('contas_financeiras', { nome: 'Caixa de pequenas despesas', tipo: 'caixa', saldo_inicial: '1500.00', data_saldo_inicial: '2026-07-01' }),
  ];
  const methods = ['Pix', 'Boleto', 'Transferência bancária', 'Cartão de crédito', 'Dinheiro'].map((nome, i) => add('metodos_pagamento', {
    nome, tipo: ['pix', 'boleto', 'transferencia', 'cartao_credito', 'dinheiro'][i],
  }).id);
  const locations = [add('locais_estoque', { nome: 'Estoque principal', codigo: 'PRINCIPAL', padrao: true }), add('locais_estoque', { nome: 'Apoio técnico', codigo: 'APOIO' })];
  const clientNames = ['Aurora Clínica Integrada', 'Horizonte Engenharia', 'Vila Serena Odontologia', 'Ponto Norte Logística', 'Brisa Comércio de Alimentos', 'Atlas Consultoria', 'Jardim das Letras Escola', 'Lume Arquitetura', 'Costa Azul Hotelaria', 'Candeia Advocacia', 'Estação Saúde', 'Prisma Contabilidade', 'Rota Nova Transportes', 'Mosaico Comunicação', 'Vale Verde Distribuidora', 'Sabor da Praça Restaurantes', 'Essência Fisioterapia', 'Terracota Construções', 'Alameda Imóveis', 'Nexo Cursos Profissionais', 'Raiz Mercado Natural', 'Porto Claro Importadora', 'Trama Confecções', 'Farol Seguros', 'Semente Editora', 'Planalto Autopeças', 'Orla Eventos', 'Vértice Laboratório', 'Bosque Veterinária', 'Nova Ponte Serviços'];
  const supplierNames = ['Núcleo Distribuição de Tecnologia', 'Circuito Equipamentos', 'Ponte Digital Atacado', 'Rede Sul Componentes', 'TecnoVale Periféricos', 'Oficina Byte Serviços', 'Conecta Redes Técnicas', 'Campo Aberto Infraestrutura', 'Edifício Horizonte Administração', 'Energia Aurora Serviços', 'Fibra Nexo Telecom', 'Nuvem Clara Software', 'Estúdio Prisma Marketing', 'Conta Certa Assessoria', 'Rota Urbana Mobilidade'];
  const cities = [['Fortaleza', 'CE'], ['Caucaia', 'CE'], ['Maracanaú', 'CE'], ['Eusébio', 'CE'], ['Aquiraz', 'CE']];
  const clients = clientNames.map((nome, i) => add('entidades', {
    nome, nome_fantasia: nome, codigo: `CLI-${String(i + 1).padStart(3, '0')}`, eh_cliente: true,
    email: `financeiro.cliente${i + 1}@example.invalid`, cidade: cities[i % 5][0], uf: cities[i % 5][1],
    logradouro: `Rua Demonstrativa ${i + 1}`, numero: String(100 + i * 17), bairro: ['Centro', 'Aldeota', 'Parque Empresarial'][i % 3],
    indicador_inscricao_estadual: 'nao_contribuinte', observacoes: 'Empresa fictícia para demonstração do ERP. Documento fiscal não informado.',
  }));
  const suppliers = supplierNames.map((nome, i) => add('entidades', {
    nome, nome_fantasia: nome, codigo: `FOR-${String(i + 1).padStart(3, '0')}`, eh_fornecedor: true,
    email: `fornecedor${i + 1}@example.invalid`, cidade: 'Fortaleza', uf: 'CE', logradouro: `Avenida de Demonstração ${i + 1}`, numero: String(200 + i * 23),
    observacoes: 'Fornecedor fictício para demonstração do ERP.',
  }));
  const sellers = ['Marina Costa', 'Rafael Menezes', 'Camila Rocha'].map((nome,i)=>add('entidades', {
    nome, tipo_pessoa:'fisica', codigo:`VEND-${i+1}`, eh_vendedor:true,
    email:`vendedor${i+1}@example.invalid`, cidade:'Fortaleza', uf:'CE', observacoes:'Vendedor fictício para demonstração.',
  }));
  const productSpecs = [
    ['Notebook empresarial 14 polegadas', 389900, 278000], ['Desktop corporativo', 329000, 239000], ['Monitor LED 24 polegadas', 89900, 62500],
    ['SSD 500 GB', 29900, 18500], ['Memória RAM 16 GB', 28900, 17800], ['Roteador empresarial', 64900, 42500],
    ['Switch gerenciável 24 portas', 139900, 94000], ['Access point Wi-Fi', 79900, 52000], ['Nobreak 1200 VA', 109900, 73500],
    ['Impressora multifuncional laser', 239900, 171000], ['Teclado USB', 8900, 4500], ['Mouse sem fio', 9900, 5200],
    ['Webcam Full HD', 21900, 13000], ['Headset corporativo', 17900, 10500], ['Dock USB-C', 34900, 21000],
    ['Cabo de rede CAT6 — metro', 590, 280], ['Patch cord CAT6 2 metros', 2900, 1300], ['HD externo 1 TB', 42900, 29500],
    ['Filtro de linha 6 tomadas', 6900, 3300], ['Suporte articulado para monitor', 15900, 8500],
  ];
  const products = productSpecs.map(([nome, price, cost], i) => add('produtos', {
    nome, codigo: `PRD-${String(i + 1).padStart(3, '0')}`, sku: `DEMO-${String(i + 1).padStart(3, '0')}`, descricao: nome,
    unidade_medida: i === 15 ? 'M' : 'UN', preco_venda: money(price), custo: money(cost), categoria_id: categories.produtos,
    centro_custo_id: centers[1], controla_estoque: true, permite_estoque_negativo: false, estoque_minimo: i < 10 ? 3 : 8, ponto_reposicao: i < 10 ? 5 : 12,
  }));
  const serviceSpecs = [
    ['Suporte técnico mensal', 129000, 54000], ['Manutenção preventiva', 28000, 11000], ['Instalação de rede — ponto', 19000, 8500],
    ['Implantação de infraestrutura', 450000, 195000], ['Backup gerenciado mensal', 39000, 15000], ['Migração de servidor', 280000, 125000],
    ['Visita técnica', 22000, 9500], ['Configuração de estação de trabalho', 18000, 6500], ['Treinamento de equipe', 150000, 60000],
    ['Consultoria em segurança da informação', 320000, 135000],
  ];
  const services = serviceSpecs.map(([nome, price, cost], i) => add('servicos', { nome, codigo: `SRV-${String(i + 1).padStart(3, '0')}`, descricao: nome, preco: money(price), custo: money(cost), categoria_id: categories.servicos, centro_custo_id: centers[i === 0 || i === 4 ? 3 : 2] }));
  const nature = add('naturezas_operacao_compra', { nome: 'Compra para revenda', codigo: 'REVENDA', atualiza_estoque: true, gera_financeiro_padrao: true });
  const serviceNature = add('naturezas_operacao_compra', { nome: 'Contratação de serviços', codigo: 'SERVICOS', gera_financeiro_padrao: true });
  for (let i = 0; i < products.length; i++) add('fornecedores_produtos', { fornecedor_id: suppliers[i % 5].id, produto_id: products[i].id, codigo_fornecedor: `REF-${String(i + 1).padStart(4, '0')}` });
  const contracts = clients.slice(0, sample ? 2 : 12).map((client, i) => {
    const service = services[i % 3 === 0 ? 4 : 0];
    const price = cents(service.preco) + (i % 4) * 18000;
    const contract = add('contratos_vendas', { cliente_id: client.id, numero: `CTR-2026-${String(i + 1).padStart(3, '0')}`, descricao: `${service.nome} — ${client.nome}`, data_inicio: '2026-07-01', data_fim: '2027-06-30', status: 'rascunho', periodicidade: 'mensal', dia_vencimento: 10, proxima_geracao_em: '2026-10-01', categoria_id: categories.mensalidades, centro_custo_id: centers[3], conta_financeira_id: accounts[0].id, metodo_pagamento_id: methods[1], chave_idempotencia: `${TAG}:contrato:${i + 1}` });
    const version = add('contratos_vendas_versoes', { contrato_id: contract.id, numero: 1, vigencia_inicio: '2026-07-01', vigencia_fim: '2027-06-30', status: 'rascunho', periodicidade: 'mensal', dia_vencimento: 10, motivo: 'Condições iniciais do contrato demonstrativo', cliente_snapshot: { nome: client.nome, demo: true }, categoria_id: categories.mensalidades, centro_custo_id: centers[3], conta_financeira_id: accounts[0].id, metodo_pagamento_id: methods[1] });
    add('contratos_vendas_itens', { contrato_id: contract.id, contrato_versao_id: version.id, servico_id: service.id, item_logico: `suporte-${i + 1}`, descricao: service.nome, quantidade: 1, valor_unitario: money(price), total: money(price), unidade: 'MES' });
    return { contract, version, client, service, price };
  });
  const stockOperations = [];
  const commercialDocuments = [];
  const paymentPlans = [];
  function title(side, data, installments, state, serial, future = false) {
    const head = add(`contas_${side}`, { ...data, status: state === 'cancelado' ? 'cancelado' : 'aberto', ...(side === 'pagar' ? { tipo_lancamento: future ? 'previsao' : 'efetivo' } : {}), chave_idempotencia: `${TAG}:${side}:${serial}`, criado_em: stamp(data.data_emissao, 11) });
    for (const [i, installment] of installments.entries()) {
      const parcel = add(`contas_${side}_parcelas`, { [`conta_${side}_id`]: head.id, numero_parcela: i + 1, descricao: `${data.descricao} — parcela ${i + 1}/${installments.length}`, data_vencimento: installment.due, valor: money(installment.value), status: state === 'cancelado' ? 'cancelado' : 'aberto', conta_financeira_id: accounts[0].id, metodo_pagamento_id: methods[serial % 4], ...(installment.predicted ? { [side === 'receber' ? 'recebimento_previsto_id' : 'parcela_prevista_id']: installment.predicted } : {}), criado_em: stamp(data.data_emissao, 11) });
      if (state !== 'cancelado' && !future) paymentPlans.push({ side, head, parcel, serial: serial + i * 5, emitted: data.data_emissao, value: installment.value });
    }
    return head;
  }
  function sale({ client, items, date, index, contractInfo }) {
    const status = contractInfo ? 'confirmada' : index % 19 === 0 ? 'cancelada' : index % 13 === 0 || index===102 ? 'rascunho' : 'confirmada';
    const subtotal = items.reduce((sum, i) => sum + i.total, 0);
    const discount = !contractInfo && index % 7 === 0 ? Math.round(subtotal * .03) : 0;
    const freight = items.some(i => i.product) && index % 3 === 0 ? 4500 : 0;
    const total = subtotal - discount + freight;
    const number = `VEN-2026-${String((rows.vendas?.length || 0) + 1).padStart(4, '0')}`;
    const doc = add('vendas', { cliente_id: client.id, numero: number, data_venda: date, data_competencia: date, status, situacao: status === 'confirmada' ? 'atendida' : status, origem: contractInfo ? 'contrato' : ['indicacao', 'site', 'comercial'][index % 3], categoria_id: contractInfo ? categories.mensalidades : items.some(i => i.product) ? categories.hardware : categories.projetos, centro_custo_id: contractInfo ? centers[3] : centers[1], conta_financeira_id: accounts[0].id, metodo_pagamento_id: methods[index % 4], subtotal: money(subtotal), tipo_desconto: 'valor', desconto: money(discount), frete: money(freight), total: money(total), local_estoque_id: locations[0].id, atendimento_status: status === 'confirmada' ? 'atendido' : status === 'cancelada' ? 'cancelado' : 'pendente', confirmada_em: status === 'confirmada' ? stamp(date, 14) : null, atendida_em: status === 'confirmada' ? stamp(date, 16) : null, cancelada_em: status === 'cancelada' ? stamp(date, 16) : null, observacoes: contractInfo ? `Mensalidade do contrato ${contractInfo.contract.numero}` : 'Operação fictícia para demonstração.', condicao_pagamento: { parcelas: contractInfo ? 1 : index % 3 + 1 }, chave_idempotencia: `${TAG}:venda:${number}`, criado_em: stamp(date, 10) });
    const docItems = items.map(item => add('vendas_itens', { venda_id: doc.id, ...(item.product ? { produto_id: item.product.id } : { servico_id: item.service.id }), descricao: item.product?.nome || item.service.nome, quantidade: item.qty, quantidade_atendida: status === 'confirmada' ? item.qty : 0, valor_unitario: money(item.unit), custo_unitario: money(item.cost), desconto: money(item.discount || 0), total: money(item.total), criado_em: stamp(date, 10) }));
    doc.vendedor_id=sellers[index%sellers.length].id;
    if(status==='confirmada'&&!contractInfo&&(index%17===0||index%11===0)) {
      for(const row of docItems)if(row.produto_id)row.quantidade_atendida=index%17===0?0:Math.floor(Number(row.quantidade)/2);
      if(docItems.some(row=>Number(row.quantidade_atendida)<Number(row.quantidade))) {
        doc.atendimento_status=docItems.some(row=>Number(row.quantidade_atendida)>0)?'parcial':'pendente';
        doc.situacao='em_atendimento';doc.atendida_em=null;
      }
    }
    const installmentCount=contractInfo?1:index%3+1+(index<=10?1:0);
    doc.condicao_pagamento={parcelas:installmentCount};
    const installments = split(total, installmentCount).map((value, i) => ({ value, due: contractInfo ? businessDay(`${date.slice(0, 7)}-10`) : businessDay(addDays(date, (i + 1) * 30)) }));
    for(const p of installments)if(p.due>'2026-12-31')p.due='2026-12-31';
    for (const [i, p] of installments.entries()) p.predicted = add('vendas_recebimentos_previstos', { venda_id: doc.id, numero_parcela: i + 1, data_vencimento: p.due, valor: money(p.value), conta_financeira_id: accounts[0].id, metodo_pagamento_id: methods[index % 4], criado_em: stamp(date, 10) }).id;
    if (status !== 'rascunho') title('receber', { cliente_id: client.id, venda_id: doc.id, descricao: `${number} — ${client.nome}`, numero_documento: number, data_emissao: date, data_competencia: date, valor_total: money(total), categoria_id: doc.categoria_id, centro_custo_id: doc.centro_custo_id, origem: contractInfo ? 'contrato' : 'venda', cliente_nome_snapshot: client.nome, ...(status === 'cancelada' ? { cancelado_em: stamp(date, 16), motivo_cancelamento: 'Solicitação do cliente antes da execução' } : {}) }, installments, status === 'cancelada' ? 'cancelado' : 'aberto', doc.id);
    add('vendas_eventos', { venda_id: doc.id, evento: status === 'cancelada' ? 'cancelada' : status === 'confirmada' ? 'confirmada' : 'criada', status_anterior: null, status_novo: status, versao: 1, dados: { demo: true, motivo: 'Carga demonstrativa' }, criado_em: stamp(date, 14) });
    if (status === 'confirmada') for (const [i, item] of items.entries()) if (item.product && docItems[i].quantidade_atendida>0) stockOperations.push({ date, direction: -1, product: item.product, qty: docItems[i].quantidade_atendida, cost: item.cost, doc, item: docItems[i], side: 'venda', entity: client.id });
    if (contractInfo) add('contratos_vendas_geracoes', { contrato_id: contractInfo.contract.id, contrato_versao_id: contractInfo.version.id, competencia: date, periodo_inicio: date, periodo_fim:new Date(Date.UTC(Number(date.slice(0,4)),Number(date.slice(5,7)),0)).toISOString().slice(0,10), venda_id: doc.id, status: 'concluida', chave_idempotencia: `${TAG}:ciclo:${contractInfo.contract.id}:${date}`, processado_em: stamp(date, 14), criado_em: stamp(date, 10) });
    commercialDocuments.push({ doc, items, docItems, client, date });
  }
  for (const month of ['07', '08', '09','10']) for (const info of contracts) sale({ client: info.client, date: `2026-${month}-01`, index: info.contract.id, contractInfo: info, items: [{ service: info.service, qty: 1, unit: info.price, cost: cents(info.service.custo), total: info.price }] });
  for(const info of contracts)info.contract.proxima_geracao_em='2026-11-01';
  const regularSales = sample ? 18 : 102;
  for (let i = 0; i < regularSales; i++) {
    const date = addDays('2026-07-02', Math.floor(i * (Math.round((Date.parse(REFERENCE)-Date.parse('2026-07-02'))/86400000)+1) / regularSales));
    const client = clients[(i * 7 + 4) % clients.length];
    const items = [];
    if (i % 3 !== 0) {
      const product = products[(i * 7) % products.length];
      const qty = product.unidade_medida === 'M' ? 80 + i % 6 * 10 : 1 + i % 3;
      const unit = Math.round(cents(product.preco_venda) * (1 + (i % 5 - 2) * .012));
      const discount = i % 8 === 0 ? Math.round(unit * qty * .025) : 0;
      items.push({ product, qty, unit, cost: cents(product.custo), discount, total: unit * qty - discount });
    }
    if (i % 2 === 0 || !items.length) {
      const service = services[(i * 3 + 1) % services.length];
      const qty = service.id === 3 ? 4 + i % 8 : 1;
      const unit = Math.round(cents(service.preco) * (1 + i % 4 * .02));
      items.push({ service, qty, unit, cost: cents(service.custo), total: qty * unit });
    }
    sale({ client, items, date, index: i + 1 });
  }
  const purchases = sample ? 8 : 60;
  for (let i = 0; i < purchases; i++) {
    const date = addDays('2026-07-01', Math.floor(i * Math.round((Date.parse(REFERENCE)-Date.parse('2026-07-01'))/86400000) / (purchases-1)));
    const servicePurchase = i % 4 === 3;
    const supplier = suppliers[servicePurchase ? 5 + i % 3 : i % 5];
    const status = i % 29 === 0 ? 'cancelada' : i % 23 === 0 ? 'rascunho' : !servicePurchase&&i%10===2?'confirmada':!servicePurchase&&i%10===6?'parcialmente_recebida':'recebida';
    const items = [];
    for (let j = 0; j < (servicePurchase ? 1 : 2); j++) {
      const product = servicePurchase ? null : products[(i * 3 + j * 9) % products.length];
      const service = servicePurchase ? services[1 + i % 3] : null;
      const qty = product?.unidade_medida === 'M' ? 150 : servicePurchase ? 1 + i % 3 : 3 + i % 5;
      const unit = Math.round(cents(product?.custo || service.custo) * (1 + (i % 5 - 2) * .01));
      items.push({ product, service, qty, unit, total: qty * unit });
    }
    const subtotal = items.reduce((sum, x) => sum + x.total, 0);
    const freight = servicePurchase ? 0 : 3500 + i % 4 * 1000;
    const total = subtotal + freight;
    const number = `CMP-2026-${String(i + 1).padStart(4, '0')}`;
    const doc = add('compras', { fornecedor_id: supplier.id, numero: number, data_compra: date, data_competencia: date, status, tipo_compra: servicePurchase ? 'servico' : 'produto', tipo_movimento: 'compra', natureza_operacao_id: servicePurchase ? serviceNature.id : nature.id, atualiza_estoque: !servicePurchase, categoria_id: servicePurchase ? categories.terceiros : categories.revenda, centro_custo_id: centers[servicePurchase ? 2 : 1], conta_financeira_id: accounts[0].id, metodo_pagamento_id: methods[i % 3], subtotal: money(subtotal), frete: money(freight), total: money(total), local_estoque_id: locations[0].id, fornecedor_nome_snapshot: supplier.nome, confirmada_em: status === 'recebida' ? stamp(date, 9) : null, recebida_em: status === 'recebida' ? stamp(date, 11) : null, cancelada_em: status === 'cancelada' ? stamp(date, 11) : null, motivo_cancelamento: status === 'cancelada' ? 'Pedido substituído antes da entrega' : null, chave_idempotencia: `${TAG}:compra:${number}`, criado_em: stamp(date, 9) });
    const docItems = items.map(item => add('compras_itens', { compra_id: doc.id, ...(item.product ? { produto_id: item.product.id } : { servico_id: item.service.id }), descricao: item.product?.nome || item.service.nome, quantidade: item.qty, quantidade_recebida: status === 'recebida' ? item.qty : 0, valor_unitario: money(item.unit), total: money(item.total), unidade: item.product?.unidade_medida || 'UN', local_estoque_id: locations[0].id, criado_em: stamp(date, 9) }));
    if(['confirmada','parcialmente_recebida'].includes(status))doc.confirmada_em=stamp(date,9);
    if(status==='parcialmente_recebida')for(const row of docItems)row.quantidade_recebida=Math.floor(Number(row.quantidade)/2);
    const installments = split(total, i % 3 + 1).map((value, j) => ({ value, due: businessDay(addDays(date, (j + 1) * 28)) }));
    for (const [j, p] of installments.entries()) p.predicted = add('compras_parcelas_previstas', { compra_id: doc.id, numero_parcela: j + 1, data_vencimento: p.due, valor: money(p.value), conta_financeira_id: accounts[0].id, metodo_pagamento_id: methods[i % 3], criado_em: stamp(date, 9) }).id;
    if (status !== 'rascunho') title('pagar', { fornecedor_id: supplier.id, compra_id: doc.id, descricao: `${number} — ${supplier.nome}`, numero_documento: number, data_emissao: date, data_competencia: date, valor_total: money(total), categoria_id: doc.categoria_id, centro_custo_id: doc.centro_custo_id, origem: 'compra', fornecedor_nome_snapshot: supplier.nome, ...(status === 'cancelada' ? { cancelado_em: stamp(date, 11), motivo_cancelamento: 'Pedido substituído antes da entrega' } : {}) }, installments, status === 'cancelada' ? 'cancelado' : 'aberto', i + 201);
    add('compras_eventos', { compra_id: doc.id, evento: status, dados: { demo: true }, criado_em: stamp(date, 11) });
    if (['recebida','parcialmente_recebida'].includes(status)) for (const [j, item] of items.entries()) if (item.product) stockOperations.push({ date, direction: 1, product: item.product, qty: docItems[j].quantidade_recebida, cost: item.unit, doc, item: docItems[j], side: 'compra', entity: supplier.id });
  }
  const expenses = [['aluguel', 420000, 8, 6], ['energia', 87000, 9, 7], ['internet', 34990, 10, 8], ['software', 129900, 11, 10], ['marketing', 180000, 12, 15], ['contabilidade', 85000, 13, 20]];
  for (const [expenseIndex, [category, base, supplierIndex, dueDay]] of expenses.entries()) {
    const recurrence = add('recorrencias_financeiras', { tipo: 'pagar', inicio_em: '2026-07-01', termino_tipo: 'indeterminado', proxima_competencia: '2027-01-01', gerado_ate: '2026-12-01' });
    for (let month = 7; month <= 12; month++) {
      const competence = `2026-${String(month).padStart(2, '0')}-01`;
      const emitted = competence > REFERENCE ? REFERENCE : competence;
      const value = category === 'energia' || category === 'marketing' ? base + (month % 3 - 1) * Math.round(base * .08) : base;
      const due = businessDay(`2026-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`);
      title('pagar', { fornecedor_id: suppliers[supplierIndex].id, descricao: `${categories[category] && rows.categorias.find(c => c.id === categories[category]).nome} — ${competence.slice(0, 7)}`, numero_documento: `DES-${category.toUpperCase()}-${competence.slice(0, 7)}`, data_emissao: emitted, data_competencia: competence, valor_total: money(value), categoria_id: categories[category], centro_custo_id: centers[category === 'marketing' ? 1 : 0], origem: 'recorrencia', recorrencia_financeira_id: recurrence.id, fornecedor_nome_snapshot: suppliers[supplierIndex].nome }, [{ value, due }], 'aberto', 401 + expenseIndex * 6 + month, competence > REFERENCE);
    }
  }
  for (let i = 0; i < 12; i++) {
    const date = addDays('2026-07-05', i * 8);
    const value = 18000 + i % 4 * 7500;
    const canceled = i === 10;
    title('pagar', { fornecedor_id: suppliers[14].id, descricao: `Deslocamento para visita técnica — ${clients[i].nome}`, numero_documento: `DES-VISITA-${String(i + 1).padStart(3, '0')}`, data_emissao: date, data_competencia: date, valor_total: money(value), categoria_id: categories.deslocamentos, centro_custo_id: centers[3], origem: 'manual', fornecedor_nome_snapshot: suppliers[14].nome, ...(canceled ? { cancelado_em: stamp(date), motivo_cancelamento: 'Visita remarcada sem cobrança' } : {}) }, [{ value, due: businessDay(addDays(date, 7)) }], canceled ? 'cancelado' : 'aberto', 501 + i);
  }
  // Payment principal is the amount settled; discounts and fees affect cash only.
  for (const plan of paymentPlans) {
    const { side, parcel, serial, emitted, value } = plan;
    const matured = parcel.data_vencimento <= REFERENCE;
    if(parcel.data_vencimento===REFERENCE)continue;
    if (!matured && serial % 17 !== 0) continue;
    if (matured && serial % 9 === 0) continue;
    const partial = serial % 8 === 0;
    const principal = partial ? Math.floor(value * .4) : value;
    const late = matured && serial % 5 === 0 && addDays(parcel.data_vencimento, 4) <= REFERENCE;
    const paidDate = !matured ? addDays(emitted, Math.min(10, Math.floor((Date.parse(REFERENCE) - Date.parse(emitted)) / 86400000))) : late ? addDays(parcel.data_vencimento, 4) : parcel.data_vencimento;
    assert(paidDate >= emitted && paidDate <= REFERENCE);
    const interest = late ? Math.round(principal * .005) : 0;
    const fine = late ? Math.round(principal * .02) : 0;
    const discount = !late && serial % 14 === 0 ? Math.round(principal * .02) : 0;
    const fee = side === 'receber' && serial % 4 === 3 ? Math.round(principal * .015) : 0;
    add('pagamentos', { tipo: side, [`conta_${side}_parcela_id`]: parcel.id, conta_financeira_id: accounts[0].id, metodo_pagamento_id: methods[serial % 4], data_pagamento: paidDate, data_credito: paidDate, valor: money(principal), juros: money(interest), multa: money(fine), desconto: money(discount), taxa: money(fee), valor_liquido: money(principal + interest + fine - discount + (side === 'pagar' ? fee : -fee)), origem: 'manual', chave_idempotencia: `${TAG}:pagamento:${side}:${parcel.id}:1`, observacoes: partial ? 'Liquidação parcial; saldo restante em aberto.' : late ? 'Pagamento após o vencimento, com encargos.' : 'Liquidação demonstrativa.', criado_em: stamp(paidDate, 16) });
    parcel.data_pagamento = paidDate;
  }
  const serviceSales = commercialDocuments.filter(x => x.doc.status === 'confirmada' && x.items.some(i => i.service) && x.doc.origem !== 'contrato');
  const orderCount = Math.min(sample ? 4 : 24, serviceSales.length);
  for (let i = 0; i < orderCount; i++) {
    const source = serviceSales[Math.floor(i * serviceSales.length / orderCount)];
    assert(source);
    const list = source.items.filter(x => x.service);
    const subtotal = list.reduce((sum, x) => sum + x.total, 0);
    const state = i < orderCount - (sample ? 2 : 4) ? 'concluida' : i % 2 ? 'em_execucao' : 'aprovada';
    if (state !== 'concluida') {
      source.doc.atendimento_status = source.docItems.some(item => item.produto_id && Number(item.quantidade_atendida)>0) ? 'parcial' : 'pendente';
      source.doc.atendida_em = null;
      source.doc.situacao = 'em_atendimento';
      for (const row of source.docItems) if (row.servico_id) row.quantidade_atendida = 0;
    } else if(source.doc.atendimento_status==='atendido') source.doc.atendida_em = stamp(addDays(source.date, 3), 17);
    const order = add('ordens_servico', { cliente_id: source.client.id, numero: `OS-2026-${String(i + 1).padStart(4, '0')}`, status: state, data_inicio: source.date, previsao_entrega: addDays(source.date, 7), concluida_em: state === 'concluida' ? stamp(addDays(source.date, 3), 17) : null, problema_informado: list.map(x => x.service.nome).join('; '), diagnostico: state === 'concluida' ? 'Serviço executado e validado com o cliente.' : 'Atendimento técnico programado.', subtotal: money(subtotal), total: money(subtotal), venda_id: source.doc.id, chave_idempotencia: `${TAG}:os:${i + 1}`, criado_em: stamp(source.date, 10) });
    for (const item of list) add('ordens_servico_itens', { ordem_servico_id: order.id, servico_id: item.service.id, descricao: item.service.nome, quantidade: item.qty, valor_unitario: money(item.unit), total: money(item.total), criado_em: stamp(source.date, 10) });
    add('ordens_servico_eventos', { ordem_servico_id: order.id, evento: state, status_novo: state, dados: { demo: true, venda_numero: source.doc.numero }, criado_em: stamp(state === 'concluida' ? addDays(source.date, 3) : source.date, 17) });
  }
  // Quotes are separate commercial documents; approved examples point to the
  // corresponding actual sale and never duplicate that sale's receivable.
  const approvedSources=commercialDocuments.filter(x=>x.doc.status==='confirmada'&&x.doc.origem!=='contrato').slice(0,3);
  for(let i=0;i<(sample?4:12);i++) {
    const source=i<3?approvedSources[i]:commercialDocuments[commercialDocuments.length-1-i];
    const date=i<3?(addDays(source.date,-1)<'2026-07-01'?'2026-07-01':addDays(source.date,-1)):addDays(REFERENCE,i-12);
    const state=i<3?'aprovada':i%3===0?'recusada':i%3===1?'enviada':'em_aberto';
    const quote=add('vendas', {cliente_id:source.client.id,vendedor_id:sellers[i%sellers.length].id,
      numero:`ORC-2026-${String(i+1).padStart(4,'0')}`,tipo_documento:'orcamento',data_venda:date,data_competencia:date,
      status:'rascunho',situacao:state,origem:'comercial',categoria_id:source.doc.categoria_id,centro_custo_id:source.doc.centro_custo_id,
      conta_financeira_id:accounts[0].id,metodo_pagamento_id:methods[1],subtotal:source.doc.subtotal,total:source.doc.total,
      tipo_desconto:'valor',desconto:source.doc.desconto,frete:source.doc.frete,condicao_pagamento:source.doc.condicao_pagamento,
      validade_em:addDays(date,20),local_estoque_id:locations[0].id,atendimento_status:'nao_aplicavel',
      enviada_em:state==='enviada'||state==='aprovada'?stamp(date,10):null,recusada_em:state==='recusada'?stamp(date,16):null,
      chave_idempotencia:`${TAG}:orcamento:${i+1}`,observacoes:'Proposta comercial fictícia para demonstração.',criado_em:stamp(date,9)});
    for(const item of source.items)add('vendas_itens',{venda_id:quote.id,...(item.product?{produto_id:item.product.id}:{servico_id:item.service.id}),
      descricao:item.product?.nome||item.service.nome,quantidade:item.qty,valor_unitario:money(item.unit),custo_unitario:money(item.cost),
      desconto:money(item.discount||0),total:money(item.total),criado_em:stamp(date,9)});
    add('vendas_eventos',{venda_id:quote.id,evento:'criada',status_novo:'rascunho',versao:1,dados:{demo:true,tipo:'orcamento',situacao:state},criado_em:stamp(date,9)});
    if(i<3)source.doc.venda_origem_id=quote.id;
  }
  for(const source of commercialDocuments.filter(x=>x.doc.status==='confirmada'))for(const item of source.docItems)if(item.produto_id && Number(item.quantidade_atendida)<Number(item.quantidade))
    add('reservas_estoque',{produto_id:item.produto_id,local_estoque_id:locations[0].id,venda_id:source.doc.id,venda_item_id:item.id,
      quantidade:item.quantidade,quantidade_atendida:item.quantidade_atendida,status:'ativa',reservada_em:stamp(source.date,14),criado_em:stamp(source.date,14)});
  stockOperations.sort((a, b) => a.date.localeCompare(b.date) || b.direction - a.direction || a.doc.id - b.doc.id);
  const opening = new Map(products.map(p => [p.id, 0]));
  for (const p of products) {
    let balance = 0, minimum = 0;
    for (const op of stockOperations.filter(o => o.product.id === p.id)) { balance += op.direction * op.qty; minimum = Math.min(minimum, balance); }
    const reserved=(rows.reservas_estoque||[]).filter(r=>r.produto_id===p.id).reduce((s,r)=>s+Number(r.quantidade)-Number(r.quantidade_atendida),0);
    opening.set(p.id, Math.max(p.unidade_medida === 'M' ? 250 : 12, -minimum + reserved + (p.unidade_medida === 'M' ? 80 : 12)));
  }
  const initialDoc = add('documentos_estoque', { tipo: 'entrada', numero: 'EST-SALDO-INICIAL', data_documento: '2026-07-01', status: 'finalizado', local_estoque_id: locations[0].id, motivo: 'Saldo físico inicial da empresa demonstrativa', chave_idempotencia: `${TAG}:estoque:abertura`, finalizado_em: stamp('2026-07-01', 8) });
  const balances = new Map();
  function movement(op, document) {
    const local=op.local || locations[0].id,key=`${op.product.id}:${local}`;
    const previous = balances.get(key) || { qty: 0, cost: Number(op.product.custo) };
    const quantity = previous.qty + op.direction * op.qty;
    const unitCost = op.direction > 0 ? op.cost / 100 : previous.cost;
    const avg = op.direction > 0 ? (previous.qty * previous.cost + op.qty * unitCost) / quantity : previous.cost;
    const average = Number(avg.toFixed(6));
    assert(quantity >= 0);
    add('movimentacoes_estoque', { produto_id: op.product.id, local_estoque_id: local, documento_estoque_id: document?.id||null, tipo: op.side==='transferencia'?(op.direction>0?'transferencia_entrada':'transferencia_saida'):op.direction > 0 ? 'entrada' : 'saida', quantidade: op.direction * op.qty, custo_unitario: unitCost.toFixed(6), custo_medio_apos: average.toFixed(6), saldo_apos: quantity, origem_tipo: op.side, origem_id: op.doc?.id || document.id, chave_idempotencia: `${TAG}:movimento:${(rows.movimentacoes_estoque?.length || 0) + 1}`, ocorrido_em: stamp(op.date, op.side==='transferencia'?18:op.side === 'saldo_inicial' ? 8 : op.direction > 0 ? 11 : 16), criado_em: stamp(op.date, op.side==='transferencia'?18:op.direction > 0 ? 11 : 16) });
    balances.set(key, { qty: quantity, cost: average, date: stamp(op.date, op.side==='transferencia'?18:op.side === 'saldo_inicial' ? 8 : op.direction > 0 ? 11 : 16) });
  }
  for (const product of products) {
    add('documentos_estoque_itens', { documento_estoque_id: initialDoc.id, produto_id: product.id, quantidade: opening.get(product.id), custo_unitario: product.custo });
    movement({ product, qty: opening.get(product.id), cost: cents(product.custo), direction: 1, date: '2026-07-01', side: 'saldo_inicial' }, initialDoc);
  }
  const stockDocs = new Map();
  for (const op of stockOperations) {
    const key = `${op.side}:${op.doc.id}`;
    let document = stockDocs.get(key);
    if (!document) {
      document = add('documentos_estoque', { tipo: op.direction > 0 ? 'entrada' : 'saida', numero: `EST-${op.doc.numero}`, data_documento: op.date, status: 'finalizado', local_estoque_id: locations[0].id, entidade_id: op.entity, [op.side === 'venda' ? 'venda_id' : 'compra_id']: op.doc.id, motivo: op.side === 'venda' ? 'Entrega dos itens vendidos' : 'Recebimento da compra', chave_idempotencia: `${TAG}:estoque:${key}`, finalizado_em: stamp(op.date, op.direction > 0 ? 11 : 16), criado_em: stamp(op.date, op.direction > 0 ? 11 : 16) });
      stockDocs.set(key, document);
    }
    add('documentos_estoque_itens', { documento_estoque_id: document.id, produto_id: op.product.id, quantidade: op.qty, custo_unitario: money(op.cost), [op.side === 'venda' ? 'venda_item_id' : 'compra_item_id']: op.item.id, criado_em: stamp(op.date, 12) });
    movement(op, document);
  }
  for(let i=0;i<3;i++) {
    const product=products[i],previous=balances.get(`${product.id}:${locations[0].id}`),qty=2+i;
    const transfer=add('transferencias_estoque',{numero:`TRF-2026-${i+1}`,local_origem_id:locations[0].id,local_destino_id:locations[1].id,
      data_transferencia:REFERENCE,status:'finalizada',finalizada_em:stamp(REFERENCE,18),chave_idempotencia:`${TAG}:transferencia-estoque:${i+1}`,observacoes:'Reposição de equipamentos para a equipe técnica.'});
    add('transferencias_estoque_itens',{transferencia_id:transfer.id,produto_id:product.id,quantidade:qty});
    const op={product,qty,cost:previous.cost*100,date:REFERENCE,side:'transferencia',doc:transfer};
    movement({...op,direction:-1},null);movement({...op,direction:1,local:locations[1].id},null);
  }
  for (const product of products) for(const location of locations) {
    const b = balances.get(`${product.id}:${location.id}`)||{qty:0,cost:0,date:null};
    const reserved=(rows.reservas_estoque||[]).filter(r=>r.produto_id===product.id&&r.local_estoque_id===location.id).reduce((s,r)=>s+Number(r.quantidade)-Number(r.quantidade_atendida),0);
    assert(b.qty>=reserved,'Reserva excede saldo fisico');
    add('saldos_estoque', { produto_id: product.id, local_estoque_id: location.id, quantidade_fisica: b.qty,quantidade_reservada:reserved,custo_medio: b.cost.toFixed(6), ultima_movimentacao_em: b.date });
    if(location.id===locations[0].id&&product.id>=19){product.estoque_minimo=b.qty-reserved+3;product.ponto_reposicao=product.estoque_minimo+5;}
  }
  // Three real cash transfers between the fictional accounts, with no duplicate income.
  for (const [i, [date, origin, destination, value]] of [['2026-07-06', 0, 2, '500.00'], ['2026-08-14', 0, 1, '5000.00'], ['2026-09-18', 1, 0, '3000.00']].entries()) add('transferencias_financeiras', { conta_origem_id: accounts[origin].id, conta_destino_id: accounts[destination].id, data_transferencia: date, valor: value, status: 'concluida', descricao: 'Transferência interna entre contas demonstrativas', chave_idempotencia: `${TAG}:transferencia:${i + 1}`, criado_em: stamp(date, 13) });
  return { rows, reference: REFERENCE, tag: TAG, tenantId };
}

async function reserveIds(db, catalog, dataset) {
  const mapping = new Map();
  for (const [table, rows] of Object.entries(dataset.rows)) {
    const allocated = (await db.query("SELECT nextval(pg_get_serial_sequence($1,'id'))::text AS id FROM generate_series(1,$2::int)", ['erp.' + table, rows.length])).rows;
    mapping.set(table, new Map(rows.map((row, i) => [String(row.id), allocated[i].id])));
  }
  for (const [table, rows] of Object.entries(dataset.rows)) {
    const refs = catalog.constraints.filter(c => c.schema === 'erp' && c.table_name === table && c.type === 'f' && c.target.startsWith('erp.'));
    for (const row of rows) {
      const mappedColumns=new Set();
      for (const ref of refs) {
        const target = ref.target.slice(4);
        for (let i = 0; i < ref.conkey.length; i++) {
          const col = catalog.columns.find(c => c.table_schema === 'erp' && c.table_name === table && c.ordinal_position === ref.conkey[i]);
          const other = catalog.columns.find(c => c.table_schema === 'erp' && c.table_name === target && c.ordinal_position === ref.confkey[i]);
          if (other?.column_name === 'id' && row[col.column_name] != null && !mappedColumns.has(col.column_name)) {
            const newId = mapping.get(target)?.get(String(row[col.column_name]));
            assert(newId, `Referência não mapeada: ${table}.${col.column_name}`);
            row[col.column_name] = newId;
            mappedColumns.add(col.column_name);
          }
        }
      }
      // Polymorphic stock references do not have a physical FK.
      if (table === 'movimentacoes_estoque') row.origem_id = mapping.get(row.origem_tipo === 'venda' ? 'vendas' : row.origem_tipo === 'compra' ? 'compras' : row.origem_tipo==='transferencia'?'transferencias_estoque':'documentos_estoque').get(String(row.origem_id));
      row.id = mapping.get(table).get(String(row.id));
    }
  }
}

async function insertRows(db, table, rows, catalog) {
  if (!rows?.length) return;
  const groups = new Map();
  for (const row of rows) { const key = Object.keys(row).sort().join(','); const group = groups.get(key) || []; group.push(row); groups.set(key, group); }
  for (const [key, group] of groups) {
    const columns = key.split(',');
    for (let offset = 0; offset < group.length; offset += 100) {
      const params = [];
      const values = group.slice(offset, offset + 100).map(row => '(' + columns.map(name => {
        const type = catalog.columns.find(c => c.table_schema === 'erp' && c.table_name === table && c.column_name === name);
        params.push(type.udt_name === 'jsonb' ? JSON.stringify(row[name]) : row[name]);
        return '$' + params.length;
      }).join(',') + ')');
      await db.query(`INSERT INTO erp.${ident(table)} (${columns.map(ident).join(',')}) VALUES ${values.join(',')}`, params);
    }
  }
}

async function loadDemo(db, catalog, dataset) {
  await reserveIds(db, catalog, dataset);
  const order = ['categorias', 'centros_custo', 'contas_financeiras', 'metodos_pagamento', 'locais_estoque', 'entidades', 'produtos', 'servicos', 'naturezas_operacao_compra', 'fornecedores_produtos', 'recorrencias_financeiras', 'contratos_vendas', 'contratos_vendas_versoes', 'contratos_vendas_itens', 'vendas', 'vendas_itens', 'vendas_recebimentos_previstos', 'compras', 'compras_itens', 'compras_parcelas_previstas', 'contas_receber', 'contas_receber_parcelas', 'contas_pagar', 'contas_pagar_parcelas', 'pagamentos', 'vendas_eventos', 'compras_eventos', 'ordens_servico', 'ordens_servico_itens', 'ordens_servico_eventos', 'documentos_estoque', 'documentos_estoque_itens','transferencias_estoque','transferencias_estoque_itens', 'movimentacoes_estoque', 'saldos_estoque','reservas_estoque', 'transferencias_financeiras'];
  for (const table of order) {
    if (['vendas','contas_receber','contas_pagar','pagamentos','documentos_estoque'].includes(table)) console.log(JSON.stringify({ stage: 'load', table }));
    if (table === 'pagamentos') {
      // Flush the complete documents before payments. Each payment batch also
      // flushes its deferred balance triggers, limiting nested trigger depth.
      await db.query('SET CONSTRAINTS ALL IMMEDIATE');
      const payments = dataset.rows[table];
      for (let offset = 0; offset < payments.length; offset += 5) {
        await db.query('SET CONSTRAINTS ALL DEFERRED');
        await insertRows(db, table, payments.slice(offset, offset + 5), catalog);
        await db.query('SET CONSTRAINTS ALL IMMEDIATE');
        if (offset % 25 === 0) console.log(JSON.stringify({ stage: 'payment_validation', processed: Math.min(offset + 5, payments.length), total: payments.length }));
      }
      await db.query('SET CONSTRAINTS ALL DEFERRED');
    } else await insertRows(db, table, table==='vendas'?[...dataset.rows[table]].sort((a,b)=>Number(b.tipo_documento==='orcamento')-Number(a.tipo_documento==='orcamento')):dataset.rows[table], catalog);
    if (table === 'contratos_vendas_itens') {
      await db.query("UPDATE erp.contratos_vendas_versoes SET status='efetivada',efetivada_em=$2 WHERE empresa_id=$1", [dataset.tenantId, stamp('2026-07-01', 9)]);
      await db.query("UPDATE erp.contratos_vendas SET status='ativo' WHERE empresa_id=$1", [dataset.tenantId]);
    }
  }
  await insertRows(db, 'contratos_vendas_geracoes', dataset.rows.contratos_vendas_geracoes, catalog);
  assert.deepEqual(Object.keys(dataset.rows).filter(t => ![...order, 'contratos_vendas_geracoes'].includes(t)), []);
  console.log(JSON.stringify({ stage: 'validating_constraints', generated: Object.fromEntries(Object.entries(dataset.rows).map(([t, r]) => [t, r.length])) }));
  await db.query('SET CONSTRAINTS ALL IMMEDIATE');
}

export async function verifyDemo(db, tenantId = 1) {
  const checks = [];
  const check = async (name, sql) => { const r = (await db.query(sql, [tenantId])).rows; assert.equal(Number(r[0].errors), 0, name); checks.push(name); };
  for (const side of ['receber', 'pagar']) {
    await check(`totais_${side}`, `SELECT count(*)::int errors FROM erp.contas_${side} t WHERE t.empresa_id=$1 AND t.valor_total<>(SELECT coalesce(sum(p.valor),0) FROM erp.contas_${side}_parcelas p WHERE p.empresa_id=t.empresa_id AND p.conta_${side}_id=t.id)`);
    await check(`saldos_${side}`, `SELECT count(*)::int errors FROM erp.contas_${side}_parcelas p CROSS JOIN LATERAL erp.composicao_parcela(p.empresa_id,'${side}',p.id) c WHERE p.empresa_id=$1 AND (p.valor_pago<>c.dinheiro OR c.saldo<0 OR (p.status='pago' AND c.saldo<>0) OR (p.status='parcial' AND (c.dinheiro<=0 OR c.saldo<=0)) OR (p.status='cancelado' AND c.dinheiro<>0))`);
    await check(`origem_parcelas_${side}`, side === 'receber' ? `SELECT count(*)::int errors FROM erp.contas_receber_parcelas p JOIN erp.vendas_recebimentos_previstos v ON v.empresa_id=p.empresa_id AND v.id=p.recebimento_previsto_id JOIN erp.contas_receber t ON t.empresa_id=p.empresa_id AND t.id=p.conta_receber_id WHERE p.empresa_id=$1 AND (v.venda_id<>t.venda_id OR v.valor<>p.valor OR v.data_vencimento<>p.data_vencimento)` : `SELECT count(*)::int errors FROM erp.contas_pagar_parcelas p JOIN erp.compras_parcelas_previstas v ON v.empresa_id=p.empresa_id AND v.id=p.parcela_prevista_id JOIN erp.contas_pagar t ON t.empresa_id=p.empresa_id AND t.id=p.conta_pagar_id WHERE p.empresa_id=$1 AND (v.compra_id<>t.compra_id OR v.valor<>p.valor OR v.data_vencimento<>p.data_vencimento)`);
  }
  await check('estoque_saldo', `SELECT count(*)::int errors FROM erp.saldos_estoque s WHERE s.empresa_id=$1 AND (s.quantidade_fisica<0 OR s.quantidade_fisica<>(SELECT coalesce(sum(m.quantidade),0) FROM erp.movimentacoes_estoque m WHERE m.empresa_id=s.empresa_id AND m.produto_id=s.produto_id AND m.local_estoque_id=s.local_estoque_id))`);
  await check('estoque_historico', `SELECT count(*)::int errors FROM (SELECT m.*,sum(quantidade) OVER(PARTITION BY empresa_id,produto_id,local_estoque_id ORDER BY ocorrido_em,id) acumulado FROM erp.movimentacoes_estoque m WHERE empresa_id=$1) x WHERE x.acumulado<>x.saldo_apos OR x.acumulado<0`);
  await check('pagamentos_datas', `SELECT count(*)::int errors FROM erp.pagamentos m LEFT JOIN erp.contas_receber_parcelas r ON r.empresa_id=m.empresa_id AND r.id=m.conta_receber_parcela_id LEFT JOIN erp.contas_receber rt ON rt.empresa_id=r.empresa_id AND rt.id=r.conta_receber_id LEFT JOIN erp.contas_pagar_parcelas p ON p.empresa_id=m.empresa_id AND p.id=m.conta_pagar_parcela_id LEFT JOIN erp.contas_pagar pt ON pt.empresa_id=p.empresa_id AND pt.id=p.conta_pagar_id WHERE m.empresa_id=$1 AND (m.data_pagamento>'${REFERENCE}' OR m.data_pagamento<coalesce(rt.data_emissao,pt.data_emissao) OR pt.tipo_lancamento='previsao')`);
  await check('os_datas', `SELECT count(*)::int errors FROM erp.ordens_servico WHERE empresa_id=$1 AND (concluida_em::date>'${REFERENCE}' OR concluida_em::date<data_inicio)`);
  await check('estoque_documentos', `SELECT count(*)::int errors FROM erp.documentos_estoque_itens d LEFT JOIN erp.vendas_itens v ON v.empresa_id=d.empresa_id AND v.id=d.venda_item_id LEFT JOIN erp.compras_itens c ON c.empresa_id=d.empresa_id AND c.id=d.compra_item_id WHERE d.empresa_id=$1 AND (coalesce(v.produto_id,c.produto_id,d.produto_id)<>d.produto_id OR (v.id IS NOT NULL AND d.quantidade<>v.quantidade_atendida) OR (c.id IS NOT NULL AND d.quantidade<>c.quantidade_recebida))`);
  await check('reservas_saldo',`SELECT count(*)::int errors FROM erp.saldos_estoque s WHERE s.empresa_id=$1 AND (s.quantidade_fisica<s.quantidade_reservada OR s.quantidade_reservada<>(SELECT coalesce(sum(r.quantidade-r.quantidade_atendida),0) FROM erp.reservas_estoque r WHERE r.empresa_id=s.empresa_id AND r.produto_id=s.produto_id AND r.local_estoque_id=s.local_estoque_id AND r.status='ativa'))`);
  await check('transferencias_estoque',`SELECT count(*)::int errors FROM erp.transferencias_estoque t WHERE t.empresa_id=$1 AND t.status='finalizada' AND ((SELECT count(*) FROM erp.movimentacoes_estoque m WHERE m.empresa_id=t.empresa_id AND m.origem_tipo='transferencia' AND m.origem_id=t.id)<>2 OR (SELECT sum(m.quantidade) FROM erp.movimentacoes_estoque m WHERE m.empresa_id=t.empresa_id AND m.origem_tipo='transferencia' AND m.origem_id=t.id)<>0)`);
  await check('orcamentos_sem_financeiro',`SELECT count(*)::int errors FROM erp.vendas v WHERE v.empresa_id=$1 AND v.tipo_documento='orcamento' AND EXISTS(SELECT 1 FROM erp.contas_receber c WHERE c.empresa_id=v.empresa_id AND c.venda_id=v.id)`);
  await check('documentos_confirmados_com_financeiro',`SELECT count(*)::int errors FROM (SELECT v.id FROM erp.vendas v WHERE v.empresa_id=$1 AND v.tipo_documento='venda' AND v.status='confirmada' AND NOT EXISTS(SELECT 1 FROM erp.contas_receber c WHERE c.empresa_id=v.empresa_id AND c.venda_id=v.id) UNION ALL SELECT v.id FROM erp.compras v WHERE v.empresa_id=$1 AND v.gera_financeiro AND v.status IN ('confirmada','recebida','parcialmente_recebida') AND NOT EXISTS(SELECT 1 FROM erp.contas_pagar c WHERE c.empresa_id=v.empresa_id AND c.compra_id=v.id)) x`);
  await check('limite_vencimentos',`SELECT count(*)::int errors FROM (SELECT data_vencimento FROM erp.contas_receber_parcelas WHERE empresa_id=$1 UNION ALL SELECT data_vencimento FROM erp.contas_pagar_parcelas WHERE empresa_id=$1) p WHERE data_vencimento>'2026-12-31'`);
  const summaries = {};
  for (const side of ['receber', 'pagar']) summaries[side] = (await db.query(`SELECT CASE WHEN p.status='cancelado' THEN 'cancelado' WHEN c.saldo=0 THEN 'pago' WHEN p.data_vencimento<'${REFERENCE}' THEN 'vencido' WHEN c.dinheiro>0 THEN 'parcial' ELSE 'aberto' END AS status,count(*)::int parcelas,sum(p.valor)::text valor_nominal,sum(c.dinheiro)::text principal_liquidado,sum(c.saldo)::text saldo FROM erp.contas_${side}_parcelas p CROSS JOIN LATERAL erp.composicao_parcela(p.empresa_id,'${side}',p.id) c WHERE p.empresa_id=$1 GROUP BY 1 ORDER BY 1`, [tenantId])).rows;
  const cash = (await db.query(`SELECT a.nome,(a.saldo_inicial+coalesce((SELECT sum(CASE WHEN p.tipo='receber' THEN p.valor_liquido ELSE -p.valor_liquido END) FROM erp.pagamentos p WHERE p.empresa_id=a.empresa_id AND p.conta_financeira_id=a.id AND p.estornado_em IS NULL AND p.estorno_de_pagamento_id IS NULL),0)+coalesce((SELECT sum(CASE WHEN x.conta_destino_id=a.id THEN x.valor ELSE -x.valor END) FROM erp.transferencias_financeiras x WHERE x.empresa_id=a.empresa_id AND (x.conta_origem_id=a.id OR x.conta_destino_id=a.id)),0))::text saldo FROM erp.contas_financeiras a WHERE empresa_id=$1 ORDER BY a.id`, [tenantId])).rows;
  assert(cash.every(c => Number(c.saldo) >= 0), 'Caixa demonstrativo negativo');
  const counts = {};
  for (const table of ['entidades', 'produtos', 'servicos', 'vendas', 'compras', 'contas_receber', 'contas_pagar', 'pagamentos', 'contratos_vendas', 'ordens_servico', 'documentos_estoque', 'movimentacoes_estoque']) counts[table] = Number((await db.query(`SELECT count(*)::int total FROM erp.${ident(table)} WHERE empresa_id=$1`, [tenantId])).rows[0].total);
  counts.vendas=Number((await db.query("SELECT count(*)::int total FROM erp.vendas WHERE empresa_id=$1 AND tipo_documento='venda'",[tenantId])).rows[0].total);
  counts.orcamentos=Number((await db.query("SELECT count(*)::int total FROM erp.vendas WHERE empresa_id=$1 AND tipo_documento='orcamento'",[tenantId])).rows[0].total);
  for(const [flag,name] of [['cliente','clientes'],['fornecedor','fornecedores'],['vendedor','vendedores']])counts[name]=Number((await db.query(`SELECT count(*)::int total FROM erp.entidades WHERE empresa_id=$1 AND eh_${flag}`,[tenantId])).rows[0].total);
  for(const table of ['contas_receber_parcelas','contas_pagar_parcelas','reservas_estoque','transferencias_estoque','transferencias_financeiras','locais_estoque','contas_financeiras'])counts[table]=Number((await db.query(`SELECT count(*)::int total FROM erp.${ident(table)} WHERE empresa_id=$1`,[tenantId])).rows[0].total);
  const dueWeek = {};
  const dueToday={},overdue={};
  for (const side of ['receber', 'pagar']) {
    const totals=async condition=>(await db.query(`SELECT count(*)::int parcelas,coalesce(sum(c.saldo),0)::text saldo FROM erp.contas_${side}_parcelas p CROSS JOIN LATERAL erp.composicao_parcela(p.empresa_id,'${side}',p.id) c WHERE p.empresa_id=$1 AND ${condition} AND p.status NOT IN ('pago','cancelado','renegociado') AND c.saldo>0`,[tenantId])).rows[0];
    dueWeek[side]=await totals("p.data_vencimento BETWEEN '2026-10-07' AND '2026-10-13'");
    dueToday[side]=await totals(`p.data_vencimento='${REFERENCE}'`);
    overdue[side]=await totals(`p.data_vencimento<'${REFERENCE}'`);
    assert(summaries[side].some(s=>s.status==='vencido'));assert(Number(dueWeek[side].parcelas)>0);assert(Number(dueToday[side].parcelas)>0);
    assert(Number((await db.query(`SELECT count(*)::int n FROM erp.contas_${side}_parcelas p CROSS JOIN LATERAL erp.composicao_parcela(p.empresa_id,'${side}',p.id) c WHERE p.empresa_id=$1 AND c.dinheiro>0 AND c.saldo>0`,[tenantId])).rows[0].n)>0,'Missing partial payments');
  }
  for(const [name,n] of Object.entries({vendas:150,compras:60,orcamentos:12,clientes:30,fornecedores:15,vendedores:3,contas_receber:142,contas_receber_parcelas:247,contas_pagar:106,contas_pagar_parcelas:163,contratos_vendas:12,ordens_servico:24}))assert.equal(counts[name],n,name);
  return { reference: REFERENCE, checks, counts, summaries, cash, dueWeek,dueToday,overdue,upcomingRange:{from:'2026-10-07',to:'2026-10-13'} };
}

async function main() {
  const args=process.argv.slice(2),apply=args.includes('--apply'),dry=args.includes('--dry-run'),verify=args.includes('--verify'),plan=args.includes('--plan');
  assert.equal([apply,dry,verify,plan].filter(Boolean).length,1,'Choose --plan, --dry-run, --apply or --verify');
  assert(args.every(a=>['--apply','--dry-run','--verify','--plan'].includes(a)||/^--empresa=\d+$/.test(a)),'Unknown argument');
  const tenantId=Number(args.find(a=>a.startsWith('--empresa='))?.slice(10));
  assert(Number.isSafeInteger(tenantId)&&tenantId>0,'Explicit company required');
  const identity=JSON.parse(readFileSync('.cache/erp-demo/identity.json','utf8'));
  assert.equal(identity.status,'provisioned');assert.equal(identity.project,project);assert.equal(identity.empresaId,tenantId);assert(identity.clerkVerified);
  const catalog=JSON.parse(readFileSync(CATALOG,'utf8')),dataset=buildDemo(catalog,tenantId,false,identity.usuarioId);
  for(const [table,rows] of Object.entries(dataset.rows))for(const column of catalog.columns.filter(c=>c.table_schema==='erp'&&c.table_name===table&&c.is_nullable==='NO'&&!c.column_default&&c.is_identity!=='YES'&&c.is_generated!=='ALWAYS'))
    assert(rows.every(row=>row[column.column_name]!=null),`Missing required column: ${table}.${column.column_name}`);
  assert.equal(dataset.rows.vendas.filter(r=>r.tipo_documento!=='orcamento').length,150);
  for(const [table,total] of [['compras',60],['contas_receber',142],['contas_receber_parcelas',247],['contas_pagar',106],['contas_pagar_parcelas',163]])assert.equal(dataset.rows[table].length,total,table);
  if(plan){console.log(JSON.stringify({project,empresaId:tenantId,reference:REFERENCE,counts:Object.fromEntries(Object.entries(dataset.rows).map(([t,r])=>[t,r.length]))}));return;}
  const tables=catalog.rls.filter(t=>t.schema==='erp'&&t.relkind==='r').map(t=>t.relname).sort(),db=connection();
  let committed=false,backupFile;
  try {
    await db.connect();await db.query('BEGIN');
    await db.query("SET LOCAL lock_timeout='15s';SET LOCAL statement_timeout='600s';SET LOCAL timezone='UTC';SET LOCAL datestyle='ISO,YMD';");
    const company=(await db.query('SELECT id,status,clerk_organization_id FROM shared.empresas WHERE id=$1 FOR UPDATE',[tenantId])).rows[0];
    assert(company&&company.status==='active'&&company.clerk_organization_id===identity.clerkOrganizationId,'Wrong or inactive company');
    const owner=(await db.query("SELECT m.role FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id WHERE m.empresa_id=$1 AND m.usuario_id=$2 AND u.clerk_user_id=$3 AND u.status='active' AND m.status='active' AND NOT m.suspenso_localmente",[tenantId,identity.usuarioId,identity.clerkUserId])).rows[0];
    assert.equal(owner?.role,'owner');
    await db.query("SELECT set_config('app.erp_empresa_id',$1,true),set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(tenantId),String(identity.usuarioId)]);
    const existing=(await db.query('SELECT metadata FROM erp.vendas WHERE empresa_id=$1 LIMIT 1',[tenantId])).rows[0];
    if(verify||existing){
      assert(existing?.metadata?.dataset===TAG,'Existing commercial data requires explicit review');
      const report=await verifyDemo(db,tenantId);await db.query('ROLLBACK');
      mkdirSync('.cache/erp-demo',{recursive:true});writeFileSync('.cache/erp-demo/verification.json',JSON.stringify({...report,project,empresaId:tenantId,status:'already_loaded',commercialWrites:false},null,2));
      console.log(JSON.stringify({status:'already_loaded',empresaId:tenantId,counts:report.counts,reference:REFERENCE}));return;
    }
    // Insert only into this new company. Lock writers while proving every record
    // belonging to another company survives byte for byte. No table reset.
    await db.query('LOCK TABLE '+tables.map(t=>'erp.'+ident(t)).join(',')+' IN SHARE ROW EXCLUSIVE MODE');
    const backup={project,empresaId:tenantId,createdAt:new Date().toISOString(),reference:REFERENCE,structure:catalog,tables:{},otherDigests:{}};
    for(const table of tables){
      const columns=catalog.columns.filter(c=>c.table_schema==='erp'&&c.table_name===table).map(c=>c.column_name);
      assert(columns.includes('empresa_id'),'Unscoped table requires review: '+table);
      const rows=(await db.query('SELECT '+columns.map(c=>ident(c)+'::text AS '+ident(c)).join(',')+' FROM erp.'+ident(table)+' ORDER BY id')).rows;
      const own=rows.filter(r=>r.empresa_id===String(tenantId));
      assert.equal(own.length,0,'New company is not empty: '+table);
      backup.tables[table]=rows;backup.otherDigests[table]=hash(rows);
    }
    mkdirSync('credentials/backups/erp-demo',{recursive:true});backupFile='credentials/backups/erp-demo/erp-before-'+Date.now()+'.json';
    const bytes=JSON.stringify(backup);writeFileSync(backupFile,bytes,{flag:'wx'});assert.equal(readFileSync(backupFile,'utf8'),bytes);
    console.log(JSON.stringify({stage:'backup_verified',tables:tables.length,records:Object.values(backup.tables).reduce((sum,r)=>sum+r.length,0)}));
    await loadDemo(db,catalog,dataset);
    const report=await verifyDemo(db,tenantId);
    for(const table of tables){
      const columns=catalog.columns.filter(c=>c.table_schema==='erp'&&c.table_name===table).map(c=>c.column_name);
      const rows=(await db.query('SELECT '+columns.map(c=>ident(c)+'::text AS '+ident(c)).join(',')+' FROM erp.'+ident(table)+' WHERE empresa_id<>$1 ORDER BY id',[tenantId])).rows;
      assert.equal(hash(rows),backup.otherDigests[table],'Other company changed: '+table);
    }
    if(apply){await db.query('COMMIT');committed=true;}else await db.query('ROLLBACK');
    const final={...report,status:apply?'applied':'dry_run_passed',project,empresaId:tenantId,usuarioId:identity.usuarioId,tag:TAG,otherCompaniesPreserved:true,backupFile,backupDigest:createHash('sha256').update(bytes).digest('hex')};
    mkdirSync('.cache/erp-demo',{recursive:true});writeFileSync('.cache/erp-demo/'+(apply?'result':'dry-run')+'.json',JSON.stringify(final,null,2));
    console.log(JSON.stringify(final));
  }catch(error){if(!committed)await db.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({status:committed?'committed_report_needs_attention':'rolled_back',code:error.code||error.name,message:error.message,backupFile}));process.exitCode=1;}
  finally{await db.end().catch(()=>{});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
