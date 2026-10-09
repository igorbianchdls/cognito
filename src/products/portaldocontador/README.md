# Portal do Contador

Produto independente para consultar várias empresas autorizadas. Entrada: `/contador`.

## Organização

| Pasta      | Responsabilidade                                                        |
| ---------- | ----------------------------------------------------------------------- |
| `frontend` | Empresas, visão geral, tabelas, documentos e convites nas configurações |
| `api`      | Transporte HTTP, filtros, erros, CSV e downloads                        |
| `server`   | Autorização, consultas e gestão de convites                             |
| `shared`   | Contratos e validação dos filtros                                       |

As rotas do Next ficam em `src/app/contador` e `src/app/api/contador`. Os dados, cálculos financeiros, DRE e dashboards continuam no produto ERP. Não existe uma cópia do banco para o portal.

## Acesso

`shared.usuarios_empresas.acesso_portal_contador` libera o produto por empresa. O perfil ERP continua independente. O novo perfil `contador` contém cinco permissões de consulta: financeiro, relatórios, vendas, compras e cadastros. O portal limita qualquer perfil, inclusive proprietário, a essas permissões de leitura.

Cada consulta valida a sessão Clerk, verifica os vínculos atuais no provedor, consulta a concessão local e executa o banco com empresa e usuário definidos, papel `erp_runtime`, `app.portal_contador=true` e transação somente leitura. RLS também exige a concessão do portal. Não existem endpoints para alterar os dados comerciais neste produto.

## Convites

Configurações → Membros oferece liberação de usuários existentes e convite por e-mail. Administradores enviam o convite organizacional pelo Clerk; a escolha do acesso fica localmente em `shared.convites_empresa.acesso_portal_contador`. Um novo contador recebe papel `viewer` e perfil `contador`.

A liberação exige convite aceito, e-mail verificado e vínculo ativo na mesma organização. A aplicação ocorre uma vez, independentemente da ordem dos eventos de aceitação e vínculo. Atualizações do Clerk preservam perfil e concessões locais. Revogar um convite pendente impede a liberação local imediatamente; a operação externa usa a fila durável existente e suas retentativas. Para revogar um convite já aceito, remova o acesso do membro nas configurações.

Chamadas externas de criação e revogação ocorrem fora da transação do banco. Os testes locais usam identidades fictícias e não enviam convites reais.

## Consultas e documentos

- Visão geral reutiliza os cálculos do dashboard ERP conforme as permissões disponíveis.
- Contas a pagar/receber mostram lançamentos efetivos pelo vencimento e saldos calculados pelo ERP.
- Movimentações usam a data do pagamento e identificam estornos.
- Relatórios: fluxo de caixa, DRE por caixa e DRE por competência.
- Documentos: anexos confirmados pela data de envio no fuso da empresa e último PDF de NFS-e por competência.
- Pendências: títulos efetivos sem categoria e transações bancárias pendentes/parciais. São cálculos atuais; não há uma fila persistente de solicitações.

Os PDFs simulados são identificados como **SIMULAÇÃO SEM VALIDADE FISCAL**. Downloads passam por autorização no servidor; URLs privadas de armazenamento não são retornadas ao navegador. Limite de download de anexo: 10 MB.

## API

`GET /api/contador/empresas` lista empresas liberadas. `GET /api/contador/empresas/:id/:recurso` aceita `resumo`, `financeiro`, `documentos`, `relatorios`, `pendencias` e `exportar`. Filtros: `from`, `to`, `query`, `page`, `pageSize`, `side`, `report`, `source`. Datas válidas, intervalo máximo de 366 dias e paginação de até 100 itens. Exportações usam `source` e todos os filtros, até 5.000 linhas, em um snapshot consistente. CSV UTF-8 com BOM, separador `;` e proteção contra fórmulas em células textuais.

`GET /api/contador/empresas/:id/documentos/arquivo::id` ou `nfse::id` baixa documentos. `GET/POST/DELETE /api/contador/convites` gerencia convites da empresa ativa, exclusivamente por administradores.

Respostas não ficam em cache e incluem identificador de correlação. Não expõem detalhes internos de falhas.

## Banco e validação

Migração: `20261009160000_portal_contador_access.sql`. Nenhuma tabela nova; duas colunas booleanas, perfil/permissões, índice, auditoria e função de listagem de documentos. Preserva a auditoria das permissões comerciais existentes.

- `node scripts/shared/shared-smoke.mjs`: regressão local de identidade, perfis, auditoria, convites e suas ordens.
- `node scripts/portaldocontador/database.mjs`: ensaio da migração com rollback no projeto fixado pelo executor.
- `node scripts/portaldocontador/database.mjs --apply`: exige compilação pronta na Vercel, salva backup privado, aplica e confere a preservação dos dados.
- `node node_modules/tsx/dist/cli.mjs scripts/portaldocontador/smoke.ts`: consultas, CSV, isolamento e proteção de escrita.
- `node scripts/portaldocontador/http.mjs`: sessão Clerk real e versão de homologação; `--production` testa o domínio publicado.

Backups privados ficam em `credentials/backups/portaldocontador`. Evidências ficam em `.cache/portaldocontador`, fora do Git. A futura versão com solicitações, encerramento de competência e equipes de escritórios deve ter contratos e tabelas próprios quando esse fluxo for definido.
