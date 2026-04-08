'use client'

import * as React from 'react'

import { ComponentEditorModalShell } from '@/products/artifacts/dashboard/editors/shared/ComponentEditorModalShell'

type ChartDraft = {
  prompt: string
  chartType: string
  format: string
  height: string
  query: string
}

export function ChartEditorModal({
  isOpen,
  initialValue,
  onClose,
  onSave,
}: {
  isOpen: boolean
  initialValue: ChartDraft
  onClose: () => void
  onSave: (value: ChartDraft) => void
}) {
  const sectionBackground = '#ffffff'
  const fieldBackground = '#f4f6f8'
  const [value, setValue] = React.useState<ChartDraft>(initialValue)

  React.useEffect(() => {
    if (!isOpen) return
    setValue(initialValue)
  }, [initialValue, isOpen])

  function patch(next: Partial<ChartDraft>) {
    setValue((current) => ({ ...current, ...next }))
  }

  return (
    <ComponentEditorModalShell
      isOpen={isOpen}
      title="Editar Chart"
      description="UI inicial do editor do chart. Ainda sem persistência no source do artefato."
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
              Espaço preparado para orientar a geração e ajuste futuro do chart.
            </p>
          </div>
          <textarea
            value={value.prompt}
            onChange={(event) => patch({ prompt: event.target.value })}
            placeholder="Ex.: destacar evolução por período, outliers e comparação com meta."
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
              Controles visuais iniciais do chart.
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
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Tipo</span>
              <select
                value={value.chartType}
                onChange={(event) => patch({ chartType: event.target.value })}
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
                <option value="bar">Bar</option>
                <option value="line">Line</option>
                <option value="pie">Pie</option>
                <option value="horizontal-bar">Horizontal Bar</option>
                <option value="scatter">Scatter</option>
                <option value="radar">Radar</option>
                <option value="treemap">Treemap</option>
                <option value="composed">Composed</option>
                <option value="funnel">Funnel</option>
                <option value="sankey">Sankey</option>
                <option value="gauge">Gauge</option>
              </select>
            </label>

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
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Altura</span>
              <input
                type="text"
                value={value.height}
                onChange={(event) => patch({ height: event.target.value })}
                placeholder="220"
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Query</div>
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: '#64748b' }}>
              Área visual para consulta ou instrução de dados do chart.
            </p>
          </div>
          <textarea
            value={value.query}
            onChange={(event) => patch({ query: event.target.value })}
            placeholder="SELECT ..."
            style={{
              minHeight: 160,
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
      </div>
    </ComponentEditorModalShell>
  )
}
