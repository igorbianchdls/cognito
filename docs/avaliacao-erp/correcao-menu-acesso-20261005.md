# Correção do menu: erro 500 no acesso ao ERP

## Causa reproduzida

O site publicado retornava `500 ERP_OPERATION_ERROR` em `GET /api/erp/acesso`, enquanto os dashboards respondiam 200. O log do ERP ocultava o erro interno e mostrava somente a mensagem genérica exibida no menu.

O Next.js entrega `{ params: undefined }` para rotas sem segmentos dinâmicos. `validateErpHttpParams` acessava `params.id` sem verificar se `params` existia. A falha foi reproduzida com o contrato real: `TypeError: Cannot read properties of undefined (reading 'id')`. Os testes anteriores forneciam um objeto vazio para todas as rotas e não representavam esse comportamento do framework.

## Correção

- A validação aceita a ausência de parâmetros nas rotas estáticas e mantém a validação dos identificadores nas rotas dinâmicas.
- Os testes HTTP agora fornecem `params: undefined` nas rotas estáticas, como o Next.js.
- O menu mantém as permissões reais; não foram concedidos acessos adicionais como solução para a falha.

## Verificação

- `scripts/erp/access-auth-diagnostic.mjs`: perfil real no Clerk, bootstrap e permissões no Supabase e handler real de acesso. Apenas os dados da sessão são fornecidos pelo teste. As transações de sincronização do perfil são revertidas. Verifica também a ausência de parâmetros e identificadores inválidos.
- `scripts/erp/access-production-smoke.mjs`: reproduziu 500 no site publicado usando uma sessão real já existente do proprietário. O token de curta duração fica apenas em memória. O script confere o projeto Vercel, proprietário ativo, organização e resposta do endpoint; também exige 401 para acesso anônimo na versão corrigida.
- Testes HTTP do ERP: 20 cenários aprovados, cobrindo 59 rotas e 83 métodos, com banco local fictício e o contexto correto de rotas estáticas.
- Tipagem e lint aprovados.
- Interface com menu completo: dez verificações aprovadas, incluindo carregamento, recuperação de erro, troca de empresa, pesquisa, celular e fundo branco.

Nenhum dado financeiro, comercial ou de estoque foi criado, alterado ou excluído durante a verificação.

## Publicação

Versão `dpl_ETbtSDVXfaxvp7widPtULrMZqnfC` preparada na Vercel sem atribuição inicial ao domínio. O teste autenticado retornou 200 e 15 permissões; o anônimo retornou 401. Após essa validação, a versão foi promovida para `https://cognito-seven.vercel.app` e os mesmos resultados foram confirmados no domínio publicado, com uma sessão real do Clerk.

Evidências locais, sem tokens: `.cache/erp-access/staged-smoke.json`, `promotion.json` e `production-smoke.json`. Nenhuma migração de banco foi aplicada nesta correção.

## Recorrência: limite de conexões do Supabase

Após uma nova publicação pelo Git, o menu voltou a falhar. A correção de parâmetros já estava nessa versão; a conexão ao Supabase retornou `(EMAXCONNSESSION) max clients reached in session mode`, com limite de 15 conexões no pooler em modo de sessão. A falha também foi reproduzida em uma conexão direta de diagnóstico, antes de executar consultas do ERP.

### Ajustes aplicados

- `SUPABASE_DB_URL` passou da porta 5432 (sessão) para 6543 (transação), no ambiente local e na configuração do projeto Vercel. Projeto, usuário, senha e ambientes associados foram preservados. As próximas publicações pelo Git também recebem essa configuração.
- O pool da aplicação passou de 5 para 2 conexões por instância remota, com limite de 15 segundos para obter conexão e liberação de conexões ociosas após 5 segundos.
- A verificação TLS continua obrigatória com a autoridade certificadora do Supabase.
- Erros de excesso de conexões agora recebem código `DATABASE_BUSY`, HTTP 503 e orientação para tentar novamente, sem expor a mensagem interna do banco.
- Os scripts de diagnóstico aceitam as duas portas conhecidas desse projeto. O teste de acesso publicado ganhou a opção `--repeat`.

O contexto de empresa, a função restrita `erp_runtime` e os bloqueios usados pelo ERP permanecem dentro das transações, compatíveis com o novo modo de conexão.

### Verificação e nova publicação

- Tipagem do ERP e lint dos arquivos alterados aprovados.
- `scripts/erp/postgres-pool-smoke.ts`: configuração TLS, limites do pool e classificação dos erros aprovados.
- `scripts/erp-runtime-isolation-smoke.ts`: conexão real, TLS, RLS, isolamento entre empresas e consultas simultâneas aprovados.
- Antes da promoção: sessão real do Clerk, acesso HTTP 200 com 15 permissões, acesso anônimo HTTP 401 e duas rodadas de 18 GETs simultâneos, todas com HTTP 200.
- Após a promoção, em `https://cognito-seven.vercel.app`: os mesmos testes aprovados, novamente com 36 GETs simultâneos em duas rodadas. Cada rodada inclui 16 leituras do acesso ao menu e leituras dos dashboards de visão geral e financeiro.

A versão publicada é `dpl_XfH9VCtmHVRVC1qy5M6hxcXNNmWK`, com digest de origem `ad8bce65dcfdaeb5b7996721d9a7e86afe270b34f333aa49ecdf60d179cfd434`. As evidências locais indicadas acima agora correspondem a essa versão. Nenhuma sessão do Clerk foi criada ou revogada; os tokens de teste ficaram apenas em memória. Nenhum dado financeiro, comercial ou de estoque foi alterado e nenhuma migração foi aplicada.
