'use client'

import { Player } from '@remotion/player'

import { SimpleExample } from '@/remotion/compositions/SimpleExample'

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
          maxWidth: 1040,
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
              fontSize: 28,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Remotion preview
          </h1>
          <p
            style={{
              color: '#475569',
              fontSize: 15,
              margin: '6px 0 0',
            }}
          >
            Exemplo simples usando Remotion Player dentro do Next.
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
            component={SimpleExample}
            compositionHeight={1080}
            compositionWidth={1920}
            controls
            durationInFrames={150}
            fps={30}
            style={{
              aspectRatio: '16 / 9',
              width: '100%',
            }}
          />
        </div>
      </section>
    </main>
  )
}
