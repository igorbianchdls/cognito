# WhatsApp no MCP do Cognito

Implementação em 16/10/2026. O domínio é `src/products/mcpcore/domains/whatsapp`; ele compartilha identidade, aprovação, auditoria e transporte do núcleo, sem depender de cadastros ou permissões financeiras/fiscais do ERP.

## Disponibilidade real

O endpoint oficial respondeu ao initialize sem token com HTTP 401 e metadados OAuth válidos. A tentativa de registro público com nome e callback próprios do Cognito respondeu HTTP 400, `invalid_client_metadata`: `Dynamic registration is not available for this client.` Nenhuma conta Meta foi conectada. O usuário informou que ainda não tem empresa/aplicativo de teste.

Por isso, a implementação mantém a conexão desativada e publica somente `whatsapp_obter_conexao`, `whatsapp_obter_operacao` e `whatsapp_cancelar_operacao`. Os outros 18 adaptadores têm mapeamento, validação, prévia e execução preparados, mas só são registrados a partir dos contratos de uma conexão real ativa. A cobertura com contratos sintéticos não comprova compatibilidade com todos os contratos reais da Meta.

## Banco e isolamento

A migration `20261017010000_whatsapp_domain.sql` cria `whatsapp.conexoes`, `contas`, `numeros`, `sessoes_autorizacao` e `execucoes_remotas`, com RLS e papel `whatsapp_runtime`. Credenciais cifradas ficam vinculadas à empresa, ao usuário e à conexão. A chave fica fora do banco. A ampliação de `plugin.drafts` aceita WhatsApp e preserva os dados e as regras anteriores de ERP e Tables.

Autorizações são pessoais dentro da empresa. Nenhum administrador recebe automaticamente os tokens de outro usuário. O acesso organizacional atual é revalidado; viewer não executa alterações. Os escopos atuais do transporte Cognito continuam por compatibilidade e não representam autorização Meta.

## Execução

Prévias são locais e não chamam ferramentas remotas de alteração. A confirmação reserva a execução e verifica conexão, contrato e recursos antes da chamada, sem manter transação de banco durante a rede. Confirmações repetidas consultam o resultado salvo. A perda de resposta gera situação indeterminada, sem repetição automática.

Uma resposta remota não é comprovante de entrega nem de finalização de etapas humanas. O código preserva o retorno da Meta para interpretação. O cancelamento termina somente propostas que ainda não começaram. Operações externas não são desfeitas por rollback SQL.

O OAuth usa estado único, PKCE S256 e vínculo à sessão, empresa e usuário. A autorização expirará conforme a Meta; nesta entrega, expiração exige reconexão. Refresh tokens eventualmente fornecidos ficam cifrados, mas renovação automática ainda não está habilitada, pois o fluxo real não foi validado.

Códigos, PINs e tokens de verificação de primeiro nível são preenchidos em `/whatsapp/etapa/:operacao_id`; o chat recebe apenas o link. O conteúdo secreto é removido ao ser consumido ou pela limpeza de expiração. Contratos não suportados não devem ser ativados sem adaptação e teste.

O catálogo aceita um subconjunto explícito de JSON Schema. Referências externas e vocabulários não suportados são recusados. A autorização de argumentos reconhece identificadores de empresa, conta e número; contratos que exigirem identificadores de aplicativo ou outros vínculos ainda precisam da adaptação correspondente. As contas e os números usam apenas listas de resultado estruturadas compatíveis para alimentar o cache. Essas limitações deverão ser verificadas ao obter os contratos reais.

## Interface

- `/whatsapp`: conexão, pendências e seleção de empresas Meta.
- `/api/whatsapp/…`: rotas protegidas com Clerk e verificação de origem em alterações.
- Entrada em Configurações, além de links nos resultados das tools.
- Cards separados no ChatGPT e Claude, com prévia, confirmação, cancelamento e consulta de situação.

## Configuração quando a Meta aceitar o cliente

1. Obter um identificador de cliente autorizado para o Cognito, sem reutilizar identidades de clientes homologados.
2. Configurar `WHATSAPP_MCP_CLIENT_ID` e `WHATSAPP_BASE_URL` com a origem HTTPS canônica. O callback é `/api/whatsapp/conexao/callback`.
3. Configurar `WHATSAPP_CREDENTIAL_KEY_ID` e `WHATSAPP_CREDENTIAL_KEYS` (objeto JSON com identificador e chave AES de 32 bytes em base64). Manter as chaves antigas enquanto houver dados cifrados com elas; não colocá-las no código, em variáveis NEXT_PUBLIC ou em evidências.
4. Habilitar `WHATSAPP_MCP_ENABLED=true` somente depois de configurar o cliente aceito e preparar a validação com uma conta de teste.
5. Conectar pela tela, conferir `tools/list`, contratos, recursos, normalização de resultados e etapas humanas. Adaptar os contratos que não forem compatíveis antes de anunciar as 18 ferramentas como funcionais.
6. Validar escritas somente em recursos e destinatários de teste explicitamente autorizados.

O sinalizador não contorna a restrição da Meta nem cria uma aprovação de cliente.

## Verificações

```text
node node_modules/typescript/bin/tsc -p tsconfig.whatsapp.json --pretty false
node --import tsx scripts/whatsapp/smoke.ts
node --import tsx scripts/whatsapp/ui-smoke.mjs
node scripts/tables/mcp-validation.mjs
node scripts/whatsapp/database.mjs --check
```

Os testes WhatsApp usam Postgres embarcado, contratos sintéticos e gateway simulado para conferir RLS, cifra, prévias, chaves de operação, cancelamento, resultado desconhecido, OAuth e registro condicional das 21 tools nos dois hosts. O navegador verifica as telas e o protocolo dos cards com backend de teste. As imagens desse teste usam um fixture funcional sem os estilos completos da aplicação.

Provas ficam em `.cache/whatsapp`. A validação implantada usa Clerk e Supabase reais para consultar estado, com o acesso remoto à Meta desativado. Não foi aberta uma conversa real no ChatGPT/Claude nem enviado SMS ou mensagem WhatsApp.

O cron existente remove sessões temporárias vencidas e marca execuções interrompidas como indeterminadas. A retenção de operações segue os 90 dias já usados no `plugin`, com remoção em cascata do registro técnico remoto correspondente. Regressões mantêm ERP, Tables e seus cronogramas.

## Referências oficiais

- https://developers.facebook.com/documentation/mcp/whatsapp-business-tools-mcp
- https://developers.facebook.com/documentation/mcp
- https://developers.facebook.com/blog/post/2026/09/15/meta-business-messaging-mcp-ai-agent/
