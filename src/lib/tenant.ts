export function resolveTenantId(h: Headers, fallback = 1) {
  const hdrTenant = Number.parseInt((h.get('x-tenant-id') || '').trim(), 10)
  const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
  const tenantId =
    Number.isFinite(hdrTenant) && hdrTenant > 0
      ? hdrTenant
      : Number.isFinite(envTenant) && envTenant > 0
        ? envTenant
        : fallback
  return tenantId
}

