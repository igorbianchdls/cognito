import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { preflightDashboardQueries } from '../../src/products/artifacts/dashboard/query/dashboardQueryPreflight'
import { requestDashboardQueryRows, useDashboardQueryRows } from '../../src/products/artifacts/dashboard/query/dashboardQueryClient'
import { buildDashboardTemplateVariants } from '../../src/products/artifacts/dashboard/templates/dashboardTemplate'
import { parseDashboardJsxToTree } from '../../src/products/artifacts/dashboard/language/parseDashboardJsx'
import { validateDashboardTree } from '../../src/products/artifacts/dashboard/language/validateDashboardTree'
import { getDashboardContract } from '../../src/products/plugin/server/dashboardTools'
import { ARTIFACT_AUTHORING_SCHEMA } from '../../src/products/plugin/server/artifactSchemas'
import { writeDashboardArtifact } from '../../src/products/artifacts/dashboard/persistence/dashboardArtifactsService'

async function main() {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('Unexpected network request') }
  try {
    const retired = '<Dashboard id="old" title="Antigo"><KPI id="value" dataQuery={{query:"SELECT 1"}} /></Dashboard>'
    assert.equal(preflightDashboardQueries({ source: retired }).items[0].code, 'dashboard_query_retired')
    assert.equal(preflightDashboardQueries({ source: '<Filter query={sql} />' }).ok, false)
    assert.equal(preflightDashboardQueries({ source: '<Query dataQuery={savedQuery} />' }).ok, false)
    await assert.rejects(() => requestDashboardQueryRows('old', { query: 'SELECT 1' }), { code: 'dashboard_query_retired' })
    const state = useDashboardQueryRows({ query: 'SELECT 1' }, {})
    assert.equal(state.loading, false)
    assert.equal(state.status, 'error')
    assert.strictEqual(state, useDashboardQueryRows({ query: 'SELECT 2' }, {}))
    assert.equal(useDashboardQueryRows(undefined, {}).status, 'idle')
    await assert.rejects(() => parseDashboardJsxToTree('app/old.tsx', [{ path: 'app/old.tsx', content: retired }]), /fonte de dados.*desativada/)
    // Invalid data sources are rejected before opening a write transaction.
    await assert.rejects(() => writeDashboardArtifact({ tenantId: 1, title: 'Antigo', source: retired }), { code: 'dashboard_query_retired', status: 410 })
    for (const template of buildDashboardTemplateVariants('light')) {
      assert(preflightDashboardQueries({ source: template.content }).ok)
      const tree = await parseDashboardJsxToTree(template.path, [{ path: template.path, content: template.content }])
      assert.equal(tree.type, 'Dashboard')
    }
    const contract = getDashboardContract(true)
    assert.equal(contract.data_contract.queries_supported, false)
    assert(!contract.supported_components.includes('Query' as never))
    assert(!(ARTIFACT_AUTHORING_SCHEMA.properties.action.enum as readonly string[]).includes('query_preview'))
    await parseDashboardJsxToTree('app/example.tsx', [{ path: 'app/example.tsx', content: contract.example_source! }])
    for (const [type, props] of [
      ['KPI', { value: 12 }], ['KPI', { value: null }],
      ['Chart', { type: 'bar', data: [{ label: 'A', value: 12 }] }],
      ['Table', { data: [{ name: 'A' }] }], ['PivotTable', { data: [] }],
    ] as const) validateDashboardTree({ type, props, children: [] })
    assert.throws(() => validateDashboardTree({ type: 'KPI', props: { dataQuery: { model: 'legacy', measure: 'count' } }, children: [] }), /desativada/)

    // Actual compatibility service with only persistence mocked: tenant boundary remains enforced.
    const result = await build({
      entryPoints: ['src/products/artifacts/dashboard/query/dashboardQueryService.ts'],
      bundle: true, write: false, platform: 'node', format: 'esm', metafile: true,
      plugins: [{ name: 'isolated-artifact-read', setup(builder) {
        builder.onResolve({ filter: /dashboardArtifactsService$/ }, () => ({ path: 'persistence', namespace: 'mock' }))
        builder.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: `
          export class ArtifactToolError extends Error { constructor(status,code,message) {super(message);this.status=status;this.code=code;} }
          export async function readDashboardArtifact(input) {if(input.tenantId!==7) throw new ArtifactToolError(403,'artifact_tenant_forbidden','Forbidden');return {};}
        ` }))
      } }],
    })
    assert(!Object.keys(result.metafile!.inputs).some(file => /bigquery|products\/integracoes/i.test(file)))
    const service = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles![0].text).toString('base64'))
    await assert.rejects(() => service.executeDashboardQuery({ artifactId: 'a', tenantId: 7, query: 'SELECT 1' }), { status: 410, code: 'dashboard_query_retired' })
    await assert.rejects(() => service.executeDashboardQuery({ artifactId: 'a', tenantId: 8, query: 'SELECT 1' }), { status: 403 })
    console.log('Dashboard inline: templates e contrato compilam; dados diretos aceitos; consultas rejeitadas sem rede; isolamento preservado.')
  } finally { globalThis.fetch = originalFetch }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
