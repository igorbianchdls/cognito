# Remoção das views financeiras

Aplicada e verificada no Supabase Creatto em 09/09/2026 às 00:25:55 (America/Fortaleza), migração `20260909033000_drop_erp_financial_views`.

Removidas: `erp.vw_aging_receber`, `erp.vw_aging_pagar`, `erp.vw_dre_gerencial` e `erp.vw_fluxo_caixa_diario`. Não foram criadas substitutas.

Resultado: **82 tabelas preservadas e 2 views restantes**, `vw_posicao_estoque` e `vw_giro_estoque`. A comparação integral dos metadados confirmou somente a retirada das quatro views e dos metadados associados. A exclusão usou RESTRICT, sem CASCADE, em uma transação.

Nenhum registro comercial foi consultado ou alterado nesta etapa. Por orientação do usuário, investigação/correção de dados existentes está fora do escopo atual; o foco permanece na estrutura das tabelas.

No código local, foram retiradas as consultas dependentes em `erpManagementRepository` e `erpProfessionalRepository`. Os sete identificadores de relatório correspondentes retornam HTTP 410 com `REPORT_RETIRED`, sem consultar as views. Não houve alteração de interface nem publicação da aplicação nesta etapa.

Validação: 14 verificações passaram, incluindo preservação das 82 tabelas e das views de estoque, rejeição de dependência por RESTRICT com rollback integral, repetição da migração e bloqueio dos relatórios antes de qualquer consulta SQL. O teste isolado não usou registros fictícios de negócio, apenas estruturas.

- [Resultado no Supabase](result.json)
- [Catálogo anterior](before.json)
- [Catálogo posterior](after.json)
- [Migração](../../../supabase/migrations/20260909033000_drop_erp_financial_views.sql)
- [Verificação local](../../../scripts/erp/retire-views-smoke.mjs)
