'use client'

import * as React from 'react'

import { ComponentEditorModalShell } from '@/products/artifacts/dashboard/editors/shared/ComponentEditorModalShell'

export type EditableInsightItem = {
  title: string
  text: string
}

type InsightScheduleFrequency = 'daily' | 'weekly' | 'no_repeat'

export function InsightsEditorModal({
  isOpen,
  initialPrompt,
  initialItems,
  onClose,
  onSave,
}: {
  isOpen: boolean
  initialPrompt: string
  initialItems: EditableInsightItem[]
  onClose: () => void
  onSave: (value: { prompt: string; items: EditableInsightItem[] }) => void
}) {
  const sectionBackground = '#ffffff'
  const fieldBackground = '#f4f6f8'
  const [prompt, setPrompt] = React.useState(initialPrompt)
  const [items, setItems] = React.useState<EditableInsightItem[]>(initialItems)
  const [schedule, setSchedule] = React.useState<{
    frequency: InsightScheduleFrequency
    date: string
    time: string
  }>({
    frequency: 'no_repeat',
    date: '',
    time: '',
  })

  React.useEffect(() => {
    if (!isOpen) return
    setPrompt(initialPrompt)
    setItems(initialItems)
    setSchedule({
      frequency: 'no_repeat',
      date: '',
      time: '',
    })
  }, [initialItems, initialPrompt, isOpen])

  function updateItem(index: number, patch: Partial<EditableInsightItem>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  function handleSave() {
    onSave({
      prompt: prompt.trim(),
      items: items
        .map((item) => ({
          title: item.title.trim(),
          text: item.text.trim(),
        }))
        .filter((item) => item.title || item.text),
    })
  }

  return (
    <ComponentEditorModalShell
      isOpen={isOpen}
      title="Editar Insights"
      description="UI inicial do editor para ajustar prompt, títulos e textos do bloco de insights."
      onClose={onClose}
      footer={(
        <>
          <div
            style={{
              fontSize: 12,
              color: '#64748b',
              lineHeight: 1.5,
            }}
          >
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
              onClick={handleSave}
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
      <div
        style={{
          display: 'grid',
          gap: 20,
        }}
      >
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
              Campo preparado para o fluxo futuro de geração/regeneração dos insights.
            </p>
          </div>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ex.: destaque aceleração de receita, concentração por canal e sinais de conversão."
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
            gap: 10,
            padding: 18,
            borderRadius: 20,
            background: sectionBackground,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Schedule</div>
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: '#64748b' }}>
              Agendamento visual da execução futura desse bloco.
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
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Frequência</span>
              <select
                value={schedule.frequency}
                onChange={(event) => {
                  setSchedule((current) => ({
                    ...current,
                    frequency: event.target.value as InsightScheduleFrequency,
                  }))
                }}
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
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="no_repeat">No repeat</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Data</span>
              <input
                type="date"
                value={schedule.date}
                onChange={(event) => {
                  setSchedule((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }}
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
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Horário</span>
              <input
                type="time"
                value={schedule.time}
                onChange={(event) => {
                  setSchedule((current) => ({
                    ...current,
                    time: event.target.value,
                  }))
                }}
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
            gap: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Itens</div>
              <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: '#64748b' }}>
                Edição visual dos conteúdos já exibidos no componente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setItems((current) => [...current, { title: '', text: '' }])}
              style={{
                border: '1px solid #dbe2ea',
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: 14,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Adicionar item
            </button>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {items.map((item, index) => (
              <div
                key={`insight-editor-item-${index}`}
                style={{
                  display: 'grid',
                  gap: 10,
                  padding: 18,
                  borderRadius: 20,
                  background: sectionBackground,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                    Item {index + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#b91c1c',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Remover
                  </button>
                </div>

                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Título</span>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(event) => updateItem(index, { title: event.target.value })}
                    placeholder="Título opcional"
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
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Texto</span>
                  <textarea
                    value={item.text}
                    onChange={(event) => updateItem(index, { text: event.target.value })}
                    placeholder="Texto do insight"
                    style={{
                      minHeight: 110,
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
              </div>
            ))}
          </div>
        </section>
      </div>
    </ComponentEditorModalShell>
  )
}
