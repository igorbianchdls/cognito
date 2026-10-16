# Domínio WhatsApp

Implementação preparada em 16/10/2026. Três controles locais estão registrados; 18 adaptadores remotos aguardam uma conexão real e contratos compatíveis. A Meta recusou o registro dinâmico do cliente Cognito; nenhuma conta Meta foi autenticada. Detalhes e limites: [documentação da implementação](../../../../../docs/whatsapp/mcp.md).

## Organização

- `tools/`: catálogo e apresentação das ferramentas do Cognito.
- `actions/`: execução, prévias e confirmação das operações.
- `schemas/`: validação dos argumentos e resultados.

Autenticação, aprovação, auditoria e transporte comuns continuam no `mcpcore`. ERP, Tables e WhatsApp são domínios; ChatGPT e Claude são integrações que podem expor esses domínios.

## MCP oficial encontrado

- Nome: **WhatsApp Business Tools**.
- Endpoint: `https://mcp.facebook.com/whatsapp_business_tools`.
- Transporte: Streamable HTTP.
- Autenticação: OAuth da conta de desenvolvedor Meta, com seleção de empresas e aplicativos autorizados.
- Estado: beta, com disponibilidade gradual e ferramentas sujeitas a mudanças.
- Pré-requisitos: administração da empresa e do aplicativo habilitado para WhatsApp, além do aceite dos termos da Cloud API.
- Permissões documentadas: `business_management`, `whatsapp_business_management`, `whatsapp_business_messaging`.

A Meta apresenta esse MCP para configuração e testes. A operação de mensagens em escala de produção exige projeto próprio com a WhatsApp Cloud API. O catálogo consultado não documenta ferramentas de leitura do histórico de conversas pessoais.

## Ferramentas documentadas pela Meta

Os nomes abaixo têm adaptadores preparados no catálogo. A publicação depende de conexão ativa e contrato suportado descoberto por `tools/list` após autenticação.

| Área | Nomes oficiais |
| --- | --- |
| Descoberta | `whatsapp_biz_businesses`, `whatsapp_biz_accounts`, `whatsapp_biz_phone_numbers` |
| Telefones | `whatsapp_biz_add_phone_number`, `whatsapp_biz_send_verification_code`, `whatsapp_biz_verify_phone_number`, `whatsapp_biz_register_phone_number` |
| Modelos | `whatsapp_biz_list_templates`, `whatsapp_biz_get_template`, `whatsapp_biz_create_template`, `whatsapp_biz_update_template`, `whatsapp_biz_delete_template` |
| Mensagens | `whatsapp_biz_send_message` |
| Webhooks | `whatsapp_biz_configure_webhooks`, `whatsapp_biz_subscribe_webhook` |
| Conta | `whatsapp_biz_configure_payments`, `whatsapp_biz_verify_business`, `whatsapp_biz_system_user_token` |

São 18 nomes no documento consultado. `whatsapp_biz_system_user_token` fornece um link para gerar o token nas configurações da Meta; não retorna o segredo. O envio exige confirmação do destinatário; texto livre depende da janela de atendimento de 24 horas, e modelos precisam estar aprovados.

## Fluxo da integração

1. Vincular a autorização Meta ao usuário e à empresa do Cognito; manter credenciais no servidor e verificar os recursos autorizados a cada chamada.
2. Descobrir e validar os contratos reais do MCP autenticado antes de publicar adaptadores, sem repasse irrestrito de tools.
3. Expor as ferramentas do Cognito com prefixo `whatsapp_`, começando por consultas de empresas, contas, números e modelos.
4. Integrar prévia, confirmação e auditoria para alterações. Envios externos precisam registrar o identificador da Meta e tratar resultados incertos antes de repetir a chamada.
5. Ampliar o registro de domínios e o roteamento compartilhado. A migration `20261017010000_whatsapp_domain.sql` acrescenta `whatsapp` às restrições de domínio e resultado, preservando ERP e Tables.

O roteamento e as duas integrações incluem o domínio; a migration aditiva cria cinco tabelas e amplia as operações compartilhadas. Nenhuma conta Meta foi autenticada ou mensagem enviada. Os controles locais consultam o estado e permitem acompanhar/cancelar propostas.

## Fontes oficiais

Consultadas diretamente em 16/10/2026:

- [Documentação e ferramentas](https://developers.facebook.com/documentation/mcp/whatsapp-business-tools-mcp)
- [Anúncio da Meta, 15/09/2026](https://developers.facebook.com/blog/post/2026/09/15/meta-business-messaging-mcp-ai-agent/)
- [WhatsApp Business Platform](https://developers.facebook.com/documentation/business-messaging/whatsapp)

Verificação pública: documentação retornou HTTP 200; GET no endpoint MCP retornou HTTP 405 informando que o transporte usa POST JSON-RPC. Isso confirma a resposta do endpoint, mas não comprova acesso autenticado às ferramentas.