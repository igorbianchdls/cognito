'use client'

import { Player } from '@remotion/player'
import { useState } from 'react'

import { McpChartIntro, type McpTemplate } from '@/remotion/compositions/McpChartIntro'
import { McpOperationsDemo, MCP_OPERATIONS_DEMO_DURATION } from '@/remotion/compositions/McpOperationsDemo'

type PreviewComposition = 'intro' | 'operations'

export default function RemotionPreviewPage() {
  const [composition, setComposition] = useState<PreviewComposition>('operations')
  const [template, setTemplate] = useState<McpTemplate>('chatgpt')
  const isOperationsDemo = composition === 'operations'

  return (
    <main
      style={{
        alignItems: 'center',
        background: '#f8fafc',
        display: 'flex',
        minHeight: '100vh',
        padding: 32,
      }}
    >
      <section
        style={{
          margin: '0 auto',
          maxWidth: 430,
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'flex-start',
            display: 'flex',
            gap: 14,
            justifyContent: 'space-between',
            marginBottom: 18,
          }}
        >
          <div>
            <h1
              style={{
                color: '#0f172a',
                fontSize: 22,
                fontWeight: 700,
                margin: 0,
              }}
            >
              Remotion preview
            </h1>
            <p
              style={{
                color: '#475569',
                fontSize: 13,
                margin: '6px 0 0',
              }}
            >
              Templates mobile com componentes MCP Apps reais.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 8, justifyItems: 'end' }}>
            <div
              style={{
                background: '#e2e8f0',
                borderRadius: 8,
                display: 'inline-flex',
                gap: 2,
                padding: 3,
              }}
            >
              {([
                ['operations', 'Operations'],
                ['intro', 'Intro'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setComposition(value)}
                  style={{
                    background: composition === value ? '#ffffff' : 'transparent',
                    border: 0,
                    borderRadius: 6,
                    color: composition === value ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '7px 9px',
                  }}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            {!isOperationsDemo ? (
              <div
                style={{
                  background: '#e2e8f0',
                  borderRadius: 8,
                  display: 'inline-flex',
                  gap: 2,
                  padding: 3,
                }}
              >
                {(['chatgpt', 'claude'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setTemplate(value)}
                    style={{
                      background: template === value ? '#ffffff' : 'transparent',
                      border: 0,
                      borderRadius: 6,
                      color: template === value ? '#0f172a' : '#64748b',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '7px 9px',
                      textTransform: 'capitalize',
                    }}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 18px 45px rgba(15, 23, 42, 0.10)',
            overflow: 'hidden',
          }}
        >
          {isOperationsDemo ? (
            <Player
              component={McpOperationsDemo}
              compositionHeight={1920}
              compositionWidth={1080}
              controls
              durationInFrames={MCP_OPERATIONS_DEMO_DURATION}
              fps={30}
              style={{
                aspectRatio: '9 / 16',
                maxHeight: '82vh',
                width: '100%',
              }}
            />
          ) : (
            <Player
              component={McpChartIntro}
              compositionHeight={1920}
              compositionWidth={1080}
              controls
              durationInFrames={4200}
              fps={30}
              inputProps={{ template }}
              style={{
                aspectRatio: '9 / 16',
                maxHeight: '82vh',
                width: '100%',
              }}
            />
          )}
        </div>
      </section>
    </main>
  )
}
