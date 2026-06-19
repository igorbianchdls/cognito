'use client'

import { Player } from '@remotion/player'

import { IntegrationHubOrbitOnlyAnimation } from '@/assets/remotion/compositions/ChatGptMobileMarketing'

const DURATION_IN_FRAMES = 240
const FPS = 30
const WIDTH = 1080
const HEIGHT = 1920

export default function RemotionPreview02Page() {
  return (
    <main
      style={{
        alignItems: 'center',
        background: '#f5f7fb',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e3e8ef',
          borderRadius: 18,
          boxShadow: '0 24px 70px rgba(16, 24, 40, 0.10)',
          overflow: 'hidden',
          padding: 12,
          width: 'min(420px, 100%)',
        }}
      >
        <Player
          component={IntegrationHubOrbitOnlyAnimation}
          compositionHeight={HEIGHT}
          compositionWidth={WIDTH}
          controls
          durationInFrames={DURATION_IN_FRAMES}
          fps={FPS}
          style={{
            aspectRatio: `${WIDTH} / ${HEIGHT}`,
            background: '#ffffff',
            borderRadius: 12,
            width: '100%',
          }}
        />
      </div>
    </main>
  )
}
