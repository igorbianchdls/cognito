# Financeiro — relatórios, acordos e importação — 14/10/2026

## Resultado

Seis novos grupos aprovados; nenhuma nova falha confirmada neste lote. Testes das funções e consultas compartilhadas com contexto de execução do ERP, empresa 2/usuário 3. Todas as transações foram descartadas ao final, inclusive importações de extrato. Nenhuma publicação ou alteração de regra de produção neste lote. Não equivale à aprovação individual da interface ou de cada tool MCP.

## Conferências aprovadas

1. **Caixa, competência e banco:** receber 1.000 e pagar 300; recebimento parcial 400 + juros 10 + multa 5 - desconto 20 - taxa 3 = 392; pagamento parcial 100 + taxa 2 = 102. Resultado de caixa e variação do banco = 290; resultado por competência = 700. Após estornar o recebimento, caixa e banco variam -102, mantendo competência 700.
2. **Adiantamento:** constituição de cliente 200 aumenta banco e entradas realizadas do fluxo em 200, sem reconhecer receita nos resultados por caixa/competência.
3. **Rateio, DRE e centavos:** despesa 100,01 distribuída em 60,01 na DRE e 40 fora da DRE; resultado por competência -100,01 e lucro líquido da DRE -60,01. Pagamento parcial 33,33 distribui 20 na DRE e 13,33 fora, preservando centavos e soma. Categoria129 fora_dre=true conferida no banco.
4. **Renegociação receber:** mistura de clientes e origem sem saldo recusadas. Após receber 20 de destino100, reversão do acordo é recusada, mantendo origem liquidada pela transferência e saldo80 no destino.
5. **Renegociação pagar:** mesmas proteções para fornecedores e destino com baixa parcial.
6. **Importação:** CSV com crédito100/débito20,50 importa dois movimentos; repetição reutiliza importação e mantém somente dois movimentos. OFX com crédito25,50 e FITID estável, importado duas vezes, mantém um movimento.

Os relatórios foram comparados por diferença entre o estado antes e depois de cada cenário, com valores esperados calculados a partir dos documentos fictícios; dados antigos da empresa não foram tratados como fixtures corrigidas. Não foi feita reconciliação integral de todo o histórico real.

## Plano atualizado

- **P2 pendente:** criação manual de conta a pagar reutiliza resposta anterior para mesma chave com conteúdo diferente. Mantida a correção proposta em financeiro-plano-melhorias.md; não implementada neste lote.
- **Próximo:** recorrências e previsões financeiras, cartões/taxas/repasses e regras automáticas de conciliação.
- **Importação avançada:** arquivos sobrepostos ou parcialmente repetidos, dados inválidos e formatos bancários adicionais; o teste atual cobre repetição integral de CSV/OFX e interpretação dos valores.
- **Relatórios avançados:** conciliar histórico completo, filtros de conta/centro de custo, períodos distintos para pagamento/estorno, transferências e previsão do fluxo. O teste atual cobre fluxos na mesma data operacional e um rateio com exclusão da DRE.
- Interface publicada, perfis distintos, isolamento entre empresas e concorrência continuam pendentes neste escopo.

## Evidências

financeiro-relatorios-final.json consolida os seis grupos. Roteiro: testes-financeiro-relatorios.mjs. A primeira consulta isolada de saldos deixou parâmetros intermediários sem tipo; o roteiro foi ajustado e os três grupos de relatórios retestados. Não classificar a falha inicial do roteiro como defeito do ERP.

Com o lote anterior: 16 grupos financeiros distintos neste avanço, 15 aprovados e uma falha P2 ainda aberta. Isso não representa auditoria integral do financeiro.
