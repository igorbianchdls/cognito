# Financeiro — recorrências e previsões — 14/10/2026

Cinco grupos aprovados, sem nova falha confirmada. Testes de funções compartilhadas usando contexto ERP da empresa2/usuário3, com rollback de todas as operações. O processador foi restrito no roteiro aos IDs de recorrências fictícias QA-OTTO; nenhuma recorrência preexistente foi processada. Não houve publicação nem correção de código do produto neste lote.

## Resultados

- **Pagar mensal, fim de mês:** primeira competência31/10/2026; geração de30/11,31/12 e31/01/2027. Quatro títulos de100, total400. Limite1 gera uma ocorrência por vez; execução posterior gera as duas restantes; reenvio gera0.
- **Pausa e término por data:** recorrência pausada não gera; após retomada, término15/12 permite apenas31/10 e30/11, sem gerar31/12.
- **Período fechado:** bloqueia a geração de novembro com PERIOD_CLOSED e mantém apenas o primeiro título, sem efeitos parciais.
- **Previsão receber:** baixa recusada antes da efetivação; efetivar duas vezes preserva o saldo100; recebimento20 deixa saldo80.
- **Previsão pagar:** mesmo comportamento; baixa20 deixa saldo80.

As previsões foram criadas pelo serviço createManualFinancialTitle, também usado pelo fluxo MCP; isso testa a função compartilhada, não o transporte OAuth nem cada tool ou tela. A pausa foi configurada em SQL no roteiro com estado válido (ativa=false/pausada_em), não pela interface.

## Plano atualizado e limites

- Permanece a falha P2 da criação manual de pagar com a mesma chave e conteúdo diferente. Correção ainda pendente.
- Próximos: cartões, taxas, parcelamento e repasses; conciliação automática e contas diferentes.
- Recorrência ainda precisa de geração a receber, frequências diária/semanal/anual, ano bissexto, edição do modelo, encerramento/cancelamento pela interface e concorrência entre processadores. Este lote não aprova todos esses caminhos.
- Confirmar o fluxo publicado das previsões na interface e nas tools individualmente; filtros/relatórios de previsões e permissões permanecem pendentes.

## Evidências

financeiro-recorrencias-final.json consolida os cinco grupos; roteiro testes-financeiro-recorrencias.mjs. O primeiro ensaio de pausa tentou manter ativa=true enquanto pausada, estado recusado corretamente pelo banco. Corrigido apenas o fixture e retestado com sucesso. Uma falha inicial do roteiro também decorreu de auxiliar chamado process ocultando process.argv. Nenhum dos dois foi classificado como falha do ERP.

Acumulado destes três avanços financeiros:21grupos distintos,20aprovados e1falhaP2aberta. Não representa auditoria integral do financeiro.
