# Plano de correções do ERP — 07/10/2026

Base: revisão de 07/10 (código) e [avaliação final de 06/10](avaliacao-final-20261006.md). Fora do escopo agora: nota fiscal, cobrança, integração bancária e funções novas (tabela de preços, comissões, limite de crédito, metas), que ficam no backlog ao final.

Regra geral: nenhuma alteração de dados comerciais existentes sem confirmação explícita; migrações aplicadas primeiro em banco local (PGlite) e depois no Supabase, em transação, com conferência antes e depois.

## Etapa 0 — Diagnóstico no Supabase (quando o acesso for liberado)

Somente leitura. Objetivo: medir o impacto real antes de corrigir.

1. **Datas gravadas com o dia seguinte:** comparar `criado_em` (timestamp) com `data_venda`, `data_compra`, `data_pagamento` e datas de estorno/recorrência. Contar registros criados entre 21h e 23h59 (horário de Brasília) cuja data é o dia seguinte e que não vieram de uma data informada pelo usuário.
2. **Fuso das empresas:** listar empresas, cidades/UF cadastradas e se alguma está fora de UTC-3.
3. **Volume e desempenho:** quantidade de registros por tabela e empresa; consultas mais lentas (`pg_stat_statements`, se disponível); conexões em uso.
4. **Estado das pendências:** existência do bucket `erp-anexos`, tabelas usadas pelo script de backup, migrações aplicadas versus repositório.
5. **Base para os relatórios:** conferir parcelas, pagamentos, renegociações e créditos para validar fluxo de caixa e aging contra os números atuais.

Saída: relatório em `docs/avaliacao-erp/diagnostico-supabase-<data>.md`, sem dados pessoais.

## Etapa 1 — Data comercial correta

**Problema:** vendas, compras, pagamentos, estornos, recorrências e telas usam `new Date().toISOString()` (UTC). Entre 21h e meia-noite gravam o dia seguinte. Estoque, automações e dashboards já usam `America/Fortaleza`.

1. Criar `src/products/erp/shared/businessDate.ts` com `businessDay(timeZone)`, `addDays`, `monthRange` e `dateText` únicos; substituir as cópias de `dateText`/`businessDay` (cerca de 8 arquivos).
2. Fuso por empresa: migração com `shared.empresas.fuso_horario text NOT NULL DEFAULT 'America/Sao_Paulo'` validado contra a lista IANA (decisão de 07/10); os usos fixos de `America/Fortaleza` passam a ler o fuso da empresa; incluir o fuso na sessão do ERP (`erpAccess`) e no principal do plugin.
3. Servidor: trocar os padrões de data em `erpRepository.ts` (linhas ~589, 686, 1183, 2643, 3185, 3319, 3436, 3714, 3939, 4277, 4430), `erpProfessionalRepository.ts`, `erpManagementRepository.ts`, `erpStockRepository.ts`, `erpSalesContracts.ts`, `erpAutomationSchedule.ts` e dashboards (`AT TIME ZONE` com o fuso da empresa).
4. Telas: `today()` e períodos de mês em `financeiro/*`, `vendas/*`, `compras/*`, `relatorios/*` passam a usar o fuso recebido da sessão.
5. Dados já gravados: só corrigir após o diagnóstico da etapa 0 e confirmação explícita; preparar script de correção com relatório prévio do que mudaria.

Testes: relógio simulado às 23h30 de Brasília (02h30 UTC do dia seguinte) para venda, compra, baixa, estorno, recorrência e estoque; empresa em `America/Manaus`; virada de mês e de ano.

## Etapa 2 — Relatórios financeiros de volta

Recriar como consultas no código (sem views), usando a composição de saldo que já existe (`financialCompositionSql`), com paginação e limites de período iguais aos atuais.

| Relatório | Conteúdo |
| --- | --- |
| `fluxo-de-caixa` | Realizado (pagamentos e recebimentos por dia/mês) e projetado (parcelas em aberto por vencimento), saldo inicial das contas financeiras e saldo acumulado |
| `aging-receber` / `aging-pagar` | Saldos em aberto por faixa de atraso (a vencer, 1–30, 31–60, 61–90, >90 dias), por cliente/fornecedor |
| `dre-competencia` | Receitas e despesas por data de competência e categoria |

1. Remover os IDs de `ERP_RETIRED_REPORTS` e incluí-los em `ERP_AVAILABLE_REPORTS`; manter 410 apenas para `dre`, `fluxo-diario` e `fluxo-mensal` (substituídos por parâmetros de agrupamento).
2. API e telas de relatórios; cards de análise no plugin.
3. Plugin: incluir os tipos em `consultar_relatorio` e atualizar a skill `usar-erp` (perguntas como "vou ter caixa no fim do mês?" e "quem está me devendo?").

Testes: totais conferidos contra soma independente no banco local e, na etapa 0/6, contra o Supabase; parcelas parciais, renegociadas, com crédito e estornadas.

## Etapa 3 — Acentuação e textos

Cerca de 550 textos sem acento em menu, telas e mensagens de erro do ERP; as mensagens de erro chegam ao chat.

1. Menu (`shared/navigation.ts`), títulos, rótulos e mensagens de `ErpDomainError` em `server/*`.
2. Substituição por mensagem completa (sem trocar identificadores, chaves ou valores de enum).
3. Conferir testes que comparam texto.

## Etapa 4 — Desempenho do acesso ao banco

1. `withTransaction`: aplicar `SET LOCAL ROLE erp_runtime` e o contexto da empresa uma vez por transação. Consultas a `shared`/`plugin` dentro dela passam a usar funções específicas ou ficam antes/depois do bloco restrito.
2. `runQuery` fora de transação: agrupar contexto e consulta, reduzindo idas ao banco de 5 para 2–3.
3. Revisar o tamanho do pool (`max: 2`) com base na medição da etapa 0 e no modo do pooler do Supabase.

Testes: os testes de isolamento atuais continuam obrigatórios (consulta de outra empresa recusada, RLS ativo); medir idas ao banco e tempo de uma confirmação de venda antes e depois.

## Etapa 5 — Pendências da avaliação de 06/10

1. **Dependências:** atualizar `braces`, `source-map-js` e `postcss-selector-parser` (overrides se necessário) e repetir build e testes.
2. **Backup:** corrigir `scripts/erp/backup-restore-proof.mjs` (`shared.users` → `shared.usuarios`), incluir tabelas fiscais e `plugin`, e fazer uma restauração isolada nova.
3. **Anexos:** criar o bucket privado `erp-anexos` e provar acesso autorizado, recusa de outra empresa e expiração dos links.
4. **Concorrência:** baixa, reserva/atendimento e recebimento simultâneos com duas conexões PostgreSQL em banco de teste exclusivo.
5. **Edição de contato pelo chat:** e-mail, telefone e endereço de clientes e fornecedores em `editar_cadastro`, com validação e prévia.

## Etapa 6 — Manutenção (junto com as etapas acima)

- Ao tocar baixa e estorno, unificar pagar/receber em uma implementação parametrizada.
- Dividir `erpRepository.ts` (4.585 linhas) por área: vendas, compras, financeiro, cadastros, recorrências — sem mudar contratos públicos.
- Fuso nunca fixo no código: sempre o da empresa.

## Ordem e dependências

| Ordem | Etapa | Depende do Supabase |
| --- | --- | --- |
| 1 | Etapa 0 — diagnóstico | Sim |
| 2 | Etapa 1 — data comercial | Código não; migração e correção de dados, sim |
| 3 | Etapa 2 — relatórios | Validação final, sim |
| 4 | Etapa 3 — acentuação | Não |
| 5 | Etapa 4 — desempenho | Medição, sim |
| 6 | Etapa 5 — pendências | Bucket, backup e concorrência, sim |

Etapas 3 e partes de 1, 2 e 4 podem começar antes do acesso.

## Decisões em aberto

1. ~~Fuso padrão das empresas~~ — **decidido em 07/10: `America/Sao_Paulo`**.
2. Corrigir ou não datas já gravadas com o dia seguinte (depende do diagnóstico).
3. Escopo do fluxo de caixa (incluir ou não previsões, `tipo_lancamento = previsao`): **delegado ao Claude**, a definir na etapa 2 com base no diagnóstico dos dados.

## Backlog (depois)

Tabela de preços, comissão de vendedores, limite de crédito na confirmação de venda, metas; nota fiscal, cobrança e integração bancária.

## Andamento — 07/10/2026

| Etapa | Situação |
| --- | --- |
| 0 — Diagnóstico no Supabase | **Pendente** (aguarda acesso). |
| 1 — Data comercial | **Concluída no código.** `shared/businessDate.ts` e `server/erpBusinessDate.ts`; fuso no contexto do banco (`app.erp_time_zone`), na sessão do ERP, no principal do plugin, nas automações, nos dashboards e nas telas (`/api/erp/acesso` devolve `fuso_horario`). Migração `20261007120000_empresa_fuso_horario.sql` criada, **não aplicada**; a leitura é tolerante (padrão São Paulo até a coluna existir). Correção de dados antigos depende da etapa 0. |
| 2 — Relatórios | **Concluída.** `fluxo-de-caixa`, `aging-receber`, `aging-pagar` e `dre-competencia` em `server/erpFinancialReports.ts`, no menu, na tela e no chat (`consultar_relatorio`). Previsões a pagar entram no previsto do fluxo de caixa (decisão delegada). Validados no banco local contra somas independentes, com adiantamento, devolução e renegociação. |
| 3 — Acentuação | **Concluída.** 537 textos em 80 arquivos; identificadores, valores de enum e SQL preservados (auditoria específica). |
| 4 — Desempenho | **Concluída no código.** Contexto aplicado em uma única instrução e uma vez por transação. Medição real depende da etapa 0. |
| 5 — Pendências | E-mail e telefone editáveis pelo chat (contato principal); script de backup corrigido (`shared.usuarios`, sequências do `plugin`); migração do bucket privado `erp-anexos` criada, **não aplicada**. Dependências (sem `pnpm` e com pouco disco nesta máquina), prova de restauração e teste de concorrência dependem do ambiente. |
| 6 — Manutenção | Parcial: datas centralizadas; unificação pagar/receber e divisão de `erpRepository.ts` ficam para a próxima rodada. |

Pré-existente e fora destas mudanças: `stage6-static-smoke` falha na checagem da rota de download de históricos (mesma falha antes das alterações).
