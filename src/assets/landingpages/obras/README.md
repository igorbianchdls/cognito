# Átio — Obras & Reformas

Frontend para gestão de construtoras e empresas de reforma, baseado na imagem aprovada pelo usuário. Acesso em `/obras` com o desenvolvimento normal do projeto.

## Funcionalidades

- Painel com indicadores mensais, obra em destaque, obras em execução, agenda, calendário, pipeline, financeiro e entregas.
- Cadastro e edição de obras, clientes, fornecedores, tarefas, compromissos, compras e lançamentos financeiros.
- Detalhe da obra com avanço físico, checklist por etapa, cronograma, compras, financeiro, documentos demonstrativos e diário.
- Pipeline com arrastar e soltar e seletor de etapa; filtros; busca; alternância entre lista e cartões.
- Compras com quantidade, unidade, fornecedor, previsão e situação de entrega.
- Propostas e relatórios em TXT, financeiro em CSV, backup em JSON.
- Dados locais no navegador em `atio-construction-v1`, independentes da demonstração de eventos.

Não há backend. Cliente/contato pertence ao cadastro da obra. Os valores contratuais previstos são distintos dos lançamentos mensais; o avanço físico é informado manualmente e não é calculado pelo checklist. Cronograma e tarefas compartilham a mesma base. Fotografias locais extraídas das referências aprovadas para a demonstração visual. Fotos da obra apresenta uma galeria demonstrativa, sem upload.

## Arquivos

`ConstructionApp.tsx`, `ConstructionApp.module.css` e `data.ts` nesta pasta; rota em `src/app/obras/page.tsx`; imagens em `public/obras-media`. A rota `/obras` é pública e contém apenas dados fictícios.
