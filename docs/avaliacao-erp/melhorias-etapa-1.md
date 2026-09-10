# Melhorias das tabelas existentes — primeiro bloco

Data: 08/09/2026.

## Estado da entrega

**Aplicado e verificado no Supabase do Creatto**, projeto `mtadnxqoqxzbdksktwdr`, em 08/09/2026 as 22:53:44 (America/Fortaleza). Os dois arquivos SQL foram executados em uma unica transacao, apos autorizacao para implementar, e registrados no historico como `20260908180000`, `improve_erp_integrity_and_periods`. A copia consolidada esta em `supabase/migrations/20260908180000_improve_erp_integrity_and_periods.sql`.

Evidencias: [resultado](aplicacao-20260908180000/result.json), [conferencia previa](aplicacao-20260908180000/preflight.json), [catalogo anterior](aplicacao-20260908180000/before.json), [catalogo posterior](aplicacao-20260908180000/after.json) e [SQL executado](aplicacao-20260908180000/executed.sql). Nenhum registro ficticio de negocio foi inserido no Supabase.

Este bloco cobre integridade dos historicos, FK bancaria, indice duplicado e protecao de periodos. Nao representa a conclusao de todas as melhorias do plano. Nao houve modificacao de interface ou de repositorios da aplicacao.

Arquivos:

- [01-integridade-historicos.sql](../../scripts/erp/sql/01-integridade-historicos.sql)
- [02-periodos-fechados.sql](../../scripts/erp/sql/02-periodos-fechados.sql)
- [Teste isolado](../../scripts/erp/integrity-smoke.mjs)

## Alteracoes aplicadas

| Estrutura existente | Alteracao |
| --- | --- |
| `cadastros_eventos` | Politica INSERT para `erp_runtime`, condicionada a capacidade de gerenciar cadastros; UPDATE/DELETE revogados desse papel e de `authenticated`. |
| `vendas_eventos` | Politica INSERT para `erp_runtime`, condicionada a capacidade de gerenciar vendas; historico permanece imutavel. |
| `ordens_servico_eventos` | Gatilho de imutabilidade tambem para caminhos privilegiados; UPDATE/DELETE revogados dos papeis operacionais. |
| `transacoes_bancarias` | FK da importacao usa RESTRICT, preservando a origem em vez de tentar anular a empresa obrigatoria. |
| `fechamentos_periodos` | Remove somente o indice comprovadamente duplicado; acrescenta `motivo_reabertura`; preserva periodo e identidade do registro; impede exclusao e reescrita da reabertura. |
| Documentos, titulos, parcelas, rateios e movimentos | Novo mecanismo de protecao confere dados anteriores e novos, INSERT/UPDATE/DELETE e dependencias do documento. |

Sao **18 tabelas existentes afetadas**, contando permissoes, indices, FKs e gatilhos. Uma coluna nova (`motivo_reabertura`) e cinco funcoes internas sao acrescentadas. Nenhuma tabela nova e criada.

As 14 tabelas com o novo gatilho de periodo sao: `vendas`, `compras`, `vendas_itens`, `compras_itens`, `vendas_recebimentos_previstos`, `compras_parcelas_previstas`, `contas_receber`, `contas_pagar`, `contas_receber_parcelas`, `contas_pagar_parcelas`, `pagamentos`, `transferencias_financeiras`, `transacoes_bancarias` e `rateios_financeiros`. Somam-se `fechamentos_periodos` e as tres tabelas de eventos citadas acima.

## Regras do fechamento

- Pagamentos: protegem data de pagamento e de credito; transferencias: data da transferencia; transacoes bancarias: data da transacao e de compensacao.
- Titulos: protegem competencia, usando emissao como alternativa quando a competencia esta ausente. Alteracoes economicas/classificatorias tambem verificam as datas dos pagamentos relacionados.
- Parcelas e rateios: consultam o titulo de origem. Mover um registro para outro titulo verifica tanto a origem antiga quanto a nova.
- Vendas/compras e seus itens/previsoes: verificam a data comercial no modulo correspondente e a competencia no fechamento financeiro.
- Trocar a data antiga por uma data aberta nao permite escapar do fechamento. Exclusao fisica e exclusao logica tambem sao protegidas.
- Um fechamento de vendas nao fecha automaticamente o financeiro. Um fechamento `todos` cobre os dominios pertinentes.
- Fechamentos ativos sobrepostos no mesmo dominio, ou entre dominio especifico e `todos`, sao rejeitados para novos registros. Sobreposicoes antigas nao sao corrigidas automaticamente.
- Reabertura exige data nao anterior ao fechamento, autor e motivo. Depois de reaberto, outro fechamento gera um novo registro, preservando o anterior.

### Receber hoje uma divida antiga continua permitido

A competencia da obrigacao pode estar fechada e o novo pagamento ter data aberta. Por isso, atualizacoes apenas do estado de recebimento do titulo e dos resumos da parcela nao sao tratadas como alteracao da obrigacao original. A excecao da parcela confere se `valor_pago` corresponde a soma dos pagamentos ativos segundo a semantica atual do banco. Cancelamento, mudanca do valor original, encargos, vencimento ou classificacao nao entram nessa excecao.

Este bloco nao redefine a formula futura de principal liquidado com descontos nem resolve toda a consistencia dos status/resumos. Essa revisao pertence ao bloco financeiro seguinte. Os testes cobrem baixas normais com os registros atuais, sem afirmar cobertura de todas as modalidades futuras de liquidacao.

## Concorrencia e permissoes

As operacoes usam bloqueio consultivo compartilhado por empresa; fechamento/reabertura usa bloqueio exclusivo. Uma disputa retorna SQLSTATE `40001` para repetir a transacao inteira, sem aguardar com uma leitura antiga. As operacoes protegidas exigem isolamento READ COMMITTED. Transacoes em REPEATABLE READ/SERIALIZABLE nao sao aceitas por este mecanismo.

O fechamento entre empresas diferentes e independente, exceto eventual colisao do hash do bloqueio, que pode provocar uma repeticao desnecessaria sem misturar dados. Operacoes comuns da mesma empresa podem compartilhar o bloqueio.

Funcoes internas de verificacao nao sao expostas ao papel operacional. Os gatilhos consultam dependencias com contexto privilegiado e caminho de busca fixo, enquanto as permissoes/RLS das tabelas continuam controlando a operacao original. Nenhuma politica foi aberta a todos os usuarios para resolver a ausencia de INSERT nos eventos.

## Validacao executada

**61 verificacoes passaram**, usando PGlite 0.5.8 (PostgreSQL em memoria), com tabelas, constraints, indices, funcoes, views, politicas e gatilhos reconstruidos do catalogo de 08/09/2026, acrescidos apenas de dados ficticios.

Incluem:

- Reproducao dos problemas anteriores: evento autorizado bloqueado, FK tentando anular tenant, historico de OS editavel, mudanca de data contornando fechamento e rateio sem protecao.
- Insercao autorizada de eventos e rejeicao por perfil de consulta, outra empresa e acesso direto nao autorizado.
- Imutabilidade do historico, inclusive como owner do banco isolado.
- Preservacao da importacao referenciada.
- Aborto transacional de todo o primeiro SQL quando os indices supostamente duplicados divergem.
- Bloqueio de exclusoes, alteracoes retroativas, mudancas de competencia e movimentacao de filhos entre pais.
- Pagamento/recebimento atual de obrigacao antiga e atualizacao de atraso sem mudar o valor original.
- Isolamento entre empresas e entre modulos.
- Reabertura com motivo, preservacao do historico e novo fechamento.
- Repeticao dos dois arquivos SQL sem duplicar objetos.
- Mesmas 68 tabelas e 6 views apos o teste; gatilhos de estoque preservados.

Para repetir os testes no ambiente atual:

```text
node scripts/erp/integrity-smoke.mjs
```

O teste nao le `.env.local`, nao aceita URL de banco e nao possui conexao remota. Usa `@electric-sql/pglite` quando instalado no projeto ou a copia 0.5.8 ja disponivel no cache dos testes anteriores. Em outra maquina, essa dependencia de teste precisa estar disponivel.

No Supabase real, a conferencia previa encontrou zero divergencias estruturais, zero fechamentos ativos, zero reaberturas historicas e zero divergencias nos resumos de pagamentos. Duas conexoes reais confirmaram compatibilidade de bloqueios compartilhados, conflito com fechamento exclusivo e liberacao no rollback, inclusive usando a funcao instalada. A conferencia posterior confirmou 68 tabelas, 6 views e preservacao das estruturas fora do escopo.

**Limites:** os testes dos bloqueios com duas conexoes nao equivalem a testar todos os fluxos completos da aplicacao. O fixture e os catalogos de metadados nao sao backups integrais dos dados do Supabase.

## Compatibilidade da aplicacao e limites restantes

1. A chamada atual `reopenErpPeriod` ainda nao envia `motivo_reabertura`. Ela precisa receber e persistir o motivo antes de usar a reabertura pela aplicacao; a regra do banco rejeita a chamada antiga. Nao foram inventados motivos nem alterada a interface neste trabalho focado nas tabelas.
2. O acesso a transacoes ainda nao repete automaticamente conflitos `40001`. A aplicacao deve repetir a transacao inteira nesses casos; ate essa adaptacao, a operacao concorrente pode falhar com seguranca e exigir nova tentativa.
3. Alterar/cancelar um pagamento de periodo fechado continua exigindo reabertura. A modelagem de reversao financeira em data posterior sera consolidada no bloco financeiro.
4. O executor `scripts/erp/apply-integrity.mjs` verifica projeto, divergencias e historico; uma repeticao com o mesmo conteudo detecta a aplicacao existente. Nao aplicar manualmente uma versao modificada sob o mesmo identificador.

## Trabalho que continua pendente

- Composicao completa dos valores de itens, titulos, pagamentos, descontos e estornos.
- Idempotencia adicional de recebiveis e transferencias, e conciliacao de um movimento com varios pagamentos.
- Protecao de alteracoes nos cadastros de classificacao que possam mudar a interpretacao de periodos antigos; esta etapa protege os vinculos nos documentos, nao versiona categorias.
- Separacao entre evento imutavel de cobranca e estado de processamento, no desenho correspondente.
- Novas tabelas do plano e evolucao de contratos/adiantamentos/renegociacoes.
- Exclusao das quatro views financeiras, apos conferir suas dependencias. Nenhuma view foi criada ou removida neste bloco.

O Supabase permanece com **68 tabelas e 6 views**, conforme o catalogo posterior a aplicacao. Este primeiro bloco esta concluido no banco; os itens pendentes acima nao foram implementados.
