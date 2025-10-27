"use client"

import { useMemo, useState } from "react"
import InsertButton, { type InsertType } from "./InsertButton"
import TriggerNode from "./nodes/TriggerNode"
import ActionNode from "./nodes/ActionNode"
import BranchNode from "./nodes/BranchNode"

type Step = {
  id: string
  type: 'trigger' | 'action' | 'branch' | 'delay'
  text?: string
}

export default function BuilderCanvas() {
  const [steps, setSteps] = useState<Step[]>([
    { id: 's1', type: 'trigger', text: 'New website form submission' },
    { id: 's2', type: 'action', text: 'Add a new app to your Zap' },
    { id: 's3', type: 'action', text: 'Add a new record' },
    { id: 's4', type: 'branch' },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleInsert = (index: number, type: InsertType) => {
    const id = `s${Date.now()}`
    const newStep: Step = {
      id,
      type: type === 'action' ? 'action' : type === 'branch' ? 'branch' : 'delay',
      text: type === 'action' ? 'New action' : undefined,
    }
    setSteps((prev) => {
      const arr = [...prev]
      arr.splice(index + 1, 0, newStep)
      return arr
    })
  }

  const renderStep = (step: Step, index: number) => {
    const commonProps = {
      key: step.id,
      index: index + 1,
      selected: selectedId === step.id,
      onSelect: () => setSelectedId(step.id),
      onDelete: () => removeStep(step.id, index),
    }
    if (step.type === 'trigger') return <TriggerNode {...commonProps} />
    if (step.type === 'action') return <ActionNode {...commonProps} text={step.text} />
    if (step.type === 'branch') return <BranchNode {...commonProps} />
    return (
      <div key={step.id} className="text-sm text-gray-500">Unsupported step</div>
    )
  }

  const removeStep = (id: string, index: number) => {
    const step = steps.find(s => s.id === id)
    if (!step) return
    if (index === 0 && step.type === 'trigger') {
      const ok = window.confirm('Remover o Trigger inicial? Sem um trigger o fluxo não inicia.')
      if (!ok) return
    }
    setSteps(prev => prev.filter(s => s.id !== id))
    setSelectedId(prev => (prev === id ? null : prev))
  }

  // Delete by keyboard
  // Avoid when input is focused
  if (typeof window !== 'undefined') {
    const w = window as Window & { __wf_keydown_attached__?: boolean }
    if (!w.__wf_keydown_attached__) {
      w.addEventListener('keydown', (e) => {
        const active = document.activeElement as HTMLElement | null
        const isEditable = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)
        if (isEditable) return
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
          const idx = steps.findIndex(s => s.id === selectedId)
          if (idx >= 0) {
            e.preventDefault()
            removeStep(selectedId, idx)
          }
        }
      })
      w.__wf_keydown_attached__ = true
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] w-full flex justify-center py-10">
      <div className="w-full max-w-3xl px-4">
        {/* sequência vertical */}
        {steps.map((step, i) => (
          <div key={step.id} className="w-full flex flex-col items-stretch">
            {i === 0 ? (
              <div className="flex flex-col items-center">
                <div className="w-0.5 bg-purple-300/80" style={{ height: 12 }} />
              </div>
            ) : null}
            {renderStep(step, i)}
            {/* Inserção após cada passo */}
            <div className="flex justify-center my-2">
              <InsertButton onInsert={(t) => handleInsert(i, t)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
