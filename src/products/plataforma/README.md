# Plataforma

O que é comum a todos os produtos do Otto: a moldura das telas (menu lateral, cabeçalho do topo, seletor de empresa) e a **categoria da empresa**, que decide o que aparece no menu.

## Onde fica

- `shared/categorias.ts`: as categorias (`marketing`, `gestao`, `atendimento`, `completo`), as seções do menu de cada uma, na ordem, e onde o Otto abre (`/`). É a regra única, usada no navegador e no servidor.
- `frontend/shell/AppShell.tsx`: a moldura usada por ERP, Marketing/Editor/Drive, Analytics, Inbox e Configurações. `AppHeader.tsx` é o cabeçalho do topo (notificações, configurações, ajuda e conta).
- `frontend/nav/`: o menu lateral (`Sidebar.tsx`) e as seções e atalhos do "Novo" (`secoes.ts`). O menu mostra as seções da categoria da empresa ativa, na ordem dela, e cada item do ERP só para perfis com a permissão (`useErpAccess`).
- `frontend/empresa/`: o seletor de empresa (com a categoria de cada uma e "Criar empresa"), `useEmpresaAtiva` (empresas da pessoa e a categoria da ativa) e o cartão "Categoria da empresa" das Configurações.
- `server/empresa.ts` e `/api/plataforma/empresas`: lista as empresas da pessoa com a categoria (GET) e muda a categoria da empresa ativa (PATCH, só owner e admin).
- Banco: `shared.empresas.categoria` (`supabase/migrations/20261125190000_plataforma_categoria_empresa.sql`), padrão `completo`.

## Estado atual

A categoria é o **foco** da empresa: organiza o menu, os atalhos do "Novo" e a página inicial, mas não bloqueia telas, API nem plugin. Quando houver cobrança, uma tabela de assinaturas passa a definir o que fica liberado (bloqueio nas telas, na API, no banco e no plugin).
