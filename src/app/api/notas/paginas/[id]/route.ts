import { apagarPagina, arquivarPagina, atualizarPagina, obterPagina, type Alteracao } from '@/products/notas/server/paginas'
import { contexto, corpo, json, responder, UUID } from '@/products/notas/server/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }
const TIPOS: Record<string, (v: unknown) => boolean> = {
  titulo: v => typeof v === 'string' && v.length <= 500,
  icone: v => v === null || (typeof v === 'string' && v.length <= 64),
  capa: v => v === null || (typeof v === 'string' && v.length <= 1000),
  capa_posicao: v => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 100,
  conteudo: v => Array.isArray(v) && JSON.stringify(v).length <= 5_000_000,
  largura_total: v => typeof v === 'boolean', texto_pequeno: v => typeof v === 'boolean', bloqueada: v => typeof v === 'boolean',
  fonte: v => v === 'padrao' || v === 'serifa' || v === 'mono',
}

/** GET — a página inteira (e registra nos recentes). */
export async function GET(_request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return json(400, { erro: 'Página inválida.' })
  return responder('NOTAS_GET_FAILED', () => obterPagina(ctx, id))
}

/** PATCH { versao, ...campos } — grava os campos enviados se a versão ainda for a mesma (409 com a página atual se não). */
export async function PATCH(request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  const body = await corpo<Record<string, unknown>>(request)
  // Sem versão só dá para trocar o título ou o ícone (renomear pela barra lateral): vale o último que gravar.
  const soNome = body && Object.keys(body).every(c => c === 'titulo' || c === 'icone')
  if (!UUID.test(id) || !body || (!Number.isSafeInteger(body.versao) && !soNome)) return json(400, { erro: 'Parâmetros inválidos.' })
  const alteracao: Record<string, unknown> = {}
  for (const [campo, valor] of Object.entries(body)) {
    if (campo === 'versao') continue
    if (!TIPOS[campo]?.(valor)) return json(400, { erro: `Campo inválido: ${campo}.` })
    alteracao[campo] = valor
  }
  return responder('NOTAS_UPDATE_FAILED', () => atualizarPagina(ctx, id, (body.versao as number | undefined) ?? null, alteracao as Alteracao))
}

/** DELETE — manda para a lixeira; ?definitivo=1 apaga de vez (só da lixeira). */
export async function DELETE(request: Request, { params }: Params) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  const { id } = await params
  if (!UUID.test(id)) return json(400, { erro: 'Página inválida.' })
  const definitivo = new URL(request.url).searchParams.get('definitivo') === '1'
  return responder('NOTAS_DELETE_FAILED', () => definitivo ? apagarPagina(ctx, id) : arquivarPagina(ctx, id))
}
