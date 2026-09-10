# Revisão completa do modelo ERP para prestadores de serviços

Data: 09/09/2026. Supabase Creatto: `mtadnxqoqxzbdksktwdr`.

**Implementação posterior:** as correções estruturais foram aplicadas na migração `20260909040000`, com 134 verificações isoladas aprovadas. Permanecem 82 tabelas e 2 views de estoque. [O relatório de implementação detalha as regras e os limites restantes](../melhorias-estruturais/README.md), incluindo dados existentes fora do escopo e validação de carga/concorrência ainda pendente. Os achados abaixo registram o estado anterior à correção, não uma nova auditoria do estado posterior.

**Atualização de escopo:** por orientação posterior do usuário, investigação e correção de dados existentes ficam fora do trabalho atual. As quatro views financeiras foram excluídas na migração `20260909033000`; permanecem 82 tabelas e 2 views de estoque. A revisão abaixo registra os achados estruturais; [a remoção está documentada aqui](../remocao-views-financeiras/README.md).

## Parecer

**A estrutura é aproveitável, mas ainda não está concluída nem validada para os cenários financeiros e comerciais previstos.** Não recomendo outro lote de tabelas agora. Recomendo corrigir as garantias das tabelas existentes e fechar as regras de negócio pendentes.

Encontrei também defeitos nas migrações recentes que implementei: perda potencial de contatos na normalização, ciclo contratual sem data final e identidade de operações ainda mutável. Esses pontos são correções da entrega, não melhorias opcionais. Os 77 testes anteriores cobriam cenários importantes, mas não justificam uma conclusão de completude do modelo.

Esta revisão não alterou tabelas, dados, funções ou views no Supabase. A conexão real foi usada somente em transações READ ONLY. As tentativas de gravar cenários inválidos ocorreram em PostgreSQL isolado, com dados fictícios e rollback.

## Cobertura e método

- Conferidas **82 tabelas e 6 views** no banco atual. O catálogo não apresentou diferenças em relação à última migração verificada.
- Revisadas individualmente **64 tabelas**: 50 anteriores e 14 novas. Elas somam 1.140 colunas, 259 índices, 314 FKs e 238 CHECKs. Esses números descrevem cobertura, não qualidade.
- Fora do escopo: 5 tabelas fiscais, 13 de estoque e 2 views de estoque. Produtos e vínculos de fornecedores foram considerados apenas como referências comerciais existentes. Sem revisão de UI.
- Todas as 82 tabelas estão com RLS habilitado; nenhuma restrição do schema ERP está pendente de validação. Isso não prova que todas as regras necessárias existam.
- Examinados campos, nulabilidade, FKs, unicidades, políticas de acesso, funções e gatilhos do banco, ciclos de vida, valores derivados, origem dos documentos e retenção histórica.
- Executados **28 cenários adicionais de investigação**. O conjunto inclui falhas reproduzidas, comportamentos que precisam de definição e controles positivos; não são 28 falhas nem 28 testes de aprovação.

A [matriz individual das 64 tabelas](tabelas.md) integra este parecer. Os resultados reproduzíveis estão em [provas.json](provas.json), com o cenário SQL em [review-probes.mjs](../../../scripts/erp/review-probes.mjs).

## A — Correções antes de usar os fluxos afetados

### A1. A normalização de contatos pode apagar dados válidos

**Tabelas:** `entidades`, `entidades_contatos`, `entidades_enderecos`.

Reproduzi a criação de uma entidade com e-mail, telefone e celular nos campos antigos. Ao adicionar somente um contato financeiro normalizado, os três campos comerciais ficaram nulos. A inserção da entidade ainda aceita os campos antigos, enquanto o mecanismo de projeção pressupõe que os contatos normalizados já representam toda a informação.

**Correção:** estabelecer uma transição completa. Migrar todos os meios existentes, inclusive telefone e celular diferentes; impedir novas gravações pelo formato antigo ou convertê-las de forma atômica. Atualizar uma finalidade não deve limpar outra. Aplicar o mesmo princípio aos endereços parciais. Campos principais devem apontar ou refletir uma fonte inequívoca, sem perda silenciosa.

**Aceite:** criar cliente com contato comercial, acrescentar contato financeiro e preservar ambos. Desativar um contato não apaga outro ainda válido. Prova: `cadastro_novo_legado_apagado_pela_normalizacao`. A perda foi reproduzida localmente; não foi demonstrada perda de contatos reais no Supabase.

### A2. Ciclos contratuais ainda aceitam estados insuficientes

**Tabelas:** `contratos_vendas_geracoes`, `contratos_vendas_versoes`, `contratos_vendas_geracoes_tentativas`, `vendas`.

Um ciclo novo foi aceito com `periodo_fim = NULL`. O CHECK e a comparação do gatilho não rejeitam explicitamente essa ausência. Também foi possível relacionar a mesma venda a dois ciclos mensais diferentes.

**Correção:** tornar início/fim obrigatórios nos ciclos novos, com regra explícita para registros legados; impedir reutilização de venda entre ciclos na política atual de uma venda por ciclo. Se houver faturamento agrupado no futuro, deverá ter uma associação de cobertura própria, não a reutilização silenciosa desse vínculo.

Uma geração marcada `concluida` também aceitou uma venda em rascunho de valor zero. **Esse caso precisa de definição:** pode ser válido se “concluída” significar somente que o rascunho foi produzido. Não pode ser usado como prova de venda efetivada/faturamento. Definir coerência entre geração, tentativa, versão e documento resultante.

**Aceite:** rejeitar ciclo sem fim; impedir dois ciclos usando a mesma venda sem regra de agrupamento; diferenciar geração de rascunho e efetivação comercial. Provas: `contrato_ciclo_sem_fim`, `mesma_venda_em_dois_ciclos`, `geracao_com_venda_rascunho_valor_zero`.

### A3. Idempotência ainda não é durável em todas as operações

**Tabelas:** `renegociacoes`, `contas_receber`, `transferencias_financeiras`; revisar também as unicidades de cobrança e recorrências.

Reproduzi trocar a chave de idempotência e reutilizar a chave anterior em outro registro. Isso ocorreu em renegociação em rascunho, transferência e recebível. Um índice único protege a situação atual da tabela, mas não conserva a identidade histórica se a chave puder mudar.

**Correção:** definir a chave uma vez, preservá-la após atribuição e não liberá-la por cancelamento/exclusão. Distinguir reutilização da operação e nova versão do documento. A função de repetição deve comparar conteúdo canônico e devolver o mesmo resultado para a mesma operação; chaves de negócio de ciclos continuam necessárias.

**Aceite:** alterar ou limpar uma chave já utilizada é rejeitado; repetir retorna a operação original; mesmo identificador com conteúdo incompatível é rejeitado. Provas: `renegociacao_chave_mutavel`, `transferencia_chave_mutavel`, `titulo_chave_mutavel`.

### A4. Equações comerciais e mudança de documento de origem ainda falham

**Tabelas:** `vendas`, `vendas_itens`, `vendas_recebimentos_previstos`, correspondentes de compras, `ordens_servico` e `ordens_servico_itens`.

Foram aceitos os seguintes cenários:

- Item de venda com quantidade 100, preço unitário R$ 100 e total R$ 100.
- Item de OS com quantidade 2, preço R$ 100 e total R$ 1.
- Venda com subtotal R$ 200, desconto identificado como percentual de 10 e total R$ 190: o validador subtrai 10 como valor monetário.
- Mover um item para outra venda e validar a venda de destino, deixando a venda confirmada de origem com subtotal R$ 100 e nenhum item.

**Correção:** estabelecer campos distintos para percentual informado e desconto monetário calculado, fórmulas por item e documento e arredondamento. Conferir pai anterior e novo nas mudanças de vínculo, ou impedir a movimentação de itens efetivados. Aplicar a mesma disciplina em compras comerciais e OS, sem alterar fiscal. Rascunhos podem continuar incompletos; a efetivação deve exigir consistência.

**Aceite:** valores de item não divergem de quantidade/preço/desconto; 10% de R$ 200 resulta em desconto monetário R$ 20; mover filho não deixa pai inconsistente. Provas: `venda_item_equacao_incorreta`, `os_item_equacao_incorreta`, `venda_percentual_tratado_como_valor`, `mover_item_deixa_venda_origem_inconsistente`.

### A5. FKs garantem empresa, mas não toda a coerência comercial

**Tabelas:** `ordens_servico`, `vendas`, `contas_receber`, `compras`, `contas_pagar` e origens dos documentos.

A criação de uma OS para um cliente com uma venda de outro cliente foi aceita. O bloqueio de troca posterior do cliente não resolve a incoerência inserida inicialmente.

**Correção:** validar cliente/fornecedor e tipo de documento na criação e em qualquer alteração do vínculo. Orçamento, pedido e venda precisam de relações semanticamente corretas, sem ciclos. Definir ligação entre previsão comercial e parcela financeira gerada; não considerar qualquer documento do mesmo tenant como origem válida.

**Aceite:** OS, venda, contrato e título relacionados mantêm o mesmo cliente, salvo cenário explícito de negócio previamente modelado. Prova: `os_nova_cliente_diverge_venda`.

### A6. Os campos financeiros e rateios ainda permitem interpretações conflitantes

**Tabelas:** `contas_receber_parcelas`, `contas_pagar_parcelas`, `pagamentos`, `rateios_financeiros`.

Uma parcela de R$ 1.000 aceitou `valor_bruto = 9999`, `valor_liquido = 1`, juros de R$ 10.000 e desconto de R$ 5.000 sem uma identidade que explique esses valores. Também foi aceito um rateio de R$ 2.000 em um título de R$ 1.000, com percentual de 10%.

**Correção:** fixar o significado de cada campo. Se campos forem previsões independentes, nomeá-los e distingui-los dos realizados; se forem derivados, garantir sua fórmula. No rateio, escolher valor como base final ou outra regra inequívoca e conferir soma/arredondamento. Categoria e centro de custo são dimensões da mesma distribuição, não duas despesas.

O controle positivo de desconto funcionou: principal de R$ 1.000, desconto de R$ 100 e caixa de R$ 900 quitaram a parcela. Nesse caso `valor_pago` ficou R$ 1.000. Portanto, o campo representa **principal baixado por pagamento**, e não dinheiro efetivamente recebido. A documentação anterior que o descrevia como dinheiro precisa dessa precisão.

**Aceite:** principal, encargos, descontos, taxas, caixa, crédito aplicado e saldo transferido são identificáveis sem dupla contagem. Provas: `parcela_valores_incoerentes`, `rateio_acima_titulo`, `pagamento_com_desconto`.

### A7. Fechamento não protege toda a interpretação histórica

**Tabelas:** `categorias`, `centros_custo`, `contas_financeiras`, títulos, rateios e `fechamentos_periodos`.

Após fechar o período de um título, a categoria associada pôde mudar de receita para despesa. Também foram aceitas categorias A → B → A, formando um ciclo hierárquico. A proteção aplicada nos documentos não protege automaticamente a semântica dos cadastros que eles referenciam.

**Correção:** impedir ciclos; preservar os atributos classificatórios relevantes por vigência/snapshot ou restringir sua alteração após uso. Proteger saldo inicial e data de contas financeiras quando já sustentam movimentos/períodos fechados. Não é necessário congelar toda correção de nome: separar rótulos de atributos que alteram o significado financeiro.

**Aceite:** mudar um cadastro não reinterpreta silenciosamente documentos de um período fechado. Provas: `classificacao_altera_periodo_fechado`, `categoria_ciclo_hierarquico`; saldo inicial foi identificado por inspeção estrutural, não por teste específico de concorrência.

### A8. Views financeiras antigas — remoção concluída

**Objetos:** `vw_aging_receber`, `vw_aging_pagar`, `vw_dre_gerencial`, `vw_fluxo_caixa_diario`.

- Após aplicar R$ 600 de crédito a uma parcela de R$ 1.000, a composição correta retorna R$ 400; a view de aging continua retornando R$ 1.000.
- A DRE soma o título renegociado e o título resultante como receita. No teste, havia R$ 2.000 em títulos antes do acordo; somente renegociar R$ 1.000 elevou a receita reportada para R$ 3.000.
- Uma antecipação de R$ 1.000 não aparece no fluxo de caixa antigo. A definição também exclui tanto pagamentos estornados quanto suas reversões, sem conservar os movimentos nas datas respectivas.

**Correção conforme sua decisão:** retirar as quatro views, sem criar substitutas. Existem consultas atuais que as usam; a remoção deve incluir a retirada/adaptação desses consumidores para não deixar consultas quebradas. Essa dependência foi confirmada em `erpManagementRepository` e `erpProfessionalRepository`; não foi feita revisão de interface.

**Aceite:** nenhum relatório/consulta usa os cálculos antigos; nenhum valor de principal renegociado vira nova receita por mera troca de obrigação. Provas: `view_aging_ignora_credito`, `view_dre_duplica_renegociacao`, `view_caixa_ignora_adiantamento`.

### A9. Dados existentes — fora do escopo atual

A investigação anterior foi arquivada como evidência histórica. Por orientação do usuário, não continuar consultas, saneamento ou correções de registros comerciais agora. A revisão e os testes devem tratar das regras das tabelas, usando cenários isolados.

## B — Completar antes de considerar cada recurso pronto

### B1. Recorrências e previsões

`recorrencias_financeiras` aceita término “por data” sem data de término. Aceita tipo `receber`, mas `contas_receber` não possui a ligação estruturada que existe em contas a pagar. Compras recorrentes também precisam de consistência entre modelo, ocorrência, período e documento gerado.

Uma conta a pagar marcada como `previsao` pôde ser integralmente paga e continuar sendo previsão. Pode existir efetivação automática ao pagar, mas ela precisa ser explícita e atômica; previsão e obrigação efetiva não podem ser indistinguíveis.

Completar: término por data/quantidade/indeterminado, pausa/encerramento, próxima ocorrência, identidade durável de geração e transição previsão → efetivo. Escolher se receitas recorrentes independentes de contrato são suportadas; o banco deve refletir essa escolha. Provas: `recorrencia_termino_sem_data`, `pagamento_liquida_previsao_pagar`.

### B2. Cobranças, eventos e notificações

`cobrancas_eventos` impede qualquer alteração, mas possui campos destinados a receber o resultado do processamento. A tentativa de preencher `processado_em` depois da inserção foi bloqueada pelo próprio gatilho de imutabilidade.

Separar evento recebido imutável e estado/tentativa de processamento. Consolidar identidade de notificações, transições de entrega e deduplicação sem perder histórico. Isso é modelagem; não exige implementar provedores externos agora.

Uma cobrança marcada `paga` foi aceita com a parcela em aberto. **Não classifico isso isoladamente como corrupção:** pode representar um evento externo recebido antes da liquidação interna. Os dois estados devem ser distinguíveis e reconciliáveis. Provas: `evento_cobranca_processamento_bloqueado`, `cobranca_paga_sem_liquidacao`.

### B3. Anexos e snapshots

A proteção de conteúdo/metadados funciona nos novos vínculos, mas um arquivo vinculado apenas a contas a pagar ainda pôde ter seu caminho substituído. Padronizar a política em compras, pagar, receber, vendas, contratos e OS.

Snapshots são congelados na criação do documento, inclusive rascunhos. Definir quais dados podem ser corrigidos antes da efetivação e quando o snapshot passa a representar o acordo final. Contratos/itens também precisam de unidade e classificação comercial preservadas; não basta manter só o nome e o preço.

O bloqueio de exclusão dos novos anexos é mais restritivo que uma política de rascunho editável. Definir substituição/anulação rastreável sem reescrever uma evidência efetivada. Prova de assimetria: `arquivo_pagar_conteudo_mutavel`.

### B4. Permissões e leitura

As novas tabelas usam capacidade de gerenciamento até para SELECT; as antigas usam, em geral, participação na empresa. No teste, um perfil de consulta leu títulos e não conseguiu ver seus eventos novos.

Definir capacidades de leitura por domínio e aplicar a mesma decisão ao documento, histórico e anexos. Isso não demonstrou vazamento entre empresas; demonstrou inconsistência funcional entre políticas. As FKs por tenant e a habilitação de RLS devem ser mantidas. Prova: `leitura_financeira_perfil_consulta`.

### B5. Importações e execuções

Uma importação com uma linha aceitou contadores de 100 importadas e 50 erros, com estado concluído. Contadores precisam derivar das linhas ou ter validação agregada. Uma linha importada precisa apontar para resultado resolvível, sem permitir que reprocessamento crie outra entidade ou obrigação.

`execucoes_automacao` precisa manter coerência entre estados, datas, tentativas e resultado. Não proponho criar automações nesta etapa; apenas completar o que as tabelas afirmam representar. Prova: `importacao_contadores_incoerentes`.

### B6. Concorrência, custo das validações e cobertura dos testes

Os bloqueios recentes rejeitam disputas por empresa, e já houve teste real de aquisição/liberação desses bloqueios. Isso não equivale a testar, em duas conexões, pagamento concorrendo com aplicação, renegociação ou fechamento completo.

Os gatilhos diferidos percorrem conjuntos financeiros da empresa e podem repetir essa conferência para várias linhas da mesma transação. É um risco de custo crescente identificado na estrutura; esta revisão não mediu desempenho em produção. Validar registros afetados com garantias suficientes e medir antes de declarar capacidade de volume.

Adicionar testes de operações completas com duas sessões, todas as modalidades de liquidação previstas, duas pontas de transferências, reversões e ciclos com limites de calendário. Usar os casos inválidos desta revisão como regressões, mantendo os controles positivos.

## O que já está bem encaminhado

- A separação entre entidade, documento comercial, título, parcela e pagamento é aproveitável.
- As 14 tabelas novas representam necessidades reais do escopo: contatos, anexos, versões, histórico, antecipações e renegociações.
- O histórico imutável e as FKs compostas melhoraram a rastreabilidade e a integridade entre empresas.
- Pagamento com desconto, aplicação de crédito sem novo caixa e transferência de saldo por renegociação têm uma base implementada.
- Conciliação com várias associações, limites e compatibilidade de conta/sentido é um avanço sobre a unicidade anterior.
- A proteção de períodos avalia datas anteriores e novas e exige reabertura identificada. Ainda precisa cobrir as dependências históricas citadas.

Esses acertos devem ser preservados durante as correções. Não é necessário apagar o ERP nem substituir tudo por uma tabela financeira genérica.

## Ordem recomendada de execução

1. **Corrigir regressões recentes:** normalização de contatos, período de geração obrigatório e preservação das chaves de operação. Acrescentar testes que reproduzam exatamente as falhas.
2. **Fechar integridade comercial e financeira:** equações de itens/descontos/parcelas, mudanças de pai, coerência de cliente/origem, rateios e classificação histórica.
3. **Concluído: retirar as quatro views financeiras e desativar as consultas dependentes no código local.** Nenhuma view substituta foi criada.
4. **Completar ciclos de vida:** recorrências, previsão/efetivação, eventos/processamento, anexos e snapshots, importações e permissões de leitura.
5. **Validar somente cenários isolados nesta fase.** Saneamento e revisão de dados reais ficam fora do escopo.
6. **Validar o conjunto:** cenários positivos, rejeição dos inválidos, operações concorrentes completas, catálogo atualizado e conferência de dados. Registrar limites de volume e funcionalidades ainda não prometidas.

Essas são, predominantemente, alterações nas **82 tabelas existentes** e nas garantias do próprio banco. Não recomendo aumentar a contagem agora. Se a separação do processamento de cobranças exigir uma estrutura adicional após definir o fluxo, isso deve ser uma decisão específica; não um novo lote genérico de tabelas.

## Critério para considerar o escopo concluído

Será possível considerar o modelo concluído para o escopo contratado quando: nenhum cenário classificado como inválido nesta revisão for aceito; valores e origens tiverem interpretação única; histórico e períodos não puderem ser reinterpretados silenciosamente; recorrências e reversões tiverem estados coerentes; e leituras por perfil forem consistentes. A retirada das views e das consultas dependentes já foi realizada. Regularização de registros existentes não faz parte do critério desta etapa estrutural.

Isso não inclui fiscal, estoque, UI nem certificação de equivalência com bancos internos de outros ERPs. A conclusão deve ser baseada nos cenários de pequenas empresas prestadoras de serviços que o Creatto efetivamente pretende suportar.

## Evidências e limites

- [Matriz das 64 tabelas](tabelas.md)
- [Catálogo atual](catalogo.json)
- [Conferência do ambiente e permissões das funções](conferencia.json)
- [28 cenários de investigação](provas.json)
- [Vendas reais divergentes](vendas-divergentes.json)
- [Script de reprodução isolada](../../../scripts/erp/review-probes.mjs)

A revisão é estrutural, com reproduções dirigidas e consultas reais limitadas. Não é uma prova formal de ausência de outros defeitos, teste de carga, revisão completa da aplicação ou auditoria dos dados de todos os módulos.
