# Lumière Eventos

Frontend demonstrativo para gestão de uma empresa de casamentos, baseado na referência fornecida pelo usuário.

## Acesso

Execute o desenvolvimento normal do projeto e acesse `/eventos`. A página é pública e usa somente dados demonstrativos. Nenhuma integração de backend foi adicionada.

## Conteúdo

- `EventsApp.tsx`: interface, navegação, cadastros, calendário, planejamento, pipeline e financeiro.
- `EventsApp.module.css`: identidade visual isolada, com desktop como prioridade.
- `data.ts`: tipos e dados iniciais.
- `public/eventos-media`: fotografias extraídas da referência enviada pelo usuário, para aproximar a composição visual sem dependência de serviços externos.
- `src/app/eventos/page.tsx`: entrada no App Router.

As alterações são persistidas no `localStorage` sob `lumiere-weddings-v1`. O menu do perfil permite exportar um backup JSON. Para restaurar a demonstração inicial, remova essa chave no armazenamento do navegador.

## Interações

Busca por casamento e fornecedor; filtros de etapas; cadastro e edição de casamentos, fornecedores, tarefas, compromissos e lançamentos; pipeline com arrastar e soltar e seletor de etapa; calendário navegável; checklist; anotações por casamento; exportação CSV do financeiro e proposta demonstrativa em texto; inventário e recados locais.

Indicadores e gráficos usam os registros da demonstração e respeitam o mês selecionado. O cadastro do casamento contém valores comerciais previstos; os lançamentos financeiros são registros próprios e devem ser cadastrados separadamente. A aba de fornecedores do casamento apresenta o catálogo da empresa. Convidados têm previsão e anotações de mesas, sem RSVP ou cadastro individual. Documentos e mensagens são demonstrativos locais.
