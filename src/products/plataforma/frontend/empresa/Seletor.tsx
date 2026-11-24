"use client"

import { useState } from "react"
import { useOrganization, useOrganizationList } from "@clerk/nextjs"
import { IconCheck, IconChevronDown, IconPlus } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CATEGORIAS, categoriaInfo, type Categoria } from "../../shared/categorias"
import { mudarCategoria, recarregarEmpresas, useEmpresaAtiva } from "./useEmpresaAtiva"

export const roleLabel: Record<string, string> = { "org:admin": "Administrador", "org:member": "Membro" }

/** The company switcher at the top of the menu: the active company and the others, each with its category, and "Criar empresa". */
export function CompanySwitcher() {
  const { organization, membership } = useOrganization()
  const { userMemberships, setActive, isLoaded } = useOrganizationList({ userMemberships: { infinite: true } })
  const { empresas, categoria } = useEmpresaAtiva()
  const [criando, setCriando] = useState(false)
  const name = organization?.name ?? "Minha empresa"
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "O"
  const others = (userMemberships?.data ?? []).filter((m) => m.organization.id !== organization?.id)
  const categoriaDe = (org: string) => empresas.find((e) => e.organizacao === org)?.categoria
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" data-sidebar="company" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1.5 py-1 text-left outline-none hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-[#1d1d1f]/30 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:px-0">
            <span data-sidebar="company-logo" className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-[9px] bg-[#1d1d1f] text-[13px] font-bold tracking-tight text-white">
              {organization?.hasImage ? <span className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${organization.imageUrl})` }} /> : initials}
            </span>
            <span className="min-w-0 truncate text-[17px] font-semibold tracking-[-0.01em] text-[#1d1d1f] group-data-[collapsible=icon]:hidden">{name}</span>
            <IconChevronDown className="size-4 shrink-0 text-[#1d1d1f] group-data-[collapsible=icon]:hidden" stroke={2.2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="text-xs font-medium text-[#6e6e73]">Empresas</DropdownMenuLabel>
          <DropdownMenuItem disabled className="gap-2 opacity-100">
            <IconCheck className="size-4" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{name}</span>
              <span className="block text-xs text-[#8e8e93]">{categoriaInfo[categoria].nome}{membership?.role ? ` · ${roleLabel[membership.role] ?? "Membro"}` : ""}</span>
            </span>
          </DropdownMenuItem>
          {isLoaded && others.length ? <DropdownMenuSeparator /> : null}
          {others.map((m) => {
            const c = categoriaDe(m.organization.id)
            return (
              <DropdownMenuItem key={m.organization.id} onSelect={() => { void setActive?.({ organization: m.organization.id }) }} className="gap-2">
                <span className="size-4" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{m.organization.name}</span>
                  {c ? <span className="block text-xs text-[#8e8e93]">{categoriaInfo[c].nome}</span> : null}
                </span>
              </DropdownMenuItem>
            )
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCriando(true)} className="gap-2"><IconPlus className="size-4" />Criar empresa</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CriarEmpresa open={criando} onOpenChange={setCriando} />
    </>
  )
}

/** Creates a company (a Clerk organization; the Otto company is created from it) and sets its category. */
function CriarEmpresa({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { createOrganization, setActive } = useOrganizationList()
  const [nome, setNome] = useState("")
  const [categoria, setCategoria] = useState<Categoria>("marketing")
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState("")

  const criar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!nome.trim() || !createOrganization || !setActive) return
    setEnviando(true); setErro("")
    try {
      const org = await createOrganization({ name: nome.trim() })
      await setActive({ organization: org.id })
      // The Otto company is created from the organization on the next request; try the category a few times.
      let ok = false
      for (let i = 0; i < 5 && !ok; i++) {
        try { await mudarCategoria(categoria); ok = true } catch { await new Promise((r) => setTimeout(r, 1200)) }
      }
      await recarregarEmpresas()
      if (!ok) setErro("A empresa foi criada, mas a categoria não foi salva. Ajuste em Configurações.")
      else { setNome(""); onOpenChange(false) }
    } catch (e) {
      console.error("plataforma: criar empresa", e)
      setErro(e instanceof Error && e.message ? e.message : "Não foi possível criar a empresa.")
    } finally { setEnviando(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!enviando) onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar empresa</DialogTitle>
          <DialogDescription>Cada empresa tem seus próprios dados, membros e categoria.</DialogDescription>
        </DialogHeader>
        <form onSubmit={criar} className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-[#1d1d1f]">
            Nome da empresa
            <input autoFocus value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required
              className="h-10 rounded-lg border border-black/15 px-3 text-[15px] font-normal outline-none focus:border-[#1d1d1f]" placeholder="Ex.: Agência Aurora" />
          </label>
          <fieldset className="grid gap-2">
            <legend className="mb-1.5 text-sm font-medium text-[#1d1d1f]">Para que você vai usar o Otto?</legend>
            {CATEGORIAS.map((c) => (
              <label key={c} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 ${categoria === c ? "border-[#1d1d1f] bg-black/[0.03]" : "border-black/10"}`}>
                <input type="radio" name="categoria" value={c} checked={categoria === c} onChange={() => setCategoria(c)} className="mt-1" />
                <span><span className="block text-sm font-semibold">{categoriaInfo[c].nome}</span><span className="block text-xs text-[#6e6e73]">{categoriaInfo[c].descricao}</span></span>
              </label>
            ))}
          </fieldset>
          {erro ? <p role="alert" className="text-sm text-red-600">{erro}</p> : null}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => onOpenChange(false)} disabled={enviando} className="h-9 rounded-lg px-4 text-sm font-medium hover:bg-black/[0.05]">Cancelar</button>
            <button type="submit" disabled={enviando || !nome.trim()} className="h-9 rounded-lg bg-[#1d1d1f] px-4 text-sm font-semibold text-white disabled:opacity-50">{enviando ? "Criando…" : "Criar empresa"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
