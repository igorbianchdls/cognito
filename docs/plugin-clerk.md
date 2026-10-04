# Configuração Clerk — chatgptplugin

## Aplicado em 03/10/2026

- Chaves de desenvolvimento salvas no `.env.local`, ignorado pelo Git. A chave secreta foi validada pela API e as chaves públicas da instância coincidiram com as do emissor.
- Emissor: `https://full-earwig-84.clerk.accounts.dev`.
- Origem do ERP: `https://cognito-seven.vercel.app`.
- Recurso MCP: `https://cognito-seven.vercel.app/api/mcp`.
- Ativados `aud_claim_enabled=true` e `pkce_required=true` pela API Clerk. Tokens JWT já estavam habilitados. A configuração `aud_claim_enabled` permite derivar `aud` do parâmetro OAuth `resource`; a emissão efetiva ainda precisa ser testada.
- Criado o cliente confidencial `Cognito ERP (chatgptplugin)` (`oa_3KD93kSMakL8wwCvru2g7gEduQW`), com PKCE obrigatório e consentimento habilitado.
- Client ID `eVl4sVAExgJ7bqZU` incluído em `CHATGPTPLUGIN_OAUTH_CLIENT_IDS`. O segredo do cliente foi salvo somente no ambiente local.
- Gerada a chave local de 32 bytes para o estado dos formulários nativos.
- Cadastrado `https://chatgpt.com/connector_platform_oauth_redirect` no cliente, com base no callback estável documentado pela OpenAI e em `authorization_response_iss_parameter_supported=true` publicado pelo Clerk. O endereço exibido na conexão efetiva do ChatGPT deve ser conferido no teste final.
- Acesso à Vercel confirmado pelo token administrativo fornecido. O projeto `cognito` (`prj_mXGm0J5InfGNAR2lO4cHGLCrgoex`) foi identificado pelo domínio verificado `cognito-seven.vercel.app`; a página de login confirmou a mesma instância Clerk de desenvolvimento.
- Criadas em production e preview as quatro variáveis `CHATGPTPLUGIN_BASE_URL`, `CHATGPTPLUGIN_OAUTH_ISSUER`, `CHATGPTPLUGIN_OAUTH_CLIENT_IDS` e `CHATGPTPLUGIN_FORM_STATE_KEY` (sensível). As credenciais Clerk e configurações do banco já existentes no projeto foram preservadas.
- Concluída a republicação `dpl_9hYv1FAfwCmjfhTtNgNyoPKreNai` do mesmo commit já publicado, `8628e25c46f876299e19e915956c6df20e1588d3`, para aplicar o ambiente atualizado. A Vercel informou `READY` e atribuiu o domínio de produção.
- Cinco verificações públicas aprovadas: metadados do recurso (HTTP 200 e emissor/recurso/scopes corretos), GET sem token (401), POST sem token (401), POST com Bearer inválido (401), todos com o desafio de reconexão, e OPTIONS de CORS (204). O erro de configuração 503 foi resolvido. Recibo sem credenciais em `.cache/erp-audit/plugin-vercel.json`.

## Pendências

1. Configurar a conexão no ChatGPT com o endereço MCP, Client ID e Client Secret salvos localmente.
2. Confirmar no teste do ChatGPT o redirect URI exibido para a conexão. Se diferir do callback estável documentado já cadastrado, registrar o endereço exato fornecido pelo host.
3. Testar autorização, consentimento, renovação e um token real com `aud` igual ao recurso MCP, usando as permissões reais do usuário no ERP. As chaves de desenvolvimento não comprovam uma configuração Clerk de produção. As verificações públicas não acessaram registros comerciais nem validaram consultas com identidade real no servidor publicado.

## Acesso à Vercel

Inicialmente não havia credencial Vercel no ambiente, no arquivo local ou nas localizações usuais de autenticação da CLI. A tentativa de conectar o navegador falhou ao inicializar a ferramenta, sem acessar uma sessão. O token fornecido depois foi salvo no ambiente local e validado por chamadas autenticadas à Vercel.

Salvar `VERCEL_TOKEN` somente no `.env.local` para a configuração administrativa. Ele não faz parte das credenciais do MCP e não deve ser copiado para o pacote ou para as variáveis públicas do site.

As variáveis do aplicativo a transferir para a Vercel são `CHATGPTPLUGIN_BASE_URL`, `CHATGPTPLUGIN_OAUTH_ISSUER`, `CHATGPTPLUGIN_OAUTH_CLIENT_IDS`, `CHATGPTPLUGIN_FORM_STATE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`, mantendo a configuração existente do banco e certificado. O Client Secret OAuth será usado na configuração do cliente ChatGPT; o verificador MCP usa a chave Clerk do servidor.

## Referências

- [Especificação oficial da API Clerk](https://github.com/clerk/openapi-specs/blob/main/bapi/2026-05-12.yml): configurações OAuth, `aud_claim_enabled` e criação de clientes.
- [Scopes personalizados Clerk](https://clerk.com/changelog/2026-08-21-custom-oauth-scopes).
- [Tokens de acesso Vercel](https://vercel.com/kb/guide/how-do-i-use-a-vercel-api-access-token).
- [Variáveis de ambiente Vercel](https://vercel.com/docs/environment-variables): alterações passam a valer em novas publicações.
