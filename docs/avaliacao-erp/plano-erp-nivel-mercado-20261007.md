# ERP Cognito → nível Conta Azul / Omie — análise e plano (07/10/2026)

Substitui a [avaliação do schema da manhã](avaliacao-schema-erp-20261007.md) e revisa o [plano de correções](plano-correcoes-erp-20261007.md). Base desta versão:

- leitura **somente leitura** do Supabase de produção: estrutura completa (87 tabelas, 1.582 colunas, 987 restrições, 258 índices, 245 triggers, 303 políticas, 70 funções), estatísticas de uso (`pg_stat_*`, `pg_stat_statements`), planos de execução (`EXPLAIN ANALYZE` em transação somente leitura) e checagens de integridade por contagem — sem ler dados pessoais;
- tempo real das consultas de leitura do ERP, chamadas pelo código da aplicação;
- código do ERP (relatórios, automações, permissões, menu);
- funcionalidades públicas do Omie e do Conta Azul (fontes ao final; onde a fonte pública não confirma, está marcado "a confirmar").

## 1. Veredito

| Dimensão | Nota | Comentário |
| --- | --- | --- |
| Modelo de dados e integridade | **9/10** | Multiempresa com chave composta em todas as FKs, RLS em 100%, livro-razão de estoque imutável, idempotência, versionamento, eventos por domínio. Dados reais sem nenhuma divergência. Acima da média do mercado. |
| Escalabilidade / desempenho | **4/10** | Listas financeiras levam ~2 s com 500 parcelas por causa do desenho das políticas de RLS e do cálculo de saldo. Com o volume de um cliente médio de Omie, ficaria inviável. **Maior risco técnico hoje.** |
| Operação contínua | **5/10** | As automações agendadas não registram nenhuma execução em produção e 12 dos 24 contratos ativos estão com faturamento atrasado desde 01/10. |
| Cobertura funcional (vs. Conta Azul) | **6/10** | Núcleo completo; faltam tabela de preços, comissões, DRE estruturado/CMV, integração contábil, conciliação em uso, fiscal e cobrança. |
| Cobertura funcional (vs. Omie) | **4,5/10** | Além do acima: lote/validade, grade, CRM/funil, produção, aprovações, limite de crédito, curva ABC/sugestão de compra, marketplaces. |

Conclusão: a **fundação é de ERP profissional** e não precisa ser refeita. O caminho até o nível de mercado tem duas partes: (1) **uma fase curta de estabilidade e escala**, que o plano anterior não previa, e (2) **módulos novos** sobre a base atual.

## 2. Análise do plano anterior

**O que continua certo:** data comercial por fuso da empresa, relatórios de fluxo de caixa/aging/DRE por competência, acentuação, contexto do banco em uma instrução por transação, backup, anexos, concorrência. Essas etapas foram executadas no código.

**O que o plano subestimou ou não viu (achados desta análise):**

| Achado | Por que o plano não pegou |
| --- | --- |
| RLS avaliada linha a linha (seção 3.1) | A etapa 4 otimizou idas ao banco, mas o custo está **dentro** do banco, por linha |
| Saldo da parcela recalculado ~13 vezes por linha (3.2) | Só aparece no plano de execução real |
| Automações sem execução em produção (3.3) | Testes locais passam; a falha é de ambiente (agendamento/variável/log) |
| DRE sem estrutura (3.4) | O relatório "funciona", mas não é um DRE gerencial: as marcações `entrada_dre`/`considera_custo_dre` nunca são lidas e não há CMV |
| 127 FKs sem índice de apoio (3.5) | Irrelevante com 13 MB; decisivo com 100× o volume |
| Status `vencido` gravado e numeração `Date.now()` (3.6) | Vistos só com os dados reais |

**O que muda na ordem:** antes de qualquer módulo novo, uma **Fase 0 — estabilidade e escala** (seção 5). Módulos novos multiplicam linhas e consultas; construí-los sobre a RLS atual tornaria cada tela mais lenta.

## 3. Achados técnicos novos

### 3.1 Políticas de RLS executam funções por linha — crítico para escala

Todas as tabelas usam políticas como `shared.can_read_erp_module(empresa_id, 'financeiro')` e `shared.has_erp_capability(empresa_id, 'erp.X.gerenciar')`. Como a função recebe a coluna `empresa_id`, o Postgres a executa **para cada linha lida**, e cada execução consulta vínculo, perfil, permissões e usuário. Há 253 políticas para `PUBLIC` e 50 para `erp_runtime`, avaliadas juntas.

Evidência (empresa 1, `EXPLAIN ANALYZE` da lista de contas a receber): varredura de índice em `entidades` com 45 linhas = 46 ms (~1 ms por linha); cada consulta de pagamentos por parcela ≈ 0,5 ms mesmo sem encontrar linhas; execução total 802 ms no banco para 247 parcelas. Medido pela aplicação:

| Consulta | Tempo |
| --- | --- |
| Contas a receber, página 1 | 2,2–2,3 s |
| Contas a pagar, página 1 | 1,7–1,8 s |
| Fluxo de caixa / posição financeira | 1,2–1,4 s |
| Visão geral, pedidos | ~1,1 s |
| Pagamentos (referência, sem composição) | 0,36 s |

`pg_stat_statements` mostra consultas históricas de 4,5–5,4 s e a consulta de dashboard mais chamada com média de 1,7 s (177 chamadas).

**Correção:** como o servidor já define `app.erp_tenant_id` e `app.erp_user_id` em toda transação, as políticas passam a comparar com valores calculados **uma vez por consulta**:

```sql
-- exemplo de leitura
USING (empresa_id = (SELECT shared.erp_empresa_atual())
       AND (SELECT shared.pode_ler_modulo_atual('financeiro')))
```

`(SELECT …)` sem coluna vira *InitPlan* (avaliado uma vez). Manter as funções atuais só para o acesso direto do papel `authenticated`, se ele continuar existindo (3.7). Validar com os testes de isolamento atuais e medir antes/depois.

### 3.2 Saldo da parcela recalculado várias vezes por linha

`financialCompositionSql` (pagamentos, adiantamentos, renegociações) é expandido em várias colunas da mesma consulta; o plano mostra os mesmos agregados repetidos (`pagamento_4` … `pagamento_13`) por parcela. Correção: calcular a composição **uma vez** por parcela em `LEFT JOIN LATERAL` e reutilizar; avaliar guardar `saldo` na parcela, mantido pelos triggers que já garantem `valor_pago` (hoje 100% consistente).

### 3.3 Automações agendadas sem execução em produção — operacional

- `erp.execucoes_automacao` **não tem nenhuma linha**, embora o cron da Vercel chame `/api/erp/internal/automacoes` todo dia às 05:15 UTC e o executor grave cada rotina nessa tabela.
- **12 dos 24 contratos ativos** têm `proxima_geracao_em = 2026-10-01` (atrasados). As 84 gerações existentes têm a última em 01/10.
- Consequência: faturamento de contratos, recorrências, alerta de estoque mínimo e indicadores não rodam sozinhos.

Hipóteses, em ordem: `CRON_SECRET` ausente no ambiente de produção (a rota responde 503 sem gravar nada); falha antes do primeiro registro (ver logs da Vercel); implantação sem o cron. Ação: conferir variável e logs, executar uma vez manualmente **com confirmação** (gera vendas e títulos) e criar alerta quando uma rotina não roda há mais de 26 h.

### 3.4 DRE e CMV

- O relatório "Resultado por competência" soma receitas e despesas por categoria. As colunas `categorias.entrada_dre` e `considera_custo_dre` existem, mas **nenhum código as lê**.
- Não existe estrutura de DRE (receita bruta → deduções → receita líquida → CMV/CSP → lucro bruto → despesas operacionais → resultado financeiro → impostos → lucro líquido).
- Não há **CMV** a partir do custo médio do estoque (`movimentacoes_estoque` de saída por venda já tem `custo_unitario`). Para comércio, sem CMV o DRE não mostra margem real.
- As 45 categorias são todas raiz (sem hierarquia em uso) e misturam classificação financeira (`receita`, `despesa`) com classificação de cadastros (`cliente`, `fornecedor`, `produto`, `servico`).
- O banco aceita rateio só com `percentual` (`valor` nulo); os relatórios assumem `valor`. A aplicação sempre grava `valor`, mas o banco deveria exigir.

### 3.5 Índices

- **127 chaves estrangeiras sem índice** que comece por elas (além de `empresa_id`). Hoje não pesa (13 MB); com volume, deixa lentos os relatórios por categoria, vendedor, produto e centro de custo, as telas de histórico e qualquer exclusão de cadastro (o `RESTRICT` varre as tabelas filhas). Não criar as 127: priorizar as usadas em filtros e relatórios — `vendas(vendedor_id)`, `vendas_itens(produto_id)`, `compras_itens(produto_id)`, `*(categoria_id)` e `*(centro_custo_id)` em títulos e documentos, `contratos_vendas(cliente_id)`, `ordens_servico(cliente_id)`, `reservas_estoque(venda_id)`, tabelas de eventos por documento (`contas_pagar_eventos` já tem 994 linhas), `documentos_estoque_itens(documento_estoque_id)`, `movimentacoes_estoque(documento_estoque_id)`.
- 1 índice duplicado (`pagamentos_estorno_idx` = `pagamento_reversao_unica_idx`); 17 índices nunca usados (192 kB) — revisar depois de medir com carga.

### 3.6 Já apontados de manhã (confirmados)

1. Status `vencido` gravado pela automação (28 parcelas) apaga o "parcial"; 89 atrasadas pela data continuam `aberto`/`parcial`. Tornar só calculado.
2. Numeração com `Date.now()` quando o número não é informado (2 vendas). Criar numeração sequencial por empresa.
3. 12 colunas com `DEFAULT CURRENT_DATE` (UTC).
4. Contato/endereço em dois lugares (sincronizados; 0 divergências).
5. `produtos.formato='variacao'` sem tabela de variações; `vendas.tipo_documento='pedido'` sem uso; `compras.tipo_movimento` repete `status`; `vendas.situacao`, `vendas.origem` e `produtos.origem` sem restrição de valores; `metodos_pagamento`/`centros_custo` sem `versao`.
6. 40/40 produtos sem NCM (bloqueia NF-e).

### 3.7 Segurança e permissões

- `authenticated` tem SELECT em 70 tabelas e escrita em 17 do schema `erp`, com uso do schema liberado. O servidor usa `erp_runtime`. **Decidir:** se nenhum cliente acessa o Supabase direto, revogar; se a intenção é permitir, documentar e testar. Hoje é superfície de ataque sem uso aparente.
- Bom: funções privilegiadas com `search_path` fixo; nenhum `password_hash` preenchido (coluna legada, pode sair); Vault disponível para segredos fiscais (`configuracoes_fiscais` já guarda só a referência `token_secret_ref`).
- Permissões: 15 capacidades e 6 perfis. Falta o que ERPs de mercado oferecem: **escopo por registro** (vendedor vê só as próprias vendas e clientes), **limites** (desconto máximo, valor máximo de pagamento) e **alçadas de aprovação**.

### 3.8 Assimetria financeira

`contas_pagar` tem `tipo_lancamento` (`previsao`/`efetivo`); `contas_receber` não. Receitas previstas (ex.: projeção de vendas, contratos ainda não gerados) não entram no planejamento de caixa como as despesas previstas.

## 4. Comparativo funcional

Legenda: ✅ completo · 🟡 parcial · ⬜ estrutura no banco, sem uso · ❌ ausente.

| Área | Funcionalidade | Conta Azul | Omie | Cognito hoje |
| --- | --- | --- | --- | --- |
| Vendas | Orçamento → venda, parcelas, atendimento | ✅ | ✅ | ✅ |
| | Pedido de venda (antes do faturamento) | ✅ | ✅ | 🟡 tipo existe, sem uso |
| | **Tabela de preços** (por cliente/canal, mín./máx., desconto) | a confirmar | ✅ | ❌ |
| | **Comissões** de vendedores | a confirmar | ✅ | ❌ (vendedor em 50% das vendas) |
| | **Limite de crédito / consulta de crédito** | 🟡 | ✅ | ❌ |
| | Devolução de venda (financeiro + estoque) | ✅ | ✅ | 🟡 só estoque |
| | Contratos recorrentes | ✅ | ✅ | ✅ (automação parada) |
| | Ordens de serviço | ✅ | ✅ | ✅ |
| | CRM / funil de oportunidades | 🟡 | ✅ | ❌ |
| | PDV / NFC-e | 🟡 | ✅ | ❌ |
| | Marketplaces / e-commerce | ✅ | ✅ | ❌ |
| Compras | Cotação, pedido, recebimento parcial | ✅ | ✅ | ✅ |
| | Entrada por XML da NF-e | ✅ | ✅ | ⬜ (origem `xml`, de-para por fornecedor) |
| | Sugestão de compra por giro / curva ABC | 🟡 | ✅ | 🟡 relatório de giro |
| | Aprovação por alçada | ❌ | ✅ | ❌ |
| Financeiro | Pagar/receber, parcelas, juros/multa/taxa, estorno | ✅ | ✅ | ✅ |
| | Centro de custo, rateio | ✅ | ✅ | ✅ |
| | Adiantamentos, renegociação | 🟡 | ✅ | ✅ |
| | Fluxo de caixa realizado + previsto | ✅ | ✅ | ✅ (sem receita prevista) |
| | **DRE gerencial estruturado com CMV** | ✅ | ✅ | 🟡 por categoria, sem CMV |
| | Cartão de crédito empresarial (faturas) | ✅ | ✅ | fora do escopo |
| | **Conciliação bancária** (OFX/Open Finance) | ✅ | ✅ | ⬜ (0 conciliações) |
| | **Conciliação de cartões / recebíveis** | ✅ | 🟡 | ❌ |
| | Orçamento empresarial / metas | ✅ | ✅ | ❌ |
| | Conta digital PJ | ✅ | ✅ (Omie.Cash) | ❌ (fora de escopo) |
| | Fechamento de período | 🟡 | ✅ | ✅ |
| Contábil | **Portal/exportação para o contador, plano de contas** | ✅ | ✅ | ❌ |
| Fiscal | NF-e, NFS-e, NFC-e, cálculo de impostos | ✅ | ✅ | ⬜ (estrutura + simulador) |
| | Regras tributárias por NCM/UF/CFOP | ✅ | ✅ | ❌ |
| Cobrança | Boleto, Pix, link de cartão, régua de cobrança | ✅ | ✅ | ⬜ |
| Estoque | Ledger, custo médio, locais, inventário, transferências, kits | ✅ | ✅ | ✅ |
| | **Lote e validade** | 🟡 | ✅ | ❌ |
| | Número de série | ❌ | 🟡 | ❌ (só em OS) |
| | Grade (variações) | 🟡 | ✅ | ❌ |
| | Produção (estrutura, ordem de produção) | ❌ | ✅ | ❌ |
| Plataforma | Multiempresa, perfis | ✅ | ✅ | ✅ |
| | Escopo por registro, limites, aprovações | 🟡 | ✅ | ❌ |
| | Importação de dados | ✅ | ✅ | ✅ |
| | API pública e webhooks | ✅ | ✅ | 🟡 (API interna) |
| | **Operar pelo chat (ChatGPT/Claude)** | ❌ | ❌ | ✅ diferencial |

## 5. Plano

Tamanhos: P ≈ até 1 semana, M ≈ 2–3 semanas, G ≈ 4+ semanas (uma pessoa, com testes).

### Fase 0 — Estabilidade e escala (antes de módulos novos)

| # | Entrega | Tam. | Critério de pronto |
| --- | --- | --- | --- |
| 0.1 | **RLS sem função por linha** (3.1): funções `shared.erp_empresa_atual()`, `pode_ler_modulo_atual()`, `pode_atual(capacidade)` + reescrita das 303 políticas por migração gerada | M | Testes de isolamento atuais passam; lista de contas a receber < 300 ms no banco atual; teste de carga com 100 mil parcelas sintéticas em banco local < 500 ms por página |
| 0.2 | **Composição de saldo uma vez por parcela** (3.2), opcionalmente `saldo` mantido por trigger | M | Mesmo resultado das somas independentes (testes atuais); plano sem subconsultas repetidas |
| 0.3 | **Automações em produção** (3.3): diagnosticar, corrigir, rodar uma vez com confirmação, alerta de rotina parada | P | `execucoes_automacao` com registros diários; contratos sem atraso |
| 0.4 | Índices priorizados (3.5) e remoção do duplicado | P | Relatórios por categoria/vendedor/produto usam índice |
| 0.5 | `vencido` só calculado + migração dos 28 registros (3.6) | P | Nenhuma parcela gravada como `vencido`; filtros e resumos iguais |
| 0.6 | **Numeração sequencial** `erp.numeracoes(empresa_id, tipo, serie, proximo)` com bloqueio transacional; formatos configuráveis | P | Sem `Date.now()`; concorrência sem buraco nem repetição |
| 0.7 | Defaults de data pelo fuso da empresa; aplicar migrações pendentes (fuso, bucket) | P | Nenhum `CURRENT_DATE` em colunas de negócio |
| 0.8 | Decisão e ajuste de `authenticated` (3.7); `rateios.valor NOT NULL`; restrições em `situacao`/`origem` | P | Grants documentados ou revogados |
| 0.9 | Observabilidade: `pg_stat_statements` revisado semanalmente, tempo por rota na API, alerta > 1 s | P | Painel/rotina com as 10 consultas mais lentas |

### Fase 1 — Comercial competitivo

| # | Módulo | Modelo de dados (resumo) | Tam. |
| --- | --- | --- | --- |
| 1.1 | **Tabelas de preço** | `tabelas_preco(id, nome, tipo: padrao/cliente/canal, vigencia, ativo)`, `tabelas_preco_itens(tabela_id, produto_id/servico_id, preco, preco_minimo, desconto_max_percentual, quantidade_minima)`, `entidades.tabela_preco_id`; venda grava `tabela_preco_id` e preço de origem no item | M |
| 1.2 | **Comissões** | `comissoes_regras(vendedor_id?, produto_id?/categoria_id?, percentual, base: faturamento/recebimento)`, `comissoes_lancamentos(venda_id, vendedor_id, base, valor, competencia, status: prevista/liberada/paga/estornada)`, geração por evento de venda ou recebimento; pagamento vira conta a pagar | M |
| 1.3 | **Limite de crédito e bloqueios** | `entidades.limite_credito`, `bloqueio_comercial`; checagem na confirmação da venda (saldo em aberto + vencidos) com liberação por permissão | P |
| 1.4 | **Pedido de venda** (usar `tipo_documento='pedido'`): orçamento → pedido → faturamento (venda); separação de pedido e faturamento parcial | M |
| 1.5 | **Devolução comercial** | `devolucoes(origem venda/compra, motivo, status)` + itens; gera documento de estoque, estorno/crédito financeiro (via `adiantamentos`) e, na fase fiscal, NF de devolução | M |
| 1.6 | **Transporte na venda** | `vendas.transportadora_id, modalidade_frete, volumes, peso_bruto, peso_liquido` (exigido pela NF-e) | P |
| 1.7 | **Permissões por escopo e limites** | `perfis.escopo_vendas: todas/proprias`, `desconto_maximo`, `valor_maximo_pagamento`; aplicado na API e nas políticas | M |

### Fase 2 — Financeiro e contábil no nível Conta Azul

> Revisada em 08/10/2026: detalhamento e decisões em [plano-fase2-financeiro-20261008.md](plano-fase2-financeiro-20261008.md). Fora da Fase 2: integração contábil (2.8) e alçadas de pagamento, que vêm com as integrações bancárias e fiscais.

| # | Módulo | Modelo de dados (resumo) | Tam. |
| --- | --- | --- | --- |
| 2.1 | **DRE gerencial estruturado** | `dre_grupos` (modelo padrão: receita bruta, deduções, CMV/CSP, despesas operacionais, financeiras, impostos sobre o lucro, não operacionais) e `categorias.dre_grupo_id`; categorias financeiras separadas das de cadastro; hierarquia em uso | M |
| 2.2 | **CMV pelo estoque** | custo das saídas por venda a partir de `movimentacoes_estoque` (custo médio) no DRE e na margem por venda/produto | M |
| 2.3 | ~~Cartão de crédito empresarial~~ | **Fora do escopo** (decisão de 08/10/2026: o ERP não terá controle de cartão de crédito da empresa) | — |
| 2.4 | **Conciliação bancária em uso** | ativar importação OFX/CSV já modelada, sugestão automática com `regras_conciliacao_bancaria`, tela de conciliação; Open Finance depois | M |
| 2.5 | **Taxa e prazo do cartão (versão simples)** | Decisão de 08/10/2026 (público principal: serviços, com vendas eventuais no cartão): `metodos_pagamento.taxa_percentual` e `prazo_credito_dias` (por modalidade: débito, crédito à vista, parcelado); ao registrar um recebimento no cartão, o ERP calcula a taxa e a data de crédito e o fluxo de caixa usa o líquido na data certa. Sem integração com adquirentes (Stone, Cielo, Rede) por enquanto. Prioridade baixa, no fim da Fase 2 | P |
| 2.6 | **Orçamento e metas** | `orcamentos_financeiros(ano)`, `orcamentos_linhas(categoria_id/centro_custo_id, mes, valor)`; relatório previsto × realizado; metas de venda por vendedor | M |
| 2.7 | **Receita prevista** | `contas_receber.tipo_lancamento` (simetria com pagar) | P |
| 2.8 | **Integração contábil** | `plano_contas_contabil` (modelo referencial), `categorias.conta_contabil_id`, `contas_financeiras.conta_contabil_id`; exportação de lançamentos (CSV/layout dos principais sistemas contábeis) e acesso de leitura para o contador | G |
| 2.9 | Anexos em uso (bucket privado) e comprovantes em pagamentos | P |

### Fase 3 — Fiscal e cobrança (já planejada; ajustes desta análise)

- Regras tributárias: `regras_tributarias(ncm, uf_origem, uf_destino, operacao, cfop, cst/csosn, aliquotas)` e grupos de tributação por produto; NCM obrigatório para produto vendável.
- Certificado A1, senhas e tokens no **Supabase Vault** (já instalado), nunca em tabela lida pelo `erp_runtime`.
- Séries e numeração da NF-e por CNPJ/série usando a numeração da Fase 0.
- Entrada por XML de NF-e de compra com o de-para `fornecedores_produtos` existente.
- Cobrança: boleto/Pix/link com a estrutura `cobrancas*` existente; régua de lembretes; baixa automática pelo retorno.
- Retenção de XML e eventos por 5 anos, imutáveis (bucket privado + trigger, como no estoque).

### Fase 4 — Recursos do Omie

| Módulo | Resumo | Tam. |
| --- | --- | --- |
| Lote e validade | `lotes(produto_id, codigo, fabricacao, validade)`; `lote_id` em movimentações, saldos por lote, FEFO na reserva | G |
| Número de série | `series_produto` ligado a entrada/saída | M |
| Grade (variações) | `produtos_variacoes` com atributos e SKU próprio; estoque por variação | G |
| CRM | `oportunidades(etapa, valor, probabilidade, responsavel)` + atividades; conversão em orçamento | M |
| Compras inteligentes | sugestão por giro, ponto de reposição (já no produto), curva ABC | M |
| Aprovações | `aprovacoes(documento, alcada, aprovador, status)` para compras e pagamentos | M |
| Produção | estrutura de produto (BOM), ordem de produção com consumo e entrada | G |
| Integrações | API pública versionada, webhooks, marketplaces/e-commerce | G |

### Em todas as fases

- Cada módulo novo entra também no chat (ChatGPT e Claude): consultas, escritas em duas etapas e cards — o diferencial que nenhum dos dois concorrentes tem.
- Testes: banco local com volume sintético (100 mil parcelas, 50 mil vendas) para cada consulta nova; isolamento entre empresas; concorrência.
- Dívida técnica conhecida: dividir `erpRepository.ts` (4,5 mil linhas) por área; unificar pagar/receber.

## 6. Ordem recomendada e prazos indicativos

| Ordem | Bloco | Duração indicativa |
| --- | --- | --- |
| 1 | Fase 0 completa | 4–6 semanas |
| 2 | 1.1 tabelas de preço, 1.2 comissões, 1.3 limite de crédito, 2.7 receita prevista | 5–7 semanas |
| 3 | 2.1 DRE estruturado + 2.2 CMV | 4–5 semanas |
| 4 | 2.4 conciliação, 1.5 devolução, 1.4 pedido, 1.6 transporte | 6–8 semanas |
| 5 | Fase 3 (fiscal e cobrança) | conforme provedor |
| 6 | 2.8 contábil, 2.6 orçamento, 1.7 permissões | 6–8 semanas |
| 7 | Fase 4 por segmento de cliente | contínuo |

Com os blocos 1 a 5 o produto fica **equivalente ao Conta Azul** no que uma PME de comércio/serviços usa no dia a dia, com o chat como diferencial. A Fase 4 aproxima do Omie.

## Andamento da Fase 0 — 07/10/2026 (código e migrações; nada aplicado em produção)

Roteiro de aplicação: [fase0-aplicacao-producao.md](fase0-aplicacao-producao.md).

| Item | Situação |
| --- | --- |
| 0.1 RLS | `20261008100000_erp_rls_contexto.sql`: 284 políticas reescritas para avaliar a permissão uma vez por consulta na empresa da sessão (equivalente à anterior). Medido no banco real: a consulta de contas a receber leva 559 ms com a RLS atual e 20 ms sem RLS. Matriz de 16 perfis (`read-access-smoke`) idêntica com as políticas novas |
| 0.2 Saldo | `financialCompositionSql` calcula as três somas uma vez por parcela (`OFFSET 0`) |
| **Novo: escrita** | Achado durante a implementação: as validações diferidas percorriam todas as parcelas, títulos, adiantamentos e acordos da empresa a cada linha alterada, e a de conciliação, todos os pagamentos e extratos. `20261008110000_erp_validacao_escopo.sql` valida só os registros afetados e seus vizinhos (mesmas regras: os 42 cenários do `evolution-smoke` passam); a trava por empresa passa a esperar em vez de falhar com 40001 |
| 0.3 Automações | Rotina `titulos_vencidos` só conta; tela de rotinas avisa rotina sem execução em 26 h; a rota do cron registra `CRON_SECRET_AUSENTE`/`CRON_NAO_AUTORIZADO`. Pendente: conferir a variável na Vercel |
| 0.4 Índices | 21 índices novos + 6 de apoio às validações; remoção automática de índice não único duplicado |
| 0.5 Vencido | Migração devolve as parcelas `vencido` ao estado real; leituras já calculavam pela data |
| 0.6 Numeração | `erp.numeracoes` + `erp.proximo_numero` (`VEN/ORC/PED/COM/OS/CTR/INV/TRF-AAAA-NNNN`), inicializada pelos números existentes; usada em vendas, orçamentos, pedidos, compras, OS, contratos, inventários e transferências |
| 0.7 Datas | `erp.hoje()` (fuso da sessão) nos 12 padrões que usavam `CURRENT_DATE`; tela de rotinas sem fuso fixo |
| 0.8 Segurança | Rateio com valor obrigatório. Pendente decisão: acesso direto do papel `authenticated` |
| 0.9 Observabilidade | Aviso `LENTO` para requisições acima de 1 s; `pnpm erp:slow-queries` (somente leitura) |
| Região | `vercel.json` com `regions: ["gru1"]` (São Paulo, junto do banco) |
| Escala | `pnpm erp:phase0-scale-smoke`: com 300 parcelas no banco local, lista 518 s → 2,4 s e pagamento 3,8 s → 0,13 s antes/depois das migrações |


## Andamento da Fase 1 — 08/10/2026 (código e migração; nada aplicado em produção)

Migrações `20261008130000_erp_comercial_fase1.sql`, `20261008140000_erp_devolucoes.sql` e `20261008150000_erp_permissoes_vendedor.sql` (tabelas novas com RLS no padrão por contexto).

| Item | Situação |
| --- | --- |
| 1.1 Tabelas de preço | **Pronto.** `tabelas_preco` + itens por faixa de quantidade, preço mínimo e desconto máximo; tabela do cliente ou padrão; venda sem preço usa a tabela (ou o cadastro) e guarda `preco_tabela`; recusa preço abaixo do mínimo e desconto acima do máximo. API `/api/erp/tabelas-preco`. No chat, a prévia já traz o preço aplicado |
| 1.2 Comissões | **Pronto.** Regras por vendedor/produto/serviço/categoria (a mais específica vale), base faturamento ou recebimento; lançamento por item na confirmação, cancelado com a venda; relatório (comissão, liberado, pago, a pagar) na API, na página de relatórios e no chat (`consultar_relatorio` tipo `comissoes`); pagamento gera conta a pagar ao vendedor (idempotente). Decisão: base configurável por regra, padrão faturamento |
| 1.3 Limite de crédito | **Pronto.** Limite e bloqueio (com motivo) no cliente (tela, API e chat); confirmação recusa bloqueado e acima do limite (saldo em aberto + venda); liberação só com `erp.financeiro.gerenciar` e motivo, registrada na venda |
| 1.6 Transporte | **Pronto.** Transportadora, modalidade de frete (valores da NF-e), volumes, espécie e pesos na venda (API e chat) |
| 1.4 Pedido de venda | **Adiado para a fase fiscal.** No modelo atual a venda confirmada já gera o financeiro e o atendimento move o estoque; o "pedido" de mercado separa compromisso de faturamento (emissão da NF-e). Fazer junto com a NF-e evita mudar o fluxo duas vezes |
| 1.5 Devolução | **Pronto.** Devolução por item da venda (só o já entregue), numeração `DEV-AAAA-NNNN`, produto volta ao estoque; três tratamentos: abater parcelas da venda, crédito ao cliente (usado depois em qualquer parcela dele) ou reembolso (conta a pagar). Abatimento e crédito são baixas sem dinheiro (`valor_liquido` 0); comissão reduzida; DRE por competência mostra "Devoluções de vendas". API, chat (`registrar_devolucao`) e tela |
| 1.7 Escopo e limites por usuário | **Pronto.** No vínculo usuário × empresa: vendedor que representa o usuário, escopo "só as próprias vendas" (política RLS restritiva em vendas/orçamentos e comissões) e desconto máximo (itens + venda); administradores nunca são restritos; alterações auditadas. Configurado em Configurações → Members. `valor_maximo_pagamento` fica para a Fase 2 (aprovação de pagamentos) |
| Telas web | **Pronto.** Vendas → Devoluções (registrar, listar, usar crédito; atalho na lista de pedidos), Tabelas de preço (itens e faixas), Comissões (a pagar por vendedor, pagamento, regras); crédito no cadastro de cliente; permissões comerciais em Configurações → Members |

Testes: `erp:api-http-smoke` cenários "Fase 1", "Fase 1.5" e "Fase 1.7" (23 checks) e `chatgptplugin:database-smoke` cenário "Fase 1 pelo chat" (35 checks), ambos com repositórios e SQL reais em banco local.

## 7. Decisões em aberto

1. Acesso direto do papel `authenticated` ao schema `erp`: manter (e testar) ou revogar.
2. Saldo da parcela: calculado na consulta (mais simples) ou mantido por trigger (mais rápido).
3. Base da comissão: faturamento ou recebimento (ou configurável por regra).
4. Modelo de DRE padrão a oferecer (sugestão: estrutura gerencial simplificada para PME, editável).
5. Segmento prioritário de clientes (comércio, serviços, indústria leve): define a ordem da Fase 4.

## Fontes

- Omie — funcionalidades: <https://omie.com.br/funcionalidades>; tabelas de preço: <https://ajuda.omie.com.br/pt-BR/articles/1399985-configurando-as-tabelas-de-preco>; lote e validade: <https://ajuda.omie.com.br/pt-BR/articles/10871466-realizando-o-controle-de-lote-e-validade-de-produtos>; estrutura de produtos: <https://www.omie.com.br/funcionalidades/estrutura-dos-produtos/>; ERP para PMEs (limite de crédito, comissões): <https://www.omie.com.br/blog/como-a-omie-ajuda-pequenas-e-medias-empresas/index.md>
- Conta Azul — como funciona: <https://contaazul.com/blog/software-conta-azul-como-funciona/>; conciliação de cartões: <https://contaazul.com/blog/conciliacao-cartoes-pequenas-empresas/>; relatórios: <https://contaazul.com/funcionalidades/relatorios/>; lista de funcionalidades (agregador): <https://www.b2bstack.com.br/product/conta-azul/funcionalidades>
- Itens marcados "a confirmar" não foram confirmados nas fontes públicas consultadas.
