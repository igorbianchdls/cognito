'use client'

import * as React from 'react'

import { ComponentEditorModalShell } from '@/products/artifacts/dashboard/editors/shared/ComponentEditorModalShell'

type HeaderDraft = {
  prompt: string
  eyebrow: string
  title: string
  subtitle: string
}

export function HeaderEditorModal({
  isOpen,
  initialValue,
  onClose,
  onSave,
}: {
  isOpen: boolean
  initialValue: HeaderDraft
  onClose: () => void
  onSave: (value: HeaderDraft) => void
}) {
  const sectionBackground = '#ffffff'
  const fieldBackground = '#f4f6f8'
  const [value, setValue] = React.useState<HeaderDraft>(initialValue)

  React.useEffect(() => {
    if (!isOpen) return
    setValue(initialValue)
  }, [initialValue, isOpen])

  function patch(next: Partial<HeaderDraft>) {
    setValue((current) => ({ ...current, ...next }))
  }

  return (
    <ComponentEditorModalShell
      isOpen={isOpen}
      title="Editar Header"
      description="UI inicial do editor do header. Ainda sem persistência no source do artefato."
      onClose={onClose}
      footer={(
        <>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            As mudanças ficam só na UI da sessão por enquanto.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                border: '1px solid #dbe2ea',
                background: '#ffffff',
                color: '#334155',
                borderRadius: 14,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave(value)}
              style={{
                border: 'none',
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: 14,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Salvar
            </button>
          </div>
        </>
      )}
    >
      <div style={{ display: 'grid', gap: 20 }}>
        <section
          style={{
            display: 'grid',
            gap: 10,
            padding: 18,
            borderRadius: 20,
            background: sectionBackground,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Prompt</div>
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: '#64748b' }}>
              Campo preparado para orientar a composição futura do header.
            </p>
          </div>
          <textarea
            value={value.prompt}
            onChange={(event) => patch({ prompt: event.target.value })}
            placeholder="Ex.: criar header executivo com foco no período, contexto e chamada principal."
            style={{
              minHeight: 120,
              resize: 'vertical',
              border: 'none',
              borderRadius: 16,
              padding: '14px 16px',
              fontSize: 14,
              lineHeight: 1.65,
              color: '#0f172a',
              outline: 'none',
              background: fieldBackground,
            }}
          />
        </section>

        <section
          style={{
            display: 'grid',
            gap: 12,
            padding: 18,
            borderRadius: 20,
            background: sectionBackground,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Conteúdo</div>
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: '#64748b' }}>
              Estrutura textual principal do header.
            </p>
          </div>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Eyebrow</span>
            <input
              type="text"
              value={value.eyebrow}
              onChange={(event) => patch({ eyebrow: event.target.value })}
              placeholder="Visão geral"
              style={{
                height: 44,
                border: 'none',
                borderRadius: 14,
                padding: '0 14px',
                fontSize: 14,
                color: '#0f172a',
                outline: 'none',
                background: fieldBackground,
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Título</span>
            <input
              type="text"
              value={value.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="Resumo executivo do dashboard"
              style={{
                height: 44,
                border: 'none',
                borderRadius: 14,
                padding: '0 14px',
                fontSize: 14,
                color: '#0f172a',
                outline: 'none',
                background: fieldBackground,
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Subtitle</span>
            <textarea
              value={value.subtitle}
              onChange={(event) => patch({ subtitle: event.target.value })}
              placeholder="Texto de apoio abaixo do título principal"
              style={{
                minHeight: 120,
                resize: 'vertical',
                border: 'none',
                borderRadius: 14,
                padding: '12px 14px',
                fontSize: 14,
                lineHeight: 1.65,
                color: '#0f172a',
                outline: 'none',
                background: fieldBackground,
              }}
            />
          </label>
        </section>
      </div>
    </ComponentEditorModalShell>
  )
}
