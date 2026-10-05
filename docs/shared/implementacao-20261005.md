# Implementação do schema shared — 05/10/2026

## Entrega aplicada

A migração `20261005180000_professionalize_shared.sql` foi aplicada ao projeto Supabase `mtadnxqoqxzbdksktwdr` em uma transação. Os registros dos schemas `shared`, `erp` e `plugin` foram comparados antes e depois. IDs, relações e dados comerciais existentes foram preservados.

O schema `shared` tem oito tabelas: `usuarios`, `empresas`, `usuarios_empresas`, `perfis_acesso`, `permissoes_perfil`, `convites_empresa`, `eventos_webhook` e `historico_acessos`. Não há colunas `tenant_id` nos três schemas; elas passaram a `empresa_id`. Os contratos internos que ainda usam `tenantId` continuam compatíveis.

Há seis perfis padrão e 41 relações de permissão, incluindo as quinze capacidades do administrador. O cadastro anterior de teste permanece com um usuário, uma empresa e um vínculo. A exceção da empresa antiga sem proprietário está documentada no [guia](README.md).

## Controles implementados

- E-mail normalizado e único; vínculo por e-mail exige identidade verificada e ausência de conflito.
- Situação global de usuário e bloqueio local de participação, preservados na sincronização.
- Mesmas regras de permissões no servidor e nos helpers SQL; visualizador recebe somente leitura.
- Proteção do último proprietário, inclusive em alterações concorrentes e SQL direto.
- Perfil configurável para membros e restrição de administradores ao gerenciamento de proprietários.
- Convites com empresa, validade, papel, perfil e referência ao autor quando disponível no evento.
- Webhooks assinados, persistência de entregas, deduplicação, ordenação e proteção contra exclusões recebidas antes da criação.
- Operações externas persistidas antes de chamar o Clerk, com retentativas e indicação de pendência.
- Histórico de alterações de acesso com inserção apenas, sem tokens ou payloads de autenticação.

## Publicação e correções finais

Deployment final: `dpl_2CF6x1ars5ttbNvyWejYBuF9ndQp`, compilado e promovido ao domínio [cognito-seven.vercel.app](https://cognito-seven.vercel.app/). O domínio foi conferido pela API Vercel depois da promoção.

A conexão Supabase da Vercel foi atualizada com a configuração validada nas consultas reais. O certificado CA é incluído explicitamente nos arquivos das funções. A rotina de reconciliação passou a responder HTTP 200 com autenticação operacional. A manutenção diária existente também executa as retentativas Clerk.

Nos testes reais, os indicadores financeiros ultrapassavam o limite de tempo. O cálculo foi ajustado para produzir resumo e agrupamentos mensais numa consulta, avaliando uma vez os saldos financeiros. As consultas de pagar e receber passaram e levaram aproximadamente dois segundos na verificação específica.

## Verificações concluídas

| Verificação | Resultado |
| --- | --- |
| Backup dos três schemas | 92 tabelas e 4.680 registros; restauração do arquivo e migração da cópia conferidas |
| Regressão shared | 17 grupos aprovados |
| Concorrência real PostgreSQL | Duas sessões independentes; commit e rollback; último proprietário protegido |
| API ERP | 20 grupos, 57 rotas e 81 métodos avaliados |
| Propostas do plugin | 27 grupos e 44 tipos de proposta |
| Estoque | 29 cenários aprovados |
| Leituras MCP com Supabase real | 99 verificações aprovadas; todas as 26 ferramentas de leitura chamadas |
| Isolamento ERP real | TLS validado, RLS e recusa de outra empresa aprovados |
| Tipos e compilação | Verificações locais e compilação completa na Vercel aprovadas |
| MCP público sem autenticação | HTTP 401 |
| Webhook com assinatura inválida | HTTP 400 |
| Reconciliação sem autenticação | HTTP 401 |
| Reconciliação autenticada | HTTP 200 |

Os testes MCP reais usaram uma instância HTTP em loopback com autenticação restrita ao processo de teste e os repositórios reais. Produziram auditoria operacional, sem modificar os dados comerciais, rascunhos ou preferências. Eles não comprovam o login OAuth dentro do ChatGPT.

## Evidências e continuidade

Relatórios privados em `.cache/shared` e `.cache/erp-audit/mcp-all-read.json`. Backup e prova também preservados em `credentials/backups/shared/2026-10-05T16-53-02.033Z-before.json` e no arquivo `.proof.json` correspondente, ambos ignorados pelo Git. Não publicar esses arquivos.

Próxima etapa: identificar a conta real do Igor no Clerk, regularizar sua empresa/propriedade e criar os dados de demonstração nessa empresa. A identificação real, o cadastro dessa empresa e o login completo no ChatGPT ficam para essa etapa. Reenvios de webhooks com falha dependem do Clerk, conforme o [guia de funcionamento](README.md).
