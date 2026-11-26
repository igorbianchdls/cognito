# Notas

Páginas e bases de dados, no estilo do Notion. A primeira versão copia a interface e o comportamento
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

- Bases de dados: `shared/bases.ts` (tipos, valores, filtros, ordenação, agrupamento, cálculos, relação, agregação),
  `shared/formula.ts` (fórmulas sem eval), `shared/csv.ts`, `server/bases.ts`, tela em `frontend/base/`.
- Etapas 3 a 5: `server/versoes.ts` (histórico), `server/comentarios.ts`, `server/compartilhamento.ts` (acesso restrito,
  convidados, link público), `server/publico.ts` (página pública `/n/<token>`), `shared/colaboracao.ts` +
  `frontend/tempoReal.ts` (edição simultânea), `frontend/importar.ts`, `shared/modelos.ts` (modelos de página).
- Migrações: `20261126060000_notas_schema`, `…070000_notas_bases`, `…080000_notas_etapa3`, `…090000_notas_etapa4`,
  `…100000_notas_etapa5`.

## Testes

- `npm run notas:regras`: regras puras (árvore, bases, fórmulas, CSV, sincronização).
- `npm run produtos:integracao`: sobe um Postgres local com o mínimo do Supabase (`scripts/notas/banco-local.sh`) e roda o
  código do servidor como cada pessoa (dona, membro, só visualização, outra empresa).
- `npm run notas:ui`: telas de ponta a ponta (navegador → telas → rotas → Postgres local). Usa um modo de teste que só
  existe fora de produção (`NOTAS_TESTE_USUARIO`) e o tempo real entre abas (`NEXT_PUBLIC_NOTAS_TEMPO_REAL=local`).
  Se a pasta `.next` tiver uma compilação de produção (`npm run build`), mova-a antes: ela faz o modo de desenvolvimento
  recarregar sem parar.

## Quem vê o quê

O servidor roda tudo como a pessoa (role authenticated com o usuário e a empresa ativa do Clerk) e as políticas decidem:
espaço **Equipe** — a empresa toda lê, quem altera dados edita; espaço **Particular** — só quem criou. Página com acesso
**restrito** (e as subpáginas): só quem criou e os convidados (ver ou editar). Link público: só leitura, por token. Subpágina fica no
espaço da mãe. Imagens e arquivos: `/api/notas/arquivos/<empresa>/…` confere o vínculo e redireciona para URL assinada.

## Edição ao mesmo tempo

O texto da página é um documento Yjs: cada pessoa salva o seu estado e o servidor funde (nada se perde, nem sem tempo
real). As mudanças, cursores e presença passam pelo Supabase Realtime em canais privados (`notas:pagina:<id>:<geração>`),
autorizados no banco (`notas.canal_permitido`). Conteúdo trocado por fora (restaurar versão, modelo) começa uma geração
nova; quem estava na antiga recarrega. Título, ícone e capa: vale o último que gravar, e quem está junto vê na hora.

## Etapas

1. Fundação: páginas, árvore, favoritos, recentes, lixeira, busca, capa e ícone, editor em blocos.
2. Bases de dados: propriedades, tabela, quadro e lista, filtros/ordenação, item aberto ao lado.
3. Galeria, calendário, relação/agregação/fórmula, modelos, histórico de versões.
4. Comentários, edição simultânea, importar (Markdown, HTML, texto, CSV) e exportar (Markdown, HTML, CSV, PDF).
5. Permissão por página e link público.
Sem IA dentro das Notas (decisão do produto).
