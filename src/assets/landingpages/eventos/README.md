# Vélia Eventos

Frontend demonstrativo para uma empresa de casamentos e eventos, baseado na referência fornecida pelo usuário.

## Acesso

Execute o desenvolvimento normal do projeto e acesse `/eventos`. A página é pública e usa somente dados demonstrativos. Nenhuma integração de backend foi adicionada.

## Conteúdo

- `EventsApp.tsx`: interface, navegação, cadastros, gaveta do evento e páginas de dados.
- `EventsApp.module.css`: identidade visual isolada (vidro creme e vidro escuro sobre a foto na visão geral; páginas claras nas demais abas).
- `data.ts`: tipos, regras (etapas do evento, recebimentos, custos) e dados iniciais gerados a partir da data atual.
- `Art.tsx`: logo e ilustrações dos módulos.
- `fonts.ts`: fonte serifada dos títulos (Cormorant Garamond); o restante usa Geist.
- `public/eventos-media`: foto da cerimônia enviada pelo usuário e recortes dela usados como capas de casamentos e galeria.
- `src/app/eventos/page.tsx`: entrada no App Router.

As alterações são persistidas no `localStorage` sob `velia-eventos-v1`. Em Relatórios é possível exportar CSV e backup JSON, ou restaurar os dados de exemplo.

## Abas

- **Visão Geral**: foto de fundo, próximo casamento com o andamento de cada etapa, próximos eventos, módulos (planejamento, fornecedores, convidados, fotos e vídeos) com indicadores, tarefas da semana, recebimentos dos próximos 30 dias e funil comercial.
- **Eventos**: lista, funil por etapa comercial e calendário mensal.
- **Clientes**, **Fornecedores**, **Financeiro** e **Relatórios**: páginas informacionais, sem foto.

Cada evento abre uma gaveta com resumo, cronograma de tarefas, fornecedores contratados, convidados com RSVP, parcelas e fotos.
