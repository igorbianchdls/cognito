'use client'

import type { ThemeOption } from '@/products/bi/shared/themeOptions'

function getThemePreviewStyle(theme: string) {
  const styles: Record<string, { background: string; accent: string; border: string; title: string }> = {
    light: {
      background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 60%, #e2e8f0 100%)',
      accent: '#2563eb',
      border: '#dbe2ea',
      title: '#0f172a',
    },
    blue: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #93c5fd 45%, #1d4ed8 100%)',
      accent: '#1d4ed8',
      border: '#93c5fd',
      title: '#eff6ff',
    },
    dark: {
      background: 'linear-gradient(135deg, #111827 0%, #1f2937 45%, #374151 100%)',
      accent: '#60a5fa',
      border: '#374151',
      title: '#f9fafb',
    },
    black: {
      background: 'linear-gradient(135deg, #050505 0%, #0f0f10 60%, #1c1c1f 100%)',
      accent: '#f59e0b',
      border: '#2a2a2a',
      title: '#f8fafc',
    },
    slate: {
      background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
      accent: '#22d3ee',
      border: '#475569',
      title: '#f8fafc',
    },
    navy: {
      background: 'linear-gradient(135deg, #0b1020 0%, #11203b 55%, #1d4ed8 100%)',
      accent: '#93c5fd',
      border: '#1d4ed8',
      title: '#eff6ff',
    },
    sand: {
      background: 'linear-gradient(135deg, #faf7f0 0%, #f5efe2 55%, #e7dcc6 100%)',
      accent: '#c08457',
      border: '#e7dcc6',
      title: '#3f2d1d',
    },
    charcoal: {
      background: 'linear-gradient(135deg, #111111 0%, #222222 50%, #3b3b3b 100%)',
      accent: '#10b981',
      border: '#3b3b3b',
      title: '#f5f5f5',
    },
    midnight: {
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
      accent: '#38bdf8',
      border: '#1e293b',
      title: '#e2e8f0',
    },
    metro: {
      background: 'linear-gradient(135deg, #141414 0%, #262626 60%, #404040 100%)',
      accent: '#f43f5e',
      border: '#404040',
      title: '#fafafa',
    },
    aero: {
      background: 'linear-gradient(135deg, #dff6ff 0%, #9ad0ec 55%, #4f8fbf 100%)',
      accent: '#0369a1',
      border: '#7dd3fc',
      title: '#082f49',
    },
  }

  return styles[theme] || styles.light
}

interface DashboardThemeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onSelect: (themeValue: string) => void
  selectedTheme: string
  themes: ThemeOption[]
}

export function DashboardThemeModal({
  isOpen,
  onClose,
  onConfirm,
  onSelect,
  selectedTheme,
  themes,
}: DashboardThemeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6 py-10">
      <div className="w-full max-w-[860px] rounded-[24px] bg-white p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
        <div className="mb-5 flex items-start justify-between">
          <div className="text-[28px] font-semibold tracking-[-0.03em] text-[#111111]">Selecionar um tema</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#111111] px-3 py-1 text-[12px] font-medium text-white transition hover:bg-[#2a2a2a]"
          >
            Fechar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-x-4 gap-y-5">
          {themes.map((theme) => {
            const preview = getThemePreviewStyle(theme.value)
            const isSelected = selectedTheme === theme.value

            return (
              <button
                key={theme.value}
                type="button"
                onClick={() => onSelect(theme.value)}
                className="text-left"
              >
                <div
                  className={`relative overflow-hidden rounded-[14px] border transition ${
                    isSelected ? 'border-[#0075E2] shadow-[0_12px_30px_rgba(0,117,226,0.18)]' : 'border-[#ececec]'
                  }`}
                  style={{ background: preview.background }}
                >
                  <div className="h-[106px] w-full p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div
                        className="h-2.5 w-14 rounded-full"
                        style={{ backgroundColor: preview.accent }}
                      />
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: preview.border }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div
                        className="w-[56%] text-[12px] font-semibold tracking-[-0.03em]"
                        style={{ color: preview.title }}
                      >
                        {theme.label}
                      </div>
                      <div
                        className="h-2.5 w-[68%] rounded-full opacity-80"
                        style={{ backgroundColor: `${preview.title}20` }}
                      />
                      <div
                        className="h-2.5 w-[42%] rounded-full opacity-65"
                        style={{ backgroundColor: `${preview.title}16` }}
                      />
                    </div>
                  </div>
                  {isSelected ? (
                    <div className="absolute inset-x-0 bottom-0 h-[4px] bg-[#0075E2]" />
                  ) : null}
                </div>
                <div
                  className="pt-2 text-center text-[15px] font-medium tracking-[-0.02em]"
                  style={{ color: isSelected ? '#0075E2' : '#111111' }}
                >
                  {theme.label}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-7 flex justify-end">
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[12px] bg-[#9b9b9b] px-5 py-3 text-[15px] font-medium tracking-[-0.02em] text-white transition hover:bg-[#7f7f7f]"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
