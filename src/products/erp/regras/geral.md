# Regras gerais (GE)

Valem para todas as áreas do ERP. Quando uma regra de área depende de uma destas, ela cita o código (por exemplo "usa GE-01").

## Data e fuso

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| GE-01 | "Hoje" é sempre a data no fuso da empresa (padrão `America/Sao_Paulo`), nunca a data UTC do servidor. Vencimentos, competências, "vencido", "futuro" e relatórios usam essa data. | **`regras/geral.ts` → `hojeDaEmpresa()`** (fonte única). No servidor: `erpBusinessDate.ts` → `erpToday()` (pega o fuso do contexto) e `ERP_TODAY_SQL` (consultas). No banco: `erp.hoje()` (usada também pelo bloqueio de período do estoque desde a migração `20261125210000`). `shared/businessDate.ts` só repassa os nomes antigos. | — | ✅ `regras/geral.test.ts` · `scripts/erp/business-date-smoke.ts` · 🧪 |
| GE-02 | Datas de entrada são `AAAA-MM-DD` e precisam ser datas reais. | `erpFinanceRepository.ts` → `date()`; contratos em `shared/*Contracts.ts` | "… invalida." | ❌ |

## Valores

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| GE-10 | Valores em reais com 2 casas, arredondando meio centavo para cima; sem separador de milhar na entrada (aceita vírgula ou ponto decimal). | `shared/erpMoney.ts` → `scaledDecimal()`, `decimalText()` | "Informe o valor sem separador de milhar." / "Informe um valor numérico válido." | ❌ |
| GE-11 | Parcelas sempre somam exatamente o total do documento, centavo a centavo. | **`regras/geral.ts` → `validarParcelas()`**, usada por vendas (`erpSalesRepository.ts`), compras (`erpPurchasesRepository.ts`), título manual do chat (`erpCrudRepository.ts`), despesa da tela (`createManualPayableRecord()`) e já na prévia do chat (`mcpcore/domains/erp/schemas/actionContracts.ts` → `proposalPreview()`) | "A soma das parcelas precisa ser igual ao total {da venda / da compra / do título / da despesa}." | ✅ `regras/geral.test.ts` · 🧪 |
| GE-12 | De 1 a 48 parcelas por documento, números válidos e sem repetição. | **`regras/geral.ts` → `validarParcelas()`** (mesmos lugares de GE-11) | "A condição de pagamento aceita no máximo 48 parcelas." / "Existem parcelas com o mesmo número." | ✅ `regras/geral.test.ts` |

## Numeração

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| GE-20 | Documentos comerciais recebem número sequencial por empresa, tipo e ano: `VEN-2026-0154`, `ORC-`, `PED-`, `COM-`, `OS-`, `CTR-`, `INV-`, `TRF-`, `DEV-`. O número nunca se repete e não pula quando uma operação é desfeita (o contador é uma tabela, não uma sequência do banco). | banco: função `erp.proximo_numero()` sobre `erp.numeracoes`; chamada por `erpDocumentNumbers.ts` → `nextDocumentNumber()` | — | 🧪 a prévia que executa e desfaz não pulou número (VEN-0153 → VEN-0154) |
| GE-21 | O ID interno (ex.: venda 1158) é diferente do número comercial e pode pular; nunca mostrar o ID como se fosse o número. | — | — | — |

## Concorrência e repetição

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| GE-30 | Quem edita um documento precisa estar vendo a versão atual. Se outra pessoa salvou antes, a gravação é recusada e a tela oferece atualizar. | **`regras/geral.ts` → `conferirVersao()` / `versaoMudou()`** em vendas, compras e cadastros (`erpRepository.ts`). Outras áreas (OS, orçamento, contrato, título) ainda têm a checagem própria. | "{Esta venda / Esta compra / Este registro} mudou desde que você abriu (outra pessoa salvou antes). Atualize antes de continuar." (`VERSION_CONFLICT`, 409) | ✅ `regras/geral.test.ts` |
| GE-31 | Toda operação de escrita tem uma chave de idempotência: repetir a mesma chave devolve o resultado anterior, nunca grava duas vezes. Mesma chave com dados diferentes é recusada. | Repositórios (`chave_idempotencia` em cada tabela); chat: `actions/draftRepository.ts` → `prepareDraft()` | "Esta identificação já foi usada em outra baixa." / "Esta chave já foi usada para outro rascunho." | 🧪 chave repetida com dados diferentes → `IDEMPOTENCY_CONFLICT`; reconfirmar rascunho executado devolveu o mesmo registro |
| GE-32 | Operações concorrentes no mesmo registro esperam ou falham com aviso; não se sobrescrevem. | `shared/erpErrors.ts` → `normalizeErpError()` (traduz bloqueio/serialização do banco) | "Outra operação está em andamento. Tente novamente mantendo a mesma solicitação." | ❌ |

## Período fechado

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| GE-40 | Nada pode ser criado, alterado ou excluído com data dentro de um período fechado do módulo (ou fechado para "todos"), até ele ser reaberto. | `erpPeriodRepository.ts` → `assertErpPeriodOpen()`; banco: triggers `validar_periodo_comercial_financeiro` e funções `exigir_periodos_abertos`, `validar_periodo_operacional_aberto` | "O período esta fechado para o módulo …" (`PERIOD_CLOSED`) | ❌ |

## Empresa e acesso

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| GE-50 | Cada consulta e gravação é sempre de uma única empresa; uma empresa nunca vê nem altera dados de outra. | banco: RLS em todas as tabelas `erp.*` (373 políticas); `src/lib/postgres.ts` → `assertErpTenantScopedQuery()` exige `empresa_id = $1` em toda consulta | "Você não tem acesso a esta empresa." | 🧪 empresa 999 → `ACCESS_DENIED` |
| GE-51 | Um registro não pode mudar de empresa. | banco: trigger `validar_periodo_comercial_financeiro` | "Nao e permitido mudar a empresa do registro" | ❌ |
| GE-52 | O que cada pessoa pode fazer vem do perfil dela na empresa; dono e administrador podem tudo; leitor só consulta. Detalhes em `permissoes.md`. | banco: `shared.has_erp_capability()`; servidor: `erpAccess.ts` | "Seu perfil não permite …" | 🧪 |

## Chat (ChatGPT/Claude)

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| GE-60 | Toda escrita pelo chat tem duas etapas: prévia e confirmação explícita. Só "saved" com `registro_id` significa que foi gravado. | `mcpcore/domains/erp/actions/draftRepository.ts`, `approvalRepository.ts` | — | 🧪 |
| GE-61 | A prévia executa a operação real numa transação que é sempre desfeita, então ela recusa exatamente o que a confirmação recusaria (saldo, crédito, estoque, período, dados fiscais). Arquivos (PDF) não são enviados na prévia. | `actions/execution.ts` → `dryRunProposal()`; `src/lib/dryRun.ts` | A mesma da regra que recusou | 🧪 baixa acima do saldo e limite de crédito recusados já na prévia |
| GE-62 | Se o registro mudar entre a prévia e a confirmação, a confirmação é recusada e é preciso nova prévia. | `actions/approvalRepository.ts` → `decideDraft()` (compara o hash do registro) | "O registro mudou. Prepare uma nova proposta para revisar os dados atuais." | 🧪 (bug corrigido em 2026-11-25: editar venda dava esse erro sempre) |
| GE-63 | Mensagens das regras do ERP chegam ao chat como estão, com o código da regra; só falhas técnicas viram "ERP indisponível". | `mcpcore/domains/erp/executeTool.ts` → `publicError()` | — | 🧪 |
