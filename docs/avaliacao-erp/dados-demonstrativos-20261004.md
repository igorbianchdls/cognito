# Dados demonstrativos do ERP — 04/10/2026

## Escopo

Carga autorizada para a empresa 1 do projeto Supabase `mtadnxqoqxzbdksktwdr`. O cenário representa uma empresa fictícia de serviços de tecnologia e venda de equipamentos.

- Histórico comercial de julho a setembro de 2026 e movimentos até 4 de outubro.
- Vencimentos futuros até dezembro; despesas futuras são previsões financeiras.
- Clientes e fornecedores fictícios, com e-mails `example.invalid` e indicação de demonstração. Documentos fiscais e telefones não são inventados.
- Vendas e compras com itens, parcelas previstas, títulos financeiros e referências de origem.
- Principal liquidado separado do caixa: juros, multa, desconto e tarifa são componentes do pagamento.
- Contratos mensais com versões efetivadas e ciclos de julho, agosto e setembro.
- Ordens de serviço concluídas e em atendimento, vinculadas às vendas correspondentes.
- Estoque inicial, compras recebidas e entregas de vendas em sequência cronológica, com custo médio e saldo por produto/local.
- Cobranças externas, emissão fiscal e envio de mensagens não fazem parte da carga.

## Proteções da aplicação

O executor exige o projeto esperado e a única empresa autorizada. Antes de limpar, bloqueia as tabelas ERP durante a transação e salva um backup de todos os seus registros, conferido por leitura e SHA-256.

A limpeza usa a lista explícita das tabelas comerciais, sem `CASCADE` e sem reiniciar as identidades. O schema `shared`, os registros do plugin e as configurações fiscais permanecem preservados. Nenhuma tabela, política ou função é removida ou alterada; os gatilhos de validação ficam ativos.

Toda a substituição acontece em uma transação. A validação ocorre em lotes para limitar a profundidade dos gatilhos financeiros. Falha antes do commit provoca rollback. A confirmação também exige que as configurações fiscais tenham permanecido iguais ao backup.

Os IDs são reservados pelas sequências reais e remapeados pelas chaves estrangeiras do catálogo. Isso evita reutilizar os IDs apagados e mantém válidos os vínculos de origem.

## Verificações

- Totais dos títulos iguais às parcelas.
- Principal pago correspondente aos pagamentos registrados; saldo não negativo.
- Parcelas previstas ligadas à venda ou compra correta, com valor e vencimento iguais.
- Estoque final correspondente à soma dos movimentos; histórico sem saldo físico negativo.
- Quantidades dos documentos de estoque iguais às recebidas e entregues nos itens comerciais.
- Pagamentos posteriores à emissão e até a data de referência; previsões sem pagamento.
- Ordens de serviço concluídas dentro do período.
- Saldo de caixa positivo e exemplos de parcelas parciais, vencidas e vencendo entre 5 e 11 de outubro.
- As próprias restrições do PostgreSQL conferem equações comerciais, fechamento dos documentos, isolamento dos vínculos e regras dos contratos.

A amostra local utiliza o catálogo atual, incluindo funções, restrições e gatilhos, em PGlite. Ela valida os cenários com volume menor. A carga completa é validada pelo PostgreSQL real antes do commit. O teste local com todos os registros esbarrou no limite de memória/tempo do ambiente em memória e não foi tratado como aprovado.

## Ferramentas

Executor: `scripts/erp/seed-realistic-demo.mjs`.

```powershell
node scripts/erp/audit-schema.mjs --output=demo-catalog-20261004.json
node scripts/erp/seed-realistic-demo.mjs --local-test --sample
```

A execução `--apply --tenant=1` substitui novamente todos os dados comerciais da empresa. Deve ser usada somente quando essa substituição for desejada e autorizada. O executor salva um novo backup em cada execução.

Depois da carga, as consultas podem ser conferidas pelo handler MCP real:

```powershell
node node_modules/tsx/dist/cli.mjs scripts/chatgptplugin-live-read-smoke.ts --demo
```

Esse teste executa HTTP local, autenticação de teste em memória e consultas nos repositórios reais, com papel `erp_runtime` no Supabase. Ele grava auditoria e contadores do plugin. Não comprova OAuth Clerk nem a conexão no ChatGPT. A opção `--demo` exige a carga completa de 150 vendas e 60 compras e acrescenta consultas de recebíveis, vendas, compras, estoque e resumo.

Backups e relatórios detalhados ficam em `.cache/erp-audit`, ignorado pelo Git. Eles não contêm credenciais de conexão.

## Resultado aplicado

A transação completa foi confirmada no Supabase. Backup dos 39 registros anteriores: `.cache/erp-audit/demo-backups/erp-before-1791085116006.json`, SHA-256 `38e70824cd572666a8ea10a0569be5e2b1edfa2ca21ef29a7c412c807b55cd36`. As configurações fiscais permaneceram iguais ao backup.

| Registro | Quantidade |
| --- | ---: |
| Clientes | 30 |
| Fornecedores | 15 |
| Produtos | 20 |
| Serviços | 10 |
| Vendas | 150 |
| Compras | 60 |
| Contas a receber | 142 |
| Parcelas a receber | 247 |
| Contas a pagar | 106 |
| Parcelas a pagar | 163 |
| Pagamentos e recebimentos | 198 |
| Contratos | 12 |
| Ordens de serviço | 24 |
| Movimentos de estoque | 169 |

As 11 verificações de integridade passaram na carga completa, além das restrições e gatilhos do PostgreSQL. As ordens de serviço em andamento mantêm o atendimento da venda correspondente pendente ou parcial.

Entre 5 e 11 de outubro, há 12 parcelas em aberto a pagar, somando R$ 17.545,60, e 12 parcelas a receber, somando R$ 30.236,31. Esses valores são exemplos para comparar com as consultas, excluindo parcelas pagas e canceladas.

Relatório da carga: `.cache/erp-audit/demo-result-20261004.json`.

## Consultas MCP após a carga

O teste `chatgptplugin-live-read-smoke.ts --demo` passou com **29 verificações e nenhuma falha**, usando o Supabase real. Foram executadas as ferramentas `meu_acesso`, `consultar_financeiro` (pagar e receber), `listar_vendas`, `obter_venda`, `listar_compras`, `obter_compra`, `consultar_estoque` e `resumo_erp`.

Foram conferidos as 163 parcelas a pagar, os filtros de status e vencimento, paginação, valores e saldos financeiros independentes, as quantidades de vendas/compras, detalhes dos documentos, estoque por produto/local e reconhecimento dos 30 clientes. Ausência de autenticação, empresa não autorizada, falta de permissão e período inválido foram recusados. Auditoria real registrou as chamadas.

O teste usa autenticação local em memória; a configuração OAuth do produto permaneceu intacta. A conexão efetiva no ChatGPT e o login Clerk seguem como uma etapa posterior. A compilação TypeScript específica do plugin também passou.

### Perguntas para experimentar no ChatGPT

- Quais contas tenho que pagar entre 5 e 11 de outubro de 2026? Mostre somente as que ainda têm saldo.
- Quais clientes têm parcelas vencidas e qual é o saldo de cada um?
- Mostre as vendas confirmadas e abra os detalhes de uma delas.
- Liste as compras recebidas e consulte os itens da primeira.
- Quais produtos estão abaixo do estoque mínimo?
- Qual é o resumo financeiro da empresa?
