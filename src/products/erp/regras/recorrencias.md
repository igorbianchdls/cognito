# Recorrências (RC)

Recorrências financeiras (a receber e a pagar) e de compras: o calendário das ocorrências e quando uma ocorrência pode ser gerada.
Contratos de venda têm calendário próprio de ciclos (`contratos.md`, CT-12).

| # | Regra | Onde | Mensagem | Teste |
|---|---|---|---|---|
| RC-01 | Calendário: cada ocorrência cai em início + n × intervalo (dia, semana, mês, ano). Mês e ano preservam o dia do início, ajustando ao último dia do mês quando ele não existe (31/01 → 28/02 → 31/03). Uma competência fora do calendário é recusada. | **`regras/recorrencias.ts` → `deslocarData()`, `indiceDaOcorrencia()`, `validarCalendario()`**; `erpRepositoryCore.ts` → `shiftDate()` e `recurrenceOccurrenceIndex()` chamam essas funções (antes o banco refazia em SQL, BD-44) | "Próxima ocorrência fora do calendário da recorrência." | ✅ `regras/recorrencias.test.ts` (inclui fim de mês e ano bissexto) |
| RC-02 | Só recorrência ativa (não pausada nem encerrada) gera; a competência fica entre o início e o término por data; não passa da quantidade de ocorrências. | **`regras/recorrencias.ts` → `validarOcorrencia()`**, via `processErpFinancialRecurrences()` e `processPurchaseRecurrences()` (antes no banco, BD-44) | "Recorrência pausada ou encerrada não gera novas ocorrências." / "Competência fora do período da recorrência." / "A recorrência já gerou todas as ocorrências previstas." | ✅ `regras/recorrencias.test.ts` |
| RC-03 | Garantias no banco: a ocorrência não se repete nem é apagada; recorrência e competência da ocorrência não mudam; a compra gerada é do fornecedor da compra modelo; o término da recorrência é coerente; encerrada não muda. | banco: `validar_origem_recorrencia`, `validar_geracao_compra`, `validar_recorrencia_estrutura` (etapa 8, mensagens reescritas) | "Esta ocorrência da recorrência já foi gerada." / "O término da recorrência não confere…" | — |
