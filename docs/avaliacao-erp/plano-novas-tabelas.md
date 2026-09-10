# Plano de criação das novas tabelas do ERP

Estado atualizado: as 14 tabelas e suas dependências foram aplicadas no Supabase pela migração `20260909030000`. O schema `erp` tem 82 tabelas. Este documento conserva o plano; consulte [a implementação e seus limites](implementacao-novas-tabelas.md) para o resultado efetivo, as 77 verificações, as pendências de dados e as adaptações da aplicação.

Objetivo: atender pequenas empresas prestadoras de serviços com histórico contratual, documentos, adiantamentos e renegociações consistentes. Escopo: tabelas e garantias do banco; sem UI, API fiscal, estoque, integrações, conectores ou BigQuery. Todas as novas tabelas ficam em `erp`.

## Resultado previsto

14 novas tabelas, de 68 para 82 tabelas em `erp`. Views não entram nessa conta. A remoção das quatro views financeiras continua como trabalho separado, dependente da revisão de seus consumidores.

| Etapa | Novas tabelas | Total acumulado |
| --- | --- | --- |
| 1. Cadastros | entidades_contatos; entidades_enderecos | 70 |
| 2. Anexos | contratos_vendas_arquivos; vendas_arquivos; ordens_servico_arquivos; contas_receber_arquivos | 74 |
| 3. Histórico financeiro | contas_receber_eventos | 75 |
| 4. Contratos | contratos_vendas_versoes; contratos_vendas_eventos; contratos_vendas_geracoes_tentativas | 78 |
| 5. Adiantamentos | adiantamentos; adiantamentos_aplicacoes | 80 |
| 6. Renegociações | renegociacoes; renegociacoes_parcelas | 82 |

Essa contagem pressupõe reaproveitar `contratos_vendas_itens` para itens de cada versão e representar devoluções como movimentos vinculados ao adiantamento original na própria tabela. Não criar tabelas vazias apenas para atingir a contagem; reavaliar o desenho se esses pressupostos não atenderem aos cenários validados.

## Regras comuns obrigatórias

- Seguir o padrão de identificadores existente, com `id`, `tenant_id`, unicidade `(tenant_id, id)` e FKs compostas nos vínculos entre registros de empresas. Um vínculo deve comprovar também a correspondência de contrato, título, cliente e versão quando aplicável; pertencer ao mesmo tenant não é suficiente.
- RLS e permissões por capacidade de cadastros, vendas, OS ou financeiro. Consultar documentos anexados exige autorização para o documento e para o arquivo; não abrir acesso a todos os arquivos por existir um vínculo.
- Valores monetários em decimal com duas casas; quantidades e preços unitários com quatro, acompanhados de fórmula e arredondamento definidos. Moeda inicial BRL.
- Datas de negócio separadas do instante de registro. Autor humano ou origem de sistema identificável. Preservar identidade histórica mesmo se o usuário for desativado.
- Dados efetivados e eventos são preservados. Correções financeiras usam reversões vinculadas; rascunhos sem dependências podem ser excluídos. Não usar exclusão lógica para liberar uma chave de idempotência financeira.
- Chaves de idempotência ficam nas operações que identificam. Mesma chave e mesmo conteúdo devem recuperar o resultado anterior; mesma chave com conteúdo diferente deve ser rejeitada. Unicidade sozinha não resolve esse contrato: a operação transacional precisa conferir conteúdo e resultado.
- Restrições de linha usam CHECK; somas, vigências, saldo e transições exigem validação transacional, com bloqueios consistentes. Adquirir proteção de período antes dos bloqueios de saldo e usar ordem estável entre registros para reduzir deadlocks.
- Nenhuma tabela de idempotência genérica, nenhum vínculo por texto sem FK e nenhuma view financeira nova.

## Etapa 1 — Contatos e endereços

### erp.entidades_contatos

Campos de negócio: entidade, nome, cargo/função, e-mail, telefone, finalidades, ativo e finalidades nas quais é principal; autor e datas. Finalidades usam conjunto controlado, por exemplo comercial, financeiro e operacional. Uma pessoa pode ter várias finalidades sem precisar de várias linhas.

Regras: nome obrigatório; ao menos um meio de contato quando necessário para contato operacional; finalidades sem repetição; principal precisa ser ativo e ter a finalidade correspondente. Garantir no máximo um principal por entidade/finalidade, inclusive em gravações simultâneas. E-mail não é identificador global da pessoa: não impor unicidade entre empresas ou entidades.

### erp.entidades_enderecos

Campos: entidade, identificação, logradouro, número, complemento, bairro, cidade, UF, CEP, país, finalidades, ativo e indicação de principal por finalidade. Usar finalidades pertinentes a serviços, como comercial, cobrança e prestação. Campo de código de município, se adotado, deve ser cadastro geográfico, sem implementar fiscal.

Regras: validação coerente com país; não obrigar formato brasileiro para endereço estrangeiro; um principal ativo por finalidade. Desativar endereço não altera documentos anteriores.

Mudanças existentes: definir transição dos campos únicos de `entidades`, evitando duas fontes editáveis para o mesmo contato/endereço. Vendas, contratos e OS devem preservar os dados utilizados no documento quando efetivados. Copiar apenas dados reais existentes; não inventar contatos, endereços ou datas históricas.

Aceite: dois contatos com finalidades distintas, uma pessoa com duas finalidades, troca concorrente do principal e alteração cadastral sem mudar documento antigo.

## Etapa 2 — Anexos por documento

Criar `contratos_vendas_arquivos`, `vendas_arquivos`, `ordens_servico_arquivos` e `contas_receber_arquivos`, seguindo o padrão de vínculos de compras e contas a pagar.

Campos: documento correspondente, arquivo, finalidade, descrição opcional, autor e data. A finalidade tem domínio adequado: contrato assinado/aditivo, proposta/comprovante, evidência de execução, comprovante de cobrança, por exemplo.

Regras: FK real para documento e `arquivos`; uma associação por documento/arquivo; ambos pertencem à mesma empresa. Não copiar conteúdo binário nem criar quatro repositórios de arquivos. Documento efetivado conserva vínculo ou registra sua retirada com motivo, sem apagar silenciosamente a evidência. Substituir arquivo cria nova versão física/vínculo; não sobrescrever o conteúdo que sustentava um documento antigo. Arquivo ainda referenciado não pode ser apagado fisicamente.

Mudanças existentes: conferir metadados de integridade/versão em `arquivos`, políticas de leitura e acesso ao conteúdo armazenado. A FK protege o vínculo no banco; sozinha não protege um objeto apagado no armazenamento.

Aceite: anexar o mesmo arquivo a documentos autorizados, rejeitar duplicidade e vínculo entre empresas, preservar comprovação histórica e negar leitura sem acesso ao documento.

## Etapa 3 — Histórico de contas a receber

### erp.contas_receber_eventos

Campos: título obrigatório, parcela e pagamento opcionais, tipo, data de negócio, instante do evento, autor/origem, motivo, identificador da operação e dados históricos complementares. Usar colunas com FK para relações centrais; JSON apenas para diferenças e contexto.

Cobertura: criação, alteração relevante, cancelamento, liquidação parcial/total, reversão, aplicação de adiantamento e renegociação. A parcela deve pertencer ao título; o pagamento, quando informado, deve corresponder à parcela.

Regras: apenas inserir e consultar; proibir alterar/apagar inclusive por caminhos privilegiados de negócio. Evento e alteração devem ocorrer na mesma transação. Identidade única por operação/evento/documento, permitindo que uma operação produza eventos distintos legítimos sem duplicação.

Mudanças existentes: alinhar `contas_pagar_eventos` para dar a mesma cobertura no lado a pagar. Não criar `pagamentos_eventos` concorrente para registrar a mesma ocorrência. Históricos novos não devem fingir reconstruir eventos que nunca foram registrados; uma carga inicial deve ser identificada como estado inicial observado.

Dependência financeira: definir principal liquidado, juros, multas, descontos, taxas e caixa líquido; compatibilizar status e resumos com pagamentos. Criar a tabela de eventos não corrige essas fórmulas por si só.

Aceite: evento e operação confirmam ou revertem juntos; repetição não duplica histórico; pagamento de outro título é rejeitado; leitor não consegue inserir eventos; correção preserva o evento anterior.

## Etapa 4 — Versões e gerações de contratos

### erp.contratos_vendas_versoes

Campos: contrato, número da versão, início e fim de vigência, estado de preparação/efetivação, periodicidade, regra de vencimento, tratamento do fim do mês, reajuste, classificações e condições de pagamento, motivo e autor da alteração, datas de registro/efetivação.

Regras: número único por contrato; vigência sem sobreposição entre versões efetivadas; preço e condições de versão utilizada ficam imutáveis. Uma alteração futura gera nova versão. Encerrar a vigência anterior só pode ser uma transição controlada que preserve os ciclos já gerados; não pode ocorrer edição livre de datas históricas.

Mudança essencial em `contratos_vendas_itens`: adicionar vínculo obrigatório à versão após preenchimento inicial e identificação estável do item lógico. Cada versão contém seu conjunto de linhas; nova versão copia os itens necessários e mantém os anteriores. Quantidade, descrição, preço e desconto da versão efetivada não são alterados. Usar FK que garanta que versão e item pertençam ao mesmo contrato. Assim não é necessária uma décima quinta tabela para itens versionados.

O cabeçalho `contratos_vendas` mantém identidade, cliente e ciclo de vida; condições comerciais passam a ter a versão como fonte oficial. A coluna atual `versao` não substitui histórico de versões e deve ter sua semântica diferenciada, caso continue como controle de concorrência.

### erp.contratos_vendas_eventos

Contrato, versão opcional, tipo, autor/origem, instante, data de efeito, motivo e contexto. Registra ativação, pausa, retomada, revisão e encerramento. Apenas anexável; operação e evento atômicos. Não substitui snapshots dos itens.

### erp.contratos_vendas_geracoes_tentativas

Geração existente, número da tentativa, início, fim, situação, erro sanitizado e identidade da execução. Unicidade por geração/número e no máximo uma tentativa em execução por geração. Enquanto em execução, aceita somente transição controlada para estado final; depois fica preservada. Retomada de tentativa abandonada encerra a anterior de forma explícita antes de abrir outra.

Mudanças em `contratos_vendas_geracoes`: guardar versão utilizada e intervalo real de prestação. Rever unicidade baseada apenas em competência para atender ciclos semanais/quinzenais sem colisões. Definir um identificador estável de ciclo e preservar uma venda por ciclo; tentar novamente não cria outro ciclo nem outra venda. Preservar venda cancelada e sua história; eventual substituição exige regra explícita, não apagar a geração anterior.

Para mudança contratual no meio do ciclo, a regra inicial é vigorar no próximo limite de ciclo; não implementar rateio temporal implícito. Período de prestação e regra de vencimento precisam ser independentes.

Aceite: alteração futura sem mudar venda antiga; duas ativações concorrentes sem sobreposição; meses curtos; ciclos semanais no mesmo mês; falha e retomada sem duplicar venda; associação de versão de outro contrato rejeitada.

## Etapa 5 — Adiantamentos e aplicações

Dependência de entrada: concluir as fórmulas financeiras e a conciliação com múltiplas associações na estrutura existente. Não efetivar adiantamentos sobre uma fórmula de saldo ainda ambígua.

### erp.adiantamentos

Representa movimentos do adiantamento: recebimento de cliente, pagamento antecipado a fornecedor, devolução e reversão identificados por tipo. Campos: entidade, lado cliente/fornecedor, tipo do movimento, adiantamento original quando aplicável, movimento revertido quando aplicável, conta financeira, método, data de movimento/crédito, valor positivo, motivo, estado, autor e chave de idempotência.

Uma linha de constituição origina o crédito. Devoluções parciais são novas linhas vinculadas à original, permitindo várias devoluções com datas e contas próprias sem perder o histórico. Reversão referencia uma operação específica e respeita seu limite; não é uma alteração do valor original. FKs e validações garantem a mesma entidade, lado e empresa. Proibir ciclos entre referências e referência de devolução a outra devolução.

Neste bloco, crédito significa dinheiro antecipado. Saldo inicial sem origem documentada, crédito comercial por concessão e compensação entre pessoas diferentes não são aceitos como se fossem adiantamento.

### erp.adiantamentos_aplicacoes

Campos: adiantamento original, exatamente uma parcela a receber ou a pagar, valor, data, autor, chave de operação e referência à aplicação revertida quando for reversão. Uma aplicação consome crédito e liquida dívida; não movimenta caixa. Cliente/fornecedor da parcela deve corresponder ao titular do crédito.

Equações: saldo disponível = constituição líquida de reversões − devoluções líquidas − aplicações líquidas de reversões. Saldo da parcela considera liquidações em dinheiro, aplicações, ajustes e transferências de dívida por renegociação, cada qual contado uma única vez. Aplicações e devoluções não podem produzir saldo negativo, inclusive em concorrência. Reverter a constituição exige resolver antes aplicações/devoluções dependentes.

Mudanças existentes: parcelas e títulos devem reconhecer aplicação sem criar pagamento de caixa fictício; proteção de período deve abranger os novos movimentos e aplicações; `conciliacoes_bancarias_itens` recebe FK explícita para movimento de adiantamento e regra de exatamente uma origem. Retirar a limitação atual de uma única associação ativa por transação apenas junto da validação de somas, sentido e conta. Não permitir conciliar aplicações, pois não movimentam dinheiro.

Aceite: antecipar R$ 1.000, aplicar R$ 600, devolver R$ 100 e manter R$ 300 disponíveis; caixa registra somente antecipação e devolução. Duas aplicações simultâneas não excedem o saldo. Testar cliente e fornecedor, reversões e períodos fechados.

## Etapa 6 — Renegociações rastreáveis

### erp.renegociacoes

Campos: entidade, lado a receber/pagar, número, data, estado de rascunho/efetivação/reversão, motivo, condições, descontos e encargos acordados, totais de origem/destino validados, autores e chave de idempotência.

### erp.renegociacoes_parcelas

Campos: acordo, papel origem/destino, exatamente uma FK para parcela a receber ou a pagar, ordem e valores discriminados de principal, ajustes e saldo transferido. Linhas de origem preservam o saldo utilizado no acordo; linhas de destino apontam para parcelas reais novas. Unicidade por acordo/papel/parcela.

Regras: uma entidade e um lado financeiro por acordo; receber e pagar não se misturam. Não incluir parcelas sem saldo nem a mesma parcela como origem e destino. Não reutilizar saldo já transferido; renegociações futuras podem partir das parcelas resultantes anteriores, preservando cadeia sem ciclos.

Escopo inicial: transferência integral do saldo aberto das parcelas selecionadas, inclusive parcelas parcialmente pagas. O pagamento anterior permanece vinculado à parcela original. Não dividir parcialmente o saldo remanescente de uma parcela entre acordos nesta versão.

Equação: soma das novas obrigações = soma dos saldos transferidos − descontos negociados + novos encargos, com componentes discriminados e arredondamento definido. Renegociar não gera receita nem entrada de caixa. Juros e ajustes devem ter classificação explícita para não serem confundidos com nova prestação de serviço.

Mudanças existentes: títulos e parcelas precisam representar saldo transferido e vínculos de origem; não marcar dívida renegociada como paga em dinheiro. Criar destino, transferir saldo e registrar eventos na mesma transação, com bloqueio das parcelas envolvidas. Reversão simples somente enquanto o destino não tiver pagamentos, aplicações ou nova renegociação; resolver dependências primeiro nos demais casos. Respeitar fechamento de períodos.

Aceite: renegociar três parcelas em quatro novas sem duplicar dívida; preservar pagamento parcial anterior; rejeitar acordo inconsistente e saldo já usado; repetição retorna o mesmo acordo; concorrência entre pagamento e renegociação não consome o mesmo saldo duas vezes.

## Entrega e validação de cada etapa

1. Conferir catálogo atual e dados preexistentes, sem presumir que ausência de clientes significa banco vazio.
2. Especificar e criar novas tabelas junto das alterações indispensáveis nas existentes. Não liberar escrita em estrutura incompleta.
3. Preencher vínculos históricos possíveis, identificar dados não reconstruíveis e validar antes de impor obrigatoriedade.
4. Testar restrições, RLS, referências entre empresas, transações e concorrência nos casos da etapa; validar que fiscal e estoque foram preservados.
5. Aplicar migração versionada e transacional quando tecnicamente possível, verificar catálogo e registrar evidências. Não apagar dados financeiros efetivados como estratégia de rollback.
6. Atualizar dicionário, relações e total de tabelas. Distinguir estrutura aplicada de fluxo operacional disponível: criar tabelas não implementa automaticamente as operações da aplicação.

Ordem recomendada: etapas 1–3; finalizar as pendências financeiras das tabelas existentes; etapa 4; etapas 5–6. Antes de liberar o uso operacional, adaptar também envio de motivo de reabertura e repetição de transações em conflitos, pendentes do primeiro bloco já aplicado.
