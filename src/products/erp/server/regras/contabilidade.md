# Contabilidade (CO)

Categorias financeiras, plano de contas, DRE, fechamento de períodos, orçamento anual e metas.
Caminhos relativos a `src/products/erp/server/`. Legenda no [README](README.md).

## Categorias financeiras e DRE

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CO-01 | Categoria financeira é de **receita** ou de **despesa**; subcategoria tem o mesmo tipo da principal; no máximo 2 níveis; categoria não é pai dela mesma. | `erpReceivablesPayablesRepository.ts` → `financialCategoryClassification()` | "Categoria financeira é de receita ou de despesa." / "A subcategoria precisa ser do mesmo tipo da categoria-pai." / "Categorias têm no máximo 2 níveis …" | 🧪 criar categoria |
| CO-02 | Lançamentos só usam categoria **sem subcategorias ativas** (a "folha"), compatível com o lado (receita para receber, despesa para pagar). | `FINANCIAL_CATEGORY_LEAF_SQL`; `erpCrudRepository.ts` → `validateFinancialReferences()` | "Escolha uma categoria financeira compatível desta empresa (sem subcategorias)." | 🧪 |
| CO-03 | Cada categoria entra num grupo da DRE (código 1 a 9) ou fica **fora da DRE** (ex.: compra de mercadoria para revenda, que vira custo pelo CMV). O grupo vem da categoria, nunca do lançamento. | `financialCategoryClassification()` | "Grupo da DRE não encontrado." | 🧪 categoria fora da DRE |
| CO-04 | Código de categoria é único na empresa. | banco: índice único `categorias (empresa_id, codigo)` | erro de duplicidade | ❌ |
| CO-05 | DRE por competência: receitas e despesas pela data de competência; CMV reconhecido na competência da venda. DRE de caixa: pela data do pagamento. Transferências e adiantamentos ficam fora. | `erpDreReport.ts`; `erpFinancialReports.ts` | — | 🧪 relatório DRE |

## Plano de contas

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CO-10 | Contas contábeis seguem as classificações de `shared/accountingContracts.ts`; vínculos apontam para conta válida da empresa. | `erpAccountingRepository.ts` → `accountingLink()` | "Selecione uma conta contábil válida." | ❌ |

## Fechamento de período

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CO-20 | Fechamento é por módulo (ou "todos") e intervalo de datas; não pode sobrepor outro fechamento ativo. | `erpPeriodRepository.ts` → `closeErpPeriod()` | "Já existe um fechamento ativo que alcanca esse período." | ❌ |
| CO-21 | Período fechado bloqueia qualquer alteração com data dentro dele (GE-40). | `assertErpPeriodOpen()`; banco | "O período esta fechado para o módulo X." | ❌ |
| CO-22 | Reabrir exige motivo e fica registrado; só reabre fechamento ativo. | `erpPeriodRepository.ts` → `reopenErpPeriod()` | "Fechamento ativo não encontrado." | ❌ |
| CO-23 | Fechar com transações de extrato não conciliadas no período gera aviso, não bloqueio. | `closeErpPeriod()` | aviso | ❌ |

## Orçamento anual e metas

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| CO-30 | Orçamento anual por categoria e mês; valores positivos (o tipo da categoria define se soma ou subtrai); versão antiga é recusada. | `erpBudget.ts` → `saveBudget()` | "Valores do orçamento são positivos …" / "O orçamento foi alterado por outra pessoa. …" | ❌ |
| CO-31 | Meta de vendas por vendedor e mês (AAAA-MM), maior que zero. | `erpBudget.ts` → `saveSalesGoal()` | "Informe o mês da meta (AAAA-MM)." / "A meta deve ser maior que zero." | ❌ |
| CO-32 | "Orçado × realizado" usa o ano do início e acumula até o mês do fim. | `erpFinancialReports.ts` | — | ❌ |
