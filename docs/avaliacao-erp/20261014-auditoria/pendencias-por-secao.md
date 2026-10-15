# Situação consolidada dos testes por seção

Atualização: fechamento de 14/10/2026 (últimas evidências em 15/10 UTC). Este quadro substitui as listas cronológicas anteriores de pendências. Detalhes, plano e limites: [fechamento-testes-erp.md](fechamento-testes-erp.md).

| Seção | Evidência disponível | Situação restante |
|---|---|---|
| Cadastros | CRUD e persistência dos cadastros auditados; cliente/fornecedor/vendedor/categorias pela interface; importação/exportação; seis correções publicadas e retestadas | Perfis visuais distintos; disparo automático por horário |
| Compras | Pedido/compra direta, recebimentos parciais, excesso, repetição, concorrência, custo com frete/desconto, parcelas, pagamento/estorno/cancelamento e XML válido/inválido/duplicado | Devolução integral ao fornecedor publicada; parcial e tratamento de crédito/reembolso sem estorno prévio ainda não disponíveis |
| Vendas | Orçamento/venda, reservas/entregas/cancelamentos, devoluções/créditos, preço/desconto, comissões e recorrências; revisão de contrato com dois itens aprovada no serviço | Links e anexos corrigidos; suspensão, retomada e encerramento de contrato publicados e testados |
| Serviços | Etapas de OS, conversão para orçamento/venda, PDFs atuais e arquivamento privado comercial real | Anexos corrigidos; homologação fiscal externa e novo PDF fiscal em Storage real ainda não comprovados |
| Estoque | Saldos/custos, conversões, kits, transferências, inventários e concorrência no servidor; inventário de dois itens e fator válido/inválido na publicação concluídos | Sem nova falha funcional de estoque nesta continuação; histórico antigo de QA preservado |
| Financeiro | Fluxos principais e concorrência/recorrências/crédito/cartões/importação/reconciliação já registrados; recorrência editada/pausada/retomada/encerrada, sugestões de crédito, seleção contextual de baixa e atualização de conciliação manual/sugerida/desfazer na publicação | Perfis reais distintos |
| Relatórios/painéis | Sete painéis, 49 comparações independentes; oito relatórios em três períodos de virada de ano; receita/custo/margem conferidos; paginação do serviço | Captura do CSV gerado pelo navegador integrado não concluída; não confundir com falha confirmada de exportação |
| Segurança/MCP/rotinas | RLS de leitura em 105 tabelas; links fiscais válidos e negativos; cron anônimo recusado; orquestração isolada em seis empresas/fusos | OAuth dentro de ChatGPT/Claude reais, usuários de consulta/operador e disparo por horário isolado |

## Correções publicadas em 15/10/2026

- **A01 encerrada:** link comercial válido abre sem sessão; assinatura, expiração e empresa verificadas.
- **A02 encerrada:** configuração de anexos alinhada ao projeto do ERP; envio e download privados reais aprovados.

Entrega, limites da devolução integral e evidências em [Correções e evolução funcional](../20261015-evolucao.md). Os bloqueios externos do fechamento continuam separados; Clerk foi adiado pelo usuário.

## Histórico de evidências

- [Correções de compras/cadastros](correcoes-compras-cadastros.md): seis correções publicadas, migração e regressão 17+7 grupos.
- [Resultados de compras/cadastros](compras-cadastros-resultados.md).
- [Cobertura de estoque/vendas](estoque-vendas-cobertura.md), `correcoes-cinco-falhas.md`, `regressao-cinco-falhas-final.json`, `cobertura-consolidada.json`.
- [Fechamento financeiro anterior](financeiro-fechamento-final.md), [melhorias financeiras](financeiro-melhorias-implementadas.md), `financeiro-reconciliacao-final-evidencia.json`.
- Relatórios históricos em `../20261013-auditoria/`; registros brutos em `.cache/audit-20261013/results.ndjson`.

Os textos históricos descrevem o estado da rodada em que foram escritos. Para situação atual, prevalece o fechamento acima.
