# Avaliação do ERP Creatto para prestadores de serviços

Data: 08/09/2026. Projeto Supabase: `mtadnxqoqxzbdksktwdr`.

## Parecer

A modelagem tem uma boa fundação para um ERP de pequenas empresas. Não é necessário recomeçar, apagar tabelas em lote ou dividir schemas para evoluir. Entretanto, a estrutura e os fluxos examinados ainda não demonstram equivalência funcional a Conta Azul ou Omie para prestadores de serviços. O investimento prioritário deve ser em recorrência confiável, faturamento de serviços, NFS-e, cobrança e relatórios financeiros consistentes.

Esta comparação usa funcionalidades públicas dos produtos, não seus esquemas internos, que não foram disponibilizados. O público escolhido pelo usuário é serviços/prestadores de serviços. Estoque avançado e produção não são requisitos gerais desse público.

## Escopo e evidências

Foram consultados apenas catálogos do banco em transações READ ONLY, sem consultar registros de clientes. Também foram lidos os repositórios do ERP e reproduzidos cálculos de datas localmente. Nenhuma migração, correção de aplicação ou escrita de dados foi executada.

- [Catálogo consultado](catalogo.json): colunas, constraints, índices, políticas, triggers, funções e views de `erp`/`shared`.
- [Verificação complementar de acessos](acessos.json): permissões compartilhadas e configuração das views.
- [Mapa completo das 68 tabelas](mapa-tabelas.md).

O schema `erp` contém 68 tabelas, 6 views, 254 índices, 334 FKs e 229 CHECKs. Todas as 68 tabelas estão com RLS habilitado. As 6 views usam `security_invoker=true`. Não foram encontradas FKs entre tabelas ERP que deixem de incluir `tenant_id`, nem constraints não validadas no catálogo inspecionado. Esses são sinais positivos de desenho, não substitutos de testes de isolamento e de concorrência.

## Referências funcionais

- Conta Azul descreve contratos que geram vendas, NFS-e e cobranças: [Contratos: como lançar](https://ajuda.contaazul.com/hc/pt-br/articles/7451444903949-Contratos-como-lan%C3%A7ar).
- Omie documenta faturamento individual/em lote e agendamento de contratos: [Faturamento](https://ajuda.omie.com.br/pt-BR/articles/1372674-faturando-contratos-de-servico-individualmente-ou-em-lote), [Agendamento](https://ajuda.omie.com.br/pt-BR/articles/7264622-agendando-o-faturamento-de-contrato-de-servico).
- Omie também documenta reajustes e múltiplos códigos de serviço: [Alterações em lote](https://ajuda.omie.com.br/pt-BR/articles/6680608-alterando-os-contratos-de-servico-em-lote), [Perguntas frequentes de Serviços/NFS-e](https://ajuda.omie.com.br/pt-BR/articles/6866234-perguntas-frequentes-servicos-e-nfs-e).

## O que manter

| Área | Base existente | Avaliação |
| --- | --- | --- |
| Clientes e fornecedores | `entidades`, categorias, centros de custo, arquivos | Boa base unificada; ampliar contatos/endereços quando houver necessidade real. |
| Catálogo de serviços | `servicos` com preço, custo, código municipal, categoria e versão | Adequado para cadastro básico; perfil fiscal e precificação complexa ainda são limitados. |
| Vendas e orçamentos | `vendas`, itens, recebimentos previstos, eventos | Boa separação; confirmação cria contas a receber e parcelas. |
| Contratos | Contrato, itens e gerações com unicidade por competência e idempotência | Base aproveitável; geração precisa de correções e evolução. |
| Ordens de serviço | OS, itens, eventos e vínculo a orçamento/venda | Fluxos de estados e conversão existem; validar atomicidade e aderência ao segmento. |
| Financeiro | Títulos, parcelas, pagamentos, estornos, rateios, contas e transferências | Base abrangente; falta fechar os fluxos externos de cobrança e a consistência dos relatórios. |
| Bancos | Importação OFX, transações, conciliação e reversão | Há implementação local útil; não comprova sincronização bancária automática. |
| Fiscal | Configuração, documento, itens, totais e eventos | Preparação inicial; o código examinado não entrega emissão NFS-e completa. |
| Estoque/compras | Saldo, movimentos, reservas, inventário, kits, recebimentos | Preservar o que existe; priorização secundária para serviços sem peças ou mercadorias. |
| Controles | Fechamento de períodos, histórico, perfis, idempotência e RLS | Preservar e validar em testes completos. |

## Problemas concretos e prioridades

### P1 — Corrigir a geração de contratos antes de atender mensalidades

Evidência: `src/products/erp/server/erpManagementRepository.ts`, linhas 332–400.

1. A conversão `String(contract.proxima_geracao_em).slice(0, 10)` não trata o objeto Date retornado pelo driver PostgreSQL instalado. A consulta somente leitura `SELECT DATE '2026-01-31'` retornou Date; essa conversão produziu `Sat Jan 31`, e não `2026-01-31`.
2. A função real `nextContractDate`, extraída do código e executada localmente, retornou `2026-03-03` ao avançar mensalmente de `2026-01-31`; de `2026-01-30`, retornou `2026-03-02`. É necessário definir uma regra de fim de mês e preservar a data de referência contratual.
3. O campo `dia_vencimento` é gravado, mas a parcela gerada usa `vencimento: competence`. Dia de faturamento, competência e vencimento precisam de regras distintas.
4. A geração cria uma venda em rascunho e registra a geração como concluída. Isso não equivale a emitir nota ou cobrança. A confirmação financeira existe em outra operação, mas não é chamada nessa geração.
5. `reajuste_indice` e `reajuste_percentual` existem no banco; não foi encontrada aplicação desses campos no fluxo de geração. Pausas, alterações de preço com vigência, adicionais, proporcionalidade e histórico precisam de comportamento explícito.
6. Cada execução avança apenas uma competência por contrato. Definir recuperação de períodos atrasados e tratamento de falha por contrato; atualmente um erro na transação pode interromper o lote.

Evolução sugerida: manter as três tabelas; acrescentar histórico de alterações/vigências e representação de ciclo de faturamento quando os requisitos estiverem definidos. Não resolver esse problema somente adicionando colunas.

### P1 — Completar o fiscal de serviços

Evidências: catálogo de `servicos`, `configuracoes_fiscais`, `notas_fiscais*`; `preflightSaleFiscal` em `erpProfessionalRepository.ts:868`; a interface em `SalesWorkspacePage.tsx:1406` informa que a emissão fiscal é futura.

- Há suporte nominal a `nfse` e campos de referência/resposta Focus, mas não foi encontrado no código ERP um fluxo completo de envio, retorno assíncrono, consulta, cancelamento e substituição de NFS-e.
- O parser implementado trata XML autorizado de NF-e de entrada. Isso não implementa emissão de NFS-e.
- `servicos` tem código municipal, mas não há perfil fiscal estruturado e versionado por serviço/localidade/vigência no conjunto de tabelas consultado.
- `notas_fiscais_totais` é orientada aos tributos de mercadorias. Dados de serviços, retenções e identificação do documento fiscal precisam de modelagem explícita conforme o provedor e a especificação fiscal adotados. JSON pode preservar o payload original, mas não deveria ser a única base de valores usados em conciliação e relatórios.
- O índice `notas_fiscais_venda_tipo_unica_idx` permite uma nota não cancelada por venda/tipo. Isso restringe cenários de múltiplas NFS-e na mesma venda, como serviços com códigos diferentes. Antes de mudar a cardinalidade, definir a regra comercial e fiscal atendida; a documentação do Omie demonstra que esse cenário existe.
- Validar regras fiscais e formatos com o provedor/contador responsável. Esta avaliação de software não estabelece alíquotas nem obrigações tributárias.

Evolução sugerida: perfil fiscal de serviço com vigência, documentos fiscais com identificadores adequados, retenções/totais consultáveis, tentativas de emissão e eventos externos deduplicados. Preservar dados históricos do emitente/tomador usados em cada documento.

### P1 — Transformar tabelas de cobrança em operação completa

As tabelas `cobrancas`, `cobrancas_eventos` e `cobrancas_notificacoes` já preveem boleto, Pix, links, destinatários, status e identificadores. Não foram encontradas referências operacionais a essas tabelas nos serviços ERP examinados. Campos de boleto/Pix não comprovam que uma cobrança possa ser emitida ou liquidada automaticamente.

Definir um fluxo de emissão, retorno, pagamento parcial, cancelamento, estorno, notificações e reprocessamento. Preservar referências externas e deduplicação para que uma notificação repetida não gere duas baixas. Registrar a diferença entre pagamento informado e pagamento confirmado pelo canal.

Automatizar NFS-e e cobrança exige comunicação com serviços fiscais e financeiros. Essa comunicação pode ficar diretamente nos módulos Fiscal e Financeiro do ERP; não depende de recuperar a antiga plataforma de conectores de marketing e BigQuery.

### P1 — Corrigir o alcance dos relatórios gerenciais

A view `erp.vw_dre_gerencial` soma títulos a receber e a pagar por competência/categoria. Na definição examinada:

- não considera `rateios_financeiros`;
- não aplica os indicadores de categoria `entrada_dre` e `considera_custo_dre`;
- não apresenta uma estrutura completa de receita, deduções, custos, despesas e resultado;
- não representa um livro contábil de partidas dobradas.

A view de fluxo de caixa é de movimentos realizados: usa pagamentos e transferências. Uma previsão de caixa exige também vencimentos futuros; não confundir as duas visões.

Recomendação: entregar primeiro DRE gerencial coerente, caixa realizado/projetado, inadimplência e receita contratada. Não é obrigatório construir um sistema contábil completo para vender um ERP de serviços; é obrigatório explicar o critério dos relatórios e reconciliar seus valores com os títulos e pagamentos.

### P2 — Fortalecer histórico e atomicidade dos documentos

Em `erpProfessionalRepository.ts:250`, a conversão de OS cria a venda/orçamento antes da transação que vincula a OS. Se houver conflito de versão ou falha entre as operações, pode existir documento criado sem vínculo confirmado. O retorno `reused` também pode esconder um vínculo não concluído. A conversão de orçamento usa estrutura semelhante.

Priorizar uma operação atômica ou recuperação explícita, com testes de concorrência, retry e falha intermediária. Campos de idempotência são positivos, mas não garantem sozinhos que todos os efeitos ficaram consistentes.

### P2 — Cadastro e serviços adequados ao público

`entidades` representa um endereço principal e contatos básicos. Para contratos mais elaborados, considerar endereços e contatos múltiplos, tomador, pagador, responsável contratual e local de prestação. Em `servicos`, avaliar unidade de cobrança e preços com vigência.

Projetos, tarefas, apontamento de horas, equipe e aceite de entregas são condicionais ao segmento: importantes para consultoria/agências, menos prioritários para quem cobra apenas mensalidades fixas. Evitar criar todos esses módulos antes de escolher o primeiro tipo de prestador.

### P2 — Escala e auditoria operacional

O processamento de contratos filtra por empresa, status e próxima geração, mas os índices atuais de `contratos_vendas` não incluem essa fila por data. Avaliar índice específico com planos e volume representativos. Não adicionar ou remover índices em lote apenas pelo número total.

As tabelas de evento existem, mas isso não prova trilha imutável completa. Validar permissões, integridade dos registros históricos, isolamento real entre empresas, efeitos de retries e recuperação depois de falhas.

## Segurança: pontos conferidos e limites

- Todas as tabelas ERP têm RLS; as relações internas incluem empresa nas FKs.
- A role `erp_runtime` não é superusuária e não ignora RLS.
- Todas as views ERP examinadas são `security_invoker`.
- As tabelas `shared.tenants`, `users` e `tenant_memberships` não têm RLS, porém não foram encontrados grants diretos para `anon`/`authenticated` nessas tabelas e a role runtime não tem acesso direto a elas. Não classifico a ausência de RLS isoladamente como vazamento comprovado.
- A conexão administrativa usada pela aplicação tem privilégios superiores; a camada de execução reduz a role nas consultas ERP. A cobertura de todos os caminhos e testes adversariais continua necessária.
- Não foram realizados testes de carga, emissão fiscal, cobrança real, invasão, recuperação de backup ou transações comerciais nesta avaliação.

## Ordem recomendada de evolução

1. Corrigir datas/vencimentos/recuperação de contratos e testar os ciclos de mensalidade.
2. Consolidar orçamento → venda/OS → títulos e parcelas, com atomicidade e recuperação.
3. Implementar NFS-e para um conjunto definido de prestadores/localidades, com regras validadas.
4. Concluir cobrança e recebimento, com tratamento de eventos repetidos e falhas.
5. Reconciliar DRE, caixa, rateios, inadimplência e relatórios contratuais.
6. Evoluir cadastro, aditivos/reajustes, projetos/horas conforme a demanda real.

Manter o schema `erp`. Manter as tabelas úteis de estoque/compras, mas reduzir seu destaque no produto de serviços. Não criar outro schema ou dezenas de tabelas como substituto para concluir e testar os fluxos principais.

## Critérios para dizer que chegou ao nível esperado

Demonstrar em ambiente de teste: um contrato iniciado no fim do mês; reajuste com data de vigência; execução repetida sem duplicação; período atrasado recuperado; OS convertida sem documento órfão; NFS-e com retorno e cancelamento tratados; cobrança com retorno duplicado e pagamento parcial; estorno refletido nos relatórios; fechamento respeitado; usuário de uma empresa sem acesso aos dados de outra. Comparar a experiência do usuário nesses cenários, não apenas a quantidade de tabelas.
