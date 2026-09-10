# Novas tabelas do ERP — implementação aplicada

Aplicado no Supabase do Creatto (`mtadnxqoqxzbdksktwdr`) em 08/09/2026 às 23:42:13, America/Fortaleza (09/09/2026 02:42:13 UTC).

Migração: `20260909030000_expand_erp_service_tables`. Resultado confirmado: **14 tabelas novas, 82 tabelas no schema erp e 6 views preservadas**. A migração local corresponde ao SQL registrado no banco. A segunda conferência reconheceu a aplicação existente, sem reaplicar as alterações.

## As seis etapas

| Etapa | Tabelas criadas | Garantias principais |
| --- | --- | --- |
| Contatos e endereços | `entidades_contatos`, `entidades_enderecos` | Várias finalidades, principal por finalidade, isolamento por empresa, cadastro normalizado e projeção dos dados principais nos campos antigos. |
| Anexos | `contratos_vendas_arquivos`, `vendas_arquivos`, `ordens_servico_arquivos`, `contas_receber_arquivos` | FKs para documento e arquivo da mesma empresa, associação única, vínculo preservado e proteção dos metadados do arquivo referenciado. |
| Histórico financeiro | `contas_receber_eventos` | Eventos automáticos na transação da alteração, vínculos reais com título/parcela/pagamento, histórico imutável. Eventos a pagar reutilizam a tabela existente. |
| Contratos | `contratos_vendas_versoes`, `contratos_vendas_eventos`, `contratos_vendas_geracoes_tentativas` | Itens existentes vinculados à versão, vigências sem sobreposição, condições utilizadas preservadas, ciclo com intervalo de prestação e tentativas separadas. |
| Adiantamentos | `adiantamentos`, `adiantamentos_aplicacoes` | Constituição, devolução e reversão; aplicação sem novo caixa; limites de crédito e de parcela; validação de entidade, lado financeiro e período. |
| Renegociações | `renegociacoes`, `renegociacoes_parcelas` | Origem e destino com FKs, transferência integral do saldo remanescente, preservação de pagamentos anteriores, equação do acordo, proibição de ciclos e reversão condicionada às dependências. |

Todas as tabelas novas têm RLS, identidade por empresa e FKs. O papel `erp_runtime` recebe acesso conforme a capacidade de gerenciamento correspondente. `anon`, `authenticated` e `PUBLIC` não recebem acesso direto às tabelas novas. A liberação de perfis de consulta deve acompanhar o desenho das consultas da aplicação; não foi aberto acesso amplo por padrão.

## Alterações necessárias nas existentes

- `entidades`: campos antigos de contato/endereço passam a servir como projeção dos cadastros normalizados; alterações diretas nesses campos são rejeitadas. Contatos comerciais e de cobrança existentes foram copiados quando havia informação suficiente. Mudanças nos dados normalizados atualizam a projeção principal.
- `vendas`, `ordens_servico` e `contratos_vendas`: recebem snapshot do cliente para novos documentos. Registros antigos são marcados como `historico_sem_snapshot`; não foi inventada uma reconstrução histórica usando dados atuais.
- `arquivos`: metadados de arquivos referenciados pelos novos vínculos ficam preservados. Isso protege o banco; a política do armazenamento físico ainda precisa ser respeitada pela aplicação.
- `contratos_vendas_itens`: vínculo obrigatório com a versão e identificação do item lógico; condições de uma versão efetivada não podem ser reescritas.
- `contratos_vendas_geracoes`: versão utilizada, início/fim da prestação e identificação explícita de legado sem versão reconstruível. A unicidade por ciclo permite mais de uma geração semanal no mesmo mês. Novas gerações exigem contrato ativo. Ciclo quinzenal significa 15 dias nesta implementação.
- `contas_receber` e `transferencias_financeiras`: chave de idempotência com unicidade por empresa.
- `contas_receber`, `contas_pagar` e parcelas: vínculo de origem de renegociação nos títulos, estado `renegociado`, validação do saldo e atualização dos resumos. Uma dívida renegociada não é registrada como recebimento em dinheiro.
- `pagamentos`: fórmula explícita de caixa, preservação do pagamento original, estorno integral com contramovimento, chave de idempotência não reutilizável por exclusão lógica e vínculos indexados com parcelas.
- `conciliacoes_bancarias_itens`: origem de adiantamento com FK, múltiplas associações por transação, validação de somas/conta/sentido, desfazimento sem apagar histórico. Indicadores de pagamento conciliado e situação do extrato são derivados das associações.
- Eventos automáticos para títulos, parcelas, pagamentos, contratos, versões, aplicações e mudanças de estado de acordos.

## Regras financeiras implementadas

`pagamentos.valor` representa o principal liquidado. Caixa a receber = principal + juros + multa − desconto − taxa. Caixa a pagar = principal + juros + multa − desconto + taxa. O desconto não pode exceder principal e encargos, e o caixa não pode ser negativo.

`valor_pago` das parcelas continua representando principal liquidado em dinheiro. Crédito aplicado e saldo transferido por renegociação são componentes separados, usados para calcular o saldo e a situação. Aplicar um adiantamento não cria um pagamento fictício.

O saldo disponível do adiantamento considera constituição, devoluções, aplicações e suas reversões; não pode ficar negativo, inclusive na sequência das datas registradas. Reversões de movimentos/aplicações são integrais nesta versão. Devoluções podem ser parciais e repetidas até o limite disponível.

Renegociação transfere todo o saldo aberto das parcelas selecionadas, conservando pagamentos anteriores. Destinos são parcelas reais em títulos próprios do acordo. Não há compensação entre clientes/fornecedores diferentes, mistura de pagar e receber no mesmo acordo ou crédito comercial sem origem em dinheiro.

As validações agregadas são diferidas até o fim da transação. A transação deve criar o conjunto completo antes de confirmar: títulos e parcelas; acordo, destinos e efetivação; estorno e contramovimento. Os bloqueios por empresa rejeitam conflitos com SQLSTATE `40001`, exigindo repetir a transação inteira em READ COMMITTED. Não foi medido desempenho com grande volume; as validações agregadas e a serialização financeira por empresa devem ser acompanhadas conforme o uso crescer.

## Idempotência

`erp.registrar_operacao_idempotente(text,jsonb)` está disponível para `erp_runtime` nas operações de constituição/devolução/reversão de adiantamentos, aplicações e criação de rascunho de renegociação. A função confere a capacidade financeira, conserva a requisição original, retorna o mesmo identificador para repetição equivalente e rejeita a mesma chave com conteúdo diferente. Não foi criada uma tabela genérica de idempotência.

Inserções SQL diretas continuam sujeitas às unicidades e rejeitam duplicação. A aplicação precisa usar a função quando quiser obter automaticamente o resultado anterior. Chaves de pagamentos, títulos, transferências e gerações possuem proteção de unicidade; isso não deve ser confundido com implementação de todas as operações de negócio na aplicação.

## Validação e preservação

- **77 verificações em PostgreSQL isolado passaram**, com identificação do conteúdo SQL exato testado.
- Duas conexões reais confirmaram rejeição de conflito e liberação do bloqueio ao encerrar a transação; nenhum dado fictício de negócio foi inserido no Supabase.
- Conferência posterior: 82 tabelas, 6 views, RLS nas 14 novas tabelas e nenhuma restrição pendente de validação no schema `erp`.
- Preservadas três parcelas a receber, total de R$ 450, e duas a pagar, total de R$ 500; valores pagos permanecem zero. Não havia pagamentos, contratos ou conciliações registrados antes desta migração.
- Estruturas fora do escopo foram comparadas ao catálogo anterior; fiscal e estoque não foram alterados.

## Pendências identificadas, sem alteração de valores

Há **duas vendas anteriores** cujo total diverge da soma das parcelas previstas. A primeira tentativa de migração foi revertida porque preencher snapshots por UPDATE acionava a validação já existente de uma dessas vendas: total de R$ 150 e parcelas previstas de R$ 0. A versão final não atualiza documentos históricos: marca explicitamente a ausência de snapshot. Os valores dessas vendas precisam de revisão da origem; não foram corrigidos por suposição.

Essas divergências são dados anteriores à migração. Podem impedir alterações futuras nessas vendas até sua correção; a aplicação das novas tabelas não significa que todos os registros antigos foram saneados.

## Adaptações da aplicação ainda necessárias

O escopo executado foi o banco, sem UI ou repositórios de negócio. Antes de expor os novos fluxos, a aplicação precisa:

1. Gravar contatos/endereços nas tabelas normalizadas, e não editar diretamente os campos antigos.
2. Criar versões e itens de contratos antes da ativação e informar versão/período nas gerações.
3. Usar transações completas para adiantamentos, reversões e renegociações, com a semântica de valores acima.
4. Tratar repetição de transação em `40001`; enviar motivo na reabertura de período, pendência do bloco anterior.
5. Respeitar imutabilidade dos anexos e proteção do objeto no armazenamento; ajustar as consultas aos novos componentes de saldo.

A remoção das quatro views financeiras permanece separada. Não foram implementados interface, API fiscal, estoque, conectores, envio de cobranças ou automações de geração de documentos. Tampouco esta entrega encerra todas as recomendações da avaliação ampla das tabelas existentes.

## Evidências

- [Dicionário das 14 novas tabelas](dicionario-novas-tabelas.md)
- [Resultado da aplicação](aplicacao-20260909030000/result.json)
- [Segunda verificação](aplicacao-20260909030000/reverification.json)
- [Conferência prévia](aplicacao-20260909030000/preflight.json)
- [Catálogo anterior](aplicacao-20260909030000/before.json)
- [Catálogo posterior](aplicacao-20260909030000/after.json)
- [SQL executado](aplicacao-20260909030000/executed.sql)
- [Testes](testes-novas-tabelas.json)
- [Pendências dos dados](aplicacao-20260909030000/pendencias-dados.json)
- [Migração local](../../supabase/migrations/20260909030000_expand_erp_service_tables.sql)
