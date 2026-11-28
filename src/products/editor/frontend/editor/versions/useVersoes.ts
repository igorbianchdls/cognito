'use client'

// Quando o editor guarda versões sozinho: depois de 10 minutos de edição desde a última versão (alguns segundos após
// a pessoa parar de mexer), antes de grandes mudanças (modelo, IA, legendas automáticas, restaurar), a cada exportação
// e ao sair do projeto com mudanças. Cada versão leva o que mudou desde a anterior, a duração, uma capa e quem fez.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { projectDuration } from '../project/ops'
import { listVersions, renameVersion, saveVersion, type TipoVersao, type Version } from '../project/store'
import { FPS, type Project } from '../project/types'
import { capaDoProjeto, resumoMudancas } from './util'

const DEZ_MINUTOS = 10 * 60 * 1000
const PAUSA = 4000
/** Nos testes de tela (só fora de produção) o intervalo pode ser encurtado. */
const intervalo = () => {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    const teste = Number((window as unknown as { __editorIntervaloVersoes?: number }).__editorIntervaloVersoes)
    if (teste > 0) return teste
  }
  return DEZ_MINUTOS
}

export function useVersoes(project: Project, carregado: boolean) {
  const { user } = useUser()
  const autor = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Você'
  const atual = useRef(project)
  useEffect(() => { atual.current = project }, [project])
  /** O projeto como estava na última versão (ou ao abrir), para o resumo do que mudou. */
  const base = useRef<Project | undefined>(undefined)
  const ultima = useRef(0)
  const temVersao = useRef(false)
  const sujo = useRef(false)
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [lista, setLista] = useState<Version[] | null>(null)
  const [aberto, setAberto] = useState(false)
  const abertoRef = useRef(aberto)
  useEffect(() => { abertoRef.current = aberto }, [aberto])

  const recarregar = useCallback(async () => { setLista(await listVersions(atual.current.id)) }, [])

  useEffect(() => {
    if (!carregado) return
    base.current = atual.current
    ultima.current = Date.now()
    void listVersions(atual.current.id).then(l => { temVersao.current = l.length > 0 })
  }, [carregado])

  const versionar = useCallback(async (tipo: TipoVersao, label: string, opcoes: { projeto?: Project; nomeada?: boolean } = {}) => {
    clearTimeout(espera.current)
    const p = opcoes.projeto ?? atual.current
    const v = await saveVersion(p, { tipo, label, nomeada: opcoes.nomeada, resumo: resumoMudancas(base.current, p),
      duracao: Math.round(projectDuration(p) / FPS * 10) / 10, capa: (await capaDoProjeto(p).catch(() => null)) ?? undefined, autor })
    base.current = p; ultima.current = Date.now(); sujo.current = false; temVersao.current = true
    if (abertoRef.current) void recarregar()
    return v
  }, [autor, recarregar])

  /** Antes de uma mudança grande: guarda como está (se mudou desde a última versão, ou se ainda não há nenhuma). */
  const antes = useCallback(async (label: string) => {
    const vazio = atual.current.tracks.every(t => !t.clips.length)
    if (vazio || (!sujo.current && temVersao.current)) return
    await versionar('antes', label).catch(() => undefined)
  }, [versionar])

  // Cada mudança: marca que há o que guardar; passados 10 min desde a última versão, guarda quando a pessoa pausa.
  useEffect(() => {
    if (!carregado || project === base.current) return
    sujo.current = true
    if (Date.now() - ultima.current < intervalo()) return
    clearTimeout(espera.current)
    espera.current = setTimeout(() => { if (sujo.current) void versionar('auto', 'Versão automática').catch(() => undefined) }, PAUSA)
  }, [project, carregado, versionar])

  // Ao sair (fechar a aba ou voltar para o início do Editor) com mudanças desde a última versão.
  const versionarRef = useRef(versionar)
  useEffect(() => { versionarRef.current = versionar }, [versionar])
  useEffect(() => {
    const sair = () => { if (sujo.current) void versionarRef.current('auto', 'Ao sair do editor').catch(() => undefined) }
    window.addEventListener('pagehide', sair)
    return () => { window.removeEventListener('pagehide', sair); clearTimeout(espera.current); sair() }
  }, [])

  return {
    lista, aberto, versionar, antes,
    abrir: () => { setAberto(true); setLista(null); void recarregar() },
    fechar: () => setAberto(false),
    renomear: async (v: Version, nome: string) => { await renameVersion(atual.current.id, v.id, nome); await recarregar() },
  }
}
