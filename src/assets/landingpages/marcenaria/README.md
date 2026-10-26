# Cerne — Marcenaria & Planejados

Frontend demonstrativo baseado na imagem aprovada. Acesso em `/marcenaria` pelo servidor de desenvolvimento do projeto.

## Funcionalidades

Painel geral com projetos, produção, agenda, calendário, financeiro, compras e referências de acabamento. Projetos com cliente, ambiente, dimensões em m², materiais, acabamento, valor, prazos e avanço informado. Cadastros e edição de projetos, fornecedores, tarefas, compromissos, compras e lançamentos financeiros. Pipeline comercial separado do fluxo de produção. Produção com quatro etapas e movimentação por arrastar e soltar, também editável pelos formulários. Checklist, etapas de fabricação, compras, financeiro, documentos demonstrativos e anotações por projeto. Exportações de proposta/relatório TXT, financeiro CSV e backup JSON.

## Dados e limitações

Frontend sem backend. Dados salvos no navegador em `cerne-joinery-v1`, separados das outras demonstrações. O avanço é informado manualmente e não calculado pelo checklist. Materiais e compras são pedidos, sem plano de corte ou baixa automática de estoque. A galeria de referências é demonstrativa e usa fotografias locais extraídas da imagem aprovada. Os valores contratuais previstos e os lançamentos financeiros são registros separados. O indicador de montagens considera compromissos do tipo Montagem no mês selecionado; indicadores de projetos e produção mostram a carteira atual.

Arquivos: `JoineryApp.tsx`, `JoineryApp.module.css`, `data.ts`; rota em `src/app/marcenaria/page.tsx`; imagens em `public/marcenaria-media`. Rota pública apenas com dados fictícios.
