# Correções do diagnóstico — 11/10/2026

## Implementado

| Área | Correção |
| --- | --- |
| Limite de crédito | Usa o saldo canônico de `erp.composicao_parcela`, incluindo adiantamentos, reversões e renegociações. Confirmações do mesmo cliente compartilham uma trava transacional. |
| Margem | Distribui o custo de estoque entre itens do mesmo produto, respeitando os vínculos dos documentos de entrega/devolução. O custo estimado continua identificado quando não há movimento vinculado. |
| DRE | O reembolso de uma devolução não entra novamente como despesa por competência. A devolução já reduz a receita; a saída efetiva continua no caixa. |
| Repetição segura | Devolução, utilização de crédito e pagamento de comissão guardam a assinatura da solicitação e serializam a mesma chave. Repetições incompatíveis retornam conflito. |
| Formulários | Reutilizam a mesma chave após resposta perdida; requisições simultâneas da mesma ação são reunidas. Alterar a solicitação enquanto o resultado é incerto é bloqueado. |
| Contas vinculadas | Aplicação e banco protegem contas geradas por comissão/reembolso. Baixa, estorno e seus campos de pagamento continuam permitidos. |
| Estoque | Corrigido o identificador SQL na consulta de produtos que precisam de reposição. |
| Numeração | Preserva os dígitos a partir de 10.000, sem truncamento. |
| Exportação | Percorre todas as páginas dentro de uma transação de leitura consistente; remove os metadados internos da exportação. |
| Listagens | Devoluções e tabelas de preços têm paginação e busca no servidor. Ordenação possui desempate estável; respostas antigas da busca não substituem a atual. |
| Histórico | Conferidas colunas, índice, quatro funções, gatilho e permissões do Portal do Contador antes de registrar sua migração já existente no banco. |

Não foram recriadas tabelas nem alteradas as políticas de acesso entre empresas. A API de emissão fiscal real permanece fora deste trabalho.

## Migrações

- Aplicada: `20261011150000_erp_audit_corrections`.
- Histórico reconciliado: `20261009160000_portal_contador_access`.
- Pendente: `20261010110100_fiscal_pdf_storage_finalize`, condicionada à migração e conferência dos arquivos reais.

A migração corretiva adiciona assinaturas em três tabelas e gatilhos de proteção, além de corrigir a função de numeração. Assinaturas antigas nulas não são inventadas: uma tentativa de repetir um registro legado sem assinatura solicita conferência do resultado anterior.

## Verificações executadas

- Consulta real da margem com produto repetido: receita 200, custo 60, margem 140; entrega parcial e devolução vinculada também conferidas.
- Consulta real da DRE com reembolso: resultado 800, sem a redução duplicada que produzia 600.
- Crédito aplicado e revertido, limite excedido e liberação apenas com permissão financeira.
- Repetição de devolução/crédito/comissão, alteração de conteúdo com mesma chave, falha de conexão após gravação e dois cliques simultâneos.
- Exportação de 251 clientes com nomes repetidos; busca e paginação de 101 tabelas e 101 devoluções em estruturas temporárias do PostgreSQL.
- Proteções dos títulos e parcelas, pagamento e estorno, imutabilidade da assinatura e numeração 9.999 → 10.000 → 10.001, com reversão integral do ensaio.
- Sete dashboards, 108 detalhamentos e 44 reconciliações independentes. Os registros existentes permaneceram iguais durante as verificações de leitura.
- Catálogo da API: 82 rotas e 124 métodos.
- Dez cenários de propostas/OS e 17 de PDFs fiscais. Banco real com rollback; armazenamento externo simulado, sem upload no bucket real.
- Compilação completa na Vercel e consultas HTTP autenticadas com Clerk: dashboards, listagens, quatro exportações e leitura de PDF legado. Exportações conferidas contra o banco: 30 clientes, 15 fornecedores, 20 produtos e 10 serviços.

As verificações atestam os cenários acima, não uma ausência absoluta de defeitos. Os testes de documentos preservaram os registros e PDFs originais; sequências podem apresentar lacunas após testes revertidos.

## Publicação

Versão `dpl_FX5FCN5iJ9GYHgv9F1tmFPJNf33A` publicada em `https://cognito-seven.vercel.app` e confirmada como `READY`. As consultas HTTP autenticadas, exportações e leitura do PDF legado passaram também no domínio público após a promoção. A versão anterior foi registrada para eventual reversão. Não foi criado commit Git neste trabalho.

## PDFs: dependência restante

A chave `ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY` ainda não está disponível no `.env.local`. Por isso, os 28 PDFs legados não foram migrados para o bucket real e a coluna binária foi preservada. Os testes com armazenamento simulado não substituem essa migração.

Após configurar a chave localmente, sem enviá-la no chat:

1. Executar `node --import tsx scripts/erp/fiscal-pdf-storage.mjs migrate`.
2. Executar o mesmo script em modo `verify` para conferir arquivos, bytes, hashes e metadados.
3. Executar `live --company=2 --user=3` contra a versão publicada, verificando download autorizado, expiração e bloqueio público.
4. Só então executar `finalize --deployment=<id comprovado pelo teste live>`.

O migrador existente mantém backup dos originais e bloqueia a remoção da coluna enquanto faltar arquivo, verificação ou prova do leitor publicado.

## Reexecutar as regressões

Executar na raiz do repositório, com acesso ao projeto correto em `.env.local`:

```text
node scripts/erp/audit-corrections-regression.mjs
node scripts/erp/audit-credit-pagination.mjs
node scripts/erp/audit-database-corrections.mjs --check
node scripts/erp/reconcile-portal-history.mjs
node --import tsx scripts/erp/dashboards-smoke.ts
node scripts/erp/dashboards-reconcile.mjs
node scripts/erp/api-catalog.mjs
node scripts/erp/audit-deployment-http.mjs --production
```

Depois de aplicada, a verificação da migração confirma seu registro e conteúdo; o ensaio de gatilhos e numeração anterior à aplicação está em `.cache/erp-audit/corrections/database-check.json`. As outras evidências ficam em `.cache/erp-audit`, `.cache/dashboards`, `.cache/commercial-documents` e `.cache/fiscal-pdf-storage`. Não publicar backups ou arquivos de ambiente.
