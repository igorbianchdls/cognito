import { randomUUID } from 'node:crypto'
import { Script } from 'node:vm'
import { AppsError, manifestSchema, type AppPackage, type Manifest } from '../shared/contracts'
import type { Database, Session } from './database'
import { available, bump, event, expected, getApp, publisher, versions } from './repository'
import { loadPackage, packageHash } from './service'
import { storage, type PackageStore } from './storage'

export function validateStatic(p: AppPackage) {
  // React projects are validated by the build; their index.html only hosts the root element.
  const paths = new Set(p.arquivos.map(f => f.caminho)), react = p.manifesto.modelo === 'react'
  for (const file of p.arquivos) {
    if (!react && file.caminho.endsWith('.js')) { try { new Script(file.conteudo) } catch { throw new AppsError('INVALID_SCRIPT', `Confira a sintaxe de ${file.caminho}.`) } }
    if (file.caminho.endsWith('.html')) {
      for (const match of file.conteudo.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
        const ref = match[1].replace(/^\.\//, '')
        if (!ref.startsWith('#') && !ref.startsWith('data:image/') && !paths.has(ref)) throw new AppsError('INVALID_REFERENCE', `O recurso ${ref.slice(0, 100)} precisa estar no pacote. Links externos não são suportados.`)
      }
      if (!react && /<script\b[^>]*\btype\s*=\s*["']module["']/i.test(file.conteudo)) throw new AppsError('UNSUPPORTED_MODULE', 'Envie JavaScript preparado sem módulos externos.')
    }
  }
}
export function compatible(previous: Manifest, next: Manifest) {
  for (const old of previous.colecoes) {
    const candidate = next.colecoes.find(c => c.id === old.id)
    if (!candidate || candidate.chave !== old.chave) throw new AppsError('INCOMPATIBLE_DATA', 'Preserve as coleções já publicadas e seus identificadores.', 409)
    for (const f of old.campos) {
      const nf = candidate.campos.find(n => n.id === f.id)
      if (!nf || nf.tipo !== f.tipo || !f.obrigatorio && nf.obrigatorio) throw new AppsError('INCOMPATIBLE_DATA', 'Essa alteração exige uma migração dos dados já publicados.', 409)
    }
    if (candidate.campos.some(f => f.obrigatorio && !old.campos.some(o => o.id === f.id))) throw new AppsError('INCOMPATIBLE_DATA', 'Adicione campos opcionais aos dados já publicados.', 409)
  }
}
export async function publish(db: Database, s: Session, appId: string, revision: number, versionId: string, operationId: string, store: PackageStore = storage) {
  publisher(s); const app = await getApp(db, s, appId, true); available(app)
  const prior = (await db.query('SELECT versao_id,estado FROM apps.execucoes WHERE empresa_id=$1 AND app_id=$2 AND chave_operacao=$3', [s.tenantId, appId, operationId])).rows[0]
  if (prior) { if (prior.versao_id !== versionId) throw new AppsError('OPERATION_CONFLICT', 'Esta operação já foi usada para outra versão.', 409); return { ok: true, repetida: true } }
  expected(app, revision)
  const version = (await versions(db, s, appId)).find(v => v.id === versionId)
  if (!version) throw new AppsError('NOT_FOUND', 'Versão não encontrada.', 404)
  if (manifestSchema.parse(version.manifesto).modelo === 'react' && version.build_estado !== 'ok') throw new AppsError('BUILD_REQUIRED', 'Corrija os erros de compilação antes de publicar.', 409)
  const p = await loadPackage(db, s, appId, versionId, store); validateStatic(p)
  // jsonb reorders keys and older manifests omit defaults: compare the parsed values.
  const { isDeepStrictEqual } = await import('node:util')
  if (!isDeepStrictEqual(manifestSchema.parse(p.manifesto), manifestSchema.parse(version.manifesto))) throw new AppsError('INVALID_CONTENT', 'O manifesto não corresponde aos arquivos salvos.', 409)
  const history = (await db.query('SELECT DISTINCT v.manifesto FROM apps.publicacoes p JOIN apps.versoes v ON (v.empresa_id,v.app_id,v.id)=(p.empresa_id,p.app_id,p.versao_id) WHERE p.empresa_id=$1 AND p.app_id=$2', [s.tenantId, appId])).rows
  for (const old of history) compatible(old.manifesto, p.manifesto)
  for (const c of p.manifesto.colecoes) await db.query('INSERT INTO apps.colecoes(id,empresa_id,app_id,chave,nome) VALUES($1,$2,$3,$4,$5) ON CONFLICT(empresa_id,app_id,id) DO UPDATE SET nome=excluded.nome', [c.id, s.tenantId, appId, c.chave, c.nome])
  if (version.estado === 'rascunho') {
    const digest = version.versao_formato === 2 ? packageHash(p) : (await db.query("SELECT hash_conteudo FROM apps.arquivos WHERE empresa_id=$1 AND app_id=$2 AND versao_id=$3 AND estado_upload='confirmado' AND finalidade='pacote'", [s.tenantId, appId, versionId])).rows[0].hash_conteudo
    await db.query("UPDATE apps.versoes SET estado='pronta',hash_conteudo=$4,selado_em=now() WHERE empresa_id=$1 AND app_id=$2 AND id=$3", [s.tenantId, appId, versionId, digest])
  }
  await db.query("UPDATE apps.publicacoes SET estado='encerrada',encerrado_em=now() WHERE empresa_id=$1 AND app_id=$2 AND estado='ativa'", [s.tenantId, appId])
  await db.query('INSERT INTO apps.publicacoes(id,empresa_id,app_id,versao_id,publicado_por) VALUES($1,$2,$3,$4,$5)', [randomUUID(), s.tenantId, appId, versionId, s.sharedUserId])
  await db.query("INSERT INTO apps.execucoes(empresa_id,app_id,versao_id,tipo,estado,chave_operacao,solicitado_por) VALUES($1,$2,$3,$4,'concluida',$5,$6)", [s.tenantId, appId, versionId, version.estado === 'rascunho' ? 'publicar' : 'restaurar', operationId, s.sharedUserId])
  await bump(db, s, appId); await event(db, s, appId, 'publicado', operationId)
  return { ok: true }
}
export async function unpublish(db: Database, s: Session, appId: string, revision: number) {
  publisher(s); const app = await getApp(db, s, appId, true); expected(app, revision)
  await db.query("UPDATE apps.publicacoes SET estado='encerrada',encerrado_em=now() WHERE empresa_id=$1 AND app_id=$2 AND estado='ativa'", [s.tenantId, appId]); await bump(db, s, appId); await event(db, s, appId, 'retirado_de_publicacao'); return { ok: true }
}
