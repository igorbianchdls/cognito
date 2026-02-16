# Modulos ERP Backend

Migracao aplicada:

- Controladores extraidos de `src/app/api/modulos/*/route.ts` para:
  `src/products/erp/backend/features/modulos/controllers/*/controller.ts`
- Rotas em `src/app/api/modulos/*` agora sao wrappers finos que:
  - mantem config (`runtime`, `dynamic`, `revalidate`, etc.) no arquivo da rota
  - exportam handlers (`GET`, `POST`, `PATCH`, `DELETE`, ...) a partir dos controllers

Observacao:

- `src/app/api/modulos/airtable/*` ficou fora desta migracao porque ja existe feature dedicada em `src/products/airtable/backend/*`.
