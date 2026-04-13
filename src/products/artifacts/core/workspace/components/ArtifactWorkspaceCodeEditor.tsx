'use client'

import { Icon } from '@iconify/react'
import { Editor } from '@monaco-editor/react'

import type { ArtifactCodeFile } from '@/products/artifacts/core/workspace/types'

function resolveEditorLanguage(file: ArtifactCodeFile | undefined) {
  if (!file) return 'plaintext'
  if (file.extension === 'tsx' || file.extension === 'ts') return 'typescript'
  if (file.extension === 'jsx' || file.extension === 'js') return 'javascript'
  if (file.extension === 'json') return 'json'
  if (file.extension === 'md') return 'markdown'
  return file.language || 'plaintext'
}

export function ArtifactWorkspaceCodeEditor({
  file,
  selectableFiles,
  selectedSelectablePath,
  onSelectSelectable,
  selectableLabel = 'Arquivo',
  editable = false,
  disabled = false,
  onChange,
}: {
  file: ArtifactCodeFile | undefined
  selectableFiles: ArtifactCodeFile[]
  selectedSelectablePath: string
  onSelectSelectable: (path: string) => void
  selectableLabel?: string
  editable?: boolean
  disabled?: boolean
  onChange?: (content: string) => void
}) {
  const lines = (file?.content ?? '').split('\n')
  const breadcrumbs = file?.path.split('/') ?? []

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#FFFFFF]">
      <div className="border-b border-[#E3E3DF] bg-[#FAFAF8]">
        <div className="flex items-center justify-between gap-3 px-4 pt-2">
          <div className="flex items-center gap-2 rounded-t-md border border-b-0 border-[#E3E3DF] bg-white px-3 py-2 text-[13px] text-[#2B2B28]">
            <Icon icon="solar:code-file-bold" className="h-4 w-4 text-[#6D6D67]" />
            <span>{file?.name ?? 'Sem arquivo'}</span>
            <Icon icon="solar:close-circle-outline" className="h-3.5 w-3.5 text-[#9B9B95]" />
          </div>
          <label className="flex items-center gap-2 pb-2 text-[12px] text-[#6E6E68]">
            <span>{selectableLabel}</span>
            <select
              value={selectedSelectablePath}
              onChange={(event) => onSelectSelectable(event.target.value)}
              className="h-8 rounded-md border border-[#D9D9D4] bg-white px-2 text-[12px] text-[#2B2B28] outline-none"
            >
              {selectableFiles.map((selectableFile) => (
                <option key={selectableFile.path} value={selectableFile.path}>
                  {selectableFile.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2 border-t border-[#ECECE8] px-4 py-2 text-[12px] text-[#7A7A74]">
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb}-${index}`} className="flex items-center gap-2">
              {index > 0 ? <Icon icon="solar:alt-arrow-right-outline" className="h-3 w-3" /> : null}
              <span>{crumb}</span>
            </div>
          ))}
        </div>
      </div>
      <div className={`min-h-0 flex-1 ${editable ? 'flex overflow-hidden' : 'overflow-auto'}`}>
        {editable ? (
          <div className="flex min-h-0 flex-1">
            <Editor
              height="100%"
              language={resolveEditorLanguage(file)}
              value={file?.content ?? ''}
              onChange={(value) => onChange?.(value ?? '')}
              theme="vs-dark"
              options={{
                readOnly: disabled,
                automaticLayout: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'off',
                lineNumbers: 'on',
                fontSize: 13,
                lineHeight: 28,
                tabSize: 2,
                insertSpaces: true,
                padding: { top: 16, bottom: 16 },
                fontFamily: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderLineHighlight: 'gutter',
              }}
            />
          </div>
        ) : (
          <div className="min-h-full min-w-full w-max bg-white">
            {lines.map((line, index) => (
              <div key={index} className="flex font-mono text-[13px] leading-7">
                <div className="shrink-0 select-none border-r border-[#EFEFEA] px-4 text-right text-[#A0A09A]">
                  {index + 1}
                </div>
                <pre className="px-4 text-[#2E2E2B]">
                  <code>{line || ' '}</code>
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
