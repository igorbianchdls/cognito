# Fase 2 — Financeiro gerencial no nível Conta Azul (plano de 08/10/2026, revisado com as decisões)

Detalha a Fase 2 de [plano-erp-nivel-mercado-20261007.md](plano-erp-nivel-mercado-20261007.md).

Público principal: empresas de serviços, com venda eventual de produtos e no cartão.

Mesmo padrão das Fases 0 e 1:

- migração com RLS por contexto (`erp.criar_politicas_padrao`);
- API REST, ferramentas no chat (ChatGPT e Claude) e tela web;
- testes locais em PGlite;
- nada em produção sem confirmação.

## 0. Decisões tomadas (08/10/2026)

| # | Decisão |
| --- | --- |
| D1 | **DRE com 9 grupos fixos.** O usuário cria e organiza as próprias categorias (2 níveis) dentro dos grupos e pode renomear e reordenar os grupos, mas não cria nem apaga grupos. Estrutura e subtotais são iguais para todas as empresas |
| D2 | **Categorias em duas tabelas.** `erp.categorias` fica só com as financeiras (receita e despesa: contas a pagar e a receber, vendas, compras, contratos, rateios). Nova `erp.categorias_cadastro` (uma tabela, com `tipo` produto/serviço/cliente/fornecedor), com cada vínculo protegido pelo tipo |
| D3 | **Cartão pelo modelo da "conta da maquininha"** (como Omie e Conta Azul). A venda é quitada na conta da maquininha, a taxa vira despesa e os repasses ao banco são previstos e conciliados. "Repasse de uma vez" (antecipação) é o padrão; "parcelado" é configurável por forma de pagamento |
| D4 | **Sem alçada/aprovação de pagamentos.** O ERP registra pagamentos feitos fora (no banco), não paga; a permissão `erp.financeiro.baixar`, o histórico e o comprovante anexado bastam. Volta com a integração bancária (CNAB, API do banco, Open Finance) |
| D6 | **Categorias que não entram na DRE.** Cada categoria financeira tem um grupo da DRE ou a opção "Não entra na DRE" (empréstimos, aportes, distribuição de lucros, compra de equipamentos): movimentam dinheiro, mas não são receita nem despesa |
| D7 | **Aba Relatórios enxuta.** Dos 14 relatórios atuais ficam 5, organizados por pergunta: **DRE**, **Fluxo de caixa**, **Contas em atraso** (receber e pagar numa tela), **Vendas** (agrupar por cliente, vendedor, produto ou serviço) e **Compras** (agrupar por fornecedor ou categoria). Saem do menu: Resultado por competência (vira a DRE), Resultado dos pagamentos (DRE em visão caixa), Posição financeira (repete os resumos dos títulos), Comissões (já existe Vendas → Comissões), Saídas e estoque atual e Valor do estoque (pertencem ao Estoque). Na Fase 2 entram Margem (2D) e Orçado × realizado (2E). Outros relatórios só entram depois, se fizerem falta |
| D5 | **Integração contábil e acesso do contador fora da Fase 2.** Ficam para depois, com o layout do sistema contábil de um cliente real |
| — | Já decididos antes: sem cartão de crédito empresarial (2.3); cartão só na versão simples (2.5) |

## 1. O que já existe (levantado no código e no schema)

| Item | Já existe | Falta |
| --- | --- | --- |
| 2.1 DRE | Relatórios "Resultado por competência" e "DRE caixa" somando por categoria; linha "Devoluções de vendas"; `categorias.categoria_pai_id`, `entrada_dre`, `considera_custo_dre` (nenhum código lê). `categorias.tipo` mistura receita/despesa com produto/serviço/cliente/fornecedor/geral (45 categorias, todas raiz) | Grupos da DRE e subtotais, separação das categorias de cadastro, hierarquia em uso |
| 2.7 Receita prevista | `contas_pagar.tipo_lancamento` (previsão/efetivo) e efetivação | O mesmo em `contas_receber` |
| 2.9 Anexos | Tabela `arquivos`, tabelas `*_arquivos` (títulos, vendas, compras, contratos, OS), bucket privado (migração `20261007130000`) | Rotas de upload/download, anexos nas telas, comprovante na baixa |
| 2.4 Conciliação | Importação OFX, `transacoes_bancarias`, sugestões, regras, conciliar/desfazer/ignorar, tela "Conciliação bancária" | CSV, regras na importação, casamento N:1 e 1:N, saldo do extrato × saldo do ERP, uso real (0 transações em produção) |
| 2.5 Cartão | `metodos_pagamento` (nome, tipo); `contas_financeiras` | Conta do tipo maquininha, taxa e prazo na forma de pagamento, repasses previstos |
| 2.2 CMV | `vendas_itens.custo`, `movimentacoes_estoque.custo_unitario` / `custo_medio_apos` | CMV na DRE, CSP, margem |
| 2.6 Orçamento | — | Tudo |

## 2. Etapas

| Etapa | Itens | Estimativa |
| --- | --- | --- |
| **2A** | DRE estruturado + categorias em duas tabelas + receita prevista + limpeza da aba Relatórios | 2 semanas |
| **2A+** | Relatórios Vendas e Compras unificados (agrupar por) | 0,5 semana |
| **2B** | Anexos e comprovante na baixa | 0,5–1 semana |
| **2C** | Conciliação em uso + cartão (conta da maquininha) | 2 semanas |
| **2D** | CMV/CSP e margem | 1 semana |
| **2E** | Orçamento financeiro e metas de venda | 1–1,5 semana |
| **Total** | | **7–8 semanas** |

DRE vem primeiro: cartão (taxa como despesa comercial), CMV e orçamento dependem dos grupos.

## 3. Detalhamento

### 2A — DRE estruturado, categorias e receita prevista

**Grupos da DRE (fixos):**

| # | Grupo | Exemplos | Sinal |
| --- | --- | --- | --- |
| 1 | Receita bruta | Venda de serviços, venda de produtos, contratos | + |
| 2 | Deduções da receita | Simples Nacional (DAS), ISS, ICMS, PIS/COFINS sobre faturamento, devoluções, descontos concedidos | − |
| | **= Receita líquida** | | |
| 3 | Custos (CMV/CSP) | Custo do estoque vendido, serviços terceirizados para o cliente, material aplicado | − |
| | **= Lucro bruto** | | |
| 4 | Despesas com pessoal | Salários, pró-labore, encargos, benefícios | − |
| 5 | Despesas administrativas | Aluguel, energia, internet, contador, software | − |
| 6 | Despesas comerciais | Comissões, marketing, taxas de cartão | − |
| | **= Resultado operacional** | | |
| 7 | Resultado financeiro | Rendimentos e juros recebidos (+); juros pagos, multas, tarifas, IOF (−) | ± |
| 8 | Resultado não operacional | Venda de equipamento, indenizações | ± |
| | **= Lucro antes do IR** | | |
| 9 | Impostos sobre o lucro | IRPJ e CSLL (Presumido/Real; vazio no Simples) | − |
| | **= Lucro líquido** | | |

**Modelo** (migração `…_erp_dre_categorias.sql`):

- `erp.dre_grupos`:
  - colunas `empresa_id`, `codigo` (fixo, 1–9), `nome` e `ordem` (editáveis), `natureza`, `sinal`;
  - os 9 grupos são criados para cada empresa, inclusive as novas, por trigger;
  - não é possível inserir nem excluir grupos.
- `categorias.dre_grupo_id`:
  - obrigatório para categorias novas;
  - as existentes ficam nulas até a classificação e aparecem na linha "Não classificado".
- Hierarquia: `categoria_pai_id` com no máximo 2 níveis. Lançamento só na folha. A subcategoria herda o grupo da pai.
- `categorias.tipo` restrito a `receita` / `despesa`.
- `categorias.fora_dre` (boolean): "Não entra na DRE". É diferente de "Não classificado" (grupo nulo e `fora_dre` falso), que significa "falta classificar". Exemplos: empréstimo recebido, pagamento do principal, aporte de sócio, distribuição de lucros, compra de equipamento.
- `erp.categorias_cadastro`:
  - colunas `empresa_id`, `tipo` (`produto` | `servico` | `cliente` | `fornecedor`), `nome`, `categoria_pai_id`, `ativo`, `versao`;
  - unicidade `(empresa_id, id, tipo)`;
  - `produtos`, `servicos` e `entidades` ganham a coluna fixa do tipo, e a chave composta impede apontar para uma categoria do tipo errado.
- **Migração dos dados**, sempre com conferência aprovada antes de aplicar:
  1. Copiar as categorias de cadastro para a tabela nova (com de-para de ids).
  2. Reapontar produtos, serviços e entidades.
  3. Marcar como excluídas, sem apagar, as categorias de cadastro na tabela financeira.
  4. `geral`: decidir pelo uso real. Usada em títulos ou vendas, é financeira; em cadastros, é de cadastro; nos dois, é duplicada.
  5. Entidade que é cliente e fornecedor ao mesmo tempo: fica com a categoria do papel principal; os casos são listados na conferência.
  6. Sugestão automática do grupo da DRE pelo nome das categorias, confirmada pelo usuário na tela (nada reclassificado em silêncio).
  7. Sugestão de `fora_dre` por nome (empréstimo, financiamento, aporte, lucros, equipamento, veículo), confirmada pelo usuário.
- `contas_receber.tipo_lancamento` (`previsao` | `efetivo`, padrão `efetivo`) e `efetivado_em`, com efetivação igual à de contas a pagar.

**Relatórios:**

- **Relatórios → DRE** (`/erp/relatorios/dre`, primeiro item da aba; a rota hoje desativada volta a funcionar):
  - período (mês, trimestre, ano, personalizado) e visão **Competência** ou **Caixa**;
  - os 9 grupos com subtotais e % sobre a receita líquida;
  - até 12 colunas mensais com total e comparação com o período anterior;
  - drill-down grupo → categoria → lançamentos;
  - linha "Não classificado" em destaque, com link para classificar.
- **Limpeza da aba (D7)**: o menu fica com DRE, Fluxo de caixa e Contas em atraso; Vendas e Compras unificados entram na 2A+.
  - Endereços antigos não quebram: `dre-competencia` e `dre-caixa` levam à DRE na visão correspondente; `aging-receber` e `aging-pagar` levam a Contas em atraso; `vendas-*` e `compras-*` levam a Vendas/Compras com o agrupamento certo; `comissoes` leva a Vendas → Comissões; `posicao-financeira` leva a Financeiro; `giro-estoque` e `valor-estoque` levam a Estoque.
  - Links dos dashboards apontam para os novos destinos.
  - A aba Relatórios abre na DRE.
- **Chat**: `consultar_relatorio` continua respondendo as mesmas perguntas; os tipos antigos são aceitos e convertidos (ex.: `vendas-vendedores` → Vendas agrupado por vendedor), então nenhuma pergunta deixa de ter resposta.
- Fluxo de caixa projetado inclui receitas previstas, marcadas como "previsto".

**Chat:**

- `consultar_relatorio` com `dre` estruturado;
- `classificar_categoria` (escrita);
- previsão e efetivação de receita.

**Telas:**

- Cadastros → Categorias financeiras: árvore, grupo da DRE, filtro "Não classificadas".
- Categorias de cadastro: dentro das telas de produtos, serviços, clientes e fornecedores.
- Relatórios → DRE (nova), Contas em atraso (receber/pagar numa tela); na 2A+, Vendas e Compras com "agrupar por".
- Configurações → nomes e ordem dos grupos.

**Testes:**

- DRE com receita, dedução, devolução, CSP, despesas, financeiro e não operacional: subtotais centavo a centavo.
- Linha "Não classificado"; categoria "Não entra na DRE" fora da DRE e presente no fluxo de caixa.
- O banco recusa produto em categoria de cliente.
- Migração das categorias com o de-para conferido.
- Previsão de receita entra no fluxo projetado e sai ao efetivar.
- Menu de Relatórios com os itens novos; endereços antigos redirecionam; links dos dashboards abrem destinos válidos.
- Chat: cada tipo antigo de `consultar_relatorio` ainda responde (smoke do ChatGPT e do Claude).

### 2B — Anexos e comprovante na baixa

- Rotas:
  - `POST /api/erp/arquivos`: URL assinada de upload; PDF, imagem e XML; até 10 MB; limite total por empresa configurável.
  - `GET /api/erp/arquivos/[id]`: URL assinada de download, de curta duração, após checar o vínculo com a empresa.
- Vínculo pelas tabelas `*_arquivos` existentes.
- `pagamentos.arquivo_id` para o comprovante da baixa.
- Componente único de anexos nas telas de título, venda, compra, contrato e OS, e "anexar comprovante" na baixa.
- Chat: listar anexos e devolver link assinado (somente leitura).
- Testes:
  - upload e download só da própria empresa;
  - tipo e tamanho validados;
  - comprovante ligado à baixa e preservado no estorno.

### 2C — Conciliação em uso e cartão (conta da maquininha)

**Conciliação:**

- **Importação CSV**:
  - mapeamento de colunas (data, descrição, valor ou crédito/débito, documento) salvo por conta financeira;
  - modelos prontos para bancos comuns, a confirmar com arquivos reais;
  - mesma deduplicação do OFX.
- **Regras na importação**: `regras_conciliacao_bancaria` aplicadas automaticamente. Por exemplo, tarifa, IOF e rendimento sem título viram lançamento na categoria da regra.
- **Casamentos N:1 e 1:N**: um PIX pagando várias parcelas, ou uma parcela paga em vários depósitos (`conciliacoes_bancarias_itens`).
- **Saldo**:
  - saldo do extrato × saldo do ERP na data, com a diferença destacada;
  - "conciliado até" por conta.
- Fechamento de período avisa se há transações não conciliadas no mês.

**Cartão (D3):**

- `contas_financeiras.tipo` ganha `maquininha` (Stone, Cielo, Mercado Pago…).
- `metodos_pagamento`:
  - `modalidade` (`dinheiro` | `pix` | `boleto` | `debito` | `credito_vista` | `credito_parcelado` | `transferencia` | `outro`);
  - `taxa_percentual`;
  - `taxa_fixa`;
  - `prazo_repasse_dias`;
  - `conta_maquininha_id`;
  - `conta_destino_id` (banco);
  - `repasse` (`unico` (padrão) | `parcelado`).
- **Baixa de recebimento no cartão**, automática:
  1. Quita o título pelo valor bruto, com entrada na conta da maquininha.
  2. Lança a taxa como despesa na categoria "Taxas de cartão" (grupo 6) e debita a maquininha.
  3. Cria os repasses previstos (um, ou um por parcela) como transferências previstas da maquininha para o banco, visíveis no fluxo de caixa na data do crédito.
- **Conciliação do repasse**:
  - o crédito no extrato casa com o repasse previsto e o efetiva;
  - se o valor for diferente, a diferença aparece como "taxa divergente" para o usuário lançar ou contestar (a conferência de taxa citada pelo Conta Azul).
- Estorno da baixa desfaz a taxa e cancela os repasses ainda não efetivados.
- Fora do escopo: arquivo EDI da adquirente, antecipação avulsa, chargeback.

**Testes:**

- CSV de 2 layouts.
- Duplicidade ignorada.
- Regra cria tarifa.
- N:1 e 1:N.
- Diferença de saldo.
- R$ 100 no crédito, 3,5%, D+30, repasse único: título quitado em 100, despesa de 3,50, repasse previsto de 96,50 em D+30, conciliação efetiva o repasse.
- Parcelado em 3x com repasse parcelado: 3 repasses mensais.
- Estorno desfaz tudo.

### 2D — CMV, CSP e margem

- **CMV**:
  - custo das saídas de estoque por venda (`movimentacoes_estoque` × custo médio no momento), por competência da saída (atendimento);
  - devolução estorna pelo custo da saída original;
  - entra no grupo 3 da DRE como linha de sistema, sem título financeiro;
  - venda faturada e ainda não atendida aparece como aviso.
- **CSP**:
  - categorias de despesa classificadas no grupo 3 (terceirizados, material aplicado);
  - produtos consumidos em OS entram pelo custo da saída;
  - sem rateio de mão de obra nesta fase.
- **Margem** por venda, produto, serviço e cliente: receita líquida − custo, em valor e %. Usa o custo real da saída quando houver, senão `vendas_itens.custo`.
- O relatório aponta produtos com saída e custo zero (custo médio incompleto).
- Testes:
  - venda atendida com custo médio de 12 → CMV de 12 × quantidade;
  - devolução estorna;
  - venda não atendida sem CMV;
  - produto consumido em OS vira CSP.

### 2E — Orçamento financeiro e metas de venda

- `erp.orcamentos_financeiros`: `ano`, `nome`, `status` (`rascunho` | `aprovado`), `versao`.
- `erp.orcamentos_financeiros_linhas`: `categoria_id`, `centro_custo_id` opcional, `mes`, `valor`. Consolida por grupo da DRE.
- Criação rápida:
  - "copiar realizado do ano anterior";
  - "+ x %";
  - "distribuir valor anual igualmente".
- Relatório orçado × realizado por mês e acumulado, na estrutura da DRE, com desvio em valor e %.
- `erp.metas_vendas`: `vendedor_id` opcional, `mes`, `valor`. Atingimento por vendedor, respeitando o escopo da 1.7: o vendedor restrito vê só a própria meta.
- Chat:
  - `consultar_relatorio` com `orcado_realizado` e `metas`;
  - escrita só para meta (orçamento completo é tarefa de tela).

## 4. Migrações previstas (ordem)

1. `…_erp_dre_categorias.sql`: grupos da DRE, `categorias.dre_grupo_id`, `categorias_cadastro` e migração dos vínculos, `contas_receber.tipo_lancamento`.
2. `…_erp_anexos.sql`: `pagamentos.arquivo_id`, políticas do Storage por empresa, limites.
3. `…_erp_conciliacao_cartao.sql`: mapeamentos CSV, saldo do extrato, conta maquininha, colunas do cartão em `metodos_pagamento`, repasses previstos.
4. `…_erp_cmv.sql`: linha de sistema do CMV, índices de saída por origem.
5. `…_erp_orcamento_metas.sql`.

Cada uma com teste local e entrada no roteiro de produção. A 1 mexe em dados existentes (categorias): a conferência sai antes, para aprovação.

## 5. Fora da Fase 2 (para quando vierem as integrações)

- Integração contábil: plano de contas contábil, de-para, exportação nos layouts dos sistemas contábeis, perfil/portal do contador (D5).
- Pagamentos de verdade:
  - arquivo de remessa CNAB (primeiro passo, sem licença);
  - API do banco do cliente;
  - Open Finance (exige ITP ou parceiro);
  - alçadas de aprovação junto com eles (D4).
- Conciliação por arquivo EDI de adquirentes.

## 7. Andamento — 08/10/2026 (código e migrações; nada aplicado em produção)

| Etapa | Situação |
| --- | --- |
| 2A DRE e categorias | **Pronto.** 9 grupos fixos (nome/ordem editáveis), categorias financeiras com grupo, "Não entra na DRE" e 2 níveis (subcategoria herda o grupo), lançamento só na folha; categorias de cadastro em tabela própria (módulo Cadastros → Categorias de cadastro) com o tipo protegido pela chave; receita prevista com efetivação (tela, API e chat `efetivar_previsao`); Relatórios → DRE (competência/caixa, subtotais, % sobre a receita líquida, mês a mês, período anterior, detalhamento até o lançamento); aba Relatórios com DRE, Fluxo de caixa, Contas em atraso, Margem, Orçado × realizado, Vendas e Compras (endereços antigos redirecionam; o chat aceita os tipos antigos e `dre`) |
| 2B Anexos | **Pronto.** Envio direto ao bucket privado por link assinado, confirmação, download por link de 60 s, permissão do módulo do documento conferida no banco, limite por arquivo (10 MB) e por empresa; anexos em títulos, vendas, compras, contratos, OS e comprovante na baixa; anexos de vendas, contratos, OS e contas a receber são preservados (não se removem); chat `listar_anexos` |
| 2C Conciliação e cartão | **Pronto.** Importação CSV com mapeamento salvo por conta e saldo do extrato (OFX e CSV); regras de lançamento (tarifa, IOF, rendimento → título pago e conciliado); casamento parcial (vários pagamentos numa transação e vice-versa) já existente; saldo extrato × ERP e "conciliado até"; aviso no fechamento com transações pendentes; Financeiro → Formas de pagamento com a conta da maquininha (taxa como despesa, repasse único ou parcelado, transferências pendentes conciliadas com o crédito do banco, estorno desfaz); fluxo de caixa considera o repasse, não a maquininha |
| 2D CMV e margem | **Pronto.** CMV pelo custo das saídas de estoque das vendas (devolução estorna) no grupo 3 da DRE por competência; Relatórios → Margem por venda, item e cliente (custo real ou estimado do cadastro, aviso de custo zero) |
| 2E Orçamento e metas | **Pronto.** Financeiro → Orçamento (grade categoria × mês, valor anual distribuído, cópia do realizado com reajuste, rascunho/aprovado); Relatórios → Orçado × realizado pelos grupos da DRE; Vendas → Metas (empresa ou vendedor, atingimento; vendedor restrito vê só a dele); chat `consultar_relatorio` com `orcado-realizado`, `metas` e `margem-*` |

Testes: `erp:api-http-smoke` com os cenários 2A, 2B, 2C e 2D/2E (27 verificações no total) e `node scripts/erp/fase2-categorias-smoke.mjs` (migração das categorias, 7 verificações), em banco local com dados fictícios.

Ficou de fora desta entrega: escrita de meta pelo chat (só consulta), conciliação por arquivo EDI de adquirente.

## 6. Riscos

- **Reclassificação de categorias** muda relatórios conhecidos. Mitigação: conferência antes, linha "Não classificado" visível e relatório antigo disponível na transição.
- **Custo médio incompleto no passado** distorce o CMV. Mitigação: o relatório aponta produtos com custo zero.
- **Layouts de CSV de banco** mudam. Mitigação: mapeamento configurável como base.
- **Armazenamento de anexos**. Mitigação: limite por arquivo e por empresa.
- **Produção**: a Fase 2 assume as 8 migrações das Fases 0 e 1 aplicadas antes.
