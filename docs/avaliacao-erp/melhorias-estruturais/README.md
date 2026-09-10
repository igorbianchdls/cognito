# Melhorias estruturais do ERP de serviços

Aplicadas no Supabase Creatto em **09/09/2026 às 13:24 (America/Fortaleza)**.
Projeto: `mtadnxqoqxzbdksktwdr`.
Migração: `20260909040000_harden_erp_service_integrity`.

## Resultado verificado

- **82 tabelas; nenhuma tabela nova.**
- **2 views de estoque; nenhuma view financeira.**
- Alterações diretas no catálogo de **44 tabelas**, além de funções compartilhadas. Foram adicionadas 16 colunas.
- **134 verificações isoladas aprovadas:** 56 cenários da revisão e complementares, mais 78 verificações dos fluxos anteriores.
- Catálogo conferido antes, dentro da transação e depois do commit. RLS mantida e nenhuma constraint pendente de validação.
- Nenhum registro comercial foi consultado, saneado ou reconstruído nesta execução. A conexão ao Supabase consultou metadados e o registro de migrações. Testes usaram dados fictícios em outro banco.
- Fiscal, estoque, interface e provedores externos não foram implementados nem alterados.

## Regras implementadas

| Área | Resultado |
|---|---|
| Contatos | Entidades novas convertem os canais informados em contatos normalizados, conservando telefone e celular separados. A projeção comercial considera cada canal. Alterações financeiras não limpam contatos comerciais. Endereços parciais são aceitos sem inventar dados. |
| Contratos | Ciclos novos exigem início e fim e não reutilizam a mesma venda. “Geração concluída” significa documento produzido, podendo ainda ser rascunho; não significa receita efetivada. |
| Identidade | Chaves atribuídas não podem mudar nem ser apagadas por exclusão física. A verificação considera também registros excluídos logicamente. |
| Repetição financeira | A função de adiantamentos, aplicações e renegociações conserva uma requisição canônica, compara o conteúdo tipado e retorna o mesmo identificador. Conteúdo diferente é rejeitado. Registros anteriores sem essa requisição não têm seu conteúdo reconstruído. |
| Valores comerciais | Equações dos itens de venda, compra e OS são conferidas. Descontos percentuais usam a base correta; venda e compra têm desconto monetário calculado separado. Alterações de pai conferem também o documento anterior. OS efetivada exige totais coerentes. |
| Origens | OS exige cliente e tipo corretos da venda/orçamento. Conversões comerciais seguem orçamento → pedido/venda e pedido → venda. Títulos vinculados conferem cliente/fornecedor e preservam a origem atribuída. |
| Previsões e parcelas | Vínculos opcionais e estruturados ligam parcelas financeiras às previsões comerciais. Ao usar o vínculo, valor, vencimento e origem devem corresponder; a previsão utilizada fica preservada. |
| Valores financeiros | Bruto da parcela é o principal. Líquido previsto é principal + juros + multa − desconto − taxa. Valores realizados pertencem a pagamentos. `valor_pago` representa principal baixado por pagamento, e não caixa. |
| Rateios | Valor monetário é obrigatório; a soma dos rateios ativos deve corresponder ao título. Percentual, se informado, deve corresponder ao valor, com tolerância de um centavo por linha para arredondamento. |
| Classificação | Categorias não podem formar ciclos. Atributos classificatórios e saldo inicial de contas usados por registros dependentes ficam protegidos. Rótulos continuam corrigíveis. |
| Recorrências | Término por data, quantidade ou prazo indeterminado exige campos coerentes. Recebíveis passam a ter origem recorrente estruturada. Calendário, limite, estado e duplicidade são conferidos; compras recorrentes conferem também fornecedor e documento gerado. |
| Previsão a pagar | Liquidação exige efetivação explícita, permitida na mesma transação. Obrigação já efetivada/utilizada não pode voltar a previsão. |
| Cobranças e processamento | Envelope recebido permanece imutável; resultado terminal do evento pode ser registrado uma vez. Execuções podem apontar para o evento. Estados e tentativas conservam histórico. “Cobrança paga” continua sendo estado externo, separado da liquidação interna. |
| Notificações | Identidade, deduplicação e datas de entrega são conferidas; transições conservam histórico na própria tabela. |
| Anexos e snapshots | Arquivos referenciados por compras e pagar recebem a mesma proteção de conteúdo aplicada aos novos vínculos. Snapshots de cliente podem ser recapturados antes da efetivação e ficam congelados depois. Itens de contrato passam a conservar unidade informada e classificação comercial. |
| Leitura | As 14 tabelas recentes permitem leitura por participação na empresa, acompanhando a política atual dos documentos. Escrita continua sujeita à capacidade de gerenciamento e ao isolamento entre empresas. |
| Importações | Contadores devem refletir as linhas. Resultado importado deve existir na empresa. Identidade, linhas originais, resultados importados e importações terminais ficam preservados. |

## Limites que permanecem explícitos

1. **Dados existentes permanecem fora do escopo.** Não há backfill de contatos, snapshots, previsões, requisições canônicas ou vínculos. As regras novas valem para gravações futuras; compatibilidade dos registros antigos não foi auditada.
2. **Carga e concorrência completa ainda precisam de validação com duas conexões PostgreSQL independentes.** Os testes desta entrega usam PGlite isolado, não comprovam concorrência nem capacidade de produção. A serialização existente por empresa foi mantida; os validadores financeiros que percorrem conjuntos da empresa não foram substituídos sem medição.
3. Esta entrega modifica garantias do banco. Não implementa geradores, processadores, provedores ou interface. Consumidores devem respeitar as novas regras nas gravações.
4. Anexos históricos continuam sujeitos à política de preservação existente. Não foi criado um fluxo novo de substituição/anulação de anexos.
5. Estes resultados não constituem equivalência certificada com Conta Azul/Omie nem uma prova de ausência de outras falhas.

## Evidências

- [Aplicação e resultado](result.json)
- [Conferência posterior](reverification.json)
- [Catálogo anterior](before.json) e [posterior](after.json)
- [Diferenças planejadas](plano-catalogo.json)
- [56 cenários da revisão](provas.json)
- [78 regressões anteriores](regressoes-anteriores.json)
- [Permissões das funções](permissoes-funcoes.json)
- [Migração](../../../supabase/migrations/20260909040000_harden_erp_service_integrity.sql)
- [Executor com validação do catálogo](../../../scripts/erp/apply-service-integrity.mjs)

A primeira aplicação foi revertida antes do commit por uma diferença de representação dos perfis de acesso nos drivers. A comparação foi normalizada sem reduzir a verificação de permissões; a tentativa final foi aplicada e conferida. Um timeout de conexão intermediário não aplicou alterações.

