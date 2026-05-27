import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

export function SimpleExample() {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  })
  const y = interpolate(frame, [0, 45], [36, 0], {
    extrapolateRight: 'clamp',
  })
  const scale = interpolate(frame, [45, 90], [0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        fontFamily: 'Inter, Arial, sans-serif',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          opacity,
          textAlign: 'center',
          transform: `translateY(${y}px) scale(${scale})`,
        }}
      >
        <div
          style={{
            color: '#38bdf8',
            fontSize: 38,
            fontWeight: 700,
            marginBottom: 18,
          }}
        >
          Creatto
        </div>
        <div
          style={{
            fontSize: 82,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          Remotion Preview
        </div>
        <div
          style={{
            color: '#cbd5e1',
            fontSize: 30,
            marginTop: 26,
          }}
        >
          Um exemplo simples animado no navegador.
        </div>
      </div>
    </AbsoluteFill>
  )
}
