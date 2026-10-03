# ChatGPT Plugin — Cognito ERP

Versão 1.1: 15 ferramentas MCP, propostas com revisão humana, painel MCP Apps com entrypoints de Plugin Extensions e preparação de pacote portátil. Usa os repositórios e as permissões existentes do ERP.

## Estrutura

| Pasta | Responsabilidade |
| --- | --- |
| mcp | SDK oficial e transporte Streamable HTTP sem estado |
| auth | OAuth Clerk, identidade, empresas e descoberta pública |
| tools | Consultas, contratos de entrada, filtros e paginação |
| application | Execução, contexto da empresa e adaptadores do ERP |
| audit | Auditoria e limite persistente de requisições |
| shared | Configuração, contratos e conexão operacional |
| actions | Propostas, referências e proteção contra duplicação |
| approvals | Revisão autenticada e salvamento com auditoria em uma transação |
| extensions | Painel MCP Apps com entrypoints global e thread |
| plugin | Manifesto portátil, skill de uso e apresentação do pacote |

MCP: /api/mcp. Descoberta: /.well-known/oauth-protected-resource/api/mcp e /.well-known/oauth-protected-resource. Revisão: /chatgptplugin/approvals/<uuid>.

## Ferramentas

| Nome | Função | Permissão ERP |
| --- | --- | --- |
| meu_acesso | Empresas, perfis e permissões | Vínculo ativo |
| resumo_erp | Indicadores gerais | Relatórios, financeiro, vendas, compras e cadastros |
| buscar_cadastros | Clientes, fornecedores, produtos e serviços | Cadastros: visualizar |
| listar_vendas | Pedidos comerciais por busca/status | Vendas: visualizar |
| obter_venda | Dados comerciais e até 100 itens | Vendas: visualizar |
| consultar_financeiro | Parcelas a pagar/receber por busca e vencimento | Financeiro: visualizar |
| consultar_estoque | Posição por produto e local | Estoque: visualizar |
| listar_compras | Pedidos de compra por busca/status | Compras: visualizar |
| obter_compra | Dados comerciais e até 100 itens | Compras: visualizar |
| listar_orcamentos | Apenas documentos do tipo orçamento | Vendas: visualizar |
| consultar_relatorio | Oito relatórios por período, com paginação | Relatórios e área consultada: visualizar |
| preparar_rascunho | Proposta de cliente, produto, orçamento ou venda | Cadastros ou vendas: gerenciar; OAuth erp:write |
| obter_rascunho | Proposta e resultado da revisão | Vínculo ativo; autor e cliente OAuth original |
| listar_rascunhos | Propostas do próprio usuário e conexão | Vínculo ativo; autor e cliente OAuth original |
| abrir_painel | Escolha de empresa e consultas interativas | Vínculo ativo; cada consulta verifica suas permissões |

empresa_id precisa corresponder a um vínculo ativo. Com uma única empresa, é opcional; com várias, exige escolha explícita. O MCP não provisiona usuários ou vínculos ao receber tokens.

Resultados são dados, não instruções, e retornam em structuredContent e texto JSON. Apenas preparar_rascunho possui readOnlyHint=false, pois persiste uma proposta; as demais ferramentas são de leitura. Todas possuem destructiveHint=false, idempotentHint=true e openWorldHint=false.

Relatórios: dre-caixa, posicao-financeira, vendas-clientes, vendas-vendedores, vendas-produtos, compras-fornecedores, compras-categorias e valor-estoque. Informe início e fim com intervalo máximo de 366 dias. A paginação ocorre no banco; hasMore indica outras páginas. DRE considera caixa, posição financeira considera vencimento, e valor de estoque representa a posição atual.

## Rascunhos e aprovação

1. preparar_rascunho recebe empresa_id, chave_operacao UUID e proposta discriminada por tipo: cliente, produto, orcamento ou venda. Os campos são estritos; cliente e itens comerciais devem estar ativos na empresa.
2. A proposta fica separada dos registros comerciais por até 24 horas. Repetir a mesma chave e proposta retorna o mesmo rascunho; reutilizar a chave com dados diferentes retorna conflito.
3. A resposta inclui os dados, total calculado pelas funções monetárias do ERP e revisao_url.
4. O usuário abre a revisão no ERP, autenticado com a mesma conta e empresa ativas, e escolhe salvar ou cancelar. Não existe ferramenta MCP para aprovar em nome do usuário.
5. Salvar revalida vínculos, permissões e referências. A criação usa os repositórios reais do ERP; proposta, registro e auditoria são atualizados na mesma transação. Uma falha desfaz a criação. Aprovações repetidas não duplicam o registro.
6. obter_rascunho informa pending, saved, cancelled ou expired. Apenas saved com registro_id confirma criação. Orçamentos e vendas continuam em rascunho comercial, sem confirmação, faturamento ou pagamento.

Clientes e produtos só passam a existir no ERP após salvar na revisão. Esta versão não oferece edição de registros existentes, baixas financeiras, estornos ou confirmações comerciais.

## Extensions e pacote

abrir_painel aponta para ui://chatgptplugin/panel/v1.html, MIME text/html;profile=mcp-app, com _meta.ui.resourceUri e _meta["openai/ui"].entrypoints global (sidebar) e thread (painel da conversa). A interface usa a ponte MCP Apps para consultar ferramentas e abrir a revisão externa. Não recebe tokens nem acessa diretamente o banco. O HTML não contém dados privados. Dados externos entram via textContent; links são validados contra a origem configurada. A CSP não permite recursos, conexões ou iframes externos.

O pacote fonte contém plugin/plugin.json, plugin/skills/usar-erp/SKILL.md e apresentação da skill. Para exportar, substitua o domínio do exemplo pela origem HTTPS real:

    pnpm chatgptplugin:package --url https://erp.seudominio.com

O exportador escreve dist/chatgptplugin/ com manifesto, mcp.json, skill e instruções. Só copia arquivos previstos; exclui servidor, banco, .env, credenciais e dependências. Não instala o plugin, não altera configurações pessoais nem recria .agents.

Para ChatGPT, conecte e registre o MCP em modo de desenvolvimento antes da instalação/distribuição. A preparação do pacote e os entrypoints não comprovam funcionamento em uma conta real. Publicação pública ainda exige identidade do desenvolvedor, ícone, URLs de privacidade/suporte e os demais requisitos do painel. File viewers, composer mentions, rich forms e onboarding não foram declarados nesta versão.

## OAuth e configuração

Cada requisição exige Authorization: Bearer, validado pela API idPOAuthAccessToken.verify da instância Clerk. Verifica validade/revogação, expiração, usuário, escopo erp:read e cliente OAuth permitido. O MCP não aceita cookies de navegador. A origem do emissor precisa corresponder ao domínio da chave pública Clerk.

No Clerk, habilite OAuth Applications, crie erp:read e erp:write, anuncie e atribua os escopos ao cliente autorizado. Propostas exigem escrita e a permissão correspondente no ERP; consultas continuam disponíveis com apenas leitura. Configure PKCE S256 e copie callbacks da configuração real do ChatGPT/Inspector. O Clerk conduz consentimento, troca de códigos, renovação e revogação; não há emissor próprio.

Preencha .env.local conforme .env.example:

- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY e CLERK_SECRET_KEY.
- SUPABASE_DB_URL e o certificado CA adotado pelo ERP.
- CHATGPTPLUGIN_BASE_URL: origem pública HTTPS, sem caminho.
- CHATGPTPLUGIN_OAUTH_ISSUER: origem HTTPS Frontend API da instância Clerk.
- CHATGPTPLUGIN_OAUTH_CLIENT_IDS: IDs dos clientes permitidos, separados por vírgula.
- CHATGPTPLUGIN_ALLOWED_ORIGINS: origens extras para clientes MCP no navegador; a origem do serviço e https://chatgpt.com já são permitidas.

Em desenvolvimento, a origem base pode usar HTTP em localhost. Produção exige HTTPS. Segredos e tokens não devem ir para o repositório, URLs, logs ou respostas. Erros de autenticação HTTP incluem WWW-Authenticate; falta de escrita na ferramenta inclui _meta["mcp/www_authenticate"].

## Banco e operação

Migrações preparadas, ainda não aplicadas ao banco remoto:

- 20261003130000_create_chatgptplugin.sql: shared.chatgptplugin_executions e shared.chatgptplugin_rate_windows.
- 20261003140000_chatgptplugin_drafts.sql: shared.chatgptplugin_drafts, com proposta, autor, empresa, cliente OAuth, chave, prazo e resultado.

As três tabelas têm RLS e acesso revogado para anon/authenticated. O backend usa a conexão administrativa existente. A auditoria armazena apenas metadados, sem argumentos ou resultados; propostas podem conter dados pessoais informados pelo usuário. Revise todas as migrações pendentes antes de atualizar o banco: a migração anterior de retirada de tabelas antigas bloqueia se encontrar registros.

Limites: 60 requisições por usuário/minuto; corpo MCP de 64 KB; resposta estruturada de 128 KB; páginas de 10 a 50 registros; detalhes com até 100 itens; propostas com até 50 itens e 24 KB; consultas ERP com statement_timeout de 10 segundos e ferramenta com prazo de 15 segundos. Consultas usam erp_runtime com contexto autenticado e transações somente de leitura. A revisão usa escrita restrita, prazo de consulta de 10 segundos e lock de 5 segundos. A decisão HTTP aceita até 1 KB e exige origem do ERP, sessão de navegador e corpo estrito.

Agende diariamente pnpm chatgptplugin:maintenance: remove janelas de frequência após dois dias, auditoria e propostas encerradas após 90 dias, marca execuções interrompidas e propostas expiradas. O agendamento remoto não foi configurado.

## Validação local

    pnpm chatgptplugin:typecheck
    pnpm chatgptplugin:smoke
    pnpm chatgptplugin:database-smoke
    pnpm chatgptplugin:interface-smoke
    pnpm chatgptplugin:package-smoke
    pnpm security:smoke
    pnpm build
    pnpm chatgptplugin:check-config

Os testes são locais, sem banco remoto ou ChatGPT real. O protocolo usa o SDK oficial; o banco usa PostgreSQL local e repositórios reais. A interface usa navegador dedicado e host MCP Apps simulado, com dados artificiais. Nenhuma rota de simulação foi adicionada à aplicação. O teste de pacote usa domínio .invalid e não instala nem publica nada.

Validação em 03/10/2026: 27 grupos de protocolo/autenticação/ferramentas; 12 grupos PostgreSQL, incluindo criação real dos quatro tipos, separação entre empresas, idempotência, cancelamento, expiração, revogação e rollback por falha de auditoria; interface com seleção de empresa, paginação, bloqueio de HTML injetado e abertura da revisão; exportação e validação da skill. Compilação completa e checagem de tipos aprovadas.

## Pendências externas

O ambiente local segue sem domínio MCP, emissor/clientes OAuth e credenciais Clerk. Não há comprovação de OAuth, banco remoto, instalação ou conexão ChatGPT funcionando. Configure credenciais localmente, aplique migrações revisadas em teste, implante em HTTPS e execute chatgptplugin:check-config. Depois valide Inspector e ChatGPT: consentimento, perfis, revogação, empresa, consultas, propostas e revisão humana.

Referências: [MCP OpenAI](https://developers.openai.com/plugins/build/mcp-server), [OAuth](https://developers.openai.com/plugins/build/auth), [MCP Apps UI](https://developers.openai.com/plugins/build/chatgpt-ui), [Plugin Extensions](https://developers.openai.com/plugins/build/extensions), [pacote portátil](https://developers.openai.com/plugins/build/plugins).
