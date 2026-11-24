"use client"

import { useState } from "react"
import { CATEGORIAS, categoriaInfo, type Categoria } from "../../shared/categorias"
import { mudarCategoria, useEmpresaAtiva } from "./useEmpresaAtiva"

/** Settings: the category of the active company (only owners and admins can change it; the server checks). */
export function CategoriaConfig() {
  const { ativa, categoria, carregado } = useEmpresaAtiva()
  const [salvando, setSalvando] = useState<Categoria | null>(null)
  const [mensagem, setMensagem] = useState<{ ok: boolean; texto: string } | null>(null)

  const escolher = async (c: Categoria) => {
    if (c === categoria || salvando) return
    setSalvando(c); setMensagem(null)
    try {
      await mudarCategoria(c)
      setMensagem({ ok: true, texto: `Categoria alterada para ${categoriaInfo[c].nome}. O menu já mudou.` })
    } catch (e) {
      setMensagem({ ok: false, texto: e instanceof Error ? e.message : "Não foi possível mudar a categoria." })
    } finally { setSalvando(null) }
  }

  return (
    <section className="mb-4 rounded-lg border border-slate-200 bg-white px-4 py-4">
      <h2 className="text-base font-semibold text-slate-950">Categoria da empresa</h2>
      <p className="mt-1 text-sm text-slate-600">
        {ativa ? <>Define o que aparece no menu de <b>{ativa.nome}</b> e onde o Otto abre.</> : "Define o que aparece no menu e onde o Otto abre."}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="radiogroup" aria-label="Categoria da empresa">
        {CATEGORIAS.map((c) => (
          <button key={c} type="button" role="radio" aria-checked={categoria === c} disabled={!carregado || !!salvando} onClick={() => void escolher(c)}
            className={`rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-default ${categoria === c ? "border-slate-950 bg-slate-50" : "border-slate-200 hover:border-slate-400"}`}>
            <span className="block text-sm font-semibold text-slate-950">{categoriaInfo[c].nome}{salvando === c ? "…" : ""}</span>
            <span className="block text-xs text-slate-600">{categoriaInfo[c].descricao}</span>
          </button>
        ))}
      </div>
      {mensagem ? <p role="status" className={`mt-2 text-sm ${mensagem.ok ? "text-emerald-700" : "text-red-600"}`}>{mensagem.texto}</p> : null}
    </section>
  )
}
