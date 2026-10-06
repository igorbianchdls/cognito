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
