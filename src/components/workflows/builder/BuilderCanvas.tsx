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
    if (step.type === 'trigger') return <TriggerNode key={step.id} index={index + 1} />
    if (step.type === 'action') return <ActionNode key={step.id} index={index + 1} text={step.text} />
    if (step.type === 'branch') return <BranchNode key={step.id} index={index + 1} />
    return (
      <div key={step.id} className="text-sm text-gray-500">Unsupported step</div>
    )
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

