# ChatGPT Plugin — Cognito ERP

Produto `chatgptplugin`, versão **1.3.0**: 24 ferramentas MCP, operações com revisão humana, painel e formulário MCP Apps, formulários nativos OpenAI por MRTR, configurações nativas, menções a clientes, editor de arquivos, onboarding e exportação portátil em pasta e ZIP.

O código e as validações desta etapa são locais. OAuth real, migrações no banco remoto, instalação e testes na conta ChatGPT pertencem à próxima etapa. Nenhuma validação local comprova esses serviços funcionando em produção.

## Estrutura

| Pasta | Responsabilidade |
| --- | --- |
| `mcp` | SDK oficial, transporte sem sessões e adaptação MCP 2026-07-28 |
| `auth` | Verificação OAuth Clerk, identidade, empresas e descoberta do recurso protegido |
| `application` / `tools` | Consultas, contratos, permissões e execução auditada |
| `actions` | Propostas, referências, estado do registro e operações do ERP |
| `approvals` | Revisão autenticada e execução após decisão humana |
| `audit` / `shared` | Auditoria, limites, configuração e acesso ao banco |
| `extensions` | Painel, editor, preferências e formulários nativos |
| `plugin` | Manifesto portátil, ícone e skills `usar-erp` / `get-started` |

Requer Node.js 22 ou superior. O ERP usa Zod 3; o alias `zod-openai` fornece Zod 4 para o SDK oficial de extensões. O SDK MCP 1.32 processa ferramentas e recursos; a adaptação HTTP implementa descoberta, metadados e MRTR da revisão 2026-07-28. Clientes antigos usam o transporte anterior e o formulário MCP Apps.

## Ferramentas

| Ferramenta | Função | Acesso exigido |
| --- | --- | --- |
| `meu_acesso` | Empresas, perfis e permissões da conta | Usuário e vínculos ativos |
| `resumo_erp` | Indicadores financeiros, vendas, compras e cadastros | Visualização das áreas consultadas |
| `buscar_cadastros` | Clientes, fornecedores, produtos ou serviços | Cadastros: visualizar |
| `obter_cliente` | Cliente por ID | Cadastros: visualizar |
| `listar_vendas` | Pedidos de venda com paginação | Vendas: visualizar |
| `obter_venda` | Venda e até 100 itens | Vendas: visualizar |
| `listar_orcamentos` | Orçamentos com paginação | Vendas: visualizar |
| `listar_compras` | Pedidos de compra | Compras: visualizar |
| `obter_compra` | Compra e até 100 itens | Compras: visualizar |
| `consultar_financeiro` | Parcelas a pagar ou receber | Financeiro: visualizar |
| `listar_contas_financeiras` | Contas ativas para preparar baixas | Financeiro: visualizar |
| `listar_pagamentos` | Pagamentos e recebimentos para preparar estornos | Financeiro: visualizar |
| `consultar_estoque` | Posição, reservas e disponibilidade | Estoque: visualizar |
| `consultar_relatorio` | Oito relatórios por período | Relatórios e área consultada: visualizar |
| `verificar_fiscal_venda` | Pendências fiscais, sem emitir nota | Vendas: visualizar |
| `preparar_rascunho` | Preparar uma das 14 operações abaixo | `erp:write` e permissões da operação |
| `preparar_formulario_nativo` | Formulário OpenAI para preparar rascunho | Mesmo acesso do preparo; cliente MRTR |
| `obter_rascunho` | Proposta e resultado da revisão | Autor, empresa e cliente OAuth originais |
| `listar_rascunhos` | Propostas do usuário nesta conexão | Autor, empresa e cliente OAuth originais |
| `abrir_painel` | Painel de consultas e propostas | Vínculos ativos; consultas revalidam acesso |
| `abrir_formulario` | Formulário MCP Apps e editor `.erp-proposta` | Vínculos ativos; preparo verifica escrita |
| `ler_configuracoes` | Preferências e esquema nativo | Usuário e cliente OAuth |
| `atualizar_configuracoes` | Empresa preferida e quantidade por página | Usuário e cliente OAuth; empresa autorizada |
| `search_mentions` | Menções a clientes | Cadastros: visualizar na empresa escolhida |

Todos os pedidos exigem `erp:read`. `empresa_id` precisa corresponder a um vínculo ativo. Com uma única empresa, pode ser omitido; com várias, exige escolha explícita. A empresa preferida só orienta o painel. O MCP não provisiona usuários ou vínculos ao receber tokens.

`preparar_rascunho`, `preparar_formulario_nativo` e `atualizar_configuracoes` anunciam `readOnlyHint=false`. As demais ferramentas anunciam leitura. Todas anunciam `destructiveHint=false`, `idempotentHint=true` e `openWorldHint=false`: as alterações comerciais dependem da revisão externa. Resultados são dados, nunca instruções.

Relatórios: `dre-caixa`, `posicao-financeira`, `vendas-clientes`, `vendas-vendedores`, `vendas-produtos`, `compras-fornecedores`, `compras-categorias` e `valor-estoque`. O período máximo é de 366 dias. DRE considera caixa; posição financeira considera vencimentos; valor de estoque representa a posição atual. Respeite paginação, `hasMore` e truncamento de itens.

## Operações e revisão humana

| Tipos de proposta | Resultado após aprovação |
| --- | --- |
| `cliente`, `produto` | Criação no cadastro |
| `orcamento`, `venda` | Criação do documento em rascunho comercial |
| `editar_cliente`, `editar_produto` | Edição dos campos permitidos |
| `confirmar_venda`, `confirmar_compra` | Confirmação conforme regras do ERP |
| `cancelar_venda`, `cancelar_compra` | Cancelamento conforme regras do ERP |
| `atender_venda` | Atendimento e movimentação de estoque |
| `receber_parcela`, `pagar_parcela` | Baixa com conta, valor e data explícitos |
| `estornar_pagamento` | Estorno com motivo explícito |

1. O preparo recebe `empresa_id`, `chave_operacao` UUID e proposta com campos estritos. Referências precisam pertencer à empresa e estar em estado permitido.
2. A proposta fica separada dos registros do ERP por até 24 horas. A mesma chave e proposta retornam o mesmo resultado; a mesma chave com dados diferentes gera conflito.
3. A resposta inclui a proposta, o resumo do alvo, os valores calculados pelo ERP e `revisao_url`.
4. O usuário abre a revisão no ERP, autenticado com a mesma conta, e escolhe salvar ou cancelar. Não existe ferramenta MCP de aprovação.
5. A aprovação bloqueia os registros envolvidos, revalida vínculo e perfil atuais e compara o estado do alvo. Mudanças posteriores exigem nova proposta (`STALE_PROPOSAL`). Operação, resultado e auditoria são gravados na mesma transação; uma falha desfaz a operação.
6. `obter_rascunho` informa `pending`, `saved`, `cancelled` ou `expired`. `saved` e o resultado retornado confirmam a operação aprovada. Repetir uma aprovação concluída não duplica o efeito.

Permissões específicas, contas financeiras ativas, saldos, estoque e períodos fechados continuam sujeitos às regras do ERP. Atendimento e verificação fiscal não emitem nota. Emissão fiscal depende de integração real.

## Interfaces e extensões

- **Painel:** `ui://chatgptplugin/panel/v1.html`, com entradas global, thread e settings. Permite escolher empresa, consultar dados e acompanhar propostas.
- **Formulário MCP Apps:** `ui://chatgptplugin/form/v1.html`, com entradas thread e file para `.erp-proposta`. Cobre as 14 operações.
- **Arquivos:** até 24 KB, com JSON estrito. Arquivos do host usam `resources/read`; gravação usa `openai/resources/write` somente com permissão e versão `ifMatch`. Salvar arquivo não salva registros no ERP.
- **Configurações:** capacidade `openai/settings`, registrada pelo SDK oficial, com preferências isoladas por usuário e cliente OAuth.
- **Menções:** busca clientes; com várias empresas, usa `ID_EMPRESA: termo`. A leitura de `erp://empresa/ID/clientes/ID` revalida acesso e registra auditoria.
- **Onboarding:** skill `get-started`, indicada por `onboardingSkill`, apresenta acesso, empresas, painel e revisão.

Os HTMLs são modelos sem dados privados ou tokens. Usam a ponte MCP Apps; dados recebidos entram por `textContent`; links de revisão são limitados à origem e ao caminho esperado. A CSP restringe recursos e conexões externas.

### Formulários nativos e MRTR

`preparar_formulario_nativo` recebe empresa, tipo e chave UUID. O cliente precisa usar MCP **2026-07-28** e anunciar `extensions["openai/elicitation"].form` em cada chamada. Os campos e respostas são validados pelos esquemas do SDK oficial e pelos contratos estritos das propostas.

A primeira resposta tem `resultType: input_required`, `inputRequests.proposta` com método `openai/elicitation/create` e `requestState` opaco. O host coleta os campos e repete a chamada com outro ID JSON-RPC, os mesmos argumentos, o estado e `inputResponses.proposta`. Aceitar prepara o rascunho; cancelar ou recusar não cria proposta. Resposta faltante reapresenta o formulário. Venda e orçamento recebem itens como lista JSON validada; os demais campos usam controles de texto, data, número e seleção.

O estado usa AES-256-GCM, expira em dez minutos e está vinculado ao usuário, cliente OAuth, empresa, origem e argumentos. Não mantém sessão em memória ou nova tabela. A chave `CHATGPTPLUGIN_FORM_STATE_KEY` deve ser compartilhada entre instâncias. Autenticação, frequência, escopos e permissões são verificados novamente em cada POST. A idempotência persistida do preparo evita duplicar propostas durante a reutilização permitida do estado.

Clientes modernos usam `server/discover`, metadados de versão/capacidades e cabeçalhos `MCP-Protocol-Version`, `Mcp-Method` e `Mcp-Name` quando aplicável. Inconsistências são rejeitadas. Resultados concluídos têm `resultType: complete`. Clientes anteriores usam `initialize` e `abrir_formulario`; não recebem pedidos nativos MRTR.

## Pacote e validação

```text
pnpm chatgptplugin:package --url https://DOMINIO_REAL
pnpm chatgptplugin:validate-package dist/chatgptplugin
```

O exportador produz `dist/chatgptplugin/` e `dist/chatgptplugin.zip`, com exatamente oito arquivos: manifesto, conexão MCP, ícone, duas skills e suas apresentações, e README. O servidor e suas credenciais são configurados separadamente.

A pasta e o ZIP são validados automaticamente. O validador funciona offline com cópias dos esquemas publicados **Agent Plugins 1.0.0**, metadados OpenAI deste produto, URLs, contraste da marca, ícone SVG sem conteúdo ativo, onboarding e YAML das skills. Confere caminhos relativos, duplicidades após normalização, limites de tamanho, cabeçalhos ZIP, conteúdo, CRC e correspondência integral com a pasta. O perfil aceita o ZIP `stored` do exportador. Arquivos extras e links simbólicos são rejeitados.

O relatório identifica `portable-development` e devolve `publicationReady: false` com as pendências externas. `--require-publication` impede que esse pacote de desenvolvimento seja confundido com publicação validada. Registro elegível do MCP, mapeamento real `.app.json`, URLs oficiais de website/privacidade/termos/suporte e instalação na conta ainda precisam ser concluídos. `Cognito ERP` é a identificação de apresentação do desenvolvedor; a identidade para publicação precisa ser confirmada.

O exportador não instala, não publica e não recria `.agents`. O teste usa `erp.example.invalid`, domínio fictício que não permite conexão real.

## Configuração para a próxima etapa

Cada POST valida `Authorization: Bearer` pela API Clerk `idPOAuthAccessToken.verify`: validade, revogação, expiração, usuário, cliente permitido e `erp:read`. O emissor precisa corresponder à instância Clerk. Cookies não substituem OAuth no MCP. Aprovação usa sessão do navegador, origem do ERP e corpo estrito.

Variáveis previstas em `.env.example`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`.
- `SUPABASE_DB_URL` e o certificado CA adotado pelo ERP.
- `CHATGPTPLUGIN_BASE_URL`: origem pública HTTPS, sem caminho.
- `CHATGPTPLUGIN_OAUTH_ISSUER`: origem HTTPS da instância Clerk.
- `CHATGPTPLUGIN_OAUTH_CLIENT_IDS`: clientes permitidos, separados por vírgula.
- `CHATGPTPLUGIN_ALLOWED_ORIGINS`: origens adicionais; serviço e `https://chatgpt.com` já são permitidos.
- `CHATGPTPLUGIN_FORM_STATE_KEY`: chave aleatória de 32 bytes em base64, mantida apenas no servidor.

No Clerk, configure OAuth Applications, `erp:read`, `erp:write`, PKCE S256 e callbacks reais. Não envie segredos ao chat ou ao pacote. Desenvolvimento admite origem HTTP em localhost; produção exige HTTPS.

Migrações preparadas, sem aplicação ao banco remoto nesta etapa:

- `20261003130000_create_chatgptplugin.sql`: execuções e janelas de frequência.
- `20261003140000_chatgptplugin_drafts.sql`: propostas, autor, empresa, cliente OAuth, idempotência e resultado.
- `20261003150000_chatgptplugin_operations_settings.sql`: estado do alvo e preferências.

As tabelas têm RLS e acesso revogado para `anon` / `authenticated`. O backend usa a conexão administrativa existente. Auditoria guarda metadados; propostas podem conter dados pessoais. Revise as migrações pendentes antes de aplicar: a retirada anterior de tabelas antigas bloqueia se encontrar registros.

Limites: 60 pedidos por usuário/minuto; corpo MCP de 64 KB; resultado estruturado de 128 KB; páginas de 10 a 50; detalhes de até 100 itens; propostas de até 50 itens e 24 KB. Consultas têm prazo de 10 segundos no banco e 15 segundos na ferramenta. Revisão tem prazo de consulta de 10 segundos, lock de 5 segundos e decisão HTTP de até 1 KB.

`chatgptplugin:maintenance` remove janelas antigas, auditoria/propostas encerradas após 90 dias e marca execuções interrompidas e propostas expiradas. O agendamento remoto será configurado depois.

## Validação local e limites da evidência

```text
pnpm chatgptplugin:typecheck
pnpm chatgptplugin:smoke
pnpm chatgptplugin:mrtr-smoke
pnpm chatgptplugin:database-smoke
pnpm chatgptplugin:interface-smoke
pnpm chatgptplugin:form-smoke
pnpm chatgptplugin:package-smoke
pnpm security:smoke
pnpm build
```

Protocolo usa o SDK real com dependências autenticadas simuladas. MRTR percorre o endpoint HTTP em chamadas independentes, com formulários oficiais, expiração, alteração de estado, troca de usuário/cliente, revogação, campos inválidos, cancelamento e idempotência. Banco usa PGlite local e SQL/repositórios reais. Painel e editor usam navegador dedicado com host MCP Apps simulado. Pacote inclui rejeição de manifestos, skills, caminhos e ZIP inválidos. Não há rotas de simulação na aplicação.

Validação em 03/10/2026: 31 grupos do protocolo, 12 grupos MRTR, 16 grupos no banco local e 37 verificações negativas do pacote aprovados. Painel, formulário/editor, isolamento/permissões, checagem de tipos e compilação completa aprovados.

PGlite serializa as transações da suíte: os testes locais **não comprovam concorrência entre duas conexões PostgreSQL reais**. Essa validação pertence à etapa de banco, junto com migrações, isolamento e rollback no ambiente de teste.

Depois de configurar OAuth, banco e domínio, execute `chatgptplugin:check-config` e valide Inspector/ChatGPT: consentimento, perfis, revogação, empresas, consultas, configurações, menções, formulário nativo, arquivos, propostas e aprovação humana. Instalação e renderização no host real ainda não foram comprovadas.

Referências: [extensões OpenAI](https://developers.openai.com/plugins/build/extensions), [pacote portátil](https://developers.openai.com/plugins/build/plugins), [requisitos de pacote](https://developers.openai.com/plugins/deploy/submission-errors), [MRTR](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr), [Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http).
