'use client'

import * as React from 'react'

import { ComponentEditorModalShell } from '@/products/artifacts/dashboard/editors/shared/ComponentEditorModalShell'

export type EditableInsightItem = {
  title: string
  text: string
}

type InsightScheduleFrequency = 'daily' | 'weekly' | 'no_repeat'

export type InsightSchedule = {
  frequency: InsightScheduleFrequency
  date: string
  time: string
}

export function InsightsEditorModal({
  isOpen,
  initialPrompt,
  initialSchedule,
  onClose,
  onSave,
}: {
  isOpen: boolean
  initialPrompt: string
  initialSchedule: InsightSchedule
  onClose: () => void
  onSave: (value: { prompt: string; schedule: InsightSchedule }) => void
}) {
  const sectionBackground = '#ffffff'
  const fieldBackground = '#f4f6f8'
  const [prompt, setPrompt] = React.useState(initialPrompt)
  const [schedule, setSchedule] = React.useState<InsightSchedule>({
    frequency: 'no_repeat',
    date: '',
    time: '',
  })

  React.useEffect(() => {
    if (!isOpen) return
    setPrompt(initialPrompt)
    setSchedule(initialSchedule)
  }, [initialPrompt, initialSchedule, isOpen])

  function resolveScheduleSummary() {
    if (schedule.frequency === 'no_repeat' && !schedule.date && !schedule.time) {
      return 'Sem agendamento definido. O componente vai usar placeholders ate existir geracao real por IA.'
    }

    const parts = [
      schedule.frequency === 'daily' ? 'Daily' : schedule.frequency === 'weekly' ? 'Weekly' : 'No repeat',
      schedule.date || 'sem data',
      schedule.time || 'sem horario',
    ]
    return `Agendamento configurado: ${parts.join(' · ')}.`
  }

  function handleSave() {
    onSave({
      prompt: prompt.trim(),
      schedule,
    })
  }

  return (
    <ComponentEditorModalShell
      isOpen={isOpen}
      title="Editar Insights"
      description="Editor do bloco de insights baseado em prompt e schedule. Os itens reais nao ficam no source."
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
            gap: 10,
            padding: 18,
            borderRadius: 20,
            background: sectionBackground,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Placeholder</div>
            <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.6, color: '#64748b' }}>
              Os itens exibidos por enquanto sao placeholders locais. O source deve guardar so prompt e schedule.
            </p>
          </div>
          <div
            style={{
              borderRadius: 16,
              padding: '14px 16px',
              background: fieldBackground,
              fontSize: 13,
              lineHeight: 1.7,
              color: '#475569',
            }}
          >
            {resolveScheduleSummary()}
          </div>
        </section>
      </div>
    </ComponentEditorModalShell>
  )
}
