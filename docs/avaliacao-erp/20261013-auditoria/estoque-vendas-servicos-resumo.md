# Estoque, vendas e serviços — testes e melhorias

Lote de 13/10/2026, empresa Igor Bianch Workspace (2), registros QA-OTTO. Publicação: dpl_26djPNymmpTjLSyHvWvsCRYApper. Compilação Next e TypeScript aprovadas; ESLint sem erros, dois avisos anteriores. Os sete arquivos modificados partem exatamente da versão publicada anterior; demais alterações locais não foram incluídas.

## Testes de vendas e serviços

| Cenário | Resultado |
| --- | --- |
| Orçamento QA-OTTO-ORC-016 aprovado e convertido | 280 em itens, desconto de 28 e frete de 10 = 262; duas parcelas de 131 preservadas; reenvio com versão atual recupera a mesma venda 946 |
| Entrega de venda 946 em duas etapas | 1+1 produtos; CMV 40; recebimento parcial 50; aberto 212 |
| Ordem QA-OTTO-OS-017 | Bloqueio de conclusão fora de etapa; aprovação, execução, conclusão; 360 em serviços + 50 em produto - 10 = 400; venda 947 vinculada, sem duplicar no reenvio |
| Venda gerada da OS | Conta a receber 400, entrega de um produto com CMV 20; não houve emissão fiscal |
| Tabela QA-OTTO 019 | Preço 39 bloqueado pelo mínimo 40; venda 45 aceita |
| Comissão QA-OTTO 019 | 5% de 45 = 2,25; cancelamento da venda 948 remove a comissão e libera a reserva |
| Contrato QA-OTTO-CTR-018 | Dois ciclos mensais de 180, total 360, rascunhos sem duplicação; teste isolado com rollback e seleção restrita ao contrato QA |

A geração global de contratos não foi executada no ambiente publicado, pois afetaria outros contratos ativos. A venda gerada de OS exige conferir categoria e dados financeiros no rascunho antes de confirmar; o cadastro de OS não fornece esses dados.

## Plano implementado

1. **Alta: devolução de kits.** Recuperar os componentes, locais e custos das saídas efetivas, sem usar a composição atual do kit. Ratear corretamente documentos com componente compartilhado entre itens e criar documento de retorno por local. Atendimento legado usa as reservas históricas. Corrigido também o limite de entrega parcial calculado a partir dos componentes. Reenvio preserva o resultado.
2. **Alta: unidade de estoque.** Campo obrigatório no cadastro com padrão UN; criar, editar, consultar e listar preservam a unidade. Produtos legados sem unidade usam UN nas conversões. Conversão deve terminar na unidade do produto. Troca de unidade é bloqueada após movimentos ou conversões, para preservar o significado dos saldos.
3. **Baixa: mensagem de saldo.** Informar separadamente saldo físico, reservado e disponível para saída.
4. **Serviços: clareza dos documentos gerados.** Ordem já convertida oferece Abrir venda ou Abrir orçamento, e permite consultar o documento vinculado. Detalhe mostra subtotal, desconto e total em reais. Não oferece gerar orçamento quando a ordem já originou venda.

## Validação das correções

Regressão transacional passou com restrições do banco e rollback: caixa de 12 por 240 produz custo 20; unidade legada funciona; destino incompatível e troca de unidade em uso são bloqueados; kit com dois componentes, devolução parcial, componente compartilhado, composição alterada após a saída, crédito e reenvio corretos; devolução completa zera CMV; atendimento legado restaura componentes a 20 e 30; mensagem mostra físico 24, reservado 2 e disponível 22. A regressão anterior de compras e financeiro também passou.

Na versão publicada: produtos 126/127, venda 965 QA-OTTO-VEN-KIT-020 e devolução 27 DEV-2026-0003. Entrada 1 CX = 12 UN a 20 (240); entrega do kit baixa 2 componentes (40); devolução retorna os 2 componentes, crédito 100 e saldo 12/240, sem criar estoque do pai; repetição retorna a mesma devolução. Saída final de 1 CX encerrou a entrada fictícia, saldo 0/valor 0.

## Limites e próximos cenários

As devoluções históricas QA 4 e 12, que evidenciaram os defeitos anteriores, permanecem como evidência e não tiveram movimentos reescritos. A correção vale para novas operações. Concorrência entre sessões, entrega/devolução distribuída entre vários locais em um mesmo caso, emissão fiscal externa e estornos financeiros avançados continuam fora da cobertura deste lote. Não representa aprovação de todos os cenários possíveis do ERP.

Evidências: vendas-servicos-validacao.json, estoque-vendas-servicos-publicacao.json e regressao-estoque-vendas-servicos.mjs.

Conferência visual publicada: ação Abrir venda abriu VEN-2026-0152; detalhe da OS exibiu subtotal R$ 410, desconto R$ 10 e total R$ 400. Evidência: output/audit-20261013/20-servicos-corrigidos.png.
