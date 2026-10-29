# Alvorada Construção e Reforma

Frontend demonstrativo para uma construtora, baseado na referência fornecida pelo usuário. Convive com a Átio (`/obras`) na mesma categoria do diretório.

## Acesso

Execute o desenvolvimento normal do projeto e acesse `/construcao`. A página é pública e usa somente dados demonstrativos. Nenhuma integração de backend foi adicionada.

## Conteúdo

- `AlvoradaApp.tsx`: interface, navegação, cadastros, gaveta da obra e páginas de dados.
- `AlvoradaApp.module.css`: identidade visual isolada (vidro creme e vidro escuro sobre a foto na visão geral; páginas claras nas demais abas).
- `data.ts`: tipos, regras (progresso ponderado pelas etapas, compras, medições) e dados iniciais gerados a partir da data atual.
- `Art.tsx`: logo e ilustrações dos módulos.
- `public/construcao-media`: foto da obra enviada pelo usuário e recortes dela usados como capas das obras residenciais.
- `src/app/construcao/page.tsx`: entrada no App Router.

As alterações são persistidas no `localStorage` sob `alvorada-obras-v1`. Em Relatórios é possível exportar CSV e backup JSON, ou restaurar os dados de exemplo.

## Abas

- **Visão Geral**: foto de fundo, obra em destaque com progresso, etapa atual e marcos, módulos (projetos, orçamentos, fornecedores, financeiro) com indicadores, etapas para acompanhar, entregas de materiais e caixa dos próximos 30 dias.
- **Projetos**: lista, quadro por situação e cronograma (Gantt).
- **Orçamentos**: propostas com itens; ao aprovar, a obra é criada com cronograma e medições.
- **Clientes**, **Fornecedores**, **Financeiro** e **Relatórios**: páginas informacionais, sem foto.

Cada obra abre uma gaveta com resumo, cronograma (progresso por etapa), compras, equipe, medições e diário de obra.
