'use client'

import { useEffect, useRef, useState, type ComponentProps, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, ExternalLink, MoreHorizontal, Pencil, Presentation, Trash2 } from 'lucide-react'

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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

function HeaderIconButton({
  label,
  children,
  ...props
}: ComponentProps<typeof Button> & {
  label: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

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
  const artifactLabel = kind === 'slide' ? 'Slides' : 'Report'
  const artifactPluralLabel = kind === 'slide' ? 'slides' : 'report'
  const artifactCollectionPath = kind === 'slide' ? 'slides' : 'reports'

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
      const response = await fetch(`/api/artifacts/${artifactCollectionPath}/${artifactId}`, {
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
      const response = await fetch(`/api/artifacts/${artifactCollectionPath}/${artifactId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('delete failed')
      router.push(`/artifacts/${artifactCollectionPath}`)
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
          <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-4 border-b border-neutral-200/80 bg-white/95 px-4 py-2.5 backdrop-blur">
            <div className="min-w-0">
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">{artifactLabel}</div>
              <h1 className="mt-0.5 min-w-0 truncate text-[15px] font-semibold leading-5 text-neutral-950">{displayTitle}</h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <HeaderIconButton
                label={copied ? 'Link copiado' : 'Copiar link'}
                type="button"
                variant="outline"
                size="icon"
                onClick={copyCurrentLink}
                disabled={pendingAction === 'copy'}
                className="size-8 bg-white text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-neutral-950"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">{copied ? 'Link copiado' : 'Copiar link'}</span>
              </HeaderIconButton>

              <HeaderIconButton
                label="Abrir em nova aba"
                type="button"
                variant="outline"
                size="icon"
                onClick={openInNewTab}
                className="size-8 bg-white text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-neutral-950"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">Abrir em nova aba</span>
              </HeaderIconButton>

              {kind === 'slide' ? (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={presentSlides}
                  disabled={pendingAction === 'present'}
                  className="h-8 rounded-md px-3 shadow-xs"
                >
                  <Presentation className="h-4 w-4" />
                  <span className="hidden sm:inline">Apresentar</span>
                </Button>
              ) : null}

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Mais ações"
                        className="size-8 bg-white text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-neutral-950"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Mais ações</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  <DropdownMenuItem className="gap-2" onSelect={() => setRenameOpen(true)}>
                    <Pencil className="h-4 w-4 text-neutral-500" />
                    Renomear
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 text-red-700 focus:text-red-700"
                    onSelect={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
        ) : null}
        {actionError ? (
          <div className="px-4 pt-3">
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</div>
          </div>
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
        <DialogContent className="sm:max-w-md">
          <form onSubmit={renameArtifact}>
            <DialogHeader>
              <DialogTitle>Renomear {artifactPluralLabel}</DialogTitle>
              <DialogDescription>Atualize o título exibido no header e na lista.</DialogDescription>
            </DialogHeader>
            <div className="py-5">
              <Input
                value={renameTitle}
                onChange={(event) => setRenameTitle(event.target.value)}
                autoFocus
                aria-label="Título"
                className="border border-neutral-200 bg-white"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir {artifactPluralLabel}</DialogTitle>
            <DialogDescription>
              Esta ação remove o artifact da lista. Não será possível desfazer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
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
