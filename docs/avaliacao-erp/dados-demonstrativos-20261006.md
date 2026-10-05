# Dados demonstrativos para Igor Bianch — 06/10/2026

## Empresa e usuário

O cenário usa o usuário real Igor Bianch e sua organização existente no Clerk, **Igor Bianch Workspace**. No Supabase, os vínculos são `shared.usuarios.id = 3` e `shared.empresas.id = 2`. A associação ativa em `shared.usuarios_empresas` tem papel `owner` e perfil `administrador`.

O usuário não é duplicado no Clerk. A organização mantém seu administrador, com o papel de proprietário da aplicação nos metadados. O vínculo da empresa foi conferido no Clerk depois do processamento da operação de sincronização.

Os clientes, fornecedores, vendedores e operações são fictícios. E-mails usam `example.invalid`; não há números de documentos fiscais, contatos reais ou credenciais bancárias inventados.

## Cenário

Empresa de serviços de tecnologia e venda de equipamentos. Histórico comercial de **01/07/2026 a 06/10/2026**, com vencimentos financeiros até **31/12/2026**. A referência é 6 de outubro, para as gravações previstas pelo usuário.

| Registro | Quantidade |
| --- | ---: |
| Clientes | 30 |
| Fornecedores | 15 |
| Vendedores | 3 |
| Produtos | 20 |
| Serviços | 10 |
| Vendas | 150 |
| Orçamentos, separados das vendas | 12 |
| Compras | 60 |
| Contas a receber | 142 |
| Parcelas a receber | 247 |
| Contas a pagar | 106 |
| Parcelas a pagar | 163 |
| Contratos de serviços | 12 |
| Ordens de serviço | 24 |
| Contas financeiras demonstrativas | 3 |
| Locais de estoque | 2 |
| Transferências de estoque | 3 |
| Transferências financeiras | 3 |

Os contratos incluem ciclos de julho, agosto, setembro e outubro, com a próxima geração programada para novembro. As despesas mensais de novembro e dezembro ficam como previsões, sem pagamentos.

Há operações pagas, parciais, vencidas, abertas e canceladas. Vendas em rascunho não geram contas a receber; compras em rascunho não geram contas a pagar. Os orçamentos aprovados apontam para suas vendas correspondentes, sem duplicar recebíveis. As vendas canceladas e compras canceladas mantêm seus títulos cancelados como histórico.

Compras recebidas ou parcialmente recebidas movimentam somente a quantidade recebida. Vendas atendidas ou parcialmente atendidas movimentam somente a quantidade entregue. As reservas correspondem às quantidades ainda não atendidas. Os dois locais têm saldos por produto, com histórico de entradas, saídas e transferências e exemplos de estoque abaixo do mínimo.

Os três saldos financeiros são demonstrativos; não representam conexão com uma instituição bancária. Juros, multas, descontos e tarifas são componentes dos pagamentos, separados do principal liquidado.

## Execução e preservação

Executores:

- `scripts/erp/provision-igor-demo.ts`: confere a identidade existente no Clerk, cria os vínculos no Supabase, registra a operação de sincronização e verifica os metadados resultantes.
- `scripts/erp/seed-realistic-demo.mjs`: monta o cenário determinístico, reserva IDs reais, remapeia os vínculos e verifica as regras do banco.

O gerador exige a empresa explícita e o relatório de identidade conferido. A primeira carga exige que a empresa esteja vazia nas tabelas ERP. Ele **não apaga dados nem reinicia as sequências**. Uma repetição sobre o cenário já carregado somente verifica os dados.

Antes de inserir, salva um backup privado das 83 tabelas ERP e confere sua gravação. As inserções ficam em uma transação, com as restrições e os gatilhos ativos. Uma falha antes da confirmação reverte a carga. A comparação final exige que os registros de todas as outras empresas permaneçam iguais ao backup.

Os backups de identidade e dados ficam em `credentials/backups/erp-demo/`, ignorado pelo Git. Relatórios de identidade, validação, carga e publicação ficam em `.cache/erp-demo/`.

```powershell
# Inspeção da quantidade gerada, sem escrever no banco:
node scripts/erp/seed-realistic-demo.mjs --plan --empresa=2

# Validação completa no PostgreSQL real, com reversão ao final:
node scripts/erp/seed-realistic-demo.mjs --dry-run --empresa=2

# Primeira carga, somente para a empresa conferida:
node scripts/erp/seed-realistic-demo.mjs --apply --empresa=2

# Conferência posterior, sem alterar os dados comerciais:
node scripts/erp/seed-realistic-demo.mjs --verify --empresa=2

# Handler MCP real, repositórios reais e Supabase:
node node_modules/tsx/dist/cli.mjs scripts/chatgptplugin-live-read-smoke.ts --all-read --empresa=2
```

## Validação

A carga confere totais dos títulos e parcelas, pagamentos e saldos, vínculo das parcelas previstas com documentos comerciais, datas de pagamentos e ordens de serviço, quantidade recebida/entregue, histórico e saldo do estoque, reservas, pares de transferências, orçamentos sem financeiro e limite de vencimentos. Também exige exemplos a pagar e receber vencidos, parcialmente pagos, vencendo no dia 6 e na semana de 7 a 13 de outubro.

O teste de leitura chama as 26 ferramentas de consulta via HTTP local, usando o handler MCP e os repositórios reais com o papel `erp_runtime` no Supabase. A identidade e as permissões são carregadas pela função real de resolução do usuário Clerk. Ele confere isolamento entre empresas, filtros, paginação, detalhes, relatórios, indicadores e preservação dos registros comerciais; auditoria e limites do plugin são reais.

A autenticação HTTP desse teste usa tokens temporários apenas no processo local. Ele não comprova o login OAuth dentro do ChatGPT. A entrega real de um evento do webhook do Clerk também é uma verificação separada.

Os status vencidos são calculados pela data da consulta. A referência do relatório do cenário é 6 de outubro; se a consulta for feita no dia 5, uma parcela vencendo no próprio dia 5 ainda não estará vencida.

## Exemplos para a gravação

- Mostre minhas contas a pagar que vencem em 6 de outubro de 2026 e ainda têm saldo.
- Quanto preciso pagar entre 7 e 13 de outubro de 2026? Mostre as parcelas e o total em aberto.
- Quais clientes têm contas a receber vencidas? Quanto falta receber de cada um?
- Mostre uma venda com seus itens, parcelas e atendimento.
- Liste os orçamentos e as vendas separadamente.
- Liste as compras parcialmente recebidas e mostre o que ainda falta chegar.
- Quais produtos estão abaixo do estoque mínimo?
- Mostre os indicadores de vendas, compras e financeiro de setembro de 2026.

## Resultado da carga

A carga foi confirmada no Supabase para a empresa 2. A validação com reversão passou antes da gravação, e a conferência posterior ao commit encontrou as mesmas quantidades e valores. As **16 verificações de integridade** passaram, além das restrições e dos gatilhos do PostgreSQL.

Os 4.071 registros ERP da empresa de testes anterior foram preservados, com comparação do conteúdo das 83 tabelas. Nenhum dado comercial dessa empresa foi excluído ou substituído.

Foram gravados 195 pagamentos e recebimentos, 153 movimentos de estoque, 9 reservas ativas e 40 saldos de produto/local. Os saldos demonstrativos das contas são R$ 146.718,41 na operacional, R$ 27.000,00 na reserva e R$ 2.000,00 no caixa.

Valores de referência, considerando somente parcelas ativas com saldo:

| Vencimento | A pagar | Saldo a pagar | A receber | Saldo a receber |
| --- | ---: | ---: | ---: | ---: |
| 06/10/2026 | 4 parcelas | R$ 10.447,98 | 2 parcelas | R$ 1.354,48 |
| 07 a 13/10/2026 | 10 parcelas | R$ 13.552,12 | 25 parcelas | R$ 30.413,46 |
| Antes de 06/10/2026 | 18 parcelas | R$ 34.461,67 | 31 parcelas | R$ 45.420,81 |

Relatórios privados:

- Identidade: `.cache/erp-demo/identity.json`.
- Validação prévia: `.cache/erp-demo/dry-run.json`.
- Carga confirmada: `.cache/erp-demo/result.json`.
- Conferência posterior: `.cache/erp-demo/verification.json`.
- Backup ERP: `credentials/backups/erp-demo/erp-before-1791227481935.json`.
- SHA-256 do backup: `72944aedfe5c42ce446fd5f17da827a7816ed619b4caf61c8573504f09414ac2`.

As consultas foram ajustadas para separar orçamentos das listas de vendas e incluir compras parcialmente recebidas nas análises e nos relatórios. A ferramenta `listar_compras` e o card de tabela aceitam o filtro `parcialmente_recebida`, com o rótulo “Parcialmente recebida”. A compilação no Vercel passou e a versão foi publicada em `cognito-seven.vercel.app`, com o destino do domínio conferido. O documento de descoberta do MCP respondeu HTTP 200, e uma chamada sem autenticação foi recusada com HTTP 401.

## Resultado das consultas MCP

A rodada final passou com **105 verificações e nenhuma falha**, cobrindo **todas as 26 ferramentas de leitura**, pelo handler real com o Supabase real. Foram conferidos as 163 parcelas a pagar, filtros, paginação, valores, saldos, documentos e itens, os 12 orçamentos, compras parcialmente recebidas, oito tipos de relatório e os indicadores de período.

O teste também confirmou a resolução da conta Clerk para a empresa 2 e suas permissões, o bloqueio de acesso à empresa CLI existente e o isolamento no banco com o papel `erp_runtime`. O conteúdo das 19 tabelas comerciais observadas permaneceu igual durante as consultas, assim como os rascunhos e preferências da conexão de teste.

Os cards de tabela, detalhes, análise e seleção foram consultados com dados reais. A tabela de compras foi conferida com o novo filtro parcial. Nos cards de revisão e resultado, foi verificada a recusa `NOT_FOUND` para rascunhos inexistentes; a nova conta não tem propostas pendentes criadas por esse teste. A rodada não chamou as três ferramentas de escrita nem criou operações comerciais adicionais.

Relatório final: `.cache/erp-demo/mcp-all-read.json`. A primeira rodada identificou a ausência do filtro parcial no catálogo e foi preservada em `.cache/erp-demo/mcp-before-partial-filter-fix.json`; o ajuste foi aplicado e a rodada completa repetida com sucesso.

A compilação TypeScript do plugin e a análise estática dos arquivos de aplicação alterados passaram. A publicação final é `dpl_CsErz1bTExCYCvtv75VTgdd8QAMz`, com digest de código `56b9be7687d8e2302d866f0dd877ccd97277805793411cea7e9bd3131aac6a8f` e o domínio público conferido. OAuth dentro do ChatGPT continua como uma etapa posterior, conforme combinado.
