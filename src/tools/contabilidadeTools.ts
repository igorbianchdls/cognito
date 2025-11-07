import { z } from 'zod';
import { tool } from 'ai';
import { runQuery } from '@/lib/postgres';

const jsonParams = (params: unknown[]) => {
  try { return JSON.stringify(params); } catch { return '[]'; }
};

// Lista lançamentos contábeis com paginação e filtros básicos
export const listarLancamentosContabeis = tool({
  description: 'Lista lançamentos contábeis (cabeçalho + linhas) com filtros e paginação',
  inputSchema: z.object({
    page: z.number().default(1).describe('Número da página (default 1)'),
    limit: z.number().default(50).describe('Linhas por página (default 50)'),
    de: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
    ate: z.string().optional().describe('Data final (YYYY-MM-DD)'),
    conta_codigo_like: z.string().optional().describe("Filtro LIKE no código da conta contábil, ex: '3.%'"),
    conta_id: z.string().optional().describe('Filtrar por ID da conta contábil'),
    cliente_id: z.string().optional().describe('Filtrar por ID do cliente'),
    fornecedor_id: z.string().optional().describe('Filtrar por ID do fornecedor'),
  }),
  execute: async ({ page = 1, limit = 50, de, ate, conta_codigo_like, conta_id, cliente_id, fornecedor_id }) => {
    try {
      const conditions: string[] = [];
      const params: unknown[] = [];
      let i = 1;

      const push = (expr: string, value: unknown) => { conditions.push(`${expr} $${i}`); params.push(value); i += 1; };

      // Filtros em cabeçalho
      if (de) push('lc.data_lancamento >=', de);
      if (ate) push('lc.data_lancamento <=', ate);
      if (cliente_id) push('lc.cliente_id =', cliente_id);
      if (fornecedor_id) push('lc.fornecedor_id =', fornecedor_id);
      const headerWhere = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // Paginação em cabeçalho
      const offset = Math.max(0, (page - 1) * limit);
      const chLimit = `LIMIT $${i}::int OFFSET $${i + 1}::int`;
      const paramsWithPage = [...params, limit, offset];

      // Listagem (join com linhas e plano de contas)
      const listSql = `WITH ch AS (\n                        SELECT lc.id\n                        FROM contabilidade.lancamentos_contabeis lc\n                        ${headerWhere}\n                        ORDER BY lc.id DESC\n                        ${chLimit}\n                      )\n                      SELECT \n                        lc.id AS lancamento_id,\n                        lc.data_lancamento,\n                        lc.historico,\n                        lc.total_debitos,\n                        lc.total_creditos,\n                        lcl.id AS linha_id,\n                        lcl.debito,\n                        lcl.credito,\n                        lcl.historico AS historico_linha,\n                        pc.codigo AS conta_codigo,\n                        pc.nome   AS conta_nome\n                      FROM ch\n                      JOIN contabilidade.lancamentos_contabeis lc ON lc.id = ch.id\n                      LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id\n                      LEFT JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id\n                      WHERE ($${i + 2}::text IS NULL OR pc.codigo LIKE $${i + 2}::text)\n                        AND ($${i + 3}::text IS NULL OR lcl.conta_id::text = $${i + 3}::text)\n                      ORDER BY lc.id DESC, lcl.id ASC`;

      const rows = await runQuery<Record<string, unknown>>(listSql, [...paramsWithPage, conta_codigo_like ?? null, conta_id ?? null]);

      // Total de cabeçalhos (opcional)
      const totalSql = `SELECT COUNT(*)::int AS total FROM contabilidade.lancamentos_contabeis lc ${headerWhere}`;
      const totalRows = await runQuery<{ total: number }>(totalSql, params);
      const total = Number(totalRows?.[0]?.total ?? 0);

      // Título dinâmico (curto): base + período + 1 filtro principal
      const baseTitle = 'Lançamentos Contábeis';
      let periodStr = '';
      if (de && ate) periodStr = `${de} a ${ate}`;
      else if (de) periodStr = `desde ${de}`;
      else if (ate) periodStr = `até ${ate}`;

      let mainFilter = '';
      if (conta_codigo_like) mainFilter = `Conta ${conta_codigo_like}`;
      else if (conta_id) mainFilter = `Conta ${conta_id}`;
      else if (cliente_id) mainFilter = `Cliente ${cliente_id}`;
      else if (fornecedor_id) mainFilter = `Fornecedor ${fornecedor_id}`;

      const title = [baseTitle, periodStr, mainFilter].filter(Boolean).join(' · ');

      return {
        success: true,
        message: `Encontrados ${rows.length} registros (página ${page})`,
        rows,
        count: rows.length,
        total,
        title,
        sql_query: listSql,
        sql_params: jsonParams([...paramsWithPage, conta_codigo_like ?? null, conta_id ?? null]),
      };
    } catch (error) {
      console.error('ERRO listarLancamentosContabeis:', error);
      return {
        success: false,
        message: `Erro ao listar lançamentos contábeis: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
      };
    }
  }
});

// Gera DRE agregando por período e grupo contábil
export const gerarDRE = tool({
  description: 'Gera DRE consolidada por período (month) e grupo contábil',
  inputSchema: z.object({
    de: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
    ate: z.string().optional().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ de, ate }) => {
    try {
      // Janela padrão (mês atual)
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const firstDay = `${y}-${m}-01`;
      const from = de || firstDay;
      const to = ate || new Date().toISOString().slice(0, 10);

      const dreSql = `\n        WITH canon AS (\n          SELECT MIN(id) AS id\n          FROM contabilidade.lancamentos_contabeis\n          WHERE data_lancamento::date BETWEEN $1::date AND $2::date\n          GROUP BY tenant_id, COALESCE(lancamento_financeiro_id, id)\n        ),\n        base AS (\n          SELECT \n            lc.data_lancamento::date AS data_lancamento,\n            DATE_TRUNC('month', lc.data_lancamento)::date AS periodo,\n            pc.codigo,\n            pc.tipo_conta,\n            COALESCE(lcl.debito,0) AS debito,\n            COALESCE(lcl.credito,0) AS credito\n          FROM canon ch\n          JOIN contabilidade.lancamentos_contabeis lc ON lc.id = ch.id\n          JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id\n          JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id\n        )\n        SELECT \n          TO_CHAR(periodo, 'YYYY-MM') AS periodo_key,\n          CASE \n            WHEN codigo LIKE '4.1.%' THEN 'receita_operacional'\n            WHEN codigo LIKE '4.2.%' THEN 'receita_outros'\n            WHEN codigo LIKE '5.1.%' THEN 'cogs'\n            WHEN codigo LIKE '5.2.%' THEN 'custos_operacionais'\n            WHEN codigo LIKE '6.1.%' THEN 'despesas_adm'\n            WHEN codigo LIKE '6.2.%' THEN 'despesas_comerciais'\n            WHEN codigo LIKE '6.3.%' THEN 'despesas_financeiras'\n            ELSE NULL\n          END AS grupo,\n          SUM(\n            CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido')\n              THEN (credito - debito)\n              ELSE (debito - credito)\n            END\n          ) AS valor\n        FROM base\n        GROUP BY 1,2\n        ORDER BY 1,2`;

      const rows = await runQuery<{ periodo_key: string; grupo: string | null; valor: number }>(dreSql, [from, to]);

      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const toLabel = (key: string) => {
        const [yy, mm] = key.split('-');
        const idx = Math.max(1, Math.min(12, Number(mm)));
        const label = `${months[idx - 1]}/${yy}`;
        return label;
      };

      const normalized = rows
        .filter(r => r.grupo)
        .map(r => ({ periodo_key: r.periodo_key, periodo: toLabel(r.periodo_key), grupo: r.grupo as string, valor: Number(r.valor || 0) }));

      // periods (ordenados)
      const periodKeys = Array.from(new Set(normalized.map(r => r.periodo_key))).sort();
      const periods = periodKeys.map(k => ({ key: k, label: toLabel(k) }));

      // Map por grupo -> {periodKey: value}
      const byGroup: Record<string, Record<string, number>> = {};
      for (const r of normalized) {
        if (!byGroup[r.grupo!]) byGroup[r.grupo!] = {};
        byGroup[r.grupo!][r.periodo_key!] = Number(r.valor || 0);
      }

      // Monta árvore como em /modulos/contabilidade/route.ts
      const node = (id: string, name: string, key: string) => ({ id, name, valuesByPeriod: byGroup[key] || {} });
      const nodes = [
        {
          id: 'receita',
          name: 'Receita',
          children: [
            node('receita-operacionais', 'Receitas Operacionais (4.1)', 'receita_operacional'),
            node('receita-outras', 'Receitas Financeiras/Outras (4.2)', 'receita_outros'),
          ],
        },
        {
          id: 'cogs',
          name: 'Custos dos Produtos/Operacionais (5.x)',
          children: [
            node('cogs-cmv', 'CMV (5.1)', 'cogs'),
            node('cogs-op', 'Custos Operacionais/Logística (5.2)', 'custos_operacionais'),
          ],
        },
        {
          id: 'opex',
          name: 'Despesas Operacionais (6.x)',
          children: [
            node('desp-adm', 'Administrativas (6.1)', 'despesas_adm'),
            node('desp-com', 'Comerciais e Marketing (6.2)', 'despesas_comerciais'),
            node('desp-fin', 'Financeiras (6.3)', 'despesas_financeiras'),
          ],
        },
      ];

      const title = `DRE · ${from} a ${to}`;
      return {
        success: true,
        message: `DRE gerada (${normalized.length} linhas)`,
        // Dados tabulares (legado)
        rows: normalized as Array<Record<string, unknown>>,
        count: normalized.length,
        title,
        // Dados estruturados (para UI rica)
        periods,
        nodes,
        // Debug
        sql_query: dreSql,
        sql_params: jsonParams([from, to]),
      };
    } catch (error) {
      console.error('ERRO gerarDRE:', error);
      return {
        success: false,
        message: `Erro ao gerar DRE: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
      };
    }
  }
});

// Gera Balanço Patrimonial consolidado por grupo
export const gerarBalancoPatrimonial = tool({
  description: 'Gera Balanço Patrimonial consolidado por grupo (Ativo/Passivo/PL)',
  inputSchema: z.object({
    de: z.string().optional().describe('Data inicial (YYYY-MM-DD)'),
    ate: z.string().optional().describe('Data final (YYYY-MM-DD)'),
  }),
  execute: async ({ de, ate }) => {
    try {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const firstDay = `${y}-${m}-01`;
      const from = de || firstDay;
      const to = ate || new Date().toISOString().slice(0, 10);

      const bpSql = `\n        WITH base AS (\n          SELECT \n            lc.data_lancamento::date AS data_lancamento,\n            pc.codigo,\n            pc.nome,\n            pc.tipo_conta,\n            pc.aceita_lancamento,\n            COALESCE(lcl.debito,0) AS debito,\n            COALESCE(lcl.credito,0) AS credito\n          FROM contabilidade.lancamentos_contabeis lc\n          JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id\n          JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id\n        ),\n        inicial AS (\n          SELECT codigo, nome, tipo_conta,\n            SUM(CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido') THEN (credito - debito) ELSE (debito - credito) END) AS saldo_inicial\n          FROM base\n          WHERE data_lancamento < $1::date AND aceita_lancamento = TRUE\n          GROUP BY codigo, nome, tipo_conta\n        ),\n        movimentos AS (\n          SELECT codigo, nome, tipo_conta,\n            SUM(CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido') THEN (credito - debito) ELSE (debito - credito) END) AS movimentos\n          FROM base\n          WHERE data_lancamento BETWEEN $1::date AND $2::date AND aceita_lancamento = TRUE\n          GROUP BY codigo, nome, tipo_conta\n        ),\n        final AS (\n          SELECT \n            COALESCE(i.codigo, m.codigo) AS codigo,\n            COALESCE(i.nome, m.nome) AS nome,\n            COALESCE(i.tipo_conta, m.tipo_conta) AS tipo_conta,\n            COALESCE(i.saldo_inicial,0) AS saldo_inicial,\n            COALESCE(m.movimentos,0) AS movimentos,\n            COALESCE(i.saldo_inicial,0) + COALESCE(m.movimentos,0) AS saldo_final\n          FROM inicial i\n          FULL JOIN movimentos m USING (codigo, nome, tipo_conta)\n        ),\n        classificados AS (\n          SELECT \n            f.codigo, f.nome, f.tipo_conta, f.saldo_inicial, f.movimentos, f.saldo_final,\n            CASE \n              WHEN f.codigo LIKE '1.1.%' THEN 'Ativo Circulante'\n              WHEN f.codigo LIKE '1.2.%' THEN 'Ativo Não Circulante'\n              WHEN f.codigo LIKE '2.1.%' THEN 'Passivo Circulante'\n              WHEN f.codigo LIKE '2.2.%' THEN 'Passivo Não Circulante'\n              WHEN f.codigo LIKE '3.%' THEN 'Patrimônio Líquido'\n              ELSE NULL\n            END AS grupo\n          FROM final f\n        )\n        SELECT * FROM classificados WHERE grupo IS NOT NULL AND saldo_final <> 0\n        ORDER BY codigo::text COLLATE "C"`;

      const rows = await runQuery<{ codigo: string; nome: string; tipo_conta: string; saldo_inicial: number; movimentos: number; saldo_final: number; grupo: string }>(bpSql, [from, to]);

      const normalized = rows.map(r => ({
        grupo: r.grupo,
        codigo: r.codigo,
        nome: r.nome,
        saldo_inicial: Number(r.saldo_inicial || 0),
        movimentos: Number(r.movimentos || 0),
        saldo_final: Number(r.saldo_final || 0),
      }));

      // Resultado do Período (4/5/6) igual ao módulo
      const resultadoSql = `
        SELECT COALESCE(SUM(
          CASE WHEN pc.tipo_conta IN ('Receita','Passivo','Patrimônio Líquido')
                 THEN (lcl.credito - lcl.debito)
               ELSE (lcl.debito - lcl.credito)
          END
        ),0) AS resultado
        FROM contabilidade.lancamentos_contabeis lc
        JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
        JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
        WHERE lc.data_lancamento BETWEEN $1::date AND $2::date
          AND pc.aceita_lancamento = TRUE
          AND (pc.codigo LIKE '4.%' OR pc.codigo LIKE '5.%' OR pc.codigo LIKE '6.%')`;
      const [resRow] = await runQuery<{ resultado: number }>(resultadoSql, [from, to]);
      const resultadoPeriodo = Number(resRow?.resultado || 0);

      // Agrupa em ativo/passivo/pl para UI de razonete
      const toLinha = (r: { codigo: string; nome: string; saldo_final: number }) => ({ conta: `${r.codigo} ${r.nome}`, valor: Number(r.saldo_final || 0) });
      const groupBy = (list: typeof rows, pred: (g: string) => boolean) => {
        const map: Record<string, { nome: string; linhas: { conta: string; valor: number }[] }> = {};
        for (const r of list) {
          if (!pred(r.grupo)) continue;
          const key = r.grupo;
          if (!map[key]) map[key] = { nome: key, linhas: [] };
          map[key].linhas.push(toLinha(r));
        }
        return Object.values(map);
      };
      const ativo = groupBy(rows, (g) => g.startsWith('Ativo'));
      const passivo = groupBy(rows, (g) => g.startsWith('Passivo'));
      const pl = groupBy(rows, (g) => g === 'Patrimônio Líquido');
      if (resultadoPeriodo !== 0) {
        pl.push({ nome: 'Resultado do Período', linhas: [{ conta: 'Resultado do Exercício', valor: resultadoPeriodo }] });
      }

      const title = `Balanço Patrimonial · ${from} a ${to}`;
      return {
        success: true,
        message: `Balanço gerado (${normalized.length} linhas)`,
        rows: normalized as Array<Record<string, unknown>>,
        count: normalized.length,
        title,
        // Dados estruturados (para UI rica)
        ativo,
        passivo,
        pl,
        // Debug
        sql_query: bpSql,
        sql_params: jsonParams([from, to]),
      };
    } catch (error) {
      console.error('ERRO gerarBalancoPatrimonial:', error);
      return {
        success: false,
        message: `Erro ao gerar Balanço Patrimonial: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        rows: [],
      };
    }
  }
});
