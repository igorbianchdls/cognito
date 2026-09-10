# Avaliação completa das tabelas do Creatto para serviços

Data: 08/09/2026. Base consultada: Supabase Creatto, projeto `mtadnxqoqxzbdksktwdr`.

## 1. Parecer

O Creatto possui uma fundação relacional consistente e deve evoluir a partir dela. A base já representa clientes, serviços, contratos, orçamentos, vendas, ordens de serviço, compras, títulos, parcelas, pagamentos, conciliações, rateios e históricos. Não recomendo recomeçar, unificar contas a pagar e receber à força, apagar módulos ou mudar schemas.

Entretanto, ainda não considero o modelo completo para um ERP profissional de prestadores de serviços. As maiores lacunas são: vigência e histórico contratual; consistência de liquidações e estornos; conciliação de um movimento para vários pagamentos; adiantamentos e renegociações rastreáveis; simetria funcional entre contas a pagar e receber; proteção de períodos fechados; e classificação financeira utilizável em relatórios.

“Nível Conta Azul ou Omie” é usado como referência de cenários de negócio representáveis. Não tivemos acesso aos bancos internos desses produtos e não afirmamos equivalência de suas tabelas. Também não é necessário reproduzir todos os recursos de todos os segmentos atendidos por eles.

Esta avaliação trata da estrutura do banco. Não avalia interface nem implementação de aplicação. Funções e gatilhos do próprio PostgreSQL foram lidos porque determinam as garantias das tabelas. Nenhum dado comercial foi consultado, nenhuma escrita no banco foi executada e nenhuma migração foi criada ou aplicada.

## 2. Escopo e evidência

- Avaliadas 50 tabelas fora dos módulos fiscal e estoque, incluindo compras comerciais/financeiras e a estrutura de cobranças já existente. Avaliar essas tabelas não significa implementar provedores externos.
- `produtos` e `fornecedores_produtos` são tratados apenas como cadastros referenciados pelas operações existentes, sem evolução de mercadorias ou estoque.
- Excluídas 5 tabelas fiscais e 13 tabelas de estoque. Campos fiscais/de estoque que aparecem em tabelas compartilhadas não recebem recomendações funcionais neste parecer.
- Avaliadas 4 views financeiras; as 2 views de estoque estão fora do escopo.
- As 8 tabelas de `shared` foram consultadas apenas para compreender identidade, empresa, permissões e dependências. Não se propõe remodelar IA/autenticação.
- O conjunto de 50 tabelas possui 947 colunas, 191 índices, 246 chaves estrangeiras e 173 CHECKs. Esses números contam todos os campos e vínculos dessas tabelas, inclusive dependências preservadas dos módulos excluídos; não são uma medida de qualidade.
- As 50 têm RLS habilitado. Todas as FKs ERP→ERP consultadas incluem `tenant_id`. As 4 views financeiras usam `security_invoker=true`.
- Valores comerciais usam tipos decimais com precisão explícita. Existem unicidades por empresa, controle de versões em parte dos documentos e gatilhos diferidos para conferir totais.

Evidências locais: [catálogo atualizado](catalogo-revisao-tabelas.json), [dicionário por tabela](dicionario-tabelas-servicos.md). A coleta de metadados foi feita em transação READ ONLY. A avaliação identifica o que o modelo permite ou impede; não afirma que existam registros inconsistentes na base.

## 3. Referências de capacidade

O Omie documenta contratos com múltiplos serviços, vigência por item, categorias, contato, condições de vencimento e previsões. Isso sustenta priorizar regras contratuais explícitas e histórico dos valores, sem presumir uma implementação interna específica. [Cadastro de contratos de serviço](https://ajuda.omie.com.br/pt-BR/articles/498998-cadastrando-um-novo-contrato-de-servico).

O Conta Azul documenta rateio por categoria e centro de custo, inclusive sua representação na consulta de parcelas. A referência útil é permitir distribuição e rastreabilidade financeira, não copiar literalmente a resposta de uma API para o banco. [Rateio financeiro](https://ajuda.contaazul.com/hc/pt-br/articles/7180813934605-Categoria-financeira-e-centro-de-custo-como-fazer-o-rateio-de-centro-de-custo-e-categoria), [Representação na API](https://developers.contaazul.com/get-parcela-por-id-rateio-categoria-centro-custo).

O Conta Azul também documenta conciliar um movimento bancário com vários lançamentos. O índice atual do Creatto impede diretamente esse cenário. [Conciliação 1:N](https://ajuda.contaazul.com/hc/pt-br/articles/7453625133837).

Adiantamentos de clientes e fornecedores são cenários documentados pelo Omie e relevantes quando um prestador recebe antes da execução ou paga antecipadamente uma contratação. [Adiantamentos](https://ajuda.omie.com.br/pt-BR/articles/14431743-registrando-adiantamento-de-clientes-e-fornecedores).

As propostas de tabelas e regras a seguir são decisões de modelagem para o Creatto, fundamentadas no catálogo e nesses cenários. Não são descrições das tabelas dos concorrentes.

## 4. Achados prioritários comprovados na estrutura

Prioridade A: integridade e rastreabilidade fundamentais. Prioridade B: cobertura profissional de serviços. Prioridade C: extensões dependentes do segmento ou volume.

### A1. Conciliação está limitada a um destino por movimento bancário

**Evidência:** `conciliacoes_bancarias_itens_transacao_ativa_idx` é único em `(tenant_id, transacao_bancaria_id)` quando `desfeito_em IS NULL`. Cada item aponta a exatamente um pagamento ou transferência.

**Consequência:** um depósito de R$ 1.000 não pode ser relacionado, simultaneamente, a dois pagamentos de R$ 400 e R$ 600. Também não existe garantia agregada no banco contra conciliar um mesmo pagamento além de seu valor usando movimentos distintos.

**Recomendação:** manter cabeçalho e itens; permitir várias alocações por transação, identificando cada associação. Validar soma conciliada por movimento e por destino, conta financeira, sentido crédito/débito e situação da operação. Transferências precisam admitir a conciliação das duas pontas, cada uma na conta correspondente. Remover a unicidade atual sem essas proteções seria insuficiente.

### A2. Liquidação, saldo e estorno ainda não têm garantias completas

**Evidência:** `pagamentos` tem principal, juros, multa, desconto, taxa, líquido e referência de estorno; parcelas também armazenam vários desses valores e `valor_pago`. Os CHECKs verificam valores não negativos, mas os gatilhos financeiros existentes só conferem soma das parcelas versus total do título. Não há validação agregada entre pagamentos e parcelas nem identidade aritmética do líquido no catálogo consultado. O índice de `estorno_de_pagamento_id` não é único.

**Consequência:** a estrutura isoladamente não impede valores resumidos divergentes, pagamentos acima do saldo segundo a regra de liquidação, autorreferência de estorno ou vários estornos integrais da mesma operação. Não se afirma que esses registros existam.

**Recomendação:** definir principal liquidado separadamente do dinheiro movimentado, encargos, descontos e tarifas; estabelecer a fórmula de entrada e saída de caixa; tratar campos resumidos como derivados ou mantidos sob garantia transacional. Escolher estorno integral único ou estornos parciais com limite acumulado e referência ao original. Proibir ciclos e vínculos incompatíveis. Preservar operações efetivadas e usar reversões identificáveis.

**Exemplo de aceitação:** uma parcela de R$ 1.000 liquidada com R$ 100 de desconto e R$ 900 recebidos deve ficar quitada, enquanto o caixa registra R$ 900. Isso exige uma semântica inequívoca para `valor_pago`; não basta subtrair qualquer valor recebido do nominal.

### A3. O fechamento de período não cobre toda a base financeira

**Evidência:** o gatilho `validar_periodo_operacional_aberto` está em INSERT/UPDATE de pagamentos, transferências, transações bancárias, vendas e compras. Não está em títulos, parcelas, rateios ou itens comerciais. A função avalia a data de `NEW`, sem conferir o período de `OLD`. Não cobre DELETE. Há dois índices idênticos: `fechamentos_periodos_ativo_idx` e `fechamentos_periodos_ativo_unico_idx`.

**Consequência:** o catálogo não garante impedir exclusão de movimentos sem dependentes, mudança de uma data fechada para outra aberta ou alteração de classificação e competência de títulos de período fechado. Sobreposições de intervalos diferentes também não são impedidas pela unicidade de datas exatas.

**Recomendação:** especificar quais datas e valores cada fechamento protege; cobrir registros relacionados e as datas anterior e nova; registrar motivo e autor de reabertura sem apagar o fechamento anterior. Definir política de sobreposição entre módulo específico e `todos`. Consolidar os índices duplicados após verificar dependências. “Fechamento financeiro” e as funções de conferência de totais chamadas `validar_fechamento_*` são mecanismos distintos.

### A4. Histórico possui permissões e proteção inconsistentes

**Evidência:** `cadastros_eventos` e `vendas_eventos` têm apenas política RLS SELECT. `erp_runtime` possui privilégio INSERT, mas não bypass de RLS; privilégio por si só não supera a falta de política de inserção. `ordens_servico_eventos` tem INSERT/SELECT, mas não o gatilho de imutabilidade presente em outros históricos. `cobrancas_eventos` tem campos `processado_em` e `erro_mensagem`, porém seu gatilho impede qualquer UPDATE/DELETE.

**Consequência:** inserções diretas nos dois primeiros históricos, sob papel sujeito a RLS, não têm uma política que as autorize. O evento de cobrança não pode ser gravado e depois marcado como processado na mesma linha por uma atualização comum. Não foi testada nenhuma escrita nem o caminho da aplicação nesta avaliação.

**Recomendação:** padronizar eventos comerciais como registros anexáveis e imutáveis, com política INSERT específica e leitura autorizada. Separar evento recebido de tentativas/processamento mutável quando necessário. Manter histórico de OS protegido mesmo em rotas privilegiadas. Não resolver a falta de INSERT desabilitando RLS.

### A5. Existem assimetrias relevantes entre pagar e receber

**Evidência:** `contas_pagar` possui `tipo_lancamento`, `recorrencia_financeira_id`, `chave_idempotencia`, eventos e arquivos próprios. `contas_receber` não possui equivalentes estruturados para esses recursos. `recorrencias_financeiras.tipo` aceita `receber`, mas não há FK correspondente em contas a receber.

**Recomendação:** definir uma política única para previsão versus título efetivo; acrescentar idempotência ao recebível manual/importado e histórico de alterações; criar vínculo de arquivos. Para receitas recorrentes, escolher explicitamente entre contrato como origem obrigatória ou recorrência financeira independente. Se a segunda for permitida, completar seus vínculos e unicidade por ocorrência; caso contrário, restringir o tipo que hoje promete esse suporte.

### A6. Rateios permitem ambiguidade e não participam da DRE

**Evidência:** `rateios_financeiros` permite `valor` e `percentual` simultâneos, sem conferir sua equivalência, e verifica apenas a existência de categoria ou centro. Não existe verificação da soma do conjunto. `vw_dre_gerencial` usa somente categoria e valor do cabeçalho e não lê rateios, `entrada_dre` ou `considera_custo_dre`. Também não exclui `contas_pagar.tipo_lancamento='previsao'`.

**Recomendação:** escolher valor monetário como base final do rateio e percentual como informação de origem, ou definir outro contrato inequívoco. Conferir total distribuído e arredondamento por título. Categoria e centro devem ser dimensões da mesma distribuição, evitando contar o valor duas vezes. Previsões precisam ser separadas do resultado realizado por competência. Só adicionar rateios próprios de parcelas se houver necessidade de distribuição distinta por vencimento; herança do título pode atender o primeiro escopo.

### A7. Validação de totais cobre parte das equações, não todas

**Evidência:** os gatilhos existentes conferem subtotal comercial e total de parcelas; é uma proteção a manter. Entretanto, não conferem a equação de cada item de venda, contrato ou OS. Contratos e OS não têm o mesmo fechamento diferido dos totais. Em `vendas`, `tipo_desconto` admite percentual, mas a função do banco subtrai `desconto` como valor absoluto. O mesmo padrão aparece em compras.

**Recomendação:** explicitar `percentual_desconto` e `valor_desconto`, ou definir que `desconto` é sempre o valor calculado e guardar o percentual de origem separadamente. Fixar arredondamento de item e documento. Validar documentos efetivados, permitindo rascunhos incompletos. Ao mover um item/parcela entre documentos, a validação diferida atual usa o novo pai; proteger a mudança ou validar pai anterior e novo. Não presumir ausência de toda proteção: já existem boas conferências de cabeçalhos e parcelas.

### A8. Uma FK bancária tem ação de exclusão incompatível com a empresa obrigatória

**Evidência:** `transacoes_bancarias_importacao_fk` referencia `(tenant_id, importacao_bancaria_id)` com `ON DELETE SET NULL` sem limitar a coluna. `tenant_id` é NOT NULL.

**Consequência:** excluir fisicamente uma importação referenciada tentaria tornar ambas as colunas nulas e falharia. Isso é conflito de modelagem, não perda de dados constatada.

**Recomendação:** preferir retenção/RESTRICT se a importação deve ser preservada; se a remoção for permitida, anular somente a coluna de importação. A ação deve expressar a política de retenção escolhida. [Semântica de constraints no PostgreSQL](https://www.postgresql.org/docs/17/ddl-constraints.html).

### B1. Contratos precisam de vigência dos itens e regra completa de ciclo

**Evidência:** o cabeçalho já possui início, fim, periodicidade, dia de vencimento, próximo processamento e reajuste. Os itens não possuem vigência, versão, unidade, categoria ou centro de custo; também não há tabela própria de versões ou eventos contratuais. As gerações são únicas por contrato/competência e possuem status/erro, o que é uma boa base.

**Recomendação:** manter as três tabelas. Acrescentar regras explícitas de ciclo, vencimento relativo ou fixo, fim de mês e período prestado. Versionar condições e itens com início/fim de vigência. Cada geração deve identificar qual versão e período originaram os valores. Guardar tentativas separadamente do ciclo único. Distinguir ajuste automático e renegociação de preço: o CHECK atual só admite reajuste não negativo, que pode ser uma decisão válida para um índice, mas não representa redução contratual.

**Atenção à competência:** o contrato aceita periodicidade semanal e quinzenal. Não impor simplesmente um único registro por mês; a chave deve identificar a ocorrência real. Recomenda-se período de referência com início/fim e identificador estável de ciclo, preservando a unicidade já existente até a regra ser definida.

### B2. Adiantamentos, créditos e renegociações não têm representação própria

**Evidência:** todo pagamento exige uma parcela a pagar ou a receber. Não há tabelas de adiantamentos/créditos e suas aplicações, nem relacionamento entre parcelas antigas e novas de uma renegociação.

**Recomendação:** modelar saldo a favor de cliente/fornecedor, origem do dinheiro, aplicações em parcelas e devoluções. Para renegociação, preservar o acordo, parcelas de origem, parcelas resultantes e ajustes. Evitar título fictício de venda ou pagamento sem origem apenas para acomodar crédito. Aplicar crédito deve liquidar dívida sem gerar uma segunda entrada de caixa.

Isso é prioridade de cobertura profissional; não significa que todo prestador precisará usar esses recursos no início. O mecanismo deve ser desenhado antes de prometer adiantamentos ou renegociação.

### B3. Contatos, endereços e unidades de serviço são limitados

**Evidência:** `entidades` possui um conjunto principal de endereço e contatos, além de arrays de e-mails de cobrança. `servicos` não tem unidade de cobrança. Itens de venda preservam descrição, preço e custo, mas não unidade/código acordados nem categoria por item. O cabeçalho da venda não tem snapshot estruturado de identificação do cliente, ao contrário de contas a receber.

**Recomendação:** contatos e endereços relacionados à entidade, com finalidade e indicação de principal; unidade explícita do serviço e snapshot no documento; preservar os dados acordados no momento da confirmação. Os campos existentes podem continuar como principais durante a transição. Histórico global de preços do catálogo é secundário se os valores dos contratos e documentos estiverem corretamente preservados.

### B4. As FKs comerciais garantem empresa, mas não coerência de negócio

**Evidência:** a OS aponta para orçamento/venda e cliente independentemente. A geração de contrato também aponta a uma venda independente. Nada nas constraints consultadas exige cliente compatível ou tipo de documento adequado. `vendas_origem_documento_unica_idx` já impede mais de um documento ativo por origem. `ordens_servico.venda_id` não é único; múltiplas OS podem apontar à mesma venda.

**Recomendação:** definir e garantir a coerência de cliente/tipo/origem. Manter uma venda por ciclo como regra inicial, sem presumir que cada origem aceite apenas uma conversão para sempre. Para faturamento parcial ou agrupado, criar associação de itens e quantidades/valores faturados; não relaxar unicidades sem rastreabilidade. Tratar orçamento→pedido→venda de forma explícita, impedindo autorreferência e ciclos.

### B5. Permissões separam empresas, mas não restringem toda leitura por função

**Evidência:** políticas SELECT financeiras examinadas usam `shared.is_tenant_member(tenant_id)`, sem capacidade específica de leitura financeira. Políticas de escrita usam capacidades. Um membro ativo não é necessariamente um funcionário autorizado a consultar todo o financeiro.

**Recomendação:** decidir as capacidades de leitura por domínio e dados sensíveis; refletir isso em políticas e perfis. Preservar os vínculos existentes entre membros, usuários e empresa. RLS habilitado não comprova sozinho isolamento funcional; o que está demonstrado é a existência das políticas e FKs, não um teste de acesso de ponta a ponta. A ausência de RLS nas tabelas compartilhadas de identidade não é tratada como vazamento: não foram encontrados grants diretos dessas tabelas para `anon`/`authenticated` no catálogo coletado.

## 5. Parecer individual das 50 tabelas

### Cadastros e suporte — 9 tabelas

| Tabela | O que já atende | Recomendação |
| --- | --- | --- |
| `entidades` | Pessoa única com papéis de cliente/fornecedor/vendedor, documento único por empresa e versão. | Manter unificada. Relacionar contatos/endereços; definir normalização de documento/código sem pressupor que documentos sejam apenas dígitos; proibir nomes vazios. Não exigir documento de todo prospect. |
| `servicos` | Preço, custo, categoria, centro e versão. | Acrescentar unidade de cobrança; definir semântica de `tipo_servico`; preservar parâmetros comerciais em itens. Tabelas de preços complexas são extensão C. |
| `categorias` | Hierarquia, tipo, dois indicadores de DRE e código único. | Definir grupo/ordem de DRE e se categoria recebe lançamentos ou agrupa filhas; impedir autorreferência e ciclos. Separar finalidade comercial/financeira sem necessariamente separar tabelas. |
| `centros_custo` | Dimensão financeira independente e código único. | Manter. Nome não vazio e trilha de alterações; hierarquia apenas se houver departamentos/subdepartamentos. Não usar centro de custo como substituto obrigatório de projeto. |
| `metodos_pagamento` | Tipos suficientes para o núcleo e estado ativo. | Manter como catálogo de meios. Não misturar meio de pagamento com condição de parcelamento; condições reutilizáveis podem ter modelo próprio se necessário. |
| `arquivos` | Caminho único, tamanho, hash e metadados. | Manter. Completar associações com recebíveis, vendas, contratos e OS; preservar autor/data/finalidade. Relações com FK real são preferíveis a IDs soltos em JSON. |
| `cadastros_eventos` | Evento, versão, dados e gatilho de imutabilidade. | Corrigir política INSERT. O destino `(entidade_tipo, entidade_id)` é polimórfico e não tem FK; garantir referência/empresa por mecanismo explícito ou aceitar essa limitação documental. Ampliar tipos somente para cadastros realmente auditados. |
| `produtos` | Cadastro referenciado por itens já existentes. | Preservar como dependência. Sem proposta de evolução de mercadorias, atributos fiscais ou estoque nesta avaliação. |
| `fornecedores_produtos` | Associação, código do fornecedor e custo de referência. | Preservar como dependência de compras existentes; sem expansão para o foco de serviços. |

### Vendas e contratos — 7 tabelas

| Tabela | O que já atende | Recomendação |
| --- | --- | --- |
| `vendas` | Orçamento/pedido/venda na mesma estrutura, origem, versão, idempotência e conferência de total. | Manter unificada; precisar `status` versus `situacao`; snapshot de cliente e condições; conferir desconto e origem, sem adicionar flags redundantes. |
| `vendas_itens` | Produto ou serviço exclusivo, descrição, preço, custo e atendimento parcial. | Unidade/código e categoria comercial-financeira acordados; ordem do item; equação do total/desconto; referência opcional ao item contratual/OS para rastrear origem. |
| `vendas_recebimentos_previstos` | Parcelamento previsto com número único por venda. | Manter distinguindo previsão comercial e dívida efetiva. Criar referência de origem na parcela efetiva quando for necessário provar a conversão; impedir duplicação da mesma previsão. |
| `vendas_eventos` | Evento, estados, versão, imutabilidade e índice de histórico. | Corrigir política INSERT e registrar alterações comerciais de forma consistente. Não usar eventos como substitutos de todos os snapshots. |
| `contratos_vendas` | Cliente, vigência, periodicidade, vencimento, reajuste, versão e idempotência. | Regra de ciclo/vencimento, motivos e datas de suspensão/cancelamento por histórico; versões vigentes das condições; índice de próximos ciclos se o uso justificar. |
| `contratos_vendas_itens` | Vários itens, descrição e preço contratados. | Vigência e versões, unidade, classificação e referência estável do item. Não editar destrutivamente a composição que explica competências antigas. |
| `contratos_vendas_geracoes` | Um ciclo por competência e idempotência, situação, falha e vínculo à venda. | Preservar unicidades. Identificar versão/período; consistência entre status, venda e processamento; histórico de tentativas. Falta índice que comece por `(tenant_id, venda_id)` para consulta inversa, a avaliar com uso. |

### Ordens de serviço — 3 tabelas

| Tabela | O que já atende | Recomendação |
| --- | --- | --- |
| `ordens_servico` | Cliente, responsável, datas, estados, observações e vínculos comerciais. | Descrição estruturada do escopo do serviço, aceite/conclusão/cancelamento com referência documental quando exigidos; vínculo contratual se aplicável. `responsavel_id` aponta a `entidades`, cujos papéis não incluem colaborador: distinguir executor prestador de usuário responsável sem forçar papel de vendedor. |
| `ordens_servico_itens` | Itens e valores básicos com origem exclusiva. | Unidade, ordem, custo acordado quando houver margem por OS e vínculo com item faturado; garantir equação do total. Quantidade executada apenas se houver execução parcial. |
| `ordens_servico_eventos` | Estados anterior/novo e autor/data. | Manter INSERT/SELECT e acrescentar proteção de imutabilidade coerente com outros históricos. Dados JSON são adequados para detalhes do evento. |

### Compras comerciais e contratação de terceiros — 8 tabelas

| Tabela | O que já atende | Recomendação |
| --- | --- | --- |
| `compras` | Compra de produto ou serviço, fornecedor, snapshots, condições e histórico de confirmação. | Manter para contratação de terceiros. Precisar `status` e `tipo_movimento`, desconto e regra de geração financeira. Nenhuma proposta sobre recebimento físico ou tributos. |
| `compras_itens` | Serviço/produto exclusivo, valores bruto/líquido, desconto e snapshots. | Conferir equações e ordem dos itens. Vínculo com OS/contrato/projeto somente quando for necessário atribuir custo de terceirização; não esconder essa origem em texto livre. |
| `compras_parcelas_previstas` | Número único, valor, percentual, vencimento e meios. | Conferir valor/percentual e ligação com parcela efetiva. Limite de 48 parcelas é uma restrição de produto, não qualidade universal; documentar ou flexibilizar conforme escopo. |
| `compras_arquivos` | Associação com arquivo, unicidade ativa e FKs. | Manter e usar como padrão de vínculo documental dos demais módulos. |
| `compras_eventos` | Evento imutável com autor e data. | Manter; alinhar grants/políticas à imutabilidade. Índice por compra e data é candidato conforme uso. |
| `compras_recorrencias` | Modelo de compra, frequência/intervalo e regras de término. | Validar relação entre tipo de término, data e quantidade; preservar condições do modelo por vigência. Definir limites entre recorrência de compra e financeira para não gerar a mesma despesa duas vezes. |
| `compras_recorrencias_geracoes` | Vínculo compra/recorrência/competência com unicidade ativa. | Registrar tentativa/falha em estrutura apropriada; política de reprocessamento e retenção da chave mesmo após exclusão lógica. |
| `naturezas_operacao_compra` | Nome/código e padrão de geração financeira. | Manter como configuração comercial existente. Não expandir aspectos fiscais/de estoque. |

### Financeiro e cobrança — 14 tabelas

| Tabela | O que já atende | Recomendação |
| --- | --- | --- |
| `contas_financeiras` | Tipos, identificação bancária, saldo inicial e uma conta padrão ativa. | Exigir data para saldo inicial relevante e preservar alterações após movimentos; fixar BRL no escopo ou explicitar moeda antes de multimoeda. Histórico de conta sem recriar saldos independentes. |
| `contas_pagar` | Origem, previsão/efetivo, recorrência, snapshots e idempotência. | Preservar. Coerência de origem com fornecedor/compra e competência obrigatória quando efetivado para DRE; histórico de alterações de classificação. |
| `contas_pagar_parcelas` | Parcelamento, vencimento, previsão de pagamento e ajustes. | Definir valores originais/derivados e liquidação acumulada; preservar vencimento anterior em renegociações; não confundir saldo de dívida com caixa líquido. |
| `contas_pagar_arquivos` | FKs e unicidade por título/arquivo. | Manter. Base para simetria documental do recebível. |
| `contas_pagar_eventos` | Histórico imutável de título. | Manter; definir quais eventos abrangem suas parcelas e pagamentos, sem duplicar trilhas incompatíveis. |
| `contas_receber` | Venda opcional, cliente, snapshots, valor e cobrança. | Idempotência, eventos, arquivos e decisão explícita de previsão/recorrência. Manter uma conta por venda se o título já comporta todas as parcelas. |
| `contas_receber_parcelas` | Estrutura simétrica às parcelas a pagar. | Mesmas regras de principal/ajustes/liquidação, vínculo da previsão de origem e suporte de crédito/renegociação quando implantados. |
| `pagamentos` | Uma parcela por operação, encargos, taxa, conta e estorno. | Corrigir garantias A2. Pagamento de várias parcelas pode ser um lote com várias linhas atuais; não é obrigatório desmontar a tabela. Para dinheiro ainda não aplicado, prever adiantamento/movimento independente. |
| `rateios_financeiros` | Título a pagar ou receber, categoria e centro. | Regras A6; total e arredondamento, sem dupla contagem. Rateios por item de contrato podem gerar esta distribuição ao constituir o título, preservando a origem. |
| `recorrencias_financeiras` | Frequência, término e marcadores de geração/pausa. | Falta modelo explícito dos valores/beneficiário/classificação fora de `metadata` e dos títulos anteriores. Definir título-modelo ou parâmetros relacionais versionados e completar geração por ocorrência; revisar tipo `receber`. |
| `transferencias_financeiras` | Origem/destino distintos, valor e estado. | Idempotência e reversão identificável, datas de efetivação/compensação conforme necessidade. Transferência concluída não deve desaparecer do histórico por simples alteração de status. |
| `cobrancas` | Parcela, idempotência, canal, situação, referência e dados de cobrança. | Preservar. Explicitar relação com recebimentos/baixas, sem confundir cobrança com título. Unicidade por parcela/tipo permite Pix e boleto simultâneos: ambos devem apontar à mesma dívida e respeitar sua liquidação. Provedor fica para trabalho futuro. |
| `cobrancas_eventos` | Identificação externa/hash, payload e estados. | Resolver imutabilidade versus processamento. Definir escopo de unicidade por provedor/conta quando IDs externos não forem globais; manter evento bruto e resultado de processamento separados. |
| `cobrancas_notificacoes` | Destinatário, canal, agenda e entrega. | Identificador estável do aviso e tentativas separadas para evitar duplicidade de reagendamento. Manter estrutura, sem implementar envios ou conexões nesta etapa. |

### Bancos e conciliação — 5 tabelas

| Tabela | O que já atende | Recomendação |
| --- | --- | --- |
| `transacoes_bancarias` | Conta, origem, valor, datas, identificação externa e situação. | Corrigir FK A8; preservar evidência original e definir fallback de deduplicação quando falta identificador, sem rejeitar dois movimentos legítimos iguais. |
| `importacoes_bancarias` | Hash único por conta, status e contadores. | Política de reprocessamento de arquivo que falhou sem forçar nova identidade; vínculo opcional ao arquivo original; intervalo e contadores coerentes. |
| `conciliacoes_bancarias` | Conta, período, estado e saldos de conferência. | Coerência de conta de todos os itens, fechamento e reabertura; histórico das revisões se os saldos forem alterados. |
| `conciliacoes_bancarias_itens` | Alocação, origem e desfazimento com autor/data. | Alteração A1: várias associações com somas controladas, conta e direção compatíveis. Manter trilha do desfazimento. |
| `regras_conciliacao_bancaria` | Preferências de correspondência e tolerância por conta. | Manter como configuração única por conta. Não é ainda um motor de várias regras; padrões, prioridades e ações só devem ser modelados se esse recurso entrar no produto. |

### Importação e controles — 4 tabelas

| Tabela | O que já atende | Recomendação |
| --- | --- | --- |
| `importacoes_dados` | Tipo, hash, mapeamento e resultado do lote. | Guardar versão do mapeamento e política de retomada quando necessário; distinguir contadores sobrepostos de totais somáveis e garantir limites. |
| `importacoes_dados_linhas` | Original/normalizado, erros, número único e referência ao resultado. | `registro_id` não possui FK porque o destino depende do tipo do lote. Documentar/garantir destino e tenant, ou usar associações tipadas; chave estável de retomada. JSON aqui é apropriado. |
| `execucoes_automacao` | Tipo, competência, idempotência, tentativas, resultado e tempos. | Manter para execução de lote. Não substituir o histórico de cada ciclo/contrato; registrar tentativas individualmente se for preciso explicar falhas sucessivas e tempos de retomada. |
| `fechamentos_periodos` | Período, módulo, autor e reabertura. | Corrigir cobertura A3, remover redundância de índices futuramente e preservar sequência de fechamento/reabertura com motivo. |

## 6. Views financeiras

| View | Parecer e mudança proposta |
| --- | --- |
| `vw_aging_receber` | Mantém faixas de atraso, mas usa `valor - valor_pago` e filtra só exclusão/status da parcela. Conferir a semântica de liquidação com desconto e filtrar título excluído/cancelado. Cadastro de cliente inativo não deve apagar dívida histórica. |
| `vw_aging_pagar` | Mesmos ajustes; distinguir previsão de obrigação efetiva quando necessário. Usar snapshot para identificação histórica quando apropriado. |
| `vw_dre_gerencial` | Incorporar rateios e grupos de DRE; separar previsões e natureza de receita/despesa. Recebimento de empréstimo/adiantamento não é automaticamente receita; preservar essa distinção no modelo. Evolução da classificação exige regra de vigência ou snapshot para não reescrever relatórios fechados. |
| `vw_fluxo_caixa_diario` | Atualmente é movimento líquido por dia/conta, sem saldo inicial acumulado nem previsão. Exclui original estornado e registro de estorno, podendo apagar o movimento histórico de um período anterior quando a reversão ocorre depois. Definir se representa movimentos históricos ou operações ainda válidas; para extrato histórico, preservar entrada original e saída de reversão em suas datas. Acrescentar visão prevista e visão de saldo usando base de movimentos consistente. |

As views não devem gerar dívida ou caixa novamente a partir de valores já registrados em pagamentos. Competência, vencimento, pagamento e crédito bancário são datas distintas e precisam de definição explícita. O campo `data_credito` já existe em pagamentos, mas a view de caixa usa `data_pagamento`; escolher o significado de cada relatório.

## 7. Estruturas novas recomendadas e extensões condicionais

Os nomes são propostas para o desenho final. Todas as relações novas devem carregar `tenant_id`, FKs compostas e regras de acesso coerentes. Não é necessário criar todas de uma vez.

| Estrutura proposta | Conteúdo mínimo e relações | Prioridade |
| --- | --- | --- |
| `entidades_contatos` | Entidade, nome, função, meios de contato, finalidade, principal/ativo e autor/datas. Contato pode ter várias finalidades; evitar duplicar a pessoa só por ser financeira e comercial. | B |
| `entidades_enderecos` | Entidade, identificação do endereço, finalidade e principal/ativo. Documentos preservam snapshot do endereço utilizado. | B |
| `contratos_vendas_versoes` | Contrato, número da versão, vigência, condições de ciclo/vencimento, motivo e autor. Versões efetivadas preservadas; períodos de vigência não se sobrepõem para a mesma regra. | B alta |
| `contratos_vendas_itens_versoes` ou itens vinculados à versão | Item lógico, versão contratual, serviço, descrição/unidade, quantidade/preço/desconto e classificação. Escolher uma das duas abordagens, não duplicar a mesma fonte de verdade. | B alta |
| `contratos_vendas_eventos` | Ativação, suspensão, retomada, alteração, encerramento, autor, instante e referência à versão. | B alta |
| Tentativas de geração contratual | Ciclo existente, número da tentativa, início/fim, situação e erro. Única por ciclo/tentativa; sucesso vinculado ao documento resultante. Pode compartilhar padrão com outras recorrências. | B |
| `contas_receber_eventos` | Título/alteração de parcela, evento, autor/data e dados históricos imutáveis. | A |
| `pagamentos_eventos` ou trilha financeira dedicada | Liquidação, correção/reversão e sua origem. Escolher cobertura única para títulos/parcelas/pagamentos, evitando dois históricos concorrentes. | A |
| Vínculos de arquivos para receber, vendas, contratos e OS | Dono, arquivo, finalidade, autor/data; unicidade da associação. Preferir tabelas de vínculo com FK por domínio, seguindo o padrão de compras. | B |
| Créditos/adiantamentos e suas aplicações | Entidade, tipo, origem financeira, valor inicial, situação e aplicações em parcelas com valor; devolução ligada ao crédito original. Saldo derivado, aplicações sem nova movimentação de caixa. | B |
| Renegociações e vínculos de parcelas | Acordo, data, motivo, parcelas antigas, parcelas novas, valores e ajustes. História preservada e sem dupla dívida. | B |
| Lotes de liquidação | Agrupador dos pagamentos existentes com origem, data e idempotência. Opcional se a associação bancária N:N e os pagamentos atuais já atenderem ao agrupamento necessário. | C |
| Grupos de DRE | Classificação ordenada, natureza e agregação das categorias. Pode começar como catálogo pequeno; sem necessidade de contabilidade completa de partidas dobradas. | B |
| Recorrência financeira: modelo e gerações | Valores/beneficiário/classificação vigentes e vínculo da ocorrência ao título. Reaproveitar colunas/títulos existentes quando houver regra inequívoca de modelo. | B |

Não recomendo criar agora: motor genérico de workflows, dezenas de tabelas de parâmetros, CRM completo, tabela financeira universal para substituir todos os títulos, tabela genérica de vínculos sem integridade, ou um razão contábil completo sem escopo contábil.

Projetos, apontamento de horas, equipe por OS, comissões, despesas reembolsáveis, centros de custo hierárquicos, múltiplas empresas jurídicas dentro do mesmo tenant e multimoeda são extensões C. Para consultorias/agências, projetos/horas podem subir de prioridade; para manutenção, execução e equipe podem ser mais importantes. Ser profissional exige sustentar os cenários prometidos, não antecipar todos.

## 8. Regras recomendadas para o desenho final

1. Uma entidade pode ter vários papéis; pessoa de contato e usuário de acesso são conceitos separados.
2. Um contrato possui vários itens e versões; cada ciclo identifica período e versão utilizados. Uma venda por ciclo é a regra inicial sugerida, com valores adicionais incorporados de forma rastreável.
3. Vendas preservam itens e condições acordadas. Recebíveis preservam o vínculo com a venda e parcelas previstas, sem duplicar a receita por existirem nos dois domínios.
4. Um título tem várias parcelas; uma parcela pode ter várias liquidações. Agrupamento de pagamento não deve obrigar a fundir dívidas distintas.
5. Uma transação bancária pode corresponder a vários pagamentos, e um pagamento pode ser conciliado em partes, sempre com limites e compatibilidade de conta/sentido. Transferências têm duas pontas.
6. Adiantamento registra dinheiro antes da aplicação. Sua aplicação reduz dívida e crédito disponível, sem novo caixa.
7. Renegociação liga obrigações antigas às novas e conserva pagamentos anteriores. Não sobrescrever simplesmente vencimento e valor de tudo.
8. Histórico explica alterações; snapshots explicam o conteúdo do documento; versões explicam a vigência das condições. Um mecanismo não substitui integralmente os demais.
9. Dados efetivados devem ser cancelados/revertidos com rastreabilidade. Exclusão física pode continuar para rascunhos sem dependências e registros temporários conforme política explícita.
10. Manter moeda única BRL e uma empresa operacional por tenant como premissas iniciais, caso esse seja o produto escolhido; expansão posterior exige modelo próprio, não apenas um campo solto.

Essas regras são recomendações, não afirmações de comportamentos já existentes. As cardinalidades que dependem de decisão de produto devem ser fixadas antes do desenho de migração correspondente.

## 9. Índices, restrições e estratégia de garantia

Não recomendo adicionar índices a todas as FKs indiscriminadamente. Já existem índices úteis de cliente/data, vencimento, origem e idempotência. Candidatos de avaliação: itens por contrato e OS; pagamentos por parcela a pagar/receber; contratos ativos por próxima geração; conciliações por conta/período; eventos por documento/data; gerações por venda. O catálogo demonstra ausência ou composição atual, mas não mede lentidão: confirmar com volume e planos de consulta antes de concluir benefício.

Unicidades de idempotência que ignoram registros excluídos permitem reutilizar a chave após exclusão lógica. Decidir se isso é permitido em importações, cobranças e movimentos efetivados; para operações financeiras, conservar a identidade histórica costuma ser a opção mais previsível.

Dados derivados exigem contrato explícito. `valor_total`, `valor_pago`, `valor_liquido`, `status`, `conciliado` e marcadores de geração não devem poder divergir livremente das linhas que os explicam. Evitar status temporal `vencido` como única verdade: vencimento muda com o calendário mesmo sem UPDATE.

CHECKs são adequados para regras da própria linha; somas, ciclos hierárquicos, limites de liquidação e consistência entre pais/filhos exigem garantias transacionais apropriadas, inclusive sob concorrência. O PostgreSQL não suporta usar CHECK como garantia geral sobre outras linhas/tabelas. [Documentação de constraints](https://www.postgresql.org/docs/17/ddl-constraints.html). Isso faz parte do desenho do banco, não é solicitação para reescrever a aplicação nesta avaliação.

## 10. Sequência de evolução recomendada

1. **Integridade fundamental:** resolver A1–A8, definir fórmulas e semânticas de valores, políticas de eventos e proteção de períodos. Entrega: especificação de constraints, gatilhos, índices e permissões que realmente faltam.
2. **Cadastros e documentos:** unidade, contatos/endereços, snapshots, classificação por item e vínculos de arquivos. Entrega: modelo mínimo de dados comerciais preserváveis.
3. **Contratos e recorrências:** ciclos, versões, vigências, eventos, tentativas e origem dos títulos. Entrega: modelo capaz de explicar qualquer competência antiga e futura.
4. **Liquidação ampliada:** créditos/adiantamentos, aplicações e renegociação, mantendo compatibilidade com pagamentos/parcelas atuais. Entrega: relações e equações que evitem duplicar caixa ou dívida.
5. **Classificação e visões financeiras:** rateios, DRE, aging, caixa previsto/realizado e histórico de reversões. Entrega: especificação de views com reconciliação até os registros de origem.
6. **Consolidação:** dicionário final, diagrama, decisões de cardinalidade, plano de migração e consultas de validação. A execução de migrações permanece fora da autorização atual.

## 11. Cenários que o banco deve conseguir representar e proteger

| Cenário | Critério estrutural de aceitação |
| --- | --- |
| Cliente com contatos diferentes | Responsável contratual e financeiro distintos sem duplicar a entidade. |
| Serviço vendido em horas | Unidade e preço da operação preservados depois de editar o catálogo. |
| Contrato de fim de mês | Regra explícita para meses curtos e referência original preservada. |
| Contrato semanal | Duas semanas do mesmo mês não colidem por uma chave mensal inadequada. |
| Reajuste futuro | Março continua explicável com o preço antigo depois da alteração válida em abril. |
| Suspensão e retomada | Intervalo e motivo preservados; geração identifica quais períodos foram ignorados. |
| Reprocessamento | Mesma ocorrência não cria outro resultado comercial/financeiro por repetição. |
| Baixa com desconto | R$ 1.000 quitados por R$ 900 mais R$ 100 de desconto; caixa e saldo de dívida corretos. |
| Pagamento parcial | Duas liquidações explicam uma parcela; concorrência não liquida além do permitido. |
| Estorno em outro mês | Movimento original permanece no mês original e reversão aparece no mês correspondente. |
| Depósito agrupado | Um crédito bancário relacionado a vários pagamentos sem duplicar seu valor. |
| Transferência | Saída e entrada relacionadas à mesma transferência, sem virar despesa/receita. |
| Adiantamento | Dinheiro recebido antes do serviço e aplicado depois sem nova entrada de caixa. |
| Renegociação | Parcelas antigas e novas relacionadas, com histórico e sem cobrança dupla. |
| Rateio | R$ 1.000 distribuídos em R$ 600 e R$ 400; DRE totaliza R$ 1.000. |
| Previsão de despesa | Aparece na visão prevista apropriada e não infla automaticamente a DRE efetiva. |
| Período fechado | Mudanças em datas, itens, parcelas, classificação e exclusões respeitam a proteção definida. |
| Separação por empresa | Vínculo entre empresas diferentes rejeitado; leitura respeita também função autorizada. |
| Histórico | Operação autorizada registra evento; evento consolidado não é reescrito. |
| Exclusão de importação | Política de retenção coerente, sem tentativa de anular `tenant_id`. |

Esses são critérios propostos para validação futura. Nenhum teste de escrita foi executado na base durante esta avaliação.

## 12. Decisão recomendada

Manter as tabelas centrais e evoluir as garantias de integridade primeiro. A base está mais avançada do que um cadastro simples de contas, mas ainda precisa de estrutura temporal para contratos, liquidação financeira verificável, conciliação flexível e histórico uniforme. Essas melhorias são mais relevantes para a qualidade do ERP de serviços do que aumentar o número de tabelas ou dividir schemas.

O próximo resultado de projeto deve ser um desenho final com alterações exatas por tabela, incorporando as decisões de cardinalidade indicadas aqui. Esta avaliação não executa esse desenho nem aplica migrações.
