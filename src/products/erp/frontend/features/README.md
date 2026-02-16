# ERP Frontend Features

Organizacao por modulo de negocio.

- Cada modulo possui `pages/` com os entrypoints da feature.
- As rotas em `src/app/erp/*` sao wrappers finos que importam estas paginas.

Exemplos:

- `features/financeiro/pages/index.tsx`
- `features/vendas/pages/dashboard.tsx`
- `features/compras/pages/cotacoes/novo.tsx`
