# ChatGPT Plugin — base MCP do Cognito ERP

Primeira versão: consultas autenticadas ao ERP pelo MCP. Produto novo em `src/products/chatgptplugin`, usando os repositórios e as permissões existentes do ERP.

## Estrutura

- `mcp`: servidor do SDK oficial e transporte Streamable HTTP sem estado, com respostas JSON.
- `auth`: validação OAuth do Clerk, resolução de usuário e empresas, metadados públicos de descoberta.
- `tools`: sete ferramentas, contratos de entrada, filtros e paginação.
- `application`: adaptadores das consultas do ERP, seleção da empresa e autorização de cada operação.
- `audit`: registros de execução e controle de frequência persistente.
- `shared`: contratos, configuração e conexão operacional com PostgreSQL.

Endpoint: `/api/mcp`. Metadados: `/.well-known/oauth-protected-resource/api/mcp` e `/.well-known/oauth-protected-resource`.

## Ferramentas

| Nome | Função | Permissão ERP |
| --- | --- | --- |
| `meu_acesso` | Identificador do usuário, empresas, perfis e permissões | Vínculo ativo |
| `resumo_erp` | Indicadores gerais | Relatórios, financeiro, vendas, compras e cadastros |
| `buscar_cadastros` | Clientes, fornecedores, produtos e serviços | Cadastros: visualizar |
| `listar_vendas` | Pedidos por busca/status, com paginação | Vendas: visualizar |
| `obter_venda` | Dados comerciais e itens da venda | Vendas: visualizar |
| `consultar_financeiro` | Parcelas a pagar/receber por busca, status e vencimento | Financeiro: visualizar |
| `consultar_estoque` | Posição por produto e local | Estoque: visualizar |

`empresa_id` deve corresponder a um vínculo ativo do usuário. Se o usuário possui uma única empresa, o parâmetro é opcional; se possui várias, as consultas exigem a escolha explícita. O MCP não cria usuários, empresas ou vínculos ao receber tokens. Os vínculos devem existir no ERP, provisionados pelo fluxo de autenticação atual.

Os dados são retornados em `structuredContent` e texto JSON. Resultados externos são dados, não instruções. As ferramentas têm `readOnlyHint: true`, `destructiveHint: false` e `openWorldHint: false`. As consultas não executam pagamentos ou alterações comerciais.

## Autenticação

O Clerk instalado possui a API `idPOAuthAccessToken.verify`, usada para verificar cada token no backend da instância. Isso verifica o token OAuth, incluindo validade/revogação, sem aceitar cookies ou tokens de sessão como substitutos. A implementação exige o escopo personalizado `erp:read`, um usuário Clerk e um cliente OAuth explicitamente autorizado.

A origem do emissor deve corresponder ao domínio da chave pública Clerk. Os metadados apontam diretamente ao servidor de autorização do Clerk, que conduz consentimento, autorização com PKCE, troca de códigos, renovação e revogação. Não foi criado um servidor próprio para emitir tokens.

Configurar no Clerk:

1. Habilitar OAuth Applications na instância utilizada pelo ERP.
2. Criar o escopo `erp:read`, anunciá-lo nos metadados e atribuí-lo ao cliente autorizado.
3. Criar um cliente OAuth dedicado ao MCP/ChatGPT, com PKCE S256 e os endereços de retorno exigidos pelo cliente que será conectado. Copiar esses endereços da configuração atual do ChatGPT ou Inspector, sem inventá-los.
4. Usar o ID desse cliente em `CHATGPTPLUGIN_OAUTH_CLIENT_IDS`. Para testes com outros clientes, adicioná-los explicitamente à lista.
5. Usar a URL Frontend API da instância em `CHATGPTPLUGIN_OAUTH_ISSUER`.

`401`/`403` de token ou escopo incluem `WWW-Authenticate` com a URL dos metadados. Configuração ausente, indisponibilidade do Clerk, banco ou auditoria impedem a execução.

## Configuração

Preencher `.env.local` com os valores documentados em `.env.example`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `SUPABASE_DB_URL` e certificado CA da conexão, conforme o ERP atual
- `CHATGPTPLUGIN_BASE_URL`: origem pública HTTPS, sem caminho
- `CHATGPTPLUGIN_OAUTH_ISSUER`: origem HTTPS da instância Clerk
- `CHATGPTPLUGIN_OAUTH_CLIENT_IDS`: lista de IDs OAuth autorizados, separados por vírgula
- `CHATGPTPLUGIN_ALLOWED_ORIGINS`: origens extras para clientes MCP no navegador; a origem do próprio serviço e `https://chatgpt.com` já são permitidas

Em desenvolvimento, a origem base pode ser `http://localhost:3000`; produção exige HTTPS. Segredos e tokens não devem ir para o repositório, URLs, logs ou respostas.

## Banco e operação

A nova migração `supabase/migrations/20261003130000_create_chatgptplugin.sql` cria apenas:

- `shared.chatgptplugin_executions`: usuário, empresa, cliente OAuth, ferramenta, status, código de erro e duração. Não armazena argumentos ou resultados.
- `shared.chatgptplugin_rate_windows`: contagem atômica por usuário/minuto, compartilhada entre processos.

As tabelas têm RLS e acesso revogado para `anon`/`authenticated`; o backend usa a conexão administrativa já adotada pelo ERP. A migração não foi aplicada ao banco remoto nesta implementação. Revisar migrações pendentes antes de executar qualquer atualização do banco: a migração anterior de retirada das tabelas antigas pode bloquear caso encontre registros.

Limites atuais: 60 requisições por usuário/minuto; corpo de 64 KB; resposta estruturada de 128 KB; páginas de 10 a 50 registros; até 100 itens no detalhe de venda, com indicação de truncamento; consulta ERP com `statement_timeout` de 10 segundos e ferramenta com prazo de 15 segundos. As consultas ERP executam no papel `erp_runtime`, com empresa/usuário por contexto assíncrono e transação somente de leitura. O pool de identidade/auditoria possui limites próprios de conexão e consulta.

Executar diariamente `pnpm chatgptplugin:maintenance` na infraestrutura de operação. Ele remove janelas de frequência anteriores a dois dias e registros de execução anteriores a 90 dias, além de marcar execuções interrompidas. Não há agendamento remoto configurado nesta etapa.

## Testes e implantação

```text
pnpm chatgptplugin:typecheck
pnpm chatgptplugin:smoke
pnpm chatgptplugin:database-smoke
pnpm security:smoke
pnpm build
pnpm chatgptplugin:check-config
```

Os dois testes do plugin são locais, sem conexão remota. O teste de protocolo usa o SDK real e dados controlados; o teste PostgreSQL restaura o catálogo do ERP, aplica suas evoluções e a migração nova e executa os repositórios reais. O último comando consulta metadados OAuth e verifica a presença das tabelas, sem imprimir credenciais ou alterar o banco.

Após configurar Clerk, banco e domínio:

1. Aplicar a migração nova em um ambiente de teste e verificar `chatgptplugin:check-config`.
2. Implantar o projeto em um domínio HTTPS e configurar a mesma origem no MCP.
3. Usar o MCP Inspector com Streamable HTTP e autenticação OAuth em `<origem>/api/mcp`.
4. Validar consentimento, acesso negado, token revogado, escolha de empresa e cada ferramenta.
5. Conectar ao ChatGPT no modo de desenvolvimento e testar perguntas com usuários de diferentes perfis e empresas.

## Estado e próxima etapa

Validação local concluída em 03/10/2026:

- 19 grupos de testes de protocolo, autenticação, permissões, parâmetros, limites e contexto assíncrono aprovados.
- 7 grupos de testes com PostgreSQL local aprovados, incluindo as sete ferramentas sobre repositórios reais, revogação de vínculo, isolamento por empresa, persistência de auditoria, limite atômico e bloqueio das tabelas operacionais ao navegador.
- Checagem de tipos do produto e do ERP, teste de segurança do ERP e build completo aprovados.
- A consulta de contas a pagar do ERP tinha uma referência a `entidade_id` sem selecionar esse campo na consulta interna. O campo foi acrescentado e a consulta passou no teste PostgreSQL do plugin.
- A verificação de configuração identificou cinco variáveis ausentes: origem do MCP, emissor, clientes OAuth autorizados e duas credenciais Clerk. Esse resultado é uma pendência, não aprovação de funcionamento remoto.
- No servidor de produção local, `/api/mcp` e os dois endpoints de descoberta responderam HTTP 503 com `CONFIGURATION_REQUIRED`, sem acesso a dados privados e sem depender da sessão de navegador. A página pública de login respondeu HTTP 200.

O código da base MCP está implementado. A conexão real ao ChatGPT e os testes remotos dependem das credenciais Clerk, cliente OAuth, configuração do banco, aplicação da migração e domínio HTTPS. O ambiente local consultado estava sem as credenciais Clerk e sem as variáveis novas do plugin. Não há comprovação de OAuth ou consulta ao banco remoto funcionando.

Ações de escrita, skills, interface MCP Apps, empacotamento/distribuição do plugin e Plugin Extensions serão implementados em etapas posteriores usando esta base.

Referências: [servidor MCP OpenAI](https://developers.openai.com/plugins/build/mcp-server), [OAuth para plugins](https://developers.openai.com/plugins/build/auth), [OAuth e MCP no Clerk](https://clerk.com/docs/guides/ai/mcp/build-mcp-server), [escopos personalizados Clerk](https://clerk.com/changelog/2026-08-21-custom-oauth-scopes).
