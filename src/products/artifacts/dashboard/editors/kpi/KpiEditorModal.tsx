'use client'

import * as React from 'react'

import { ComponentEditorModalShell } from '@/products/artifacts/dashboard/editors/shared/ComponentEditorModalShell'

type KpiDraft = {
  prompt: string
  title: string
  description: string
  format: string
  unit: string
}

export function KpiEditorModal({
  isOpen,
  initialValue,
  onClose,
  onSave,
}: {
  isOpen: boolean
  initialValue: KpiDraft
  onClose: () => void
  onSave: (value: KpiDraft) => void
}) {
  const sectionBackground = '#ffffff'
  const fieldBackground = '#f4f6f8'
  const [value, setValue] = React.useState<KpiDraft>(initialValue)

  React.useEffect(() => {
    if (!isOpen) return
    setValue(initialValue)
  }, [initialValue, isOpen])

  function patch(next: Partial<KpiDraft>) {
    setValue((current) => ({ ...current, ...next }))
  }

  return (
    <ComponentEditorModalShell
      isOpen={isOpen}
      title="Editar KPI"
      description="UI inicial do editor do KPI. Ainda sem persistência no source do artefato."
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
              Campo preparado para orientar a criação e o ajuste futuro do KPI.
            </p>
          </div>
          <textarea
            value={value.prompt}
            onChange={(event) => patch({ prompt: event.target.value })}
            placeholder="Ex.: destacar principal métrica do período e comparação mais relevante."
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
              Texto principal e descrição do KPI.
            </p>
          </div>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Título</span>
            <input
              type="text"
              value={value.title}
              onChange={(event) => patch({ title: event.target.value })}
              placeholder="Receita líquida"
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
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Descrição</span>
            <textarea
              value={value.description}
              onChange={(event) => patch({ description: event.target.value })}
              placeholder="Descrição auxiliar abaixo do valor"
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Formato</div>
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: '#64748b' }}>
              Ajustes visuais básicos do valor exibido.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gap: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            }}
          >
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Formato</span>
              <select
                value={value.format}
                onChange={(event) => patch({ format: event.target.value })}
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
              >
                <option value="number">Number</option>
                <option value="currency">Currency</option>
                <option value="percent">Percent</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Unidade</span>
              <input
                type="text"
                value={value.unit}
                onChange={(event) => patch({ unit: event.target.value })}
                placeholder="%"
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
          </div>
        </section>
      </div>
    </ComponentEditorModalShell>
  )
}
