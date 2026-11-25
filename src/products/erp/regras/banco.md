# Regras no banco (BD)

O que o banco (Supabase, schema `erp`) impõe sozinho: triggers, checks, RLS e funções. Levantado em 2026-11-25.

| Tipo | Quantidade |
|---|---|
| Checks (restrições de coluna) | 437 |
| Políticas de segurança (RLS) | 373 |
| Triggers | 282, de 72 funções |
| Funções | 98 |

## Quem escreve no schema `erp`

| Papel | Acesso | Quem usa |
|---|---|---|
| `anon`, `authenticated` | **nenhum** (sem uso do schema) | navegador, app |
| `erp_runtime` | leitura e escrita, com RLS | servidor do ERP (`src/lib/postgres.ts`) |
| `service_role` / `postgres` | leitura e escrita, sem RLS | scripts, migrações, manutenção |

O schema `erp` **não** está na API REST do Supabase (`db_schema`: public, graphql_public, editor, marketing, drive, analytics, inbox).
Consequência: uma regra que existe no servidor só pode ser contornada por scripts e acesso administrativo — não por usuários.
Mesmo assim, **fatos** continuam no banco, porque scripts, migrações e jobs também gravam.

## Critério

| Tipo | Fica no banco? | Por quê |
|---|---|---|
| **Fato**: precisa ser verdade sempre, por qualquer caminho | **Fica** (e o servidor confere antes, com mensagem boa) | Isolamento entre empresas, saldo nunca negativo, totais que fecham, documento finalizado imutável, período fechado, numeração |
| **Decisão**: política do negócio, muda com o tempo, depende de configuração/fluxo | **Sai** para `regras/*.ts` | Prazo de validade, fluxo entre documentos, calendário de recorrência, comissão, máquinas de estado de processos |
| **Técnico** | Fica | Datas de alteração, histórico |

Regra para tirar algo do banco: **primeiro a regra entra no servidor e é testada; só depois o trigger sai ou encolhe.** Nunca o contrário.

## Ficam (fatos e técnicos)

| # | Trigger (função) | Tabelas | O que garante | Equivalente no servidor |
|---|---|---|---|---|
| BD-01 | `set_atualizado_em` | 71 | Data de alteração | — (técnico) |
| BD-02 | `bloquear_mutacao_evento`, `registrar_evolucao_documento`, `preservar_evento` | 22 | Histórico de eventos é imutável | — |
| BD-03 | `preservar_chave_operacao` | 14 | Mesma chave de operação não grava duas vezes, nem depois de cancelada | GE-31 |
| BD-04 | `proteger_identidade_nova`, `preservar_assinatura_comercial`, `preservar_requisicao_original`, `preservar_requisicao_canonica` | 16 | Identidade e pedido original de pagamentos, devoluções e acordos não mudam | GE-31 |
| BD-05 | `validar_periodo_comercial_financeiro` | 14 | Período fechado bloqueia alteração; registro não muda de empresa | GE-40, GE-51 |
| BD-06 | `validar_periodo_operacional_aberto`, `preservar_fechamento_comercial_financeiro` | 4 | Período fechado no estoque; fechamento não se sobrepõe nem se apaga (reabre-se) | CO-20 a CO-22 |
| BD-07 | `validar_equacao_comercial`, `validar_os_diferida`, `validar_documento_diferido` | 17 | Itens, descontos, frete e total fecham; desconto ≤ subtotal; percentual ≤ 100 | VD-11, CP-02, OS-01 |
| BD-08 | `validar_previsao_parcela`, `validar_rateio_diferido` | 5 | Parcela: líquido = principal + juros + multa − desconto − taxa, nunca negativo; rateio soma o total | CR-60, CPG-04 |
| BD-09 | `exigir_obrigacao_efetiva` | 2 | Não há pagamento de previsão | CR-09 |
| BD-10 | `validar_saldo_estoque_final`, `travar_ledger_estoque` | 7 | Saldos, movimentos e reservas de estoque consistentes; vínculos imutáveis | ES-03, ES-06 |
| BD-11 | `validar_integridade_nota_fiscal`, `congelar_nota_fiscal_finalizada`, `validar_filho_nota_fiscal`, `preservar_original_arquivo_fiscal`, `validar_pdf_armazenado`, `validar_registro_integracao_fiscal`, `validar_evento_integracao_fiscal` | 9 | Nota autorizada e seus arquivos são imutáveis; itens batem com a venda/compra | NS-20, NS-22 |
| BD-12 | `proteger_dependencias_financeiras` | 8 | Conciliação se desfaz, não se apaga; origem da obrigação preservada | CB-34 |
| BD-13 | `validar_nivel_categoria`, `herdar_classificacao_categoria`, `preservar_classificacao_usada`, `proteger_grupo_dre`, `validar_conta_contabil`, `validar_vinculo_contabil` | 8 | Categorias sem ciclo, 2 níveis, mesmo tipo do pai; classificação usada não muda de sentido; grupos da DRE fixos; plano de contas coerente | CO-01, CO-03, CO-10 |
| BD-14 | `validar_kit_simples`, `validar_ativacao_kit_simples` | 2 | Sem kit dentro de kit nem ciclo | ES-23 |
| BD-15 | `validar_principais_entidade`, `validar_endereco_parcial` | 3 | Um principal por finalidade; endereço com ao menos um campo | CD-03 |
| BD-16 | `validar_arquivo_anexo`, `preservar_anexo`, `preservar_arquivo_referenciado`, `validar_pdf_comercial` | 7 | Anexo aponta para arquivo existente; arquivo em uso não se apaga; revisão de PDF é imutável | — |
| BD-17 | Checks (437) e RLS (373) | todas | Formato, listas de status, isolamento entre empresas | GE-50 |
| BD-18 | `erp.proximo_numero()` | — | Numeração sequencial sem pular | GE-20 |

## Saem (decisões), em ordem de prioridade

### Grupo 1 — já existem no servidor, com mensagem melhor — **feito na etapa 6 (2026-11-25)**, migração `20261125230000_erp_regras_etapa6_gatilhos.sql`

| # | Trigger | Tabelas | O que decide hoje | No servidor | Ação |
|---|---|---|---|---|---|
| BD-30 | `validar_conversao_proposta` | vendas | Orçamento encerrado ou **vencido** não gera venda ("vencido" depende da data de hoje) | VD-01, VD-02 | ✅ **Removido.** Servidor: `validarConversaoOrcamento()` na conversão e em toda venda criada com orçamento de origem |
| BD-31 | `efetivacao_receber`, `efetivacao_pagar` | contas_receber, contas_pagar | Efetivado/utilizado não volta a previsão; venda não gera previsão | CR-09 | ✅ **Reduzido**: o banco só grava `efetivado_em` e trava título utilizado; "efetivado não volta" e "venda não é previsão" estão em `validarPrevisao()` |
| BD-32 | `validar_vinculos_os` | ordens_servico | A venda da OS precisa ter o orçamento da OS como origem | OS-06 a OS-08 | ✅ **Removido.** Garantido por `convertServiceOrder()`: a venda de OS com orçamento sai do orçamento |

### Grupo 2 — fluxos de negócio inteiros em SQL (grande; separar fato de decisão)

| # | Trigger | Tamanho | O que contém | Fato que fica no banco | Decisão que vai para `regras/` |
|---|---|---|---|---|---|
| BD-40 | `validar_contrato_versionado`, `validar_cabecalho_contrato` | 7,3 mil car. | Versões e ciclos de contrato | Condições usadas são imutáveis | Duração do ciclo × periodicidade; quando criar versão; contrato ativo exige versão (CT-07) |
| BD-41 | `proteger_conta_comercial`, `validar_provisao_comissao_ajustada` | 4,7 mil | Política de comissão e reembolso | Provisão bate com o financeiro | Quem altera e como tratar comissão/reembolso (CPG-06, CPG-07) |
| BD-42 | `validar_origem_comercial` | 3 mil | Quais conversões entre documentos valem; cliente/fornecedor da origem | Documento convertido mantém vínculo com a origem | Quais conversões são permitidas (VD-07, OS-06) |
| BD-43 | `snapshot_documento_cliente`, `snapshot_item_contrato` | 3,3 mil | **Criam** a fotografia do cliente/item na efetivação, de forma invisível ao código | Fotografia efetivada não muda | Quando e como tirar a fotografia (NS-03, OS-10, CD-05) |
| BD-44 | `validar_origem_recorrencia`, `validar_recorrencia_estrutura`, `validar_geracao_compra` | 6 mil | Calendário de recorrências financeiras e de compra | Ocorrência não se duplica | Calendário, limites, pausa/encerramento (CR-61, CPG-03) |
| BD-45 | `validar_saldos_evolucao` | **13 mil** | Renegociações e adiantamentos: equação do acordo, ciclos, entidade/lado | Saldo nunca excedido; equação do acordo fecha | Regras do acordo (entidade, transferência única, destino) (CR-50, CR-51) |
| BD-46 | `validar_movimento_evolucao`, `evento_credito_acordo` | 8,2 mil | Ciclo de vida de acordos e aplicações | Acordo efetivado imutável; estorno controlado | Etapas do acordo (rascunho → efetivado) |
| BD-47 | `validar_conciliacao_evolucao` | 6,7 mil | Casamento extrato × pagamento/transferência | Conciliação não excede extrato nem origem | Conta/sentido compatíveis, repasse de cartão (CB-32, CB-33) |
| BD-48 | `validar_execucao_estado`, `validar_notificacao_estado`, `validar_execucao_evento`, `registrar_transicao_estado`, `preservar_evento_cobranca` | 5,3 mil | Máquinas de estado de automações e cobrança | Histórico preservado; notificação não duplica | Estados, tentativas, repetição |
| BD-49 | `validar_importacao_diferida`, `preservar_importacao_identidade` | 3,8 mil | Fluxo de importação de dados | Linha original preservada | Contadores e conclusão da importação |

Ordem sugerida antes da leitura: BD-40 e BD-41 → BD-42, BD-43 → BD-44 → BD-47 → BD-45, BD-46 → BD-48, BD-49. **Substituída pelo plano final abaixo.**

### Plano final do grupo 2 (leitura completa das 21 funções, 2026-11-25)

A leitura mostrou que o grupo 2 é **quase todo integridade**, não decisão. Três tipos de coisa aparecem misturados:

- **Garantia (fica no banco):** histórico imutável, saldo nunca excedido, nada duplicado, totais que fecham.
- **Motor de estado (fica no banco):** o banco *recalcula* situação de parcela e título (pago, parcial, renegociado), o marcador
  "conciliado" do pagamento e o status do extrato. Tirar daqui obrigaria todo caminho do código a recalcular igual; é a parte mais arriscada e não traz ganho.
- **Decisão (sai para `regras/`):** o que o negócio permite, e que pode mudar com o tempo.

| # | Decisões que saem | O que fica no banco | Situação no servidor hoje | Etapa |
|---|---|---|---|---|
| BD-40 contratos ✅ **feito (etapa 7)** | Contrato ativo exige versão efetivada (CT-07); versão só efetiva com itens; vigência da versão dentro da do contrato; geração só de contrato ativo; duração do ciclo × periodicidade; condições do cabeçalho só mudam por nova versão; venda do ciclo é do mesmo cliente | Versão e itens efetivados imutáveis (só encurtar a vigência sem cortar ciclo gerado); vigências e ciclos sem sobreposição; geração e tentativas preservadas; venda não usada em dois ciclos; total do item | O servidor já cria versões e calcula ciclos; as recusas vêm do banco ("Vigencias sobrepostas", sem acento) | **7** |
| BD-44 recorrências ✅ **feito (etapa 8)** | Calendário (frequência, intervalo, fim por data/ocorrências); recorrência pausada/encerrada não gera | Ocorrência não duplica; identidade da ocorrência preservada; limites coerentes; encerrada imutável | **Calendário existe duas vezes**: `erpRoutineRepository` (`recurrenceOccurrenceIndex`) e o SQL. Vira uma função pura testada | **8** |
| BD-41 comissão ✅ **feito (etapa 9)** | Quem pode reduzir a provisão (permissão do financeiro) e quando (aberta/vencida, sem devolução) | Título de comissão/reembolso só aceita baixa e estorno; provisão = financeiro | Já decidido em `erpCommissionAdjustments.ts`; o banco repete a permissão | **9** |
| BD-42 origem ✅ **feito (etapa 9)** | Quais conversões valem (orçamento → pedido/venda, pedido → venda); a receber só de venda; a pagar só de compra efetiva | Identidade, cliente/fornecedor e origem do documento preservados | Conversões só existem no servidor por construção | **9** |
| BD-43 fotografia | — | **Fica inteiro.** O banco grava a fotografia do cliente/item na efetivação; mover exigiria todo caminho que confirma venda, aprova OS ou ativa contrato gravar igual | — | — |
| BD-45 saldos | — | **Fica inteiro**: motor de saldo e situação + equação do acordo, sem ciclo entre acordos | Servidor confere antes com mensagens próprias (CR-50, CR-51) | — |
| BD-46 movimentos | — | **Fica inteiro**: movimento financeiro não muda, só é revertido por inteiro; acordo efetivado imutável; eventos de histórico | Idem | — |
| BD-47 conciliação | — | **Fica inteiro**: limites e marcadores de conciliação | Servidor confere conta/sentido antes (CB-32, CB-33) | — |
| BD-48, BD-49 | — | **Ficam inteiros**: máquinas de estado e histórico de automação, cobrança e importação (só integridade) | — | — |

**Etapas:**

- **7 — Contratos (BD-40, CT-07..):** funções puras em `regras/contratos.ts` (efetivar versão, gerar ciclo, mudar condições, duração do ciclo); o servidor recusa antes, com mensagem boa; o gatilho fica só com as garantias. Teste ao vivo: nova versão, suspender/retomar, geração.
- **8 — Recorrências (BD-44):** `regras/recorrencias.ts` com o calendário (usado na geração financeira e na de compras); o SQL do calendário sai; ficam "não duplica" e "identidade preservada".
- **9 — Comissão e conversões (BD-41, BD-42):** tirar do banco a checagem de permissão e a ordem de conversão (já estão no servidor); garantias ficam.
- **10 — Mensagens das garantias que ficam:** reescrever com acento e em linguagem de negócio as mensagens dos gatilhos que permanecem
  ("Saldo de adiantamento excedido", "Vigencias sobrepostas", "Pagamento efetivado imutavel"...), já que elas ainda podem chegar ao usuário.

Cada etapa: regra pura + teste → servidor chama → migração reduz o gatilho → publicar → testar ao vivo.

### Grupo 3 — dívida técnica (apagar quando a causa sumir)

| # | Trigger | O que faz | Sai quando |
|---|---|---|---|
| BD-60 | `preservar_contato_legado`, `refletir_cadastro_normalizado`, `normalizar_entidade_nova` | Sincronizam as colunas antigas de e-mail/telefone/endereço em `entidades` com as tabelas novas de contatos e endereços | As colunas antigas forem removidas e o código parar de lê-las |
| BD-61 | `validar_evento_receber` | Confere vínculos de eventos de contas a receber | Revisar junto com BD-02 |

## Mensagens

**Etapa 10 (2026-11-26), migração `20261126030000_erp_regras_etapa10_mensagens.sql`:** as mensagens das garantias que ficam
no banco foram reescritas em português claro, terminando em ponto (181 mensagens em 69 funções; só o texto mudou).

- A tela e o chat mostram a mensagem do banco quando ela termina em ponto: `shared/erpErrors.ts` → `mensagemDoBanco()`,
  usada em `normalizeErpError()` (tela) e em `mcpcore/domains/erp/executeTool.ts` → `publicError()` (chat).
- Mensagens **internas** (falha de programa, não algo que o usuário corrige: sessão/empresa, idempotência fiscal,
  isolamento de transação…) ficam técnicas e **sem ponto**: viram a mensagem genérica.
- Mensagem nova no banco: escreva para o usuário e termine em ponto; se for interna, sem ponto.
