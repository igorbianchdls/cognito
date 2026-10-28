# Torque — Oficina & Centro Automotivo

Frontend demonstrativo baseado na imagem aprovada (quadro de ordens de serviço). Acesso em `/oficina` pelo servidor de desenvolvimento do projeto.

## Funcionalidades

- Painel com saudação, busca (OS, placa, modelo ou cliente), notificações e o botão "Adicionar OS".
- Três indicadores: Faturamento (OS finalizadas), Alertas inteligentes (valor das OS que precisam de atenção) e Peças (peças orçadas), com comparação entre os últimos 30 dias e os 30 anteriores.
- Quadro com as etapas Avaliação, Orçamento, Peças, Execução e Entrega. Os cartões podem ser arrastados entre colunas; a coluna de destino mostra uma área tracejada. A etapa também muda pelo menu do cartão e pela OS.
- Cartão de OS: número, mecânico, serviços concluídos (x/y), veículo, placa, cliente, previsão e valor. Em Avaliação o cartão mostra a próxima ação (checklist, orçamento ou envio). Em Orçamento o status (Pendente, Aprovado, Recusado) muda direto no cartão.
- Alertas calculados: OS sem atualização há 2 dias ou mais (borda vermelha), entrega atrasada e orçamento pendente.
- OS completa em painel lateral: dados do veículo e do cliente, vistoria de entrada, orçamento com serviços e peças, checklist de serviços, histórico e finalização da entrega.
- Telas de ordens (filtros, CSV e backup JSON), veículos, agenda de entregas, orçamentos, financeiro e clientes.

## Dados e limitações

Sem backend. Os dados ficam no navegador em `torque-oficina-v2` e as datas de exemplo são geradas a partir do dia do primeiro acesso. Para voltar ao início, use o botão de restaurar na tela Ordens de serviço. Mover uma OS de Orçamento para etapas seguintes marca o orçamento como aprovado. Finalizar a entrega soma o valor ao faturamento. Veículos e clientes são derivados das ordens, pela placa e pelo nome. Carros e ilustrações são SVG desenhados em código (`Art.tsx`). Rota pública, apenas com dados fictícios.

Arquivos: `TorqueApp.tsx`, `TorqueApp.module.css`, `Art.tsx`, `data.ts`, `fonts.ts`; rota em `src/app/oficina/page.tsx`.
