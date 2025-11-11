import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

// ============================================
// WORKFLOW TOOLS - CONCILIAÇÃO BANCÁRIA
// ============================================

/**
 * [WORKFLOW] Processa extrato bancário e estrutura transações
 * Recebe dados extraídos pelo Claude multimodal do extrato
 */
export const processarExtratoBancario = tool({
  description: '[WORKFLOW] Processa extrato bancário e estrutura as transações extraídas do documento',
  inputSchema: z.object({
    banco: z.string().describe('Nome do banco'),
    conta: z.string().describe('Número da conta'),
    agencia: z.string().optional().describe('Número da agência'),
    data_inicio: z.string().describe('Data início do período (YYYY-MM-DD)'),
    data_fim: z.string().describe('Data fim do período (YYYY-MM-DD)'),
    saldo_inicial: z.number().describe('Saldo inicial do período'),
    saldo_final: z.number().describe('Saldo final do período'),
    transacoes: z.array(z.object({
      data: z.string().describe('Data da transação (YYYY-MM-DD)'),
      descricao: z.string().describe('Descrição da transação'),
      valor: z.number().describe('Valor da transação'),
      tipo: z.enum(['debito', 'credito']).describe('Tipo: débito (saída) ou crédito (entrada)'),
      saldo_apos: z.number().optional().describe('Saldo após a transação')
    })).describe('Lista de transações extraídas do extrato')
  }),
  execute: async ({ banco, conta, agencia, data_inicio, data_fim, saldo_inicial, saldo_final, transacoes }) => {
    // Mock data - será substituído por processamento real

    // Calcular totais
    const total_debitos = transacoes
      .filter(t => t.tipo === 'debito')
      .reduce((sum, t) => sum + t.valor, 0);

    const total_creditos = transacoes
      .filter(t => t.tipo === 'credito')
      .reduce((sum, t) => sum + t.valor, 0);

    // Validar saldo
    const saldo_calculado = saldo_inicial + total_creditos - total_debitos;
    const saldo_bateu = Math.abs(saldo_calculado - saldo_final) < 0.01;

    return {
      success: true,
      data: {
        banco,
        conta,
        agencia,
        periodo: {
          data_inicio,
          data_fim,
          dias: Math.ceil((new Date(data_fim).getTime() - new Date(data_inicio).getTime()) / (1000 * 60 * 60 * 24))
        },
        saldos: {
          inicial: saldo_inicial,
          final: saldo_final,
          calculado: saldo_calculado,
          conferido: saldo_bateu
        },
        totais: {
          transacoes: transacoes.length,
          debitos: total_debitos,
          creditos: total_creditos,
          quantidade_debitos: transacoes.filter(t => t.tipo === 'debito').length,
          quantidade_creditos: transacoes.filter(t => t.tipo === 'credito').length
        },
        transacoes
      },
      message: `Extrato processado com sucesso: ${transacoes.length} transações encontradas`,
      title: '📄 Extrato Processado',
      resumo: {
        banco,
        conta,
        periodo: `${new Date(data_inicio).toLocaleDateString('pt-BR')} a ${new Date(data_fim).toLocaleDateString('pt-BR')}`,
        total_transacoes: transacoes.length,
        saldo_conferido: saldo_bateu
      }
    };
  }
});

/**
 * [WORKFLOW] Cria registro do extrato bancário na base de dados
 */
export const criarExtratoBancario = tool({
  description: '[WORKFLOW] Salva extrato bancário processado na base de dados',
  inputSchema: z.object({
    banco: z.string().describe('Nome do banco'),
    conta: z.string().describe('Número da conta'),
    agencia: z.string().optional().describe('Número da agência'),
    data_inicio: z.string().describe('Data início (YYYY-MM-DD)'),
    data_fim: z.string().describe('Data fim (YYYY-MM-DD)'),
    saldo_inicial: z.number().describe('Saldo inicial'),
    saldo_final: z.number().describe('Saldo final'),
    total_debitos: z.number().describe('Total de débitos'),
    total_creditos: z.number().describe('Total de créditos'),
    quantidade_transacoes: z.number().describe('Quantidade de transações'),
  }),
  execute: async ({ banco, conta, agencia, data_inicio, data_fim, saldo_inicial, saldo_final, total_debitos, total_creditos, quantidade_transacoes }) => {
    // Mock data - será substituído por insert real no BigQuery

    const extratoCriado = {
      id: `extrato-${Date.now()}`,
      banco,
      conta,
      agencia: agencia || '-',
      data_inicio,
      data_fim,
      saldo_inicial,
      saldo_final,
      total_debitos,
      total_creditos,
      quantidade_transacoes,
      status: 'aguardando_conciliacao',
      data_cadastro: new Date().toISOString()
    };

    return {
      success: true,
      data: extratoCriado,
      message: `Extrato bancário registrado com ID: ${extratoCriado.id}`,
      title: '💾 Extrato Salvo',
      resumo: {
        id: extratoCriado.id,
        banco,
        conta,
        periodo: `${new Date(data_inicio).toLocaleDateString('pt-BR')} a ${new Date(data_fim).toLocaleDateString('pt-BR')}`,
        total_transacoes: quantidade_transacoes,
        status: 'Aguardando conciliação'
      }
    };
  }
});

/**
 * [WORKFLOW] Busca lançamentos financeiros do período
 */
export const buscarLancamentosFinanceiros = tool({
  description: '[WORKFLOW] Busca lançamentos financeiros (pagamentos efetuados/recebidos) com filtro por tipo',
  inputSchema: z.object({
    tipo: z.enum(['pagamento_recebido', 'pagamento_efetuado', 'todos']).optional()
      .describe('Tipo do lançamento (recebido, efetuado ou todos). Default: todos'),
    limite: z.number().int().positive().max(1000).optional()
      .describe('Limite de registros. Default 20')
  }),
  execute: async ({ tipo, limite }) => {
    const lim = Math.max(1, Math.min(1000, limite || 20));

    const baseReceb = `
      SELECT 'pagamento_recebido'::text AS tipo,
             lf.id::text AS pagamento_id,
             lf.descricao AS descricao_pagamento,
             lf.valor AS valor,
             lf.status AS status_pagamento,
             c.nome_fantasia AS cliente_nome,
             f.nome AS fornecedor_nome
        FROM financeiro.lancamentos_financeiros lf
        LEFT JOIN financeiro.lancamentos_financeiros orig 
               ON lf.lancamento_origem_id = orig.id
        LEFT JOIN entidades.clientes c 
               ON orig.cliente_id = c.id
        LEFT JOIN entidades.fornecedores f 
               ON lf.fornecedor_id = f.id
       WHERE lf.tipo = 'pagamento_recebido'
    `.replace(/\n\s+/g, ' ').trim();

    const baseEfet = `
      SELECT 'pagamento_efetuado'::text AS tipo,
             lf.id::text AS pagamento_id,
             lf.descricao AS descricao_pagamento,
             lf.valor AS valor,
             lf.status AS status_pagamento,
             c.nome_fantasia AS cliente_nome,
             f.nome AS fornecedor_nome
        FROM financeiro.lancamentos_financeiros lf
        LEFT JOIN financeiro.lancamentos_financeiros orig 
               ON lf.lancamento_origem_id = orig.id
        LEFT JOIN entidades.fornecedores f 
               ON orig.fornecedor_id = f.id
        LEFT JOIN entidades.clientes c 
               ON lf.entidade_id = c.id
       WHERE lf.tipo = 'pagamento_efetuado'
    `.replace(/\n\s+/g, ' ').trim();

    let sql: string;
    if (tipo === 'pagamento_recebido') {
      sql = `${baseReceb} ORDER BY lf.id DESC LIMIT ${lim}`;
    } else if (tipo === 'pagamento_efetuado') {
      sql = `${baseEfet} ORDER BY lf.id DESC LIMIT ${lim}`;
    } else {
      sql = `SELECT * FROM ( ${baseReceb} UNION ALL ${baseEfet} ) u ORDER BY u.pagamento_id::bigint DESC LIMIT ${lim}`;
    }

    type Row = { tipo: string; pagamento_id: string; descricao_pagamento: string | null; valor: number | null; status_pagamento: string | null; cliente_nome: string | null; fornecedor_nome: string | null };
    const rows = await runQuery<Row>(sql);

    const msgTipo = tipo ? (tipo === 'todos' ? 'pagamentos' : tipo.replace('_', ' ')) : 'pagamentos';
    return {
      success: true,
      title: '📊 Lançamentos Financeiros',
      message: `${rows.length} ${msgTipo} encontrados`,
      rows,
      count: rows.length
    };
  }
});

/**
 * [WORKFLOW] Concilia transações do extrato com lançamentos financeiros
 */
export const conciliarTransacoes = tool({
  description: '[WORKFLOW] Realiza conciliação automática entre transações do extrato bancário e lançamentos financeiros do sistema',
  inputSchema: z.object({
    extrato_id: z.string().describe('ID do extrato bancário'),
    transacoes_extrato: z.array(z.object({
      data: z.string(),
      descricao: z.string(),
      valor: z.number(),
      tipo: z.enum(['debito', 'credito'])
    })).describe('Transações do extrato'),
    lancamentos: z.array(z.object({
      id: z.string(),
      tipo: z.string(),
      data: z.string(),
      descricao: z.string(),
      valor: z.number()
    })).describe('Lançamentos financeiros do sistema')
  }),
  execute: async ({ extrato_id, transacoes_extrato, lancamentos }) => {
    // Mock conciliação automática
    type TransacaoExtrato = {
      data: string;
      descricao: string;
      valor: number;
      tipo: 'debito' | 'credito';
    };

    type Lancamento = {
      id: string;
      tipo: string;
      data: string;
      descricao: string;
      valor: number;
    };

    const conciliacoes: Array<{
      transacao_extrato: TransacaoExtrato;
      lancamento?: Lancamento;
      status: 'conciliado' | 'possivel_match' | 'divergencia';
      score?: number;
    }> = [];

    transacoes_extrato.forEach(transacao => {
      // Buscar possíveis matches
      const matches = lancamentos
        .filter(lanc => {
          // Verificar tipo (débito = pagamento efetuado, crédito = pagamento recebido)
          const tipoMatch =
            (transacao.tipo === 'debito' && lanc.tipo === 'pagamento_efetuado') ||
            (transacao.tipo === 'credito' && lanc.tipo === 'pagamento_recebido');

          if (!tipoMatch) return false;

          // Verificar valor (diferença menor que R$ 0.10)
          const valorMatch = Math.abs(transacao.valor - lanc.valor) < 0.10;

          // Verificar data (diferença de até 3 dias)
          const dataTransacao = new Date(transacao.data).getTime();
          const dataLanc = new Date(lanc.data).getTime();
          const diffDias = Math.abs(dataTransacao - dataLanc) / (1000 * 60 * 60 * 24);
          const dataMatch = diffDias <= 3;

          return valorMatch && dataMatch;
        })
        .map(lanc => {
          // Calcular score de similaridade
          let score = 0;
          if (Math.abs(transacao.valor - lanc.valor) < 0.01) score += 50; // Valor exato
          if (transacao.data === lanc.data) score += 30; // Data exata
          if (transacao.descricao.toLowerCase().includes(lanc.descricao.toLowerCase().split(' ')[0])) score += 20; // Descrição similar
          return { lanc, score };
        })
        .sort((a, b) => b.score - a.score);

      if (matches.length > 0 && matches[0].score >= 80) {
        // Match perfeito - conciliar automaticamente
        conciliacoes.push({
          transacao_extrato: transacao,
          lancamento: matches[0].lanc,
          status: 'conciliado',
          score: matches[0].score
        });
      } else if (matches.length > 0) {
        // Possível match - requer confirmação
        conciliacoes.push({
          transacao_extrato: transacao,
          lancamento: matches[0].lanc,
          status: 'possivel_match',
          score: matches[0].score
        });
      } else {
        // Sem match - divergência
        conciliacoes.push({
          transacao_extrato: transacao,
          status: 'divergencia'
        });
      }
    });

    const conciliadas = conciliacoes.filter(c => c.status === 'conciliado');
    const possiveis = conciliacoes.filter(c => c.status === 'possivel_match');
    const divergencias = conciliacoes.filter(c => c.status === 'divergencia');

    return {
      success: true,
      data: {
        extrato_id,
        conciliacoes,
        data_conciliacao: new Date().toISOString()
      },
      message: `Conciliação concluída: ${conciliadas.length} automáticas, ${possiveis.length} pendentes, ${divergencias.length} divergências`,
      title: '✅ Conciliação Realizada',
      resumo: {
        total: conciliacoes.length,
        conciliadas: conciliadas.length,
        possiveis_matches: possiveis.length,
        divergencias: divergencias.length,
        taxa_conciliacao: `${((conciliadas.length / conciliacoes.length) * 100).toFixed(1)}%`
      },
      detalhamento: {
        conciliadas: conciliadas.map(c => ({
          data: c.transacao_extrato.data,
          descricao: c.transacao_extrato.descricao,
          valor: c.transacao_extrato.valor,
          lancamento_id: c.lancamento?.id,
          score: c.score
        })),
        possiveis: possiveis.map(p => ({
          data: p.transacao_extrato.data,
          descricao: p.transacao_extrato.descricao,
          valor: p.transacao_extrato.valor,
          possivel_lancamento: p.lancamento?.descricao,
          score: p.score
        })),
        divergencias: divergencias.map(d => ({
          data: d.transacao_extrato.data,
          descricao: d.transacao_extrato.descricao,
          valor: d.transacao_extrato.valor
        }))
      }
    };
  }
});
