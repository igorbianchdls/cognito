# Átio — Construtora & Incorporadora

Frontend demonstrativo baseado na imagem aprovada (painel de obras em kanban). Acesso em `/obras` pelo servidor de desenvolvimento do projeto.

## Funcionalidades

- Início com saudação, busca (atalho ⌘K / Ctrl+K) por obras, clientes, fornecedores e materiais, notificações e o botão "Nova obra" com atalhos para atividade, compra, lançamento e documento.
- Indicadores: receita contratada, custo das obras, margem projetada (com anel de percentual) e obras em andamento. A comparação é com os contratos assinados até 30 dias atrás.
- Obras em kanban (Planejamento, Em execução, Acabamento, Entrega) com arrastar e soltar, abas (Todas, Em construção, Lançamento, Entregues, Planejamento), filtros por cidade e ordenação, e visões em lista e em mapa.
- Card de obra com ilustração, cidade, avanço físico, início, entrega (em vermelho se atrasada), equipe e selo de entrega.
- Mapa ilustrado da Região Metropolitana do Recife com as obras posicionadas; atividades de hoje; evolução financeira mensal (receita, custo e lucro); compras e estoque; equipe em campo; documentos recentes.
- Ficha da obra em painel lateral: dados e valores, avanço físico, cronograma por etapa, equipe, atividades, financeiro e documentos; mover de etapa e marcar como entregue.
- Telas de planejamento (cronograma das obras e agenda), orçamentos (previsto x realizado), financeiro (lançamentos), compras (receber atualiza o estoque), estoque (baixa de material), fornecedores, clientes, documentos e relatórios (CSV, backup JSON e restauração dos dados de exemplo).

## Dados e limitações

Sem backend. Dados no navegador em `atio-construtora-v2`, com datas de exemplo geradas a partir do primeiro acesso. O avanço físico e o avanço por etapa são informados manualmente. Uma compra registra o custo no financeiro e fica em trânsito até ser recebida. Documentos são apenas registros: o download gera um arquivo de texto demonstrativo. Prédios, ilustrações e mapa são SVG desenhados em código (`Art.tsx`), sem serviço de mapas externo. Rota pública, apenas com dados fictícios.

Arquivos: `ConstructionApp.tsx`, `ConstructionApp.module.css`, `Art.tsx`, `data.ts`; tipografia Geist, carregada no layout raiz; rota em `src/app/obras/page.tsx`.
