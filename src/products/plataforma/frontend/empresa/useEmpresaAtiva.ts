"use client"

import { useEffect, useSyncExternalStore } from "react"
import { useAuth } from "@clerk/nextjs"
import type { Categoria } from "../../shared/categorias"

export type Empresa = { id: number; nome: string; organizacao: string | null; categoria: Categoria }
type Estado = { empresas: Empresa[] | null; erro: string }

// One copy for every component (menu, switcher, settings); loaded once per person and refreshed after a change.
let estado: Estado = { empresas: null, erro: "" }
let carregando: Promise<void> | null = null
let dono: string | null = null
const ouvintes = new Set<() => void>()
const publicar = (next: Estado) => { estado = next; ouvintes.forEach(l => l()) }
const assinar = (l: () => void) => { ouvintes.add(l); return () => { ouvintes.delete(l) } }
const ler = () => estado
const vazio: Estado = { empresas: null, erro: "" }
const semMudancas = () => () => {}

/** The last category seen for each company, so the menu doesn't flash before the server answers. */
const LEMBRADA = "otto-categoria-empresa"
function lembrada(org: string | null | undefined): Categoria | null {
  if (!org) return null
  try { return (JSON.parse(localStorage.getItem(LEMBRADA) ?? "{}") as Record<string, Categoria>)[org] ?? null } catch { return null }
}
function lembrar(empresas: Empresa[]) {
  try { localStorage.setItem(LEMBRADA, JSON.stringify(Object.fromEntries(empresas.filter(e => e.organizacao).map(e => [e.organizacao, e.categoria])))) } catch { /* storage blocked */ }
}

export function recarregarEmpresas(): Promise<void> {
  carregando = fetch("/api/plataforma/empresas", { cache: "no-store" })
    .then(async r => {
      const body = await r.json().catch(() => ({})) as { empresas?: Empresa[]; erro?: string }
      if (!r.ok || !body.empresas) throw new Error(body.erro ?? `HTTP ${r.status}`)
      lembrar(body.empresas)
      publicar({ empresas: body.empresas, erro: "" })
    })
    .catch(e => { console.error("plataforma: empresas", e); publicar({ empresas: estado.empresas ?? [], erro: "Não foi possível carregar as empresas." }) })
  return carregando
}

/** Changes the category of the active company (owner or admin); throws with the server's message when refused. */
export async function mudarCategoria(categoria: Categoria) {
  const r = await fetch("/api/plataforma/empresas", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ categoria }) })
  const body = await r.json().catch(() => ({})) as { erro?: string }
  if (!r.ok) throw new Error(body.erro ?? "Não foi possível mudar a categoria.")
  await recarregarEmpresas()
}

/**
 * The person's companies and the active one (the Clerk organization in use), with its category.
 * Until the server answers, the category is the last one seen in this browser, or "completo".
 */
export function useEmpresaAtiva() {
  const { isLoaded, userId, orgId } = useAuth()
  const atual = useSyncExternalStore(assinar, ler, () => vazio)
  useEffect(() => {
    if (!isLoaded || !userId) return
    if (dono !== userId) { dono = userId; carregando = null; publicar({ empresas: null, erro: "" }) }
    if (!carregando) void recarregarEmpresas()
  }, [isLoaded, userId])
  const empresas = atual.empresas ?? []
  const ativa = empresas.find(e => e.organizacao && e.organizacao === orgId) ?? (orgId ? undefined : empresas[0])
  // The remembered category is read only after hydration, so the server and the first client render match.
  const montado = useSyncExternalStore(semMudancas, () => true, () => false)
  const categoria: Categoria = ativa?.categoria ?? (montado ? lembrada(orgId) : null) ?? "completo"
  return { empresas, ativa, categoria, carregado: atual.empresas !== null, erro: atual.erro }
}
