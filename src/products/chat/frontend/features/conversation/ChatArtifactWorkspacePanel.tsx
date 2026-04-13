'use client'

import { useEffect, useMemo, useState } from 'react'

import { DashboardArtifactWorkspace } from '@/products/artifacts/dashboard/DashboardArtifactWorkspace'
import type {
  DashboardListItem,
  DashboardSourceVersionListItem,
} from '@/products/artifacts/backend/dashboardArtifactsService'

type ArtifactResponse = {
  artifact_id: string
  title: string
  status: string
  version: number
  current_draft_version: number | null
  metadata: Record<string, unknown>
  source: string
  updated_at: string
}

type Props = {
  selectedArtifactId: string | null
  onSelectArtifactId: (artifactId: string | null) => void
}

function WorkspaceMessage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex h-full items-center justify-center bg-[#F7F7F6] px-8 text-center">
      <div className="max-w-md">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-[#1F1F1D]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#6F6F6A]">{description}</p>
      </div>
    </div>
  )
}

export function ChatArtifactWorkspacePanel({
  selectedArtifactId,
  onSelectArtifactId,
}: Props) {
  const [dashboards, setDashboards] = useState<DashboardListItem[]>([])
  const [artifact, setArtifact] = useState<ArtifactResponse | null>(null)
  const [versions, setVersions] = useState<DashboardSourceVersionListItem[]>([])
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingArtifact, setLoadingArtifact] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeArtifactId = useMemo(() => {
    if (selectedArtifactId && dashboards.some((dashboard) => dashboard.id === selectedArtifactId)) {
      return selectedArtifactId
    }
    return dashboards[0]?.id || null
  }, [dashboards, selectedArtifactId])

  useEffect(() => {
    let cancelled = false

    async function loadDashboards() {
      try {
        setLoadingList(true)
        setError(null)
        const response = await fetch('/api/artifacts/dashboards', { cache: 'no-store' })
        const json = await response.json().catch(() => ({}))
        if (!response.ok || json?.ok === false) {
          throw new Error(String(json?.error || `Falha ao listar dashboards (${response.status})`))
        }
        const nextDashboards = Array.isArray(json?.dashboards) ? (json.dashboards as DashboardListItem[]) : []
        if (cancelled) return
        setDashboards(nextDashboards)
      } catch (nextError) {
        if (cancelled) return
        setError(nextError instanceof Error ? nextError.message : 'Erro ao carregar dashboards')
      } finally {
        if (!cancelled) setLoadingList(false)
      }
    }

    void loadDashboards()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activeArtifactId) {
      onSelectArtifactId(null)
      setArtifact(null)
      setVersions([])
      setSelectedVersion(null)
      return
    }
    if (selectedArtifactId !== activeArtifactId) {
      onSelectArtifactId(activeArtifactId)
    }
  }, [activeArtifactId, onSelectArtifactId, selectedArtifactId])

  useEffect(() => {
    if (!activeArtifactId) return
    let cancelled = false

    async function loadArtifact() {
      try {
        setLoadingArtifact(true)
        setError(null)
        const query = selectedVersion ? `?version=${selectedVersion}` : ''
        const response = await fetch(`/api/artifacts/dashboards/${activeArtifactId}${query}`, { cache: 'no-store' })
        const json = await response.json().catch(() => ({}))
        if (!response.ok || json?.ok === false || !json?.artifact) {
          throw new Error(String(json?.error || `Falha ao carregar dashboard (${response.status})`))
        }
        if (cancelled) return
        setArtifact(json.artifact as ArtifactResponse)
        setVersions(Array.isArray(json?.versions) ? (json.versions as DashboardSourceVersionListItem[]) : [])
      } catch (nextError) {
        if (cancelled) return
        setError(nextError instanceof Error ? nextError.message : 'Erro ao carregar dashboard')
      } finally {
        if (!cancelled) setLoadingArtifact(false)
      }
    }

    void loadArtifact()
    return () => {
      cancelled = true
    }
  }, [activeArtifactId, selectedVersion])

  if (loadingList) {
    return <WorkspaceMessage title="Carregando workspace" description="Buscando dashboards persistidos na base de dados." />
  }

  if (error) {
    return <WorkspaceMessage title="Falha ao carregar workspace" description={error} />
  }

  if (!dashboards.length) {
    return <WorkspaceMessage title="Sem dashboards" description="Nenhum dashboard persistido foi encontrado para abrir no workspace." />
  }

  if (loadingArtifact || !artifact || !activeArtifactId) {
    return <WorkspaceMessage title="Carregando dashboard" description="Preparando o workspace do dashboard selecionado." />
  }

  return (
    <DashboardArtifactWorkspace
      artifactId={artifact.artifact_id}
      dashboards={dashboards}
      title={artifact.title}
      status={artifact.status}
      version={artifact.version}
      currentDraftVersion={artifact.current_draft_version ?? artifact.version}
      metadata={artifact.metadata || {}}
      availableVersions={versions}
      source={artifact.source}
      updatedAt={artifact.updated_at}
      containerHeightClass="h-full"
      allowSourceEditing
      showHeaderStatusBadges={false}
      onSelectDashboard={(dashboardId) => {
        setSelectedVersion(null)
        onSelectArtifactId(dashboardId)
      }}
      onSelectVersion={(version) => {
        setSelectedVersion(version)
      }}
      onSaveSuccess={async () => {
        setSelectedVersion(null)
        const response = await fetch(`/api/artifacts/dashboards/${artifact.artifact_id}`, { cache: 'no-store' })
        const json = await response.json().catch(() => ({}))
        if (response.ok && json?.ok !== false && json?.artifact) {
          setArtifact(json.artifact as ArtifactResponse)
          setVersions(Array.isArray(json?.versions) ? (json.versions as DashboardSourceVersionListItem[]) : [])
        }
      }}
    />
  )
}
