# Lumen — Hotel & Pousada

Frontend demonstrativo baseado na imagem aprovada. Acesso em `/hotel` pelo servidor de desenvolvimento do projeto.

## Funcionalidades

- Visão Geral sobre a foto da pousada, com barra de navegação e cartões em vidro fosco: boas-vindas, "Nova reserva", "Hoje no hotel" (data, clima, ocupação, check-ins e check-outs) e indicadores do mês (receita, diária média, RevPAR e ocupação prevista para 7 dias, com comparação ao mês anterior). Abaixo, chegadas e saídas do dia com check-in e check-out, governança e ocupação dos próximos 14 dias.
- As demais abas usam um layout informacional, sem foto: Reservas (lista com filtros e mapa de quartos por dia), Hóspedes (cadastro, estadias e total gasto), Quartos (mapa por andar com ocupação e governança, tarifas por tipo), Financeiro (receita de diárias e extras, diária média, RevPAR, ocupação, previsão do mês e canais) e Relatórios (indicadores de 30 dias, exportações e configurações).
- Reserva nova ou editada só aceita quartos livres no período e respeita a capacidade do tipo. Check-out antecipado libera as noites restantes e deixa o quarto aguardando limpeza. Extras são lançados na conta durante a estadia.

## Dados e limitações

Sem backend. Dados no navegador em `lumen-hotel-v2`, com 50 quartos e reservas de exemplo geradas a partir do dia do primeiro acesso. O clima é um valor de demonstração ajustável (não há serviço de previsão do tempo). A ficha de cada tipo de quarto (aba Quartos) mostra um fundo ilustrado até que as fotos sejam adicionadas em `roomPhotos` (`HotelApp.tsx`). Rota pública, apenas com dados fictícios.

Arquivos: `HotelApp.tsx`, `HotelApp.module.css`, `data.ts`; rota em `src/app/hotel/page.tsx`; foto de fundo em `public/hotel-media/hero.webp` (e `hero.jpg` para o diretório `/sistemas`).
