# Identidade, empresas e acesso — schema shared

## Visão geral

O schema `shared` é interno ao servidor. Ele conecta as pessoas autenticadas pelo Clerk às empresas e define o acesso ao ERP e às integrações. As tabelas não possuem grants de leitura ou escrita para `anon`, `authenticated` ou `erp_runtime`. Os helpers usados nas políticas ERP executam com privilégios definidos e `search_path=pg_catalog`.

| Tabela | Responsabilidade |
| --- | --- |
| `usuarios` | ID interno estável, e-mail normalizado, identidade Clerk e situação global. |
| `empresas` | Empresa, organização Clerk, situação e proteção de proprietário. |
| `usuarios_empresas` | Vínculo composto por empresa/usuário; papel, perfil, estado e bloqueio local. |
| `perfis_acesso` | Catálogo de seis perfis padrão, compartilhado entre empresas. |
| `permissoes_perfil` | Capacidades conhecidas por perfil, sem duplicação. |
| `convites_empresa` | Convite Clerk, empresa, e-mail, papel, perfil, autor e validade. |
| `eventos_webhook` | Entregas Clerk e operações externas pendentes. |
| `historico_acessos` | Alterações de acesso com autor, origem, motivo, antes/depois e data. |

Uma pessoa pode participar de várias empresas. Os dados comerciais pertencem à `empresa_id`. O vínculo usa `(empresa_id,usuario_id)`. As FKs continuam usando os mesmos IDs depois da renomeação. Os IDs e campos externos do Clerk permanecem com a nomenclatura do provedor.

## Papel e perfil

- `owner`: proprietário; pode gerenciar proprietários e os demais membros.
- `admin`: gerencia os demais membros; não pode alterar nem promover proprietários.
- `member`: usa o ERP conforme o perfil atribuído.
- `viewer`: recebe apenas capacidades terminadas em `.visualizar`, mesmo quando seu perfil tem permissões de escrita.

Proprietário e administrador usam o perfil `administrador`, preenchido com as quinze capacidades do contrato ERP. O servidor e os helpers SQL aplicam a mesma regra. O administrador não pode ser atribuído como perfil a um membro comum. O perfil pode ser alterado na configuração de membros.

Um vínculo suspenso localmente só pode ser reativado por uma alteração local autorizada. Eventos Clerk não removem `suspenso_localmente`. Papéis gerenciados localmente têm `metadata.accessRoleManaged=true`; o espelhamento preserva a escolha local.

O banco serializa mudanças de acesso pela linha da empresa. Impede suspender, excluir ou rebaixar seu último proprietário ativo, inclusive por SQL direto e operações concorrentes. A desativação global desse proprietário também é bloqueada enquanto a empresa estiver ativa. Uma exclusão real no Clerk suspende primeiro as empresas que ficariam sem proprietário utilizável. Essas empresas só podem ser reativadas depois da regularização do acesso.

O cadastro antigo de teste sem proprietário é preservado. `proprietario_definido` passa a verdadeiro quando um proprietário é estabelecido e não pode voltar a falso. Essa exceção permite regularizar o cadastro existente sem promover um usuário de teste por suposição.

## Identidade e sincronização

`clerk_user_id` é a identidade externa principal. A vinculação automática por e-mail requer e-mail verificado, correspondência única, usuário ativo e ausência de autenticação antiga vinculada. E-mails são normalizados e únicos. Conflitos de identidade exigem resolução explícita; não mesclamos contas silenciosamente. Bloqueios por identidade/e-mail evitam criação concorrente de duplicatas.

`password_hash` e `auth_user_id` continuam presentes para compatibilidade. O fallback Supabase Auth ainda existe nos helpers; sua retirada exige uma migração própria.

`POST /api/clerk/webhooks` verifica a assinatura antes de registrar a entrega. O `svix-id` identifica tentativas do mesmo evento. O processamento serializa eventos da mesma entidade e compara a data do objeto/evento; eventos antigos são ignorados. Exclusões mantêm uma barreira mesmo se chegarem antes da criação. No mesmo instante, exclusão prevalece sobre atualização.

Os efeitos locais e a conclusão do evento são transacionais. Uma falha reverte os efeitos, registra um código resumido e retorna HTTP 503 para permitir nova entrega. Nenhum token ou payload completo do usuário é gravado na tabela de eventos. [Garantias de entrega Clerk](https://clerk.com/docs/guides/development/webhooks/overview).

## Operações externas e recuperação

Alterações locais de papel/empresa enfileiram uma operação com `provedor=clerk_outbox` na mesma transação. Depois da confirmação, o servidor chama o Clerk fora da transação. O papel técnico (`org:admin`/`org:member`) e o `appRole` dos metadados são atualizados. [Metadados de participação Clerk](https://clerk.com/docs/reference/backend/organization/update-organization-membership-metadata).

Falhas preservam a mudança local e deixam a operação pendente com tentativas e atraso crescente. A configuração de membros mostra essa pendência. Uma concessão de acesso local não substitui uma associação ativa no Clerk para autenticar o usuário.

A manutenção diária existente do plugin tenta novamente as operações pendentes. `GET`/`POST /api/clerk/reconcile` também permite reconciliação operacional protegida por `CRON_SECRET`. As requisições ao Clerk têm prazo de oito segundos; a reserva do processamento dura sessenta segundos. Operações antigas são descartadas quando uma escolha local mais recente existe. O worker recupera reservas expiradas.

Eventos recebidos com falha dependem da nova entrega/reenvio pelo Clerk; seu payload não é persistido para reexecução local. Para retenção, conservar eventos pendentes/falhos e a entrega processada mais recente por entidade. Apagar todas as entregas elimina a proteção contra eventos antigos. O histórico de acesso permite apenas inserção; não inclui e-mails, tokens ou payloads de autenticação.

## Migração e publicação

Migração: `supabase/migrations/20261005180000_professionalize_shared.sql`. Ela renomeia as tabelas/colunas no lugar, preserva FKs e atualiza os corpos das funções SQL. `tenant_id` passa a `empresa_id` em `shared`, `erp`, `plugin` e views ERP. Assinaturas públicas de helpers e nomes legados de constraints continuam compatíveis; a projeção fiscal antiga é adaptada por alias no servidor.

Os contratos TypeScript/HTTP que usam `tenantId` continuam compatíveis. A camada SQL usa os nomes novos. O contexto ERP fornece `app.erp_empresa_id` e a configuração legada durante a transição. Campos de empresa/autor enviados pelo cliente são rejeitados tanto nos nomes novos quanto nos antigos.

Sequência de publicação:

1. `pnpm shared:backup`: snapshot privado dos três schemas e prova de restauração a partir do arquivo; aplica a migração na cópia e compara cada valor comercial/operacional.
2. `pnpm shared:smoke`, `pnpm shared:typecheck`, regressões API/plugin/estoque e `pnpm shared:concurrency`.
3. Preparar uma compilação Vercel com ambiente de produção e sem atribuir os domínios: `node scripts/shared/stage-vercel.mjs --production`.
4. Esperar a compilação ficar `READY`; `pnpm shared:check-database` verifica o backup e a migração exata.
5. `node scripts/shared/apply.mjs --apply --project=mtadnxqoqxzbdksktwdr`: valida o código compilado, bloqueia as tabelas, compara o backup com os registros atuais, aplica a migração numa transação e solicita a promoção do deployment pronto.
6. Conferir o domínio, as permissões e consultas reais depois da promoção.

Há uma janela curta entre a confirmação do banco e a promoção da aplicação. Não aplicar a renomeação enquanto a compilação nova estiver indisponível. O script recusa código alterado depois da preparação do deployment, migrações não testadas e backups desatualizados. [Publicação preparada na Vercel](https://vercel.com/docs/cli/deploy).

### Recuperação

Antes do COMMIT, qualquer falha reverte toda a migração. Depois do COMMIT, consultar `.cache/shared/application.json` e o catálogo de migrações. Se a promoção falhar, promover o deployment de produção já preparado; não voltar a apontar o código antigo para o banco renomeado. Os relatórios ficam em `.cache/shared`. O backup e sua prova também são copiados para `credentials/backups/shared`, fora do cache e ignorado pelo Git. Preservar essa pasta em armazenamento privado e incluir a cópia numa política externa de backup operacional.

Para recuperação integral, restaurar `backup-before.json` em banco isolado usando sua estrutura, registros e sequências; `backup-proof.json` registra a prova da restauração. Conferir novos registros e auditorias produzidos desde o backup antes de substituir dados. Migrações antigas e relatórios históricos continuam com os nomes vigentes na época. Os testes históricos restauram a estrutura antiga antes de aplicar a migração atual.

## Próxima etapa

Identificar a conta real do Igor no Clerk, regularizar sua empresa/propriedade e então criar os dados de demonstração somente para essa empresa. Essa migração não cadastra uma identidade real nem popula novas vendas, compras ou títulos.
