'use client'

import * as React from 'react'

import { ComponentEditorModalShell } from '@/products/artifacts/dashboard/editors/shared/ComponentEditorModalShell'

export type FilterFieldDraft = {
  label: string
  field: string
  variant: string
  mode: string
}

export type FilterDraft = {
  prompt: string
  layout: 'vertical' | 'horizontal'
  applyMode: 'auto' | 'manual'
  fields: FilterFieldDraft[]
}

export function FilterEditorModal({
  isOpen,
  initialValue,
  onClose,
  onSave,
}: {
  isOpen: boolean
  initialValue: FilterDraft
  onClose: () => void
  onSave: (value: FilterDraft) => void
}) {
  const sectionBackground = '#ffffff'
  const fieldBackground = '#f4f6f8'
  const [value, setValue] = React.useState<FilterDraft>(initialValue)

  React.useEffect(() => {
    if (!isOpen) return
    setValue(initialValue)
  }, [initialValue, isOpen])

  function patch(next: Partial<FilterDraft>) {
    setValue((current) => ({ ...current, ...next }))
  }

  return (
    <ComponentEditorModalShell
      isOpen={isOpen}
      title="Editar Filter"
      description="UI inicial do editor do filtro. Ainda sem persistência no source do artefato."
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
              Campo preparado para orientar a criação e o ajuste futuro do filtro.
            </p>
          </div>
          <textarea
            value={value.prompt}
            onChange={(event) => patch({ prompt: event.target.value })}
            placeholder="Ex.: criar filtro horizontal, simples, com foco em período e canal."
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Configuração</div>
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: '#64748b' }}>
              Estrutura básica do container do filtro.
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
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Layout</span>
              <select
                value={value.layout}
                onChange={(event) => patch({ layout: event.target.value })}
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
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Apply mode</span>
              <select
                value={value.applyMode}
                onChange={(event) => patch({ applyMode: event.target.value })}
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
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
            </label>
          </div>
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Campos</div>
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: '#64748b' }}>
              Visão inicial dos campos configurados nesse filtro.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {value.fields.length > 0 ? value.fields.map((field, index) => (
              <div
                key={`filter-field-${index}`}
                style={{
                  display: 'grid',
                  gap: 12,
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  borderRadius: 18,
                  padding: 14,
                  background: fieldBackground,
                }}
              >
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Label</span>
                  <input
                    type="text"
                    value={field.label}
                    readOnly
                    style={{
                      height: 40,
                      border: 'none',
                      borderRadius: 12,
                      padding: '0 12px',
                      fontSize: 13,
                      color: '#0f172a',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Field</span>
                  <input
                    type="text"
                    value={field.field}
                    readOnly
                    style={{
                      height: 40,
                      border: 'none',
                      borderRadius: 12,
                      padding: '0 12px',
                      fontSize: 13,
                      color: '#0f172a',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Variant</span>
                  <input
                    type="text"
                    value={field.variant}
                    readOnly
                    style={{
                      height: 40,
                      border: 'none',
                      borderRadius: 12,
                      padding: '0 12px',
                      fontSize: 13,
                      color: '#0f172a',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Mode</span>
                  <input
                    type="text"
                    value={field.mode}
                    readOnly
                    style={{
                      height: 40,
                      border: 'none',
                      borderRadius: 12,
                      padding: '0 12px',
                      fontSize: 13,
                      color: '#0f172a',
                      outline: 'none',
                      background: '#ffffff',
                    }}
                  />
                </label>
              </div>
            )) : (
              <div
                style={{
                  borderRadius: 18,
                  padding: 16,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: '#64748b',
                  background: fieldBackground,
                }}
              >
                Nenhum campo detectado para esse filtro.
              </div>
            )}
          </div>
        </section>
      </div>
    </ComponentEditorModalShell>
  )
}
