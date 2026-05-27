'use client'

import { Player } from '@remotion/player'

import { McpChartIntro } from '@/remotion/compositions/McpChartIntro'

export default function RemotionPreviewPage() {
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
            marginBottom: 18,
          }}
        >
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
            Exemplo usando componentes MCP Apps reais dentro do Remotion Player.
          </p>
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
          <Player
            component={McpChartIntro}
            compositionHeight={1920}
            compositionWidth={1080}
            controls
            durationInFrames={510}
            fps={30}
            style={{
              aspectRatio: '9 / 16',
              maxHeight: '82vh',
              width: '100%',
            }}
          />
        </div>
      </section>
    </main>
  )
}
