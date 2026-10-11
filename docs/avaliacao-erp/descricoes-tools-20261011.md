# Revisão das descrições de todas as tools

Data: 11/10/2026.

## Melhorias implementadas

- As 59 ferramentas têm descrições centralizadas de finalidade, pré-requisitos, IDs, efeitos e próximos passos; corrigidas as descrições de confirmação de compra, estados de NFS-e, exclusão/inativação e preferências imediatas.
- Todos os parâmetros publicados têm explicações, incluindo valores, percentuais, descontos, datas, condições de pagamento e campos das variantes. Metadados não alteram validações de negócio.
- Os contratos de saída explicam campos úteis, limites, paginação, truncamento, estado da aprovação versus estado do documento e expiração de PDFs/XML.
- As consultas agora expõem códigos fiscais de serviços, limite/bloqueio/tabela de preço do cliente, classificação DRE e condições comerciais de vendas/compras para identificar edições que o chat não suporta e preservar dados.
- Orientações gerais incluem recuperação de erros, reconfirmação após prévia expirada/alterada, consulta após timeout e distinção entre permissão OAuth e perfil no ERP.

Verificação: `scripts/chatgptplugin-tool-documentation-smoke.ts` passou com 59 descrições e 619 ocorrências de parâmetros documentadas por protocolo. Conferiu metadados/permissões nos protocolos legado e atual e preservação de defaults, trimming, strict, nullable, arrays, uniões e refinamentos.

Teste no Supabase: 4 grupos passaram, com 34 chamadas MCP em 11 ferramentas. Comparação dos novos campos com SQL, criação/edição/conversão/exclusão de proposta, idempotência, configurações, menções e recursos HTML. Transação revertida e conteúdo original preservado. OAuth e Storage externo não foram testados nesta execução. Evidência local: `.cache/all-tools/selected-report.json`.

TypeScript: checagem dos dois scripts de teste e de suas dependências, incluindo os arquivos de produção alterados, terminou com zero erros. Não foi executado o build completo do site nesta revisão.

As seções abaixo preservam a avaliação inicial, anterior às melhorias. Esta implementação é local; não publica automaticamente o catálogo no ChatGPT.

## Avaliação inicial: escopo e conclusão

Revisão das 59 ferramentas efetivamente publicadas por `tools/list`, com comparação dos textos, esquemas de entrada, contratos de saída e rotinas do ERP. Catálogo capturado pelo handler MCP local, com identidade de teste e sem executar operações de negócio. Evidência local: `.cache/tool-descriptions/catalog.json`.

São 20 consultas de negócio, 34 ferramentas de ação e 5 ferramentas de acesso, painel e extensões. As ações podem ter várias variantes; estas não são ferramentas adicionais. Não houve alteração de descrições, regras de negócio ou dados nesta revisão.

As descrições existentes explicam razoavelmente a finalidade de cada operação. A seleção da empresa, confirmação das operações de negócio, idempotência e uso de IDs reais já têm uma base boa. Ainda faltam pré-requisitos, significado de parâmetros, interpretação de resultados e recuperação de erros. Algumas descrições contradizem ou excedem o que o código oferece.

## Prioridades

### P1: texto incorreto, ausente ou capaz de induzir ação errada

1. `confirmar_compra` sugere recebimento de estoque. `confirmErpPurchase` confirma a compra e gera ou efetiva o financeiro conforme `gera_financeiro`; produtos controlados permanecem aguardando recebimento. O recebimento de mercadoria é separado e não está exposto no catálogo MCP atual. O teste existente de estoque também verifica que confirmar a compra preserva o saldo físico.
2. `ler_configuracoes`, `atualizar_configuracoes` e `search_mentions` são publicados sem `description`. A primeira regra geral de escrita diz que todas as tools de escrita têm prévia e confirmação, mas atualização de preferências é imediata, usa `set` e não aceita `rascunho_id`. Delimitar a regra às ações de negócio.
3. `emitir_nota_servico` precisa orientar a consultar o estado da nota após a execução. `saved` confirma a execução da ação, não a autorização fiscal: a simulação pode resultar em `falha` ou `aguardando_retorno`. `consultar_nota_servico` também é uma ação que processa retorno e pode produzir autorização e efeitos financeiros.
4. A autorização de NFS-e com retenções e venda vinculada pode registrar abatimentos nas parcelas a receber; o cancelamento estorna esses abatimentos. As descrições não deixam esses efeitos claros.
5. A emissão aceita estados `rascunho` e `falha`, mas edição e exclusão da nota aceitam apenas `rascunho`. Explicar a recuperação conforme o estado, sem recomendar edição ou cancelamento de uma nota em falha.
6. `obter_cadastro` promete dados completos, mas a consulta devolve uma seleção de campos. O retorno de serviços não expõe os códigos fiscais exigidos para emissão; categorias não expõem todos os campos de classificação DRE; dados comerciais do cliente também são selecionados. É necessário documentar o limite e avaliar a exposição dos campos úteis, não apenas aumentar o texto.
7. As descrições genéricas de categorias e inativação de cadastros excedem algumas variantes disponíveis: `criar_cadastro` cria categorias financeiras, e os esquemas de edição de serviço/categoria/conta financeira não aceitam `status` para inativar. Explicar as capacidades por variante.

### P2: contexto para planejamento e interpretação

- Identificar a origem de cada ID: empresa, cadastro, venda, compra, nota, OS, título, parcela, pagamento e item de venda. `rascunho_id` identifica a aprovação da ação, não o documento de negócio.
- Descrever valores em reais, datas ISO, percentuais e desconto por item versus desconto de cabeçalho. Quando o schema aceita número e a consulta devolve ID textual, orientar a conversão apenas de IDs já retornados.
- Explicar paginação, truncamento de itens/histórico e limites fixos sem parâmetros de continuação. Não afirmar resultado completo quando faltam páginas ou há `itemsTruncated`, `installmentsTruncated` ou `historyTruncated`.
- Dar orientações para `DRAFT_EXPIRED`, `STALE_PROPOSAL`, `IDEMPOTENCY_CONFLICT`, `INVALID_STATE`, `ACCESS_DENIED`, `INSUFFICIENT_SCOPE`, `PERIOD_CLOSED`, `STORAGE_UNAVAILABLE` e `FILE_UNAVAILABLE`. Em timeout, consultar o estado antes de reenviar; preservar a chave para a mesma tentativa, sem criar duplicatas.
- Documentar retorno genérico `record`/`records` por domínio. Hoje muitos campos ficam em objetos livres, sem semântica publicada.
- Explicar os critérios e limites de cada variante de relatório, incluindo diferenças de caixa e competência e a posição atual do estoque.

## Inventário completo e recomendações

Legenda: **Boa base** = finalidade e limite principal já estão claros; **Complementar** = faltam orientações práticas; **Corrigir** = ausência de descrição ou divergência relevante. Mesmo os textos com boa base devem receber o contexto comum acima.

### Acesso, painel e extensões — 5

| Tool | Avaliação | Recomendação |
|---|---|---|
| `meu_acesso` | Boa base | Explicar empresa selecionada, perfil e permissões; não confundir usuário com empresa. |
| `abrir_painel` | Boa base | Documentar o que o painel permite navegar e que abrir a interface não executa ações de negócio. |
| `ler_configuracoes` | Corrigir | Adicionar descrição; lê preferências da conta/conexão, não configuração fiscal ou bancária da empresa. |
| `atualizar_configuracoes` | Corrigir | Adicionar descrição; atualização imediata via `set`, campos permitidos e ausência de prévia de negócio. Não pressupor que preferências eliminem a necessidade de `empresa_id`. |
| `search_mentions` | Corrigir | Adicionar descrição; busca apenas clientes. Com várias empresas, `query` exige o prefixo `ID_DA_EMPRESA: busca`. Retorna referências de recursos, não executa ações. |

### Cadastros — 5

| Tool | Avaliação | Recomendação |
|---|---|---|
| `buscar_cadastros` | Complementar | Explicar variantes plurais, categorias financeiras versus categorias de cadastro, campos pesquisados e status. |
| `obter_cadastro` | Corrigir | Substituir promessa de dados completos por lista de campos disponíveis ou ampliar o retorno; explicitar limites por variante. |
| `criar_cadastro` | Complementar | Documentar requisitos por tipo, classificação DRE da categoria financeira, tipo e saldo inicial da conta e dados não suportados. |
| `editar_cadastro` | Corrigir | Distinguir campos editáveis por tipo, contato comercial principal e variantes que aceitam inativação; saldo inicial da conta não é editável por esta tool. |
| `excluir_cadastro` | Complementar | Explicar exclusão lógica, vínculos que impedem a operação e alternativa de inativação somente quando a variante a suporta. |

### Vendas e propostas — 11

| Tool | Avaliação | Recomendação |
|---|---|---|
| `listar_vendas` | Boa base | Distinguir `status` de `situacao`, data comercial e `tipo_documento`; explicar totais filtrados, incluindo rascunhos quando não filtrados. |
| `obter_venda` | Complementar | Explicar documento de origem, ID dos itens para devolução, parcelas e limites/truncamento; dados retornados não contêm todo o formulário comercial. |
| `criar_venda` | Complementar | Explicar preço opcional resolvido pelo ERP, campos obrigatórios, parcelas, validade da proposta, vendedor e descontos de item/cabeçalho. |
| `editar_venda` | Complementar | Documentar reposição de itens e condição completa quando há várias parcelas; preservar os valores existentes ao alterar dados sem intenção de reprificar. |
| `excluir_venda` | Boa base | Explicar exclusão lógica do rascunho, bloqueios por vínculos e diferença de ID da venda/orçamento. |
| `confirmar_venda` | Complementar | Explicitar geração do contas a receber e reserva dos produtos controlados, mantendo saída física como atendimento separado; orientar bloqueios e limite de crédito. |
| `cancelar_venda` | Complementar | Explicar efeitos financeiros e de estoque e bloqueios por histórico, sem prometer cancelamento de nota fiscal ou reembolso bancário. |
| `atender_venda` | Complementar | Documentar que o catálogo não aceita itens/quantidades para atendimento parcial; orientar consulta da situação de atendimento e reservas. |
| `converter_orcamento` | Complementar | Informar que o ID retornado é da venda gerada, que ela continua em rascunho e que a conversão reaproveita a venda existente; explicar validade e situações encerradas. |
| `alterar_orcamento` | Boa base | Explicar estados de origem/destino de cada ação e confirmação após revisão; envio registra um fato informado, não envia mensagem. |
| `registrar_devolucao` | Boa base | Documentar o valor estimado na prévia, ID resultante da devolução e restrições de quantidade; diferenciar crédito/reembolso no ERP de transferência de dinheiro. |

### Compras — 7

| Tool | Avaliação | Recomendação |
|---|---|---|
| `listar_compras` | Complementar | Explicar data da compra, status, totais e inclusão de cotações; não afirmar que uma compra confirmada já foi recebida. |
| `obter_compra` | Complementar | Documentar quantidades recebidas, parcelas e limites/truncamento; descrever o retorno como seleção de dados. |
| `criar_compra` | Boa base | Documentar fornecedor, itens, preço obrigatório e vencimento; esta variante do chat tem contrato mais restrito que o formulário do ERP. |
| `editar_compra` | Complementar | Acrescentar bloqueio de compras com descontos/despesas no cabeçalho, além de múltiplas parcelas; encaminhar esses casos ao ERP. |
| `excluir_compra` | Boa base | Explicar exclusão lógica e bloqueios por vínculos; usar somente rascunhos. |
| `confirmar_compra` | Corrigir | Remover indicação de recebimento automático de estoque; explicar financeiro conforme configuração e recebimento posterior no ERP. |
| `cancelar_compra` | Complementar | Explicar validações de histórico e consequências financeiras/de estoque; não prometer devolução de dinheiro ao fornecedor. |

### Financeiro — 10

| Tool | Avaliação | Recomendação |
|---|---|---|
| `consultar_financeiro` | Boa base | Explicar `id` da parcela versus `conta_id` do título, vencimento, saldo versus valor original e significado de previsões. |
| `obter_titulo_financeiro` | Boa base | Documentar origem manual/automática, parcelas, limites do histórico e campos necessários para reconstruir a edição. |
| `obter_parcela_financeira` | Complementar | Explicar conta financeira sugerida, saldo disponível para baixa, histórico truncado e ID usado na ação. |
| `listar_pagamentos` | Complementar | Explicar estornos e registros já estornados; ID de pagamento difere do título e parcela. Não há busca por nome ou filtro de período nesta tool. |
| `criar_titulo` | Boa base | Documentar categoria ativa de receita/despesa sem subcategorias ativas, competência/emissão/vencimentos e soma exata de parcelas. |
| `efetivar_previsao` | Boa base | Explicar que muda a natureza do lançamento sem registrar pagamento; orientar consulta do resultado pelo ID do título. |
| `editar_titulo` | Complementar | Documentar conservação de opcionais omitidos, limpeza via `null`, categoria compatível e reposição da programação de parcelas. |
| `excluir_titulo` | Boa base | Explicar exclusão lógica e bloqueios; confirmar que ID deve ser do título manual. |
| `registrar_baixa` | Boa base | Explicar baixa parcial, valor positivo até o saldo, data e conta ativa; ação registra pagamento no ERP e influencia saldos contábeis, sem operar o banco. |
| `estornar_pagamento` | Boa base | Explicar o efeito no saldo pendente da parcela, restrições de período e necessidade de buscar pagamento ainda não estornado. |

### Estoque — 1

| Tool | Avaliação | Recomendação |
|---|---|---|
| `consultar_estoque` | Complementar | Explicar quantidade física, reservada e disponível, unidade e local; posição atual, não saldo histórico da data pedida. |

### Resumo e análises — 3

| Tool | Avaliação | Recomendação |
|---|---|---|
| `resumo_erp` | Boa base | Documentar campos e data de referência; ausência de filtro de período e permissões exigidas de várias áreas. |
| `analisar_periodo` | Boa base | Explicar agregação mensal, ausência de meses sem registros e que saldo financeiro pendente não representa todos os pagamentos históricos. |
| `consultar_relatorio` | Complementar | Documentar cada uma das 19 variantes e seus critérios. Estoque é posição atual apesar dos parâmetros de data; orçado × realizado usa o ano de `inicio` e acumula até o mês de `fim`. Distinguir DRE estruturada e resultados simplificados por caixa/competência, além de totais ausentes em certas variantes paginadas. |

### Ordens de serviço — 6

| Tool | Avaliação | Recomendação |
|---|---|---|
| `listar_ordens_servico` | Boa base | Documentar os estados e que não possui filtro de período nesta tool; resumo abrange todos os filtrados. |
| `obter_ordem_servico` | Complementar | Explicar itens, observações públicas/internas e vínculos com orçamento/venda; orientar obtenção do PDF com a tool comercial. |
| `criar_ordem_servico` | Complementar | Explicar campos obrigatórios, itens e desconto; separar observações internas do conteúdo público do documento. |
| `editar_ordem_servico` | Boa base | Documentar reposição de itens e bloqueio após gerar orçamento/venda, inclusive quando a OS aparenta continuar em rascunho. |
| `alterar_ordem_servico` | Complementar | Publicar transições válidas: aprovação, início, conclusão e cancelamento; consultar estado antes de escolher ação. |
| `converter_ordem_servico` | Boa base | Explicar ID do documento resultante conforme `tipo`, reutilização de documento e próximos passos para confirmar venda. |

### Documentos e anexos — 3

| Tool | Avaliação | Recomendação |
|---|---|---|
| `obter_documento_comercial` | Boa base | Explicar origem do ID, lista de revisões, validade do link e distinção entre versão atual e revisão imutável. |
| `arquivar_documento_comercial` | Boa base | Orientar consulta posterior da revisão e download com `obter_documento_comercial`; ID resultante continua sendo o documento de origem. |
| `listar_anexos` | Complementar | Explicar orçamento como `documento: venda`, link indisponível como `null` e limite de 10 arquivos sem argumento de paginação; `hasMore` não autoriza afirmar que todos foram listados. |

### NFS-e simulada — 8

| Tool | Avaliação | Recomendação |
|---|---|---|
| `listar_notas_servico` | Boa base | Explicar período por competência, estados e paginação; ID não é o número da nota. |
| `obter_nota_servico` | Complementar | Explicar valores bruto/líquido, dados para edição, PDF em rascunho e XML autorizado/cancelado; links são temporários. |
| `criar_nota_servico` | Complementar | Documentar reais, percentual como `5` para 5%, desconto em reais por item, máximo de 50 itens e vínculo com venda do mesmo cliente. |
| `editar_nota_servico` | Complementar | Explicar que só rascunho aceita edição e que `dados_editaveis` deve ser complementado com `registro_id`; atualizar fotografia do cliente após revisão. |
| `emitir_nota_servico` | Corrigir | Documentar pré-requisitos fiscais, estados rascunho/falha, retorno por cenário, consulta após `saved` e efeitos financeiros de retenções. Descrever as validações implementadas sem garantir compatibilidade integral com qualquer provedor real. |
| `consultar_nota_servico` | Complementar | Explicar que processa retorno somente de `aguardando_retorno`, pode autorizar e aplicar retenções; requer prévia e confirmação. |
| `cancelar_nota_servico` | Complementar | Explicar códigos de motivo, justificativa, estado emitida, estorno dos abatimentos por retenção e preservação dos documentos. |
| `excluir_nota_servico` | Boa base | Explicar exclusão lógica e preservação do histórico; estado falha não é rascunho para esta operação. |

## Formato recomendado para as descrições

Cada ferramenta deve fornecer, de forma curta e específica:

1. Quando usar e qual pedido atende.
2. Consultas prévias e origem dos IDs.
3. Parâmetros críticos, unidades, valores padrão e limites.
4. Pré-requisitos e estados permitidos.
5. Efeitos no ERP e sistemas externos, quando houver.
6. Como interpretar o resultado e qual o próximo passo.
7. Como recuperar erros esperados sem duplicar operações.

As regras comuns devem permanecer nas instruções gerais e nos campos do schema. Orientações específicas de cada operação precisam aparecer também na própria tool. A documentação publicada deve refletir as capacidades reais, inclusive quando é necessário concluir algo no site do ERP.

## Arquivos conferidos

- `src/products/chatgptplugin/mcp/createServer.ts`: instruções gerais, acesso, painel e extensões.
- `src/products/mcpcore/tools/catalog.ts`: 20 consultas e parâmetros.
- `src/products/mcpcore/actions/catalog.ts`: 34 ferramentas de ação e fluxo de confirmação.
- `src/products/mcpcore/actions/contracts.ts` e `expandedContracts.ts`: variantes e validações de entrada.
- `src/products/mcpcore/tools/outputs.ts`: contratos de saída.
- `src/products/mcpcore/actions/pricing.ts`, `operations.ts` e `references.ts`: preços, limites e execução.
- `src/products/mcpcore/actions/draftRepository.ts` e `approvals/approvalRepository.ts`: prévias, idempotência e conflitos.
- `src/products/mcpcore/application/preferences.ts` e `executeTool.ts`: preferências, seleção de empresa, permissões e erros.
- `src/products/erp/server/erpReadService.ts` e `erpReadQueries.ts`: campos realmente devolvidos e critérios das consultas.
- `src/products/erp/server/erpRepository.ts`, `erpProfessionalRepository.ts` e `erpStockRepository.ts`: confirmação, conversão e movimentação.
- `src/products/erp/shared/financialTitleContracts.ts`, `serviceInvoiceContracts.ts` e `quoteLifecycle.ts`: estados e unidades.
- `src/products/erp/server/fiscal/serviceInvoiceRepository.ts`, `serviceInvoiceSimulator.ts` e `nfseDps.ts`: simulação, documentos e efeitos financeiros.

Esta é uma revisão de contexto/documentação. Não substitui uma nova rodada de testes funcionais nem confirma implantação das descrições em produção.
