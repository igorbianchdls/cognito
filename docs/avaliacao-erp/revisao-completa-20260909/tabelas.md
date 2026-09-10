# Revisão individual das tabelas — serviços

Revisão de 09/09/2026. Escopo: 64 tabelas de `erp`; as 5 fiscais e 13 de estoque ficam fora. `produtos` e `fornecedores_produtos` são avaliados apenas como referências comerciais existentes.

“Manter” significa aproveitar a estrutura; não certifica todos os fluxos de uso. Achados reproduzidos e prioridades estão no [parecer completo](parecer.md).

## Cadastros e suporte — 11 tabelas

| Tabela | Parecer | Ação necessária |
| --- | --- | --- |
| `erp.arquivos` | Ajustar | Unificar a preservação de conteúdo/metadados para anexos antigos e novos; manter identidade, hash e controle do armazenamento. |
| `erp.cadastros_eventos` | Manter e completar | Inserção autorizada e imutabilidade presentes; padronizar tipos, identidade da operação e autoria dos eventos relevantes. |
| `erp.categorias` | Corrigir | Impedir ciclos hierárquicos e preservar natureza/atributos históricos que afetam a classificação financeira. |
| `erp.centros_custo` | Ajustar | Preservar classificação usada em documentos; definir desativação sem perder vínculos e evitar nomes/códigos ambíguos. |
| `erp.entidades` | Corrigir | A transição entre campos antigos e contatos normalizados permite apagar e-mail/telefones; completar a migração e o contrato de escrita. |
| `erp.entidades_contatos` | Corrigir | Finalidades e principal já são protegidos; sincronização não pode limpar dados de outras finalidades nem perder números adicionais. |
| `erp.entidades_enderecos` | Ajustar | Boa estrutura básica; impedir perda de endereço incompleto na transição e manter snapshot do endereço efetivamente usado. |
| `erp.fornecedores_produtos` | Manter no escopo atual | Preservar vínculos existentes; nenhuma ampliação de produtos/estoque proposta. |
| `erp.metodos_pagamento` | Manter e ajustar | Domínio e referência adequados; desativar sem reclassificar operações efetivadas e manter nomes coerentes. |
| `erp.produtos` | Manter no escopo atual | Cadastro referenciado por documentos existentes; não expandir mercadorias ou estoque nesta revisão. |
| `erp.servicos` | Completar | Falta unidade de cobrança explícita e sua preservação nos itens; manter preço/custo/classificação e separar descrição comercial de dados fiscais. |

## Vendas e contratos — 12 tabelas

| Tabela | Parecer | Ação necessária |
| --- | --- | --- |
| `erp.vendas` | Corrigir | Definir desconto monetário versus percentual e validar documentos de origem e regras de efetivação; saneamento de dados fora do escopo. |
| `erp.vendas_eventos` | Manter e completar | Histórico imutável e INSERT autorizado; garantir eventos de transição comercial na mesma transação e evitar eventos duplicados sem identidade. |
| `erp.vendas_itens` | Corrigir | Validar quantidade × preço − desconto e conferir os dois documentos quando houver mudança do pai; snapshot de unidade/classificação. |
| `erp.vendas_recebimentos_previstos` | Corrigir | Validar pai antigo e novo ao mover previsões e estabelecer vínculo inequívoco com as parcelas a receber geradas. |
| `erp.contratos_vendas` | Ajustar | Identidade e ativação existem; eliminar ambiguidade dos campos comerciais antigos, definir extensão de vigência e snapshots de rascunho/efetivação. |
| `erp.contratos_vendas_itens` | Completar | Versionamento e equação do item já existem; acrescentar unidade e classificação por item quando exigidas pelo contrato. |
| `erp.contratos_vendas_geracoes` | Corrigir | Impedir período final nulo, reutilização indevida de venda entre ciclos e definir exatamente o significado de geração concluída. |
| `erp.contratos_vendas_versoes` | Ajustar | Preservação e sobreposição protegidas; completar regra de vencimento, limites de vigência e captura dos dados comerciais efetivados. |
| `erp.contratos_vendas_eventos` | Manter e completar | Trilha anexável presente; padronizar motivos, autoria e identificação de operação/versão, sem usar evento como substituto da versão. |
| `erp.contratos_vendas_geracoes_tentativas` | Ajustar | Tentativa única ativa e resultado preservado; alinhar estados de ciclo/tentativa e recuperação de execução abandonada. |
| `erp.contratos_vendas_arquivos` | Manter e ajustar | Vínculo com FK e imutabilidade presentes; definir substituição/anulação rastreável sem apagar o arquivo anterior. |
| `erp.vendas_arquivos` | Manter e ajustar | Mesma política de evidência documental; permitir evolução controlada de rascunho sem reescrever documento efetivado. |

## Ordens de serviço — 4 tabelas

| Tabela | Parecer | Ação necessária |
| --- | --- | --- |
| `erp.ordens_servico` | Corrigir | Na criação, aceita cliente incompatível com a venda vinculada; validar cliente e tipo do orçamento/venda e totais do documento. |
| `erp.ordens_servico_itens` | Corrigir | Aceita quantidade 2 × preço 100 com total 1; validar equação, total da OS, unidade e classificação comercial necessária. |
| `erp.ordens_servico_eventos` | Manter e completar | Imutabilidade aplicada; completar coerência entre transições, autor, motivo e registro da operação. |
| `erp.ordens_servico_arquivos` | Manter e ajustar | Base de evidência adequada; alinhar política de substituição/anulação aos demais anexos. |

## Compras de serviços — 8 tabelas

| Tabela | Parecer | Ação necessária |
| --- | --- | --- |
| `erp.compras` | Corrigir | Revisar composição comercial e desconto percentual, coerência com fornecedor e distinção entre compra-modelo e documento efetivo; sem alterar fiscal. |
| `erp.compras_arquivos` | Ajustar | Alinhar proteção do arquivo e retenção do vínculo às quatro tabelas novas de anexos. |
| `erp.compras_eventos` | Manter e completar | Preservar histórico e padronizar autoria, motivos e identidade de operação. |
| `erp.compras_itens` | Corrigir | Completar equação do item e conferência de pai antigo/novo; preservar unidade e dados do serviço. |
| `erp.compras_parcelas_previstas` | Corrigir | Conferir alterações entre documentos e vínculo com a parcela a pagar; preservar condições que originaram a obrigação. |
| `erp.compras_recorrencias` | Completar | Coerência entre término por data/quantidade/indeterminado, modelo e vigência, pausa e encerramento. |
| `erp.compras_recorrencias_geracoes` | Completar | Identidade durável de ocorrência/documento e retenção histórica; distinguir competência mensal de ocorrência real. |
| `erp.naturezas_operacao_compra` | Manter no escopo comercial | Conservar cadastro e suas referências; não alterar regras fiscais nesta revisão. |

## Financeiro e cobrança — 20 tabelas

| Tabela | Parecer | Ação necessária |
| --- | --- | --- |
| `erp.contas_financeiras` | Ajustar | Proteger saldo inicial/data após uso e em períodos fechados; correções devem ter origem rastreável. |
| `erp.contas_pagar` | Corrigir | A previsão pode ficar paga sem efetivação explícita; alinhar natureza, estado, origem e idempotência. |
| `erp.contas_pagar_arquivos` | Ajustar | O conteúdo do arquivo vinculado ainda pode ser substituído; alinhar retenção/proteção com anexos novos. |
| `erp.contas_pagar_eventos` | Manter e completar | Eventos automáticos na mesma transação presentes; padronizar referências a parcela/pagamento, motivos e leitura por perfil. |
| `erp.contas_pagar_parcelas` | Corrigir | Fixar semântica e relação dos campos bruto/líquido/encargos; separar principal baixado de caixa e créditos. |
| `erp.contas_receber` | Corrigir | Chave pode ser trocada e reutilizada; completar origem de receita recorrente e simetria necessária com pagar. |
| `erp.contas_receber_parcelas` | Corrigir | Saldo principal protegido, mas campos financeiros paralelos aceitam valores incompatíveis; origem da previsão deve ser explícita. |
| `erp.contas_receber_eventos` | Ajustar | FKs e imutabilidade funcionam; alinhar acesso de leitura ao título e identidade das operações. |
| `erp.contas_receber_arquivos` | Manter e ajustar | FKs e retenção presentes; definir política documental uniforme e leitura coerente com o título. |
| `erp.pagamentos` | Ajustar e homologar | Principal/desconto/caixa e estorno integral têm proteção; revisar todos os modos de liquidação, datas resumidas e transições vinculadas. |
| `erp.rateios_financeiros` | Corrigir | Aceita rateio superior ao título e percentual divergente; garantir distribuição única e soma/arredondamento. |
| `erp.recorrencias_financeiras` | Completar | Aceita término por data sem data; falta vínculo estruturado de receber e identidade clara das ocorrências. |
| `erp.transferencias_financeiras` | Corrigir | Chave mutável permite reutilização; explicitar efetivação/cancelamento/reversão e preservação das duas pontas. |
| `erp.cobrancas` | Ajustar | Separar estado externo da liquidação interna e garantir reconciliação entre eles; não implementar provedor nesta etapa. |
| `erp.cobrancas_eventos` | Corrigir | O evento é imutável, mas a mesma linha contém processamento mutável bloqueado; separar responsabilidades. |
| `erp.cobrancas_notificacoes` | Completar | Identidade de notificação e coerência de agendamento/entrega/tentativas; sem implementar canais externos. |
| `erp.adiantamentos` | Manter e homologar | Constituição/devolução/reversão e saldo histórico presentes; validar cobertura de datas, conta e eventos em todos os fluxos. |
| `erp.adiantamentos_aplicacoes` | Manter e homologar | Crédito sem duplicar caixa, saldo e entidade protegidos; alinhar consultas de saldo e fechamento às aplicações/reversões. |
| `erp.renegociacoes` | Corrigir | Chave de rascunho mutável quebra a identidade de operação; consolidar transições e efeito financeiro sem nova receita. |
| `erp.renegociacoes_parcelas` | Manter e homologar | Origens/destinos, saldo transferido e ciclos protegidos; manter recuperação/reversão com dependências e consultas sem duplicidade. |

## Bancos e conciliação — 5 tabelas

| Tabela | Parecer | Ação necessária |
| --- | --- | --- |
| `erp.transacoes_bancarias` | Manter e ajustar | Origem restritiva e associação múltipla presentes; preservar identificação externa, datas e valores após conciliação. |
| `erp.importacoes_bancarias` | Manter e ajustar | Retenção da origem melhorou; preservar identidade durável do arquivo e separar reprocessamento de duplicação de movimento. |
| `erp.conciliacoes_bancarias` | Ajustar | Definir critério de encerramento e relação com saldos inicial/final e movimentos abrangidos. |
| `erp.conciliacoes_bancarias_itens` | Manter e homologar | Limites por banco/destino, conta/sentido e desfazimento protegidos; ampliar testes de transferência, estorno e concorrência real. |
| `erp.regras_conciliacao_bancaria` | Manter e ajustar | Tolerâncias e regra ativa por conta presentes; versões das regras não devem reescrever associações já confirmadas. |

## Importações e controles — 4 tabelas

| Tabela | Parecer | Ação necessária |
| --- | --- | --- |
| `erp.importacoes_dados` | Corrigir | Contadores podem declarar 100 importados e 50 erros em arquivo de uma linha; derivar dos itens e validar término. |
| `erp.importacoes_dados_linhas` | Completar | Coerência entre estado, erros, destino e processamento; registro_id genérico precisa de origem resolvível e deduplicação. |
| `erp.execucoes_automacao` | Ajustar | Coerência entre estado, início/fim e tentativas; identidade durável de execução e resultado, sem criar automações nesta revisão. |
| `erp.fechamentos_periodos` | Ajustar e homologar | Datas anteriores/novas e reabertura melhoraram; ampliar proteção das classificações/saldo inicial e testar concorrência de operações completas. |

