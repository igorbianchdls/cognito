# Financeiro — cartões e conciliação automática — 14/10/2026

## Resultado

Sete novos grupos aprovados, sem nova falha confirmada. Funções compartilhadas do servidor executadas com contexto ERP empresa2/usuário3 e restrições do banco. Todas as operações foram descartadas ao final: recebimentos, despesas de taxa, repasses, extratos e regras. O seletor de regras automáticas foi limitado no roteiro aos IDs de regras e transações QA recém-criados. Nenhuma transação antiga foi processada. Não houve mudança do produto ou publicação neste lote.

## Casos aprovados

1. **Cartão parcelado:** bruto100,01; taxa3%+0,30=3,30; líquido96,71; repasses32,23+32,23+32,25, previstos16/10,15/11 e15/12 (prazo inicial2dias, intervalos30dias). Quitação do principal, reenvio sem duplicação e estorno restaurando saldo100,01 com repasses pendentes cancelados.
2. **Repasse conciliado:** conciliar96,70 bloqueia o estorno do recebimento com INVALID_STATE. Desfazer a conciliação permite estornar e restaura saldo100.
3. **Validações:** forma Pix com conta de maquininha, destino de repasse também maquininha e taxa manual num recebimento com taxa calculada são recusados; saldo permanece100.
4. **Regra de crédito:** extrato42,35 gera título, recebimento e conciliação uma vez; reexecução lança0; pagamento líquido42,35 conciliado.
5. **Regra de débito:** mesmo comportamento para título a pagar/pagamento.
6. **Correspondência:** regra restrita à conta21 não processa transação da conta22; descrição sem correspondência não gera título.
7. **Repasse divergente:** outra conta é recusada. Repasse previsto96,70 conciliado por95 registra diferença-1,70 e preserva valor_previsto no histórico da transferência. A diferença é aceita pelo fluxo e fica auditada; não foi tratada como erro de cálculo.

As validações diferidas do banco foram executadas antes de verificar o campo conciliado. A primeira tentativa leu esse resumo antes da atualização diferida; foi ajustado apenas o roteiro, e os sete grupos foram executados novamente com sucesso.

## Plano e limites

Permanece a falhaP2 anterior de criação manual de pagar com chave repetida e conteúdo diferente. Este lote não implementa sua correção.

Próximos testes: interface publicada e tools individualmente; perfis/isolamento entre empresas e concorrência; regras automáticas ambíguas, prioridade e falha de uma transação sem impedir outras; limites de parcelamento/taxa e ajustes após mudar configuração; conciliação integral dos saldos de banco/maquininha/fluxo no tempo; importações sobrepostas/inválidas; recorrências avançadas e datas distintas para pagamento/estorno. Não afirmar cobertura integral do financeiro.

## Evidências

financeiro-cartoes.json; roteiro testes-financeiro-cartoes.mjs. Nenhum pagamento externo ou integração com adquirente real foi executado. Acumulado destes avanços:28grupos financeiros distintos,27aprovados e1falhaP2pendente.
