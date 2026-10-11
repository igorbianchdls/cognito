# Diagnóstico do ERP — 11/10/2026

**Revisão posterior:** os seis achados abaixo foram mantidos. Uma investigação adicional identificou quatro frentes de correção em relatórios, repetição de operações e vínculos financeiros. Consulte a [segunda revisão](segunda-revisao.md) para a avaliação consolidada e a ordem atualizada de prioridades.

## Conclusão

A base está bem estruturada e tem controles relevantes para um ERP profissional. Não encontrei motivo para refazer o schema, renomear tabelas ou criar uma nova camada de API. Entretanto, há seis pontos concretos a corrigir/concluir, descritos abaixo. Não é correto declarar que toda a implementação está perfeita.

A ausência da API real de emissão fiscal foi considerada uma etapa futura, não um defeito. As notas existentes estão em modo de simulação.

## Escopo e método

- Supabase real: catálogo atual de todas as 104 tabelas ERP, constraints, índices, triggers, funções, permissões e políticas de acesso.
- Contagens de todas as tabelas e consultas de consistência sobre os dados existentes, em transações de somente leitura.
- RLS das 104 tabelas com o papel `erp_runtime`: usuário proprietário, usuário sem vínculo e empresa não autorizada.
- Código atual em `src/products/erp`: acesso, API HTTP, contratos, dinheiro/datas, vendas, compras, financeiro, estoque, recorrências, documentos, dashboards e telas de listagem; revisão dirigida dos caminhos críticos, não leitura exaustiva linha a linha de todos os arquivos.
- Catálogo HTTP: 82 rotas e 124 combinações de método e rota.
- Execução dos sete dashboards, suas consultas de detalhamento e reconciliação independente de 44 cálculos com os registros brutos.
- Reprodução local dos problemas de crédito, exportação e paginação, utilizando PostgreSQL em memória e funções reais da aplicação.

Não houve alteração nos registros, tabelas, buckets ou configurações de produção. Foram criados somente arquivos locais de diagnóstico. Não foi feito deploy.

## O que está bom

### Estrutura e segurança

- Todas as 104 tabelas possuem chave primária e RLS habilitada.
- Há 513 chaves estrangeiras, 423 CHECKs e 134 constraints de unicidade nas tabelas ERP.
- Não foram encontrados FKs entre tabelas ERP sem a empresa em ambos os lados, constraints não validadas, índices inválidos ou triggers desativados.
- O contexto de empresa/usuário é aplicado por transação. A aplicação executa consultas ERP com `erp_runtime`, sem privilégio de ignorar RLS.
- Nos testes das 104 tabelas, o proprietário viu somente dados da empresa autorizada; usuário sem vínculo e empresa não autorizada viram zero registros.
- Policies e validações de capacidades complementam a separação por empresa. A não utilização de FORCE RLS, isoladamente, não constitui problema neste desenho.

Esses testes não equivalem a uma prova de todas as combinações de perfis, permissões do contador e vendedores ou a um teste de login/OAuth.

### Financeiro, comercial e estoque

Não foram encontradas divergências nos dados examinados para:

- Subtotais de vendas/compras versus seus itens.
- Valores de títulos versus parcelas e valores pagos em cache versus pagamentos ativos.
- Vínculos financeiros esperados de vendas confirmadas e compras que geram financeiro.
- Composição de parcelas: nenhum saldo negativo nos dados atuais.
- Totais de OS e devoluções versus itens, ressalvando que não há devoluções cadastradas para validar casos reais desse fluxo.
- Quantidade física versus movimentos assinados, custo/saldo do último movimento e quantidade reservada versus reservas abertas.
- Estoque negativo de produtos que o proíbem e reservas atendidas acima da quantidade reservada.
- Sobreposição de fechamentos ativos nos dados existentes. Isso não é um teste concorrente de todos os fechamentos.

O código contém operações transacionais, controle de versões, validação de períodos, registros de histórico, idempotência em operações importantes e cálculos financeiros em centavos. Não encontrei necessidade de substituir esses mecanismos por uma nova arquitetura.

### API e dashboards

O verificador do catálogo HTTP passou: handlers seguem a camada de acesso/validação, rotas delegam ao produto ERP e o servidor ERP não depende do plugin ChatGPT. Esse teste é estrutural; não representa execução de todos os 124 endpoints via HTTP.

Os sete dashboards principais carregaram. A reconciliação independente passou em 44 cálculos de financeiro, comercial, estoque, resultados e serviços para o período de setembro/2026, com referência em 11/10/2026. A verificação de detalhamentos encontrou três falhas da mesma causa, especificada no item 1. Foram 108 tentativas de detalhamento: 105 concluídas e três falhas. O teste conferiu que os dados de negócio das duas empresas não mudaram.

## Melhorias necessárias

### 1. Corrigir o detalhamento de reposição de estoque

**Impacto atual:** o usuário consegue ver os indicadores, mas não consegue abrir a lista de produtos para reposição; o servidor retorna erro SQL.

**Causa comprovada:** o SELECT cria o alias `disponivel`, mas o HAVING utiliza `disponível` com acento. PostgreSQL trata os dois identificadores como nomes diferentes.

**Local:** `src/products/erp/server/dashboards/drilldownQueries.ts:153`.

**Evidência:** falha na consulta geral de reposição e em dois detalhamentos por produto com a mensagem de coluna inexistente. Os cálculos do indicador, em outra consulta, reconciliaram corretamente.

**Correção indicada:** usar o alias correto no HAVING e repetir os três caminhos, além do teste dos detalhamentos.

### 2. Corrigir o saldo utilizado no limite de crédito

**Impacto:** uma venda válida pode ser bloqueada após o cliente abater parte de uma dívida com adiantamento/crédito aplicado.

**Causa comprovada:** `assertCustomerCredit` soma `p.valor - p.valor_pago`. O campo `valor_pago` contabiliza dinheiro, enquanto `erp.composicao_parcela` também desconta créditos aplicados e valores transferidos por renegociação. O controle comercial usa um conceito de saldo diferente do financeiro.

**Local:** `src/products/erp/server/erpCommercialRules.ts:111`.

**Reprodução local:** parcela de R$ 1.000, crédito aplicado de R$ 600 e nenhum pagamento em dinheiro. A função real do banco retorna saldo de R$ 400. Com limite de R$ 1.000, uma nova venda de R$ 100 deveria resultar em exposição de R$ 500. A função real da aplicação calcula R$ 1.100 e lança `CREDIT_LIMIT_EXCEEDED`.

**Correção indicada:** usar a composição financeira canônica para o saldo utilizado no crédito e validar aplicação/reversão de créditos e renegociações. Não alterar `valor_pago` para representar crédito: esse campo tem semântica própria.

### 3. Remover a truncagem da numeração após 9.999 documentos

**Impacto:** ao ultrapassar 9.999 documentos de um tipo no mesmo ano/empresa, a geração pode colidir com números anteriores e ficar procurando um número até o tempo limite. Isso limita crescimento, mesmo sem aparecer na base pequena atual.

**Causa comprovada:** a função do banco usa `lpad(v_n::text, 4, '0')`. A largura é fixa e trunca números maiores. No Supabase real, `lpad('10000', 4, '0')` e `lpad('10001', 4, '0')` retornaram `1000`, igual ao número anterior 1.000.

**Locais:** função live `erp.proximo_numero`; `supabase/migrations/20261008140000_erp_devolucoes.sql:107`; chamada em `src/products/erp/server/erpDocumentNumbers.ts:13`.

**Correção indicada:** manter quatro dígitos como largura mínima, permitindo cinco ou mais sem truncar; testar a transição 9.999 → 10.000, colisões com números manuais e isolamento por empresa/tipo/ano. Criar migração corretiva nova, sem apenas editar a migração já aplicada.

### 4. Exportar todos os cadastros, não apenas a primeira página

**Impacto:** o arquivo CSV aparenta ser uma exportação completa, mas omite cadastros a partir do 51º registro.

**Causa comprovada:** `exportErpRecords` chama a listagem paginada sem percorrer páginas. O padrão é 50 registros.

**Locais:** `src/products/erp/server/erpImportRepository.ts:152`, `src/products/erp/server/erpRepository.ts:520`, handler `src/products/erp/api/handlers/importacoes/type.ts:20`.

**Reprodução local:** 51 clientes inseridos somente na base em memória; a função real de exportação devolveu 50. Os cadastros da empresa real testada têm menos de 50 por tipo e, por isso, a omissão ainda não aparece nesses dados.

**Correção indicada:** consulta de exportação própria ou leitura de todas as páginas em uma visão consistente. Um limite operacional deve ser explícito; não truncar silenciosamente. Conferir contagem e conteúdo do CSV gerado.

### 5. Completar a paginação em telas secundárias

**Impacto:** registros mais antigos ou além da primeira página ficam inacessíveis pela tela, e uma pesquisa local pode indicar ausência de um registro que existe no servidor.

**Causa comprovada:** a tela de tabelas de preço solicita apenas `pageSize=100`, descarta o total, filtra localmente e não oferece próxima página. A tela de devoluções também carrega somente a primeira página de 100 registros e descarta `hasMore`.

**Locais:** `src/products/erp/frontend/modules/vendas/PriceTablesPage.tsx:33` e `src/products/erp/frontend/modules/vendas/SaleReturnsPage.tsx:42`.

**Reprodução local:** com 101 tabelas de preço, a API real devolveu 100 na primeira página e uma na segunda. A tela possui apenas o primeiro carregamento. Não há tabelas de preço/devoluções na base atual; esse é um defeito comprovado de implementação, ainda não um caso de dados atuais ocultos.

**Correção indicada:** paginação e busca no servidor, com total/hasMore apresentado corretamente. Aplicar a revisão apenas a outras telas que tenham o mesmo contrato paginado; não presumir que todas as listagens são defeituosas.

### 6. Concluir a migração dos PDFs fiscais antigos para Storage

**Situação real:** os buckets `erp-fiscal`, `erp-comercial` e `erp-anexos` existem e são privados. Há 28 PDFs fiscais, todos ainda na coluna binária `conteudo`, nenhum com `arquivo_id` de Storage. Os três buckets não possuem objetos na consulta realizada. A tabela de PDFs comerciais está vazia.

**Impacto:** o objetivo de manter somente metadados no banco e conteúdo no Storage ainda não foi concluído para os documentos antigos. Isso não significa que os links antigos estejam quebrados: o leitor atual tem fallback para o conteúdo do banco.

**Verificação:** os 28 binários têm assinatura PDF válida e hash SHA-256 igual ao registrado. Essa checagem verifica integridade dos bytes; não é inspeção visual ou validação jurídica dos documentos.

**Locais:** `src/products/erp/server/fiscal/serviceInvoiceRepository.ts:318`; `scripts/erp/fiscal-pdf-storage.mjs`; migração final `supabase/migrations/20261010110100_fiscal_pdf_storage_finalize.sql`.

**Correção indicada:** executar a migração existente com credenciais de servidor, conferir conteúdo e download após upload, manter backup e somente então finalizar a remoção do binário do banco. A migração de finalização não foi aplicada e contém uma trava correta para impedir a remoção antes da migração dos PDFs.

Não foi verificado nesta revisão se a configuração do deploy permite upload de um PDF novo. Buckets vazios, por si só, não comprovam falta de credenciais. A migração dos antigos independe da API real de nota fiscal.

## Implantação e manutenção

O catálogo local tem duas migrações ausentes do histórico remoto. A finalização de Storage está efetivamente pendente e pertence ao item 6. A migração do portal do contador (`20261009160000`) tem os objetos principais já presentes: colunas, funções, índice, perfil e cinco capacidades. Portanto, não deve ser reaplicada às cegas. O histórico precisa ser reconciliado após conferir todos os objetos dessa migração; seu DDL não é idempotente e uma reaplicação simples tenta recriar colunas existentes.

Foi encontrado um par de índices idênticos em `erp.produtos`: `produtos_categoria_cadastro_idx` e `produtos_categoria_idx`. É uma limpeza de manutenção possível, de baixa prioridade; não explica os erros funcionais e não exige redesenhar índices. Não recomendo criar índices para todas as FKs sem evidência de consulta lenta.

## Limites da validação

- 56 tabelas possuem dados e 48 estão vazias. A estrutura e RLS de todas foram examinadas, mas tabelas vazias não fornecem evidência de uso real de todos os seus fluxos.
- Não houve execução de todos os CRUDs e ações de todas as ferramentas ChatGPT, nem teste visual de todas as telas, nesta revisão.
- Não foram testados simultaneamente todos os cenários concorrentes, produção fiscal, entrega de cobrança externa ou login/OAuth no navegador.
- A checagem `tsc -p tsconfig.erp.json --noEmit` não terminou: o processo sofreu falta de memória. O computador tinha cerca de 448 MiB de memória virtual disponível na consulta posterior. Isso é uma limitação desta execução; não foi registrado como defeito do ERP. O build completo ainda precisa passar em ambiente com memória suficiente.

## Ordem recomendada

1. Corrigir a consulta de reposição e o limite de crédito, que afetam o funcionamento.
2. Corrigir numeração, exportação e paginação antes de aumentar a base.
3. Concluir Storage e reconciliar o histórico de migrações.
4. Repetir os testes correspondentes e concluir a checagem de tipos/build em ambiente com memória suficiente.

Nenhuma dessas correções exige recriar o ERP ou integrar a API fiscal agora.

## Inventário das 104 tabelas

Todas as tabelas abaixo tiveram catálogo e RLS verificados. “Registros” é a contagem de todas as empresas no instante da consulta; zero não significa tabela desnecessária.

| Tabela | Colunas | FKs | CHECKs | Registros |
|---|---:|---:|---:|---:|
| `adiantamentos` | 18 | 7 | 7 | 0 |
| `adiantamentos_aplicacoes` | 14 | 6 | 5 | 0 |
| `arquivos` | 14 | 3 | 3 | 0 |
| `cadastros_eventos` | 9 | 2 | 3 | 77 |
| `categorias` | 18 | 5 | 4 | 45 |
| `categorias_cadastro` | 15 | 4 | 4 | 21 |
| `centros_custo` | 11 | 3 | 1 | 8 |
| `cobrancas` | 33 | 4 | 7 | 0 |
| `cobrancas_eventos` | 19 | 4 | 3 | 0 |
| `cobrancas_notificacoes` | 19 | 4 | 3 | 0 |
| `comissoes_lancamentos` | 18 | 7 | 7 | 0 |
| `comissoes_pagamentos` | 11 | 5 | 2 | 0 |
| `comissoes_pagamentos_itens` | 7 | 3 | 1 | 0 |
| `comissoes_regras` | 18 | 7 | 6 | 0 |
| `compras` | 46 | 11 | 12 | 123 |
| `compras_arquivos` | 10 | 5 | 1 | 0 |
| `compras_eventos` | 7 | 3 | 1 | 129 |
| `compras_itens` | 27 | 8 | 5 | 213 |
| `compras_parcelas_previstas` | 17 | 6 | 2 | 243 |
| `compras_recorrencias` | 17 | 4 | 4 | 0 |
| `compras_recorrencias_geracoes` | 11 | 5 | 1 | 0 |
| `conciliacoes_bancarias` | 14 | 4 | 2 | 0 |
| `conciliacoes_bancarias_itens` | 13 | 8 | 3 | 0 |
| `configuracoes_fiscais` | 31 | 3 | 7 | 2 |
| `contas_financeiras` | 19 | 3 | 3 | 6 |
| `contas_pagar` | 30 | 10 | 6 | 215 |
| `contas_pagar_arquivos` | 10 | 5 | 1 | 0 |
| `contas_pagar_eventos` | 7 | 3 | 1 | 1018 |
| `contas_pagar_parcelas` | 30 | 7 | 3 | 332 |
| `contas_receber` | 32 | 9 | 6 | 287 |
| `contas_receber_arquivos` | 8 | 4 | 1 | 0 |
| `contas_receber_eventos` | 12 | 5 | 2 | 1493 |
| `contas_receber_parcelas` | 30 | 7 | 3 | 500 |
| `contratos_vendas` | 28 | 8 | 8 | 24 |
| `contratos_vendas_arquivos` | 8 | 4 | 1 | 0 |
| `contratos_vendas_eventos` | 10 | 4 | 2 | 96 |
| `contratos_vendas_geracoes` | 15 | 5 | 2 | 84 |
| `contratos_vendas_geracoes_tentativas` | 9 | 2 | 6 | 0 |
| `contratos_vendas_itens` | 18 | 7 | 2 | 24 |
| `contratos_vendas_versoes` | 23 | 7 | 12 | 24 |
| `conversoes_unidades_produto` | 12 | 4 | 2 | 0 |
| `devolucoes` | 17 | 7 | 8 | 0 |
| `devolucoes_itens` | 8 | 3 | 2 | 0 |
| `documentos_comerciais_pdfs` | 11 | 5 | 5 | 0 |
| `documentos_estoque` | 22 | 7 | 4 | 202 |
| `documentos_estoque_itens` | 12 | 6 | 2 | 316 |
| `dre_grupos` | 9 | 1 | 5 | 18 |
| `entidades` | 47 | 5 | 9 | 98 |
| `entidades_contatos` | 14 | 3 | 4 | 100 |
| `entidades_enderecos` | 19 | 3 | 6 | 94 |
| `execucoes_automacao` | 18 | 4 | 4 | 0 |
| `fechamentos_periodos` | 12 | 3 | 2 | 0 |
| `fornecedores_produtos` | 17 | 5 | 3 | 40 |
| `importacoes_bancarias` | 19 | 3 | 3 | 0 |
| `importacoes_dados` | 15 | 2 | 4 | 0 |
| `importacoes_dados_linhas` | 11 | 2 | 3 | 0 |
| `inventarios` | 19 | 4 | 4 | 0 |
| `inventarios_itens` | 13 | 5 | 1 | 0 |
| `kits_produtos` | 9 | 4 | 0 | 0 |
| `kits_produtos_itens` | 9 | 5 | 1 | 0 |
| `locais_estoque` | 17 | 3 | 5 | 4 |
| `metas_vendas` | 9 | 4 | 2 | 0 |
| `metodos_pagamento` | 20 | 7 | 8 | 10 |
| `movimentacoes_estoque` | 19 | 5 | 5 | 322 |
| `naturezas_operacao_compra` | 13 | 3 | 2 | 4 |
| `notas_fiscais` | 58 | 7 | 13 | 19 |
| `notas_fiscais_arquivos` | 8 | 4 | 1 | 0 |
| `notas_fiscais_eventos` | 19 | 6 | 3 | 58 |
| `notas_fiscais_itens` | 36 | 8 | 6 | 21 |
| `notas_fiscais_pdfs` | 11 | 4 | 6 | 28 |
| `notas_fiscais_retornos` | 18 | 2 | 7 | 16 |
| `notas_fiscais_tentativas` | 23 | 4 | 11 | 28 |
| `notas_fiscais_totais` | 37 | 4 | 3 | 19 |
| `numeracoes` | 5 | 1 | 3 | 9 |
| `operacoes_estoque` | 8 | 2 | 4 | 0 |
| `orcamentos_financeiros` | 11 | 3 | 4 | 0 |
| `orcamentos_financeiros_linhas` | 9 | 4 | 2 | 0 |
| `ordens_servico` | 32 | 7 | 6 | 48 |
| `ordens_servico_arquivos` | 8 | 4 | 1 | 0 |
| `ordens_servico_eventos` | 9 | 3 | 1 | 48 |
| `ordens_servico_itens` | 16 | 6 | 2 | 48 |
| `pagamentos` | 31 | 10 | 9 | 393 |
| `pagamentos_arquivos` | 10 | 4 | 0 | 0 |
| `produtos` | 36 | 5 | 5 | 40 |
| `rateios_financeiros` | 16 | 7 | 6 | 0 |
| `recorrencias_financeiras` | 20 | 3 | 5 | 12 |
| `regras_conciliacao_bancaria` | 15 | 4 | 1 | 0 |
| `regras_lancamento_bancario` | 15 | 6 | 4 | 0 |
| `renegociacoes` | 22 | 6 | 9 | 0 |
| `renegociacoes_parcelas` | 9 | 4 | 4 | 0 |
| `reservas_estoque` | 15 | 8 | 2 | 9 |
| `saldos_estoque` | 10 | 3 | 1 | 80 |
| `servicos` | 22 | 5 | 6 | 20 |
| `tabelas_preco` | 15 | 3 | 4 | 0 |
| `tabelas_preco_itens` | 14 | 6 | 6 | 0 |
| `transacoes_bancarias` | 20 | 5 | 4 | 0 |
| `transferencias_estoque` | 17 | 5 | 3 | 3 |
| `transferencias_estoque_itens` | 7 | 4 | 1 | 3 |
| `transferencias_financeiras` | 17 | 6 | 4 | 6 |
| `vendas` | 63 | 16 | 19 | 315 |
| `vendas_arquivos` | 8 | 4 | 1 | 0 |
| `vendas_eventos` | 10 | 3 | 2 | 321 |
| `vendas_itens` | 20 | 7 | 5 | 391 |
| `vendas_recebimentos_previstos` | 15 | 6 | 2 | 529 |

## Evidências

Os resultados resumidos e reproduções estão em [evidencias.json](evidencias.json). Não há senhas, tokens, nomes de clientes ou conteúdo de PDFs nesse arquivo.
