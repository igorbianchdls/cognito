'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, ExternalLink, MoreHorizontal, Presentation } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ArtifactWorkspacePage } from '@/products/artifacts/core/workspace/ArtifactWorkspacePage'
import type { ArtifactKind, ArtifactTreeNode } from '@/products/artifacts/core/types/artifactTypes'
import { parseDocumentJsxToTree } from '@/products/artifacts/document/language/parseDocumentJsx'
import { DocumentRenderer } from '@/products/artifacts/document/runtime/DocumentRenderer'

type DocumentKind = Extract<ArtifactKind, 'report' | 'slide'>

type DocumentArtifactPageProps = {
  artifactId: string
  kind: DocumentKind
  source: string
  title?: string | null
  embedMode?: boolean
}

type PendingAction = 'copy' | 'present' | 'rename' | 'delete' | null

export function DocumentArtifactPage({
  artifactId,
  kind,
  source,
  title,
  embedMode,
}: DocumentArtifactPageProps) {
  const router = useRouter()
  const presentationRef = useRef<HTMLDivElement | null>(null)
  const [tree, setTree] = useState<ArtifactTreeNode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fallbackTitle = kind === 'report' ? 'Report' : 'Slides'
  const [displayTitle, setDisplayTitle] = useState(title || fallbackTitle)
  const [renameTitle, setRenameTitle] = useState(title || fallbackTitle)
  const [copied, setCopied] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    const nextTitle = title || fallbackTitle
    setDisplayTitle(nextTitle)
    setRenameTitle(nextTitle)
  }, [fallbackTitle, title])

  useEffect(() => {
    let cancelled = false

    async function parseSource() {
      try {
        setError(null)
        const parsedTree = await parseDocumentJsxToTree(kind, kind === 'report' ? 'report.tsx' : 'deck.tsx', [
          { path: kind === 'report' ? 'report.tsx' : 'deck.tsx', content: source },
        ])
        if (!cancelled) setTree(parsedTree)
      } catch (parseError) {
        if (!cancelled) {
          setTree(null)
          setError(parseError instanceof Error ? parseError.message : `Falha ao renderizar ${kind}`)
        }
      }
    }

    void parseSource()
    return () => {
      cancelled = true
    }
  }, [kind, source])

  async function copyCurrentLink() {
    setPendingAction('copy')
    setActionError(null)
    try {
      const currentUrl = window.location.href
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = currentUrl
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setActionError('Não foi possível copiar o link.')
    } finally {
      setPendingAction(null)
    }
  }

  async function presentSlides() {
    if (kind !== 'slide') return
    setPendingAction('present')
    setActionError(null)
    try {
      await presentationRef.current?.requestFullscreen()
    } catch {
      setActionError('Não foi possível entrar em tela cheia.')
    } finally {
      setPendingAction(null)
    }
  }

  function openInNewTab() {
    window.open(window.location.href, '_blank', 'noopener,noreferrer')
  }

  async function renameArtifact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextTitle = renameTitle.trim()
    if (!nextTitle) {
      setActionError('Informe um título.')
      return
    }

    setPendingAction('rename')
    setActionError(null)
    try {
      const response = await fetch(`/api/artifacts/${kind === 'slide' ? 'slides' : 'reports'}/${artifactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', title: nextTitle }),
      })
      if (!response.ok) throw new Error('rename failed')
      setDisplayTitle(nextTitle)
      setRenameOpen(false)
      router.refresh()
    } catch {
      setActionError('Não foi possível renomear.')
    } finally {
      setPendingAction(null)
    }
  }

  async function deleteArtifact() {
    setPendingAction('delete')
    setActionError(null)
    try {
      const response = await fetch(`/api/artifacts/${kind === 'slide' ? 'slides' : 'reports'}/${artifactId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('delete failed')
      router.push(`/artifacts/${kind === 'slide' ? 'slides' : 'reports'}`)
      router.refresh()
    } catch {
      setActionError('Não foi possível excluir.')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <ArtifactWorkspacePage initialData={{ ui: {}, filters: {}, document: {} }}>
      <main className={embedMode ? 'min-h-screen bg-white' : 'min-h-screen bg-[#f7f7f6]'}>
        {!embedMode ? (
          <header className="flex items-center justify-between gap-4 border-b border-black/10 bg-white px-5 py-3">
            <h1 className="min-w-0 truncate text-sm font-medium text-neutral-900">{displayTitle}</h1>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyCurrentLink}
                disabled={pendingAction === 'copy'}
              >
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar link'}</span>
              </Button>
              {kind === 'slide' ? (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={presentSlides}
                  disabled={pendingAction === 'present'}
                >
                  <Presentation className="h-4 w-4" />
                  <span className="hidden sm:inline">Apresentar</span>
                </Button>
              ) : null}
              <Button type="button" variant="ghost" size="sm" onClick={openInNewTab}>
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Abrir em nova aba</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" aria-label="Mais ações">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem]">
                  <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-700 focus:text-red-700"
                    onSelect={() => setDeleteOpen(true)}
                  >
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        ) : null}
        {actionError ? (
          <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700">{actionError}</div>
        ) : null}
        {error ? (
          <div className="p-4 text-sm text-red-700">{error}</div>
        ) : tree ? (
          <div ref={presentationRef} className="min-h-screen bg-[#f7f7f6]">
            <DocumentRenderer tree={tree} kind={kind} />
          </div>
        ) : (
          <div className="p-4 text-sm text-neutral-500">Carregando {fallbackTitle.toLowerCase()}...</div>
        )}
      </main>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <form onSubmit={renameArtifact}>
            <DialogHeader>
              <DialogTitle>Renomear {kind === 'slide' ? 'slides' : 'report'}</DialogTitle>
              <DialogDescription>Atualize o título exibido na lista e no header.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                autoFocus
                aria-label="Título"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pendingAction === 'rename'}>
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {kind === 'slide' ? 'slides' : 'report'}</DialogTitle>
            <DialogDescription>
              Esta ação remove o artifact da lista. Não será possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={deleteArtifact} disabled={pendingAction === 'delete'}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ArtifactWorkspacePage>
  )
}
