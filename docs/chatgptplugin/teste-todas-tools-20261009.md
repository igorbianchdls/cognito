# Avaliação das ferramentas MCP — 09/10/2026

Iniciada em 09/10; casos adicionais de acesso, período fechado e anexos concluídos em 10/10. Todas as transações de escrita concluídas foram revertidas e os hashes das tabelas originais conferidos. A verificação adicional inclui também usuários, empresas e vínculos de `shared`.

## Método

Alvo: Supabase do projeto configurado, empresa 2, usuário 3. Catálogo atual: 50 ferramentas, com 54 variantes de ações e 19 tipos de relatório.

- Consultas: servidor HTTP em loopback, handler MCP e SDK reais, consultas reais ao Supabase, limites e auditoria reais. Identidade externa substituída por um token de teste somente no processo local. Valores conferidos contra SQL e cálculos independentes.
- Escritas: handler MCP, SDK, rascunhos, aprovação, repositórios e RLS reais. Uma conexão de teste mantém transação externa; o adaptador de pool converte confirmações internas em savepoints e reverte tudo ao final. As restrições diferidas são executadas nos limites das operações. A autenticação e a verificação nativa de transação somente de leitura são fixtures nesta rodada; a segunda é exercitada com conexões normais na suíte de consultas.
- Usuário autoriza confirmações fictícias para a suíte. Repetição da execução, conflito de chave, prévia sem persistir no ERP, empresa proibida e escopo insuficiente são testados.
- PDFs/XML: chamadas ao handler de download com token assinado, verificação do conteúdo, hash e versão de apresentação. Não é download público de uma nota fictícia gravada em produção: os registros permanecem na transação revertida.
- Nenhum navegador utilizado. Abertura visual dos cards no ChatGPT e conexão OAuth externa não são validadas por estes testes.

## Resultados concluídos

| Suíte | Resultado |
| --- | --- |
| Autenticação criptográfica | 37 verificações aprovadas; chaves temporárias e SDK Clerk real |
| Contratos MCP, HTTP e isolamento | 36 verificações aprovadas com dependências simuladas |
| Protocolo moderno e formulários | 9 grupos aprovados |
| Consultas MCP e Supabase | 107 verificações aprovadas, incluindo todas as 21 ferramentas de leitura |
| Fluxos completos de escrita e extensões | Todas as 50 ferramentas tiveram chamada bem-sucedida; rodada completa com 394 chamadas MCP |
| Relatórios | Todos os 19 tipos executaram; três relatórios de margem verificam também receita menos custo |
| NFS-e simulada | CRUD, sucesso/rejeição/demora/timeout, consulta, cancelamento, PDF/XML, versões e links temporários aprovados |
| Assinatura e validação de anexos | 19 verificações aprovadas com storage simulado; não comprova download no bucket real |
| Dashboards | 7 dashboards carregaram; 105 de 108 detalhamentos funcionaram; 26 grupos de verificações concluídos |

Oito relatórios têm comparação numérica independente na suíte de leitura. Os demais tipos recebem testes de execução, contrato e consistência, sem alegação de validação contábil completa de todos os cenários.

A rodada de escrita encontrou a falha de mensagem para estoque insuficiente descrita abaixo. Uma segunda falha do relatório bruto veio de fixture: o teste tentava suspender o único proprietário, corretamente impedido pelo banco. O teste de revogação foi ajustado para suspender a empresa e repetido separadamente. Os erros do produto continuam registrados; não foram corrigidos nesta avaliação.

## Erro confirmado: detalhes dos produtos a repor

A consulta de detalhamento de estoque usa `HAVING sum(disponível)`; a subconsulta cria o campo `disponivel`, sem acento. PostgreSQL retorna `column "disponível" does not exist`.

Arquivo: `src/products/erp/server/dashboards/drilldownQueries.ts`, na consulta de `source=estoque&status=reposicao`.

Afeta o detalhamento geral e os dois produtos a repor da base atual. Os indicadores principais e os demais 105 detalhamentos funcionaram. A falha está na consulta da aplicação; não é necessário recriar a tabela do Supabase.

## Erro confirmado: mensagem incorreta para estoque insuficiente

Ao confirmar uma venda de produto sem saldo, o ERP impede a operação, mas a tool retorna `ERP_UNAVAILABLE` e “Não foi possível concluir a consulta ao ERP”. O erro real é `STOCK_OPERATION_INVALID`, com a informação de estoque insuficiente.

Arquivo: `src/products/mcpcore/application/executeTool.ts`, função `publicError`. O mapeamento reconhece algumas regras comerciais, mas não esse código de estoque e cai no retorno genérico de indisponibilidade.

Impacto: o usuário não recebe a orientação correta e pode pensar que a conexão ou o banco caiu. Não foi observada aprovação da venda sem estoque. Reserva, atendimento e devoluções nos três tratamentos passaram com saldo disponível.

## Capacidade ausente: recebimento de compras

`confirmar_compra` confirma a compra e efetiva o financeiro. Para produtos que controlam estoque, deixa o documento confirmado e aguarda recebimento separado. Não dá entrada física automaticamente. O catálogo MCP atual não tem ferramenta para registrar esse recebimento.

É uma diferença de capacidade entre ERP e MCP, e não prova de erro no saldo. Os testes de estoque respeitam esse comportamento e verificam reserva, atendimento e devolução sobre saldo já existente.

## Anexos e armazenamento

Os sete tipos de documento foram consultados: pagar, receber, pagamento, venda, compra, contrato e ordem de serviço. Os documentos usados não tinham anexos. A configuração local não contém todos os parâmetros exigidos para o storage, por isso não foi validado download de anexo no bucket real. Isso não afeta o PDF/XML da NFS-e simulada, que utiliza o armazenamento e os handlers próprios já testados.

## Cobertura das 50 ferramentas

| Ferramenta | Resultado |
| --- | --- |
+| `abrir_painel` | Resposta e HTML aprovados; abertura no ChatGPT não verificada |
| `analisar_periodo` | Chamada e fluxo válido aprovados |
| `atender_venda` | Chamada e fluxo válido aprovados |
| `atualizar_configuracoes` | Chamada e fluxo válido aprovados |
| `buscar_cadastros` | Chamada e fluxo válido aprovados |
| `cancelar_compra` | Chamada e fluxo válido aprovados |
| `cancelar_nota_servico` | Chamada e fluxo válido aprovados |
| `cancelar_venda` | Chamada e fluxo válido aprovados |
| `confirmar_compra` | Confirmação e financeiro aprovados; recebimento físico separado |
| `confirmar_venda` | Fluxo válido aprovado; mensagem de estoque insuficiente incorreta |
| `consultar_estoque` | Chamada e fluxo válido aprovados |
| `consultar_financeiro` | Chamada e fluxo válido aprovados |
| `consultar_nota_servico` | Chamada e fluxo válido aprovados |
| `consultar_relatorio` | Chamada e fluxo válido aprovados |
| `converter_orcamento` | Chamada e fluxo válido aprovados |
| `criar_cadastro` | Chamada e fluxo válido aprovados |
| `criar_compra` | Chamada e fluxo válido aprovados |
| `criar_nota_servico` | Chamada e fluxo válido aprovados |
| `criar_titulo` | Chamada e fluxo válido aprovados |
| `criar_venda` | Chamada e fluxo válido aprovados |
| `editar_cadastro` | Chamada e fluxo válido aprovados |
| `editar_compra` | Chamada e fluxo válido aprovados |
| `editar_nota_servico` | Chamada e fluxo válido aprovados |
| `editar_titulo` | Chamada e fluxo válido aprovados |
| `editar_venda` | Chamada e fluxo válido aprovados |
| `efetivar_previsao` | Chamada e fluxo válido aprovados |
| `emitir_nota_servico` | Chamada e fluxo válido aprovados |
| `estornar_pagamento` | Chamada e fluxo válido aprovados |
| `excluir_cadastro` | Chamada e fluxo válido aprovados |
| `excluir_compra` | Chamada e fluxo válido aprovados |
| `excluir_nota_servico` | Chamada e fluxo válido aprovados |
| `excluir_titulo` | Chamada e fluxo válido aprovados |
| `excluir_venda` | Chamada e fluxo válido aprovados |
| `ler_configuracoes` | Chamada e fluxo válido aprovados |
| `listar_anexos` | Sete tipos aprovados sem arquivos; download real pendente |
| `listar_compras` | Chamada e fluxo válido aprovados |
| `listar_notas_servico` | Chamada e fluxo válido aprovados |
| `listar_pagamentos` | Chamada e fluxo válido aprovados |
| `listar_vendas` | Chamada e fluxo válido aprovados |
| `meu_acesso` | Chamada e fluxo válido aprovados |
| `obter_cadastro` | Chamada e fluxo válido aprovados |
| `obter_compra` | Chamada e fluxo válido aprovados |
| `obter_nota_servico` | Chamada e fluxo válido aprovados |
| `obter_parcela_financeira` | Chamada e fluxo válido aprovados |
| `obter_titulo_financeiro` | Chamada e fluxo válido aprovados |
| `obter_venda` | Chamada e fluxo válido aprovados |
| `registrar_baixa` | Chamada e fluxo válido aprovados |
| `registrar_devolucao` | Chamada e fluxo válido aprovados |
| `resumo_erp` | Chamada e fluxo válido aprovados |
| `search_mentions` | Chamada e fluxo válido aprovados |

As 54 variantes de ações se distribuem em 21 de cadastros, 11 de vendas/orçamentos/devoluções, 5 de compras, 11 financeiras e 6 fiscais. A prévia, a execução e a repetição foram exercitadas nos fluxos válidos. Devoluções cobrem abatimento, crédito e reembolso; notas cobrem os quatro cenários do simulador.

Suspender a empresa após a prévia impede executar o rascunho. Fechar o período impede confirmar a venda, sem criar título financeiro nem confirmar parcialmente o documento. Esses casos adicionais passaram e tiveram as alterações revertidas.

## Scripts

```text
pnpm chatgptplugin:auth-smoke
pnpm chatgptplugin:smoke
pnpm chatgptplugin:mrtr-smoke
pnpm chatgptplugin:live-read-smoke --all-read --empresa=2
pnpm chatgptplugin:all-tools-smoke --company=2 --user=3
pnpm erp:dashboards-smoke
```

`chatgptplugin-live-crud-smoke.ts` passa a encaminhar para a suíte atual. Scripts antigos referiam ferramentas removidas; a comparação de identidade também não considerava nome, e-mail e fuso adicionados ao contrato. Essas expectativas foram atualizadas.

Os relatórios brutos ficam em `.cache/erp-audit/mcp-all-read.json`, `.cache/all-tools/` e `.cache/dashboards/read-smoke.json`. Falhas de fixture nas primeiras rodadas não são classificadas como defeitos do produto; cenários corrigidos são repetidos.

## Limitação da máquina

O disco ficou sem espaço durante a primeira gravação de relatório. Um relatório temporário de lint foi removido para liberar espaço. A tentativa de verificar todos os tipos com TypeScript esgotou o limite de memória disponível; não houve confirmação de build completo nesta avaliação. As suítes citadas como aprovadas executaram efetivamente.
