# ERP server layer

This folder is reserved for API, repositories, Supabase migrations adapters, and tenant-aware business rules.
The frontend uses `frontend/services/erpClient.ts` to access authenticated ERP API routes.

## Dashboards

As consultas dos sete dashboards ficam em [`dashboards/`](dashboards/README.md), com um arquivo por área. O contrato público fica em `../shared/dashboardContracts.ts`; filtros, fórmulas, permissões e testes são explicados no README desse módulo.
