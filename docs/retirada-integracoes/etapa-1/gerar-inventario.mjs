import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

// Auditoria local: lê apenas arquivos versionados e não altera código do produto.
const root = process.cwd()
const out = 'docs/retirada-integracoes/etapa-1'
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean)
const marker = /bigquery|big_query|integracoes|integrations[./_-]|connected_(?:erp|crm)|paid_media|plugin\.connector|ConnectorsStructuredContent|ConnectorsView/i
const sources = new Map()
for (const file of files) {
  if (file.startsWith(out) || !existsSync(file) || !/\.(?:ts|tsx|js|jsx|mjs|cjs|sql|md|yaml|yml|json|css|html)$|(?:^|\/)Dockerfile|^\.env\.example$|^\.gitignore$/.test(file)) continue
  if (/lock|credential|key\.json|\.env\.(?!example)/i.test(file)) continue
  const data = readFileSync(file, 'utf8')
  sources.set(file, data)
}
const imports = new Map()
for (const [file, data] of sources) {
  const targets = []
  for (const m of data.matchAll(/(?:from\s*|import\s*\(|require\s*\(|import\s*)['"]([^'"]+)['"]/g)) {
    const spec = m[1]
    const base = spec.startsWith('@/') ? 'src/' + spec.slice(2) : spec.startsWith('.') ? path.posix.normalize(path.posix.join(path.posix.dirname(file), spec)) : null
    if (!base) continue
    const resolved = [base, ...['.ts','.tsx','.js','.mjs','.json','/index.ts','/index.tsx'].map(x => base+x)].find(p => sources.has(p))
    if (resolved) targets.push(resolved)
  }
  imports.set(file, targets)
}
const affected = new Set([...sources].filter(([file, data]) => marker.test(file) || marker.test(data)).map(([f]) => f))
for (const file of files) {
  if (file.startsWith('src/products/integracoes/') || file.startsWith('src/products/plugin/server/domain-adapters/')) affected.add(file)
}
for (const file of ['pnpm-lock.yaml', 'src/products/plugin/web/src/styles.css', 'src/products/plugin/web/src/utils/format.ts']) if(files.includes(file)) affected.add(file)
const direct = new Set(affected)
for (let changed = true; changed;) {
  changed = false
  for (const [file, targets] of imports) {
    if (!affected.has(file) && targets.some(t => affected.has(t))) { affected.add(file); changed = true }
  }
}
function disposition(file) {
  if (file === 'tsconfig.ai-platform.json') return ['PRESERVAR', '2–5', 'Referência a integracoes-ia é da IA do ERP; não remover.']
  if (file === '.gitignore') return ['ADAPTAR', '4', 'Retirar apenas caminho/comentário obsoleto; manter proteções de credenciais, .env e arquivos gerados.']
  if (file === 'pnpm-lock.yaml') return ['REGENERAR', '4', 'Atualizar com o gerenciador após retirar a dependência BigQuery; não editar manualmente.']
  if (file.startsWith('src/products/plugin/web/dist/')) return ['REGENERAR', '4', 'Saída versionada do widget: recompilar fontes adaptadas; não editar bundle manualmente.']
  if (file === 'src/products/plugin/web/src/views/ConnectorsView.tsx') return ['APAGAR', '4', 'Vitrine de conectores do widget; retirar registro no App, tipos e estilos associados.']
  if (file === 'scripts/artifacts/dashboard-query-live-smoke.mjs') return ['APAGAR', '4', 'Teste live exclusivo do executor BigQuery retirado; substituir apenas por teste do recurso mantido, se necessário.']
  if (file === 'scripts/plugin/tool-call.mjs') return ['ADAPTAR', '4', 'Retirar preparação BigQuery e utilitários importados de Integrações; preservar chamadas locais úteis.']
  if (file.endsWith('.sql')) return ['PRESERVAR HISTÓRICO', '6', 'Inspecionar objetos no banco; retirar estruturas exclusivas por nova migração. Não apagar o arquivo histórico.']
  if (/^src\/products\/integracoes\//.test(file)) return ['APAGAR', '4', 'Produto e infraestrutura exclusivos; desacoplar consumidores antes.']
  if (/^src\/products\/plugin\/server\/domain-adapters\//.test(file)) return ['APAGAR', '4', 'Adaptadores da plataforma conectada, inclusive leitores Postgres desse subsistema; separar qualquer consumidor local antes.']
  if (/^src\/app\/(?:api\/integracoes\/|\(navigation\)\/integracoes\/)/.test(file)) return ['APAGAR', '4', 'Rotas exclusivas da plataforma antiga.']
  if (/^src\/(?:products\/observability\/(?:frontend\/features\/connectors\/|server\/connectorsObservabilityRepository)|app\/(?:api\/internal\/observability\/connectors\/|internal\/observability\/connectors\/))/.test(file)) return ['APAGAR', '4', 'Observabilidade exclusiva dos conectores. Preservar o restante de observability.']
  if (/^src\/assets\/skills\/(?:integracoes-|connected-erp-)/.test(file)) return ['APAGAR', '4', 'Instruções de funcionalidades aposentadas; ajustar catálogo de skills.']
  if (/^scripts\/integracoes\/|^scripts\/provision-tenant-bigquery|^scripts\/plugin\/connected-|^src\/lib\/bigqueryClient/.test(file)) return ['APAGAR', '4', 'Utilitário exclusivo de conectores ou BigQuery.']
  if (/^src\/products\/artifacts\/dashboard\/query\/dashboardQueryService\.ts$/.test(file)) return ['ADAPTAR / RETIRAR EXECUTOR', '3', 'Eliminar executor BigQuery; preservar apenas contratos realmente necessários ao ERP.']
  if (/^src\/assets\/(?:remotion|landingpages)\//.test(file) || /remotion-preview/.test(file)) return ['PRESERVAR ARQUIVO / ADAPTAR REFERÊNCIAS', '4', 'Material visual; retirar promessas/links obsoletos sem apagar vídeos ou alterações preexistentes.']
  if (/^src\/products\/(?:erp|ai-platform)\/|^src\/app\/(?:api\/(?:erp|ai)\/|erp\/|configuracoes\/integracoes-ia\/)/.test(file)) return ['PRESERVAR', '2–5', 'Núcleo mantido. Dependência indireta deve ser resolvida na camada compartilhada.']
  if (/^src\/products\/auth\/|^src\/app\/(?:onboarding\/|page\.tsx$|api\/clerk\/)/.test(file)) return ['ADAPTAR', '2', 'Preservar identidade e acesso; retirar provisionamento e destinos antigos.']
  if (/^src\/products\/plugin\/server\/domainTools\.ts$/.test(file)) return ['ADAPTAR', '2–4', 'Arquivo misto: retirar connected_*, analytics/social/paid-media externos; preservar e avaliar ferramentas locais separadamente.']
  if (direct.has(file)) return ['ADAPTAR', /artifacts|dashboard/i.test(file) ? '3–4' : '2–4', 'Remover apenas referências à plataforma antiga; preservar funcionalidade compartilhada.']
  return ['PRESERVAR / VALIDAR', '2–5', 'Consumidor indireto por imports. Não é ordem de exclusão; validar após desacoplamento.']
}
const rows = [...affected].sort().map(file => {
  const [action, stage, reason] = disposition(file)
  const data = sources.get(file) || ''
  const lines = data.split(/\r?\n/).flatMap((line,i) => marker.test(line) ? [i+1] : [])
  const deps = (imports.get(file)||[]).filter(t => affected.has(t))
  return {file, action, stage, reason, lines, deps, direct:direct.has(file)}
})
const counts = {}
for (const row of rows) counts[row.action] = (counts[row.action]||0)+1
const md = ['# Inventário de arquivos — etapa 1', '', 'Gerado em '+new Date().toISOString()+'. Base: arquivos versionados presentes no workspace.', '', 'Método: busca textual + fechamento de imports estáticos relativos e @/. Não resolve imports dinâmicos calculados nem recursos remotos. Linhas indicam referências textuais, sem reproduzir conteúdo ou segredos. PRESERVAR / VALIDAR inclui consumidores indiretos: não significa que todos precisem de edição.', '', 'Cada arquivo abaixo tem uma destinação de planejamento. A execução deve verificar consumidores remanescentes antes de excluir qualquer arquivo.', '', `Arquivos classificados: **${rows.length}**. Produto Integrações versionado: **${files.filter(f=>f.startsWith('src/products/integracoes/')).length}**.`, '', ...Object.entries(counts).map(([k,v])=>`- ${k}: ${v}`), '', '| Arquivo | Destino | Etapa | Evidência / motivo |', '|---|---|---|---|']
for (const r of rows) md.push(`| \`${r.file}\` | ${r.action} | ${r.stage} | ${r.lines.length ? 'Linhas '+r.lines.slice(0,12).join(', ')+(r.lines.length>12?'…':'')+'. ' : ''}${r.reason} |`)
writeFileSync(out+'/inventario-arquivos.md', md.join('\n')+'\n')
const edges = ['# Dependências estáticas relevantes', '', 'Arestas entre arquivos classificados. Inclui dependências indiretas para apoiar a validação; não equivale a lista de exclusões.', '', '| Consumidor | Dependência |','|---|---|']
for (const r of rows) for (const d of r.deps) if (!r.file.startsWith('src/products/integracoes/') && !r.file.startsWith('src/products/plugin/server/domain-adapters/')) edges.push(`| \`${r.file}\` | \`${d}\` |`)
writeFileSync(out+'/dependencias.md',edges.join('\n')+'\n')
const sql = new Map()
for (const [file,data] of sources) if(file.endsWith('.sql')) for(const m of data.matchAll(/(?:CREATE\s+(?:TABLE|(?:OR\s+REPLACE\s+)?VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?|ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?|REFERENCES\s+)((?:integrations|plugin)\.[a-z_]+)/gi)) {
  if (!m[1].startsWith('integrations.') && !m[1].startsWith('plugin.integration_') && !m[1].startsWith('plugin.connector')) continue
  const refs=sql.get(m[1])||new Set(); refs.add(file); sql.set(m[1],refs)
}
writeFileSync(out+'/objetos-banco.md',['# Objetos de banco identificados no código','','São declarações/referências em SQL versionado, não confirmação de existência no banco conectado. Etapa 6: verificar FKs, views, funções, triggers, jobs e grants no catálogo real antes de uma migração explícita de remoção. Não remover o schema plugin inteiro.','','| Objeto candidato à retirada | Evidência histórica |','|---|---|',...[...sql].sort().map(([name,refs])=>`| \`${name}\` | ${[...refs].map(r=>'`'+r+'`').join(', ')} |`),'','Preservar shared.tenants, shared.users, shared.tenant_memberships e todas as estruturas do ERP/IA/artifacts ainda utilizadas. scripts/sql/43_shared_tenant_identity.sql é misto. scripts/sql/50_artifacts_dashboard_security.sql contém identidade do artifact e auditoria: adaptar por nova migração apenas se necessário.',''].join('\n'))
const vars=new Map()
for (const [file,data] of sources) for(const m of data.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)|\benv\(['"]([A-Z][A-Z0-9_]+)['"]/g)) {
  const name=m[1]||m[2]; const set=vars.get(name)||new Set(); set.add(file); vars.set(name,set)
}
const envRows=[...vars].filter(([name,refs])=>/BIGQUERY|INTEGRAC|PUBSUB|SECRET_PREFIX|SECRET_INTERNAL|CONTROL_API|WORKER_|GCP_|GOOGLE_|DASHBOARD_QUERY|OAUTH/.test(name) && [...refs].some(f=>affected.has(f)))
writeFileSync(out+'/variaveis-ambiente.md',['# Variáveis referenciadas no código','','Somente nomes e consumidores; nenhum arquivo de credenciais ou .env.local foi copiado. Esta lista não confirma quais variáveis estão configuradas nos ambientes. Nomes genéricos GCP/GOOGLE/OAUTH exigem conferência de uso compartilhado antes da retirada.','','| Nome | Consumidores no código |','|---|---|',...envRows.sort().map(([name,refs])=>`| \`${name}\` | ${[...refs].map(r=>'`'+r+'`').join(', ')} |`),''].join('\n'))
console.log(JSON.stringify({files:files.length,classified:rows.length,counts,sqlObjects:sql.size,envNames:envRows.length}))
