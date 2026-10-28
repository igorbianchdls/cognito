# Pata — Pet Shop

Frontend demonstrativo baseado na imagem aprovada (atendimentos do dia em kanban). Acesso em `/petshop` pelo servidor de desenvolvimento do projeto.

## Funcionalidades

- Início com saudação, busca (atalho ⌘K / Ctrl+K) por pets, clientes, serviços e produtos, notificações (atendimentos atrasados, vacinas vencendo, estoque baixo) e o botão "Novo atendimento" com atalhos para cliente e pet, venda e produto.
- Indicadores com minigráfico dos últimos 7 dias: faturamento hoje (atendimentos concluídos e vendas), atendimentos hoje, novos clientes na semana e produtos em estoque.
- Atendimentos de hoje em kanban (Agendado, Em atendimento, Finalizando, Concluído) com arrastar e soltar, abas por tipo de serviço e visões em lista e calendário semanal.
- Próximos atendimentos, pets por serviço no mês (rosca), faturamento da semana, produtos mais vendidos, estoque em atenção e clientes recentes.
- Ficha do atendimento (serviço, profissional, horário, valor, observações, status e histórico) e ficha do pet (dados, vacinas e atendimentos).
- Telas de agenda, clientes, pets, serviços (preço editável), estoque (ajuste e mínimo), vendas (PDV com baixa de estoque), financeiro (30 dias), marketing (lembretes de vacina, clientes inativos e aniversariantes com mensagem para copiar), relatórios (CSV, backup e restauração) e configurações.

## Dados e limitações

Sem backend. Dados no navegador em `pata-petshop-v2`, com datas de exemplo geradas a partir do primeiro acesso. Os pets aparecem com avatar ilustrado (cão ou gato), sem fotos. O faturamento conta atendimentos concluídos e vendas de produtos. As mensagens de marketing são copiadas para a área de transferência; nada é enviado a terceiros. Rota pública, apenas com dados fictícios.

Arquivos: `PataApp.tsx`, `PataApp.module.css`, `Art.tsx`, `data.ts`, `fonts.ts`; rota em `src/app/petshop/page.tsx`.
