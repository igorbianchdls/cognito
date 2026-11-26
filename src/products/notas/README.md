# Notas

Páginas e (nas próximas etapas) bases de dados, no estilo do Notion. A primeira versão copia a interface e o comportamento
do Notion (layout, medidas, cores, interações), sem a marca nem os desenhos dele; o toque do Otto vem depois.
Aparece no menu das empresas das categorias Marketing e Completo (`plataforma/shared/categorias.ts`).

## Onde fica

- Telas: `src/app/notas` (`/notas` início, `/notas/[id]` página). Moldura: `frontend/NotasApp.tsx` dentro do `AppShell`
  com o menu do Otto recolhido.
- Tela: `frontend/Sidebar.tsx` (empresa, Buscar, Início, Favoritos, Equipe, Particular, árvore com arrastar, Lixeira, Nova
  página; recolhível e redimensionável), `frontend/PaginaView.tsx` (caminho, editado, favoritar, ⋯ com estilo da fonte,
  texto pequeno, largura total, bloquear, duplicar, lixeira; capa, ícone, título; salva sozinha), `frontend/Busca.tsx`
  (Ctrl+K), `frontend/Inicio.tsx`, `frontend/NotasProvider.tsx` (árvore e ações compartilhadas).
- Editor em blocos: **BlockNote 0.57** (MPL-2.0; versões fixadas no package.json), só em `frontend/Editor.tsx`. Os pacotes
  "XL" do BlockNote (GPL ou pagos) não são usados.
- Regras puras: `shared/arvore.ts` (árvore, caminho, ciclo ao mover, posição ao arrastar, texto dos blocos para a busca),
  testes em `arvore.test.ts` (`npm run notas:regras`).
- Servidor: `server/paginas.ts` (operações), `server/db.ts` (roda como a pessoa; bucket), `server/http.ts`; rotas em
  `src/app/api/notas` (`arvore`, `paginas`, `paginas/[id]` e `mover`/`duplicar`/`restaurar`/`favorito`, `lixeira`, `busca`,
  `arquivos`).
- Banco: schema `notas` (`paginas`, `favoritos`, `recentes`) e bucket privado `notas`
  (`supabase/migrations/20261126060000_notas_schema.sql`).

## Quem vê o quê

O servidor roda tudo como a pessoa (role authenticated com o usuário e a empresa ativa do Clerk) e as políticas decidem:
espaço **Equipe** — a empresa toda lê, quem altera dados edita; espaço **Particular** — só quem criou. Subpágina fica no
espaço da mãe. Imagens e arquivos: `/api/notas/arquivos/<empresa>/…` confere o vínculo e redireciona para URL assinada.

## Edição ao mesmo tempo

Fica para a etapa 4. Até lá cada gravação leva a versão aberta (`versao`); se outra pessoa salvou antes, o servidor recusa
e a página mostra "Esta página foi alterada em outro lugar" com Recarregar, em vez de sobrescrever.

## Etapas

1. Fundação (esta): páginas, árvore, favoritos, recentes, lixeira, busca, capa e ícone, editor em blocos.
2. Bases de dados: propriedades, tabela, quadro e lista, filtros/ordenação/agrupamento, linha abrindo como página.
3. Galeria, calendário, relação/rollup/fórmula, modelos, histórico, comentários, importar/exportar Markdown.
4. Edição simultânea, link público, permissão por página, IA, ferramentas no chat.
5. Toque do Otto.
