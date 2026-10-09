# Teste do Otto ERP no ChatGPT — 09/10/2026

## Resultado

A conexão OAuth real funcionou, as consultas financeiras bateram com o Supabase e a criação de um cliente fictício funcionou após confirmação. O teste encontrou dois problemas: os cards personalizados não abriram no ChatGPT e um cliente solicitado como pessoa física foi salvo como pessoa jurídica. Não foi uma aprovação das 50 ferramentas.

## Testes pelo ChatGPT

Conversa: https://chatgpt.com/c/6ac8dbad-0170-83e9-a0bb-6e41c38e35d9

Empresa 2, usuário local 3, vínculo e permissões reais resolvidos pelo Clerk. O endpoint continuou exigindo o token OAuth e a audiência do recurso; nenhuma proteção foi desativada.

| Ferramenta | Resultado observado |
| --- | --- |
| `meu_acesso` | Identidade e empresa retornadas, auditoria `succeeded`. |
| `consultar_financeiro` | Contas a pagar e receber de outubro; totais conferidos diretamente no banco. |
| `listar_vendas`, `listar_compras` | Listagens e totais retornados. |
| `consultar_estoque` | Quantidades físicas, reservadas e disponíveis retornadas. |
| `analisar_periodo` | Indicadores mensais de vendas e compras retornados. |
| `criar_cadastro` | Prévia sem criar o registro; após confirmação explícita na conversa, cliente 260 salvo. |
| `obter_cadastro` | Cliente 260 localizado; leitura revelou a divergência do tipo de pessoa. |
| `editar_cadastro` | Prévia gerada; execução pelo navegador não concluída porque a página travou. |
| `abrir_painel`, `ler_configuracoes` | Execução bem-sucedida na configuração inicial do app; painel não abriu. |

O ChatGPT mostrou os resultados em sua resposta, mas os recursos personalizados exibiram “Não foi possível abrir”. A resposta e os botões gerados pelo ChatGPT não comprovam que os cards do ERP funcionaram.

### Conferência financeira

Período de vencimento: 01/10/2026 a 31/10/2026; referência de atraso: 09/10/2026.

| Consulta | Parcelas | Valor original | Saldo pendente | Saldo vencido |
| --- | ---: | ---: | ---: | ---: |
| Pagar | 43 | R$ 97.714,75 | R$ 81.119,78 | R$ 13.300,78 |
| Receber | 74 | R$ 99.167,96 | R$ 87.414,68 | R$ 13.278,97 |

Os três totais de cada consulta coincidiram com uma agregação direta das parcelas, pagamentos válidos, créditos aplicados e renegociações no Supabase. Permaneceram iguais após o teste de cadastro.

## Continuação direta no núcleo do ERP

Depois da falha do navegador, os testes restantes usaram `executeTool` diretamente, com Supabase real, vínculo/permissões carregados do usuário e contexto restrito de banco do ERP. Esta etapa não é um teste do transporte OAuth ou da UI do ChatGPT.

Foram **25 verificações: 24 chamadas bem-sucedidas e 1 recusa esperada** por ausência de `erp:write`.

- Todas as 18 ferramentas de consulta do catálogo responderam: `meu_acesso`, `resumo_erp`, `buscar_cadastros`, `obter_cadastro`, `listar_vendas`, `obter_venda`, `listar_compras`, `obter_compra`, `listar_notas_servico`, `obter_nota_servico`, `consultar_financeiro`, `obter_titulo_financeiro`, `obter_parcela_financeira`, `listar_anexos`, `listar_pagamentos`, `consultar_estoque`, `analisar_periodo`, `consultar_relatorio`.
- `abrir_painel` retornou os dados; renderização não verificada nesta etapa.
- A execução de `editar_cadastro` atualizou apenas o nome do cliente fictício 260.
- Repetir a confirmação devolveu o mesmo registro e não incrementou a versão novamente.
- Uma tentativa de criar cadastro usando apenas `erp:read` retornou `INSUFFICIENT_SCOPE`, sem criar cadastro ou prévia.
- `excluir_cadastro` produziu prévia sem exclusão; após execução, somente o cliente fictício foi excluído logicamente. A busca posterior retornou zero resultados.

Estado final do cliente 260: inativo, `excluido_em` preenchido, versão 3. O registro foi mantido para auditoria, sem exclusão física. Nenhuma venda, compra, pagamento, cobrança ou nota fiscal foi criada neste teste.

## Problemas confirmados e pendências

1. **Tipo de pessoa incorreto — corrigido e publicado às 13:12 UTC em 09/10/2026.** Na coleta inicial, o contrato do MCP enviava `fisica`/`juridica`, mas `normalizePersonType`, em `src/products/erp/server/erpRepository.ts`, aceitava apenas `PF`/`PJ` e usava `juridica` como fallback. A proposta do cliente fictício continha `fisica`, enquanto o banco gravou `juridica`. A correção e seus testes estão descritos ao final deste relatório.
2. **Cards e painel não abriram no ChatGPT.** Falha repetida em acesso, financeiro, estoque, indicadores e revisão. A causa não foi determinada. O navegador também registrou falha ao carregar um módulo do próprio ChatGPT e posteriormente travou; isso não comprova que essa seja a causa dos cards.
3. **Cobertura de escrita parcial.** A primeira rodada cobriu cadastro; a ampliação abaixo também cobriu orçamento, cotação, títulos manuais e NFS-e simulada. Confirmação comercial, entrega, devolução, baixa/estorno de pagamentos e os demais tipos de cadastro ainda não foram executados nesta rodada.
4. **UI, formulários e documentos pendentes.** Não foram validados os botões dos cards personalizados, formulários nativos, paginação em tela cheia, downloads dos anexos ou abertura do PDF fiscal pelo ChatGPT.

## Evidências locais

Artefatos ignorados pelo Git em `.cache/chatgptplugin/`:

- `live-db-after-create.json`: prova da criação do registro 260 antes da limpeza.
- `live-db-check.json`: auditoria, conferência financeira e estado após a limpeza.
- `core-live-test.json`: resultados e IDs de execução dos 25 testes diretos.
- `chatgpt-live-test.json`: resumo consolidado dos canais e pendências.

Os artefatos não contêm tokens OAuth nem credenciais. Nenhuma correção de código ou novo deploy foi realizada nesta etapa de testes.

## Ampliação dos testes — 09/10/2026

Conversa: https://chatgpt.com/c/6ac8df87-cee4-83e8-83c9-174faa6bb096

### Novas consultas realizadas no ChatGPT

Além das ferramentas já cobertas, passaram oito consultas na conversa real: `resumo_erp`, `consultar_relatorio` (fluxo de caixa de outubro), `listar_pagamentos`, `buscar_cadastros` (clientes e serviços), `obter_venda`, `obter_compra`, `listar_notas_servico` e `obter_nota_servico`.

Os resultados apareceram como texto/tabelas do ChatGPT. Os cards personalizados continuaram mostrando “Não foi possível abrir”. A página travou novamente ao solicitar prévias de orçamento e compra. A auditoria confirmou que `criar_venda` e `criar_compra` geraram duas prévias pendentes, sem salvar documentos comerciais. Ambas foram canceladas pelo serviço de aprovação na limpeza, mantendo o vínculo do usuário, empresa e cliente OAuth originais.

### Escritas verificadas diretamente no núcleo

Continuação com `executeTool`, usuário 3, empresa 2, Supabase real e cliente de teste separado `mcp-more-tools-20261009-B8D4`. Esta etapa não valida o transporte OAuth, os formulários ou os cards do ChatGPT.

Foram **59 chamadas bem-sucedidas**, incluindo prévias, execuções, leituras e limpeza. Dezesseis ferramentas de escrita foram exercitadas:

| Fluxo | Ferramentas | Resultado conferido |
| --- | --- | --- |
| Orçamento | `criar_venda`, `editar_venda`, `excluir_venda` | Registro 813 criado por R$ 10,00, atualizado para duas unidades/R$ 20,00 e excluído logicamente. |
| Cotação | `criar_compra`, `editar_compra`, `excluir_compra` | Registro 310 criado por R$ 10,00, atualizado para R$ 20,00 e excluído logicamente. |
| Contas a pagar/receber | `criar_titulo`, `editar_titulo`, `efetivar_previsao`, `excluir_titulo` | Títulos 537 e 719 criados como previsão, atualizados para R$ 20,00, efetivados e excluídos logicamente, sem registrar pagamentos. |
| NFS-e em rascunho | `criar_nota_servico`, `editar_nota_servico`, `excluir_nota_servico` | Nota 132 atualizada para R$ 20,00, ISS de R$ 1,00, e excluída logicamente. |
| Ciclo fiscal simulado | `emitir_nota_servico`, `consultar_nota_servico`, `cancelar_nota_servico` | Nota 133: rascunho → aguardando retorno (`demora`) → emitida → cancelada. Provedor `simulador_local`, sem vínculo com venda, sem retenções e sem envio externo. |

A nota **133 permanece cancelada**, marcada `TESTE TOOLS 09-10-2026 B8D4 CICLO SIMULADO`, para preservar a auditoria fiscal. As duas prévias da conversa estão canceladas e os cinco registros de CRUD estão arquivados. Nenhum cadastro existente foi editado. A comparação dos registros anteriores nas tabelas comerciais, financeiras, entidades, serviços e notas verificadas não encontrou diferenças após o CRUD.

O DANFSe da nota 133 respondeu HTTP 200, com assinatura `%PDF-` e 9.188 bytes; o XML respondeu HTTP 200, com 1.660 caracteres. São verificações de download/formato, não uma inspeção visual do PDF nem validação do XML contra esquema oficial nesta rodada. Os links foram obtidos pela ferramenta; abertura pelo ChatGPT não foi validada.

Os totais financeiros de outubro continuaram exatamente iguais aos da conferência acima após toda a ampliação.

### Ajustes necessários encontrados

- **Detalhes financeiros omitem `tipo_lancamento`.** `obter_titulo_financeiro` não informa se o título é previsão ou efetivo; a efetivação foi comprovada diretamente no banco. É necessário incluir esse campo para o ChatGPT explicar e decidir o fluxo corretamente.
- **Testes antigos precisam acompanhar o catálogo atual.** `scripts/chatgptplugin-live-crud-smoke.ts` ainda depende de ferramentas removidas, como `preparar_rascunho` e `obter_rascunho`. O arquivo não foi usado nesta rodada; foi criado um verificador temporário com os nomes atuais.
- Os dois problemas anteriores permanecem: cards que não abrem e divergência `fisica` → `juridica` no cadastro.

Na primeira coleta temporária, algumas asserções do próprio verificador usaram campos incorretos (`record` em vez de `sale`/`purchase`, e `totals.total` em vez de `record.valor_total`). As chamadas ao núcleo tiveram sucesso. As asserções foram corrigidas e os resultados preservados foram conferidos junto aos registros arquivados no banco, sem repetir as criações. A ausência de `tipo_lancamento` foi distinguida desses erros do verificador e confirmada no código da consulta.

Evidências adicionais em `.cache/chatgptplugin/`: `more-tools-test.json` (59 chamadas em conjunto com o seguinte), `verify-more-tools.json` (verificação final, cancelamento das prévias e ciclo fiscal), `more-tools-db-check.json` (totais financeiros após os testes) e `more-tools-chatgpt.png` (resposta da conversa real). Nenhuma correção funcional ou publicação foi feita durante estes testes.

## Correção do tipo de pessoa — 09/10/2026

`normalizePersonType` agora reconhece `PF`/`fisica` e `PJ`/`juridica`, sem diferenciar maiúsculas e após remover espaços externos. Preserva `estrangeira`, já permitida no schema, e o padrão `juridica` quando o campo opcional está ausente/vazio. Um valor informado que não seja reconhecido gera `VALIDATION_ERROR`, em vez de ser convertido silenciosamente para jurídica.

A mesma função atende criação, edição e filtros do ERP; portanto, a correção cobre clientes, fornecedores e vendedores, tanto pelos valores do site quanto pelos contratos do MCP. Nenhuma alteração de schema ou reclassificação de cadastros existentes foi feita.

Regressão reproduzível:

```text
pnpm erp:person-type-smoke --company=2 --user=3
```

O script `scripts/erp/person-type-smoke.ts` exige empresa/usuário explícitos e permissão ativa. Usa os contratos do MCP, `proposalValues`, `executeOperation` e os repositórios reais, sob contexto ERP/RLS. Passaram **39 verificações** de criação física/jurídica, alteração nos dois sentidos, edição somente do nome preservando o tipo, compatibilidade com PF/PJ, espaços/maiúsculas, estrangeira, ausência de campo e recusa de tipo inválido sem mutação. Todos os 24 cadastros fictícios ficaram numa única transação revertida; a consulta posterior confirmou zero registros remanescentes. Esta regressão não testa o transporte OAuth ou a UI do ChatGPT.

O build da Vercel concluiu em `READY`. Publicado no domínio `cognito-seven.vercel.app` pelo deploy `dpl_8fpmeNLKWQfEybJFraKow92egjK7`, com `sourceDigest` `c0a8c7b78c028171a3fc1d2f4fb27bd6121d8abe621acfa7390ee1b8c56527d0`. Os hashes dos arquivos locais foram comparados ao manifesto publicado. Em produção, os metadados OAuth responderam 200; MCP e acesso ERP sem credenciais responderam 401, mantendo a proteção. Evidências da publicação em `.cache/person-type/`.

Os problemas dos cards e da ausência de `tipo_lancamento` nos detalhes financeiros permanecem fora desta correção.

## Correção do tipo de lançamento financeiro — 09/10/2026

`obter_titulo_financeiro` agora retorna `record.tipo_lancamento` para contas a pagar e a receber. A consulta compartilhada inclui o campo do banco e o contrato MCP exige `previsao` ou `efetivo`. A descrição da ferramenta explica que uma previsão precisa ser efetivada antes da baixa. Nenhuma alteração de schema foi necessária.

Regressão reproduzível:

```text
pnpm erp:financial-title-type-smoke --company=2 --user=3
```

Passaram **9 verificações** com Supabase real: leitura de previsão/efetivo nos dois tipos de conta, leitura após efetivação, retorno de `tools/call` pelo handler HTTP e SDK MCP, e rejeição de campo ausente ou inválido pelo contrato. Os quatro títulos fictícios foram criados numa transação revertida, com zero registros remanescentes. O teste HTTP usa uma autenticação controlada com o usuário real resolvido; não verifica token OAuth, conversa ou UI do ChatGPT.

O build concluiu em `READY` e foi publicado às 13:22 UTC no domínio `cognito-seven.vercel.app`, pelo deploy `dpl_4cZZ5XVqm6GnApZzMN5obmtbi4aw`, com `sourceDigest` `f7353fb0bd2e404f0df0103d78f940ded01413ed5005237ca2a7ccd42a5dddc3`. Os arquivos locais foram conferidos com o manifesto. A verificação em produção confirmou metadados OAuth com HTTP 200 e os endpoints MCP/acesso ERP sem credenciais com HTTP 401. Evidências em `.cache/financial-title-type/`.

A omissão de `tipo_lancamento` está corrigida. A falha de abertura dos cards continua pendente de diagnóstico.
