'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, CheckCircle2, LoaderCircle, Mic, Plus } from 'lucide-react'

type PromptStep = {
  prompt: string
  result: string
  status: string
}

const promptSteps: PromptStep[] = [
  {
    prompt: 'Emita as notas fiscais das minhas últimas vendas.',
    result: 'Notas preparadas para sua confirmação.',
    status: 'Preparando notas fiscais...',
  },
  {
    prompt: 'Concilie as movimentações bancárias desta semana.',
    result: 'Movimentações conciliadas com os lançamentos.',
    status: 'Conciliando movimentações...',
  },
  {
    prompt: 'Classifique as despesas que ainda estão pendentes.',
    result: 'Despesas classificadas nas categorias corretas.',
    status: 'Classificando despesas...',
  },
  {
    prompt: 'Envie cobranças para os clientes em atraso.',
    result: 'Cobranças enviadas e acompanhamentos programados.',
    status: 'Preparando cobranças...',
  },
  {
    prompt: 'Mostre se posso pagar menos imposto dentro da lei.',
    result: 'Cenários tributários analisados pela Otto.',
    status: 'Analisando oportunidades fiscais...',
  },
]

type AnimationPhase = 'clearing' | 'result' | 'submitting' | 'typing'

export function AnimatedHeroPrompt({ variant = 'default' }: { variant?: 'default' | 'fiscal' }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [phase, setPhase] = useState<AnimationPhase>('typing')
  const [reducedMotion, setReducedMotion] = useState(false)
  const [text, setText] = useState('')

  const activeStep = promptSteps[activeIndex]
  const isFiscal = variant === 'fiscal'

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReducedMotion(media.matches)
    const updateVisibility = () => setIsPageVisible(document.visibilityState === 'visible')

    updateMotionPreference()
    updateVisibility()
    media.addEventListener('change', updateMotionPreference)
    document.addEventListener('visibilitychange', updateVisibility)

    return () => {
      media.removeEventListener('change', updateMotionPreference)
      document.removeEventListener('visibilitychange', updateVisibility)
    }
  }, [])

  useEffect(() => {
    if (reducedMotion) {
      setText(promptSteps[0].prompt)
      setActiveIndex(0)
      setPhase('result')
      return
    }

    if (!isPageVisible) return

    if (phase === 'typing') {
      if (text.length < activeStep.prompt.length) {
        const timeout = window.setTimeout(() => {
          setText(activeStep.prompt.slice(0, text.length + 1))
        }, 38)
        return () => window.clearTimeout(timeout)
      }

      const timeout = window.setTimeout(() => setPhase('submitting'), 850)
      return () => window.clearTimeout(timeout)
    }

    if (phase === 'submitting') {
      const timeout = window.setTimeout(() => setPhase('result'), 900)
      return () => window.clearTimeout(timeout)
    }

    if (phase === 'result') {
      const timeout = window.setTimeout(() => setPhase('clearing'), 1700)
      return () => window.clearTimeout(timeout)
    }

    if (text.length > 0) {
      const timeout = window.setTimeout(() => {
        setText((current) => current.slice(0, Math.max(0, current.length - 3)))
      }, 20)
      return () => window.clearTimeout(timeout)
    }

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % promptSteps.length)
      setPhase('typing')
    }, 220)
    return () => window.clearTimeout(timeout)
  }, [activeStep.prompt, isPageVisible, phase, reducedMotion, text])

  const isSubmitting = phase === 'submitting'
  const showResult = phase === 'result'
  const accent = isFiscal ? '#17653a' : '#181818'
  const softAccent = isFiscal ? '#e8f3eb' : '#f0f1f0'

  return (
    <div className="mx-auto mt-10 w-full max-w-[920px] sm:mt-12">
      <p className="mb-4 text-center text-sm font-medium text-[#343934] sm:text-base">Por onde começamos?</p>

      <div
        className="grid h-[66px] w-full items-center gap-2 rounded-full border border-[#d8ddda] bg-white px-2.5 shadow-[0_12px_35px_-25px_rgba(20,35,24,0.45)] sm:grid-cols-[46px_minmax(0,1fr)_42px_48px] sm:px-3"
        style={{ gridTemplateColumns: '42px minmax(0, 1fr) 38px 46px' }}
      >
        <button aria-label="Adicionar contexto" className="grid h-10 w-10 place-items-center rounded-full text-[#343834] transition-colors hover:bg-[#f4f6f4]" title="Adicionar contexto" type="button">
          <Plus className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <div className="min-w-0 overflow-hidden text-left">
          <span className="block truncate text-[14px] text-[#202421] sm:text-[17px]">
            {text}
            {phase === 'typing' && !reducedMotion ? <span aria-hidden className="ml-0.5 inline-block h-[1.05em] w-px animate-pulse bg-[#262a27] align-[-2px]" /> : null}
          </span>
          <span className="sr-only">{activeStep.prompt}</span>
        </div>

        <button aria-label="Usar voz" className="grid h-10 w-10 place-items-center rounded-full text-[#343834] transition-colors hover:bg-[#f4f6f4]" title="Usar voz" type="button">
          <Mic className="h-5 w-5" strokeWidth={1.8} />
        </button>

        <button
          aria-label="Enviar pedido"
          className="grid h-11 w-11 place-items-center rounded-full text-white transition-transform duration-200"
          style={{ backgroundColor: accent, transform: isSubmitting ? 'scale(0.9)' : 'scale(1)' }}
          title="Enviar pedido"
          type="button"
        >
          {isSubmitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ArrowUp className="h-5 w-5" strokeWidth={2.3} />}
        </button>
      </div>

      <div aria-live="polite" className="mt-3 flex h-7 items-center justify-center text-xs sm:text-sm">
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2 text-[#6a706b]"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />{activeStep.status}</span>
        ) : showResult ? (
          <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium" style={{ backgroundColor: softAccent, color: accent }}><CheckCircle2 className="h-3.5 w-3.5" />{activeStep.result}</span>
        ) : null}
      </div>

      <div aria-hidden className="mt-2 flex justify-center gap-1.5">
        {promptSteps.map((step, index) => (
          <span
            className="h-1 rounded-full transition-all duration-300"
            key={step.prompt}
            style={{ backgroundColor: index === activeIndex ? accent : '#dfe3df', width: index === activeIndex ? 20 : 6 }}
          />
        ))}
      </div>
    </div>
  )
}
