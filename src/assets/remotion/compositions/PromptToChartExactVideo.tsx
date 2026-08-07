import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'

export const PROMPT_TO_CHART_EXACT_DURATION = 300

const PROMPT_SCENE_DURATION = 150
const PROMPT = 'Give me a pie chart showing the energy sources used in these markets'

function progress(frame: number, from: number, to: number, output: [number, number] = [0, 1]) {
  return interpolate(frame, [from, to], output, {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function PromptInputScene() {
  const frame = useCurrentFrame()
  const visibleCharacters = Math.floor(progress(frame, 16, 108, [0, PROMPT.length]))
  const exit = progress(frame, 132, PROMPT_SCENE_DURATION, [1, 0])
  const showCursor = frame < 112 && Math.floor(frame / 10) % 2 === 0

  return (
    <AbsoluteFill style={{ background: '#ffffff', opacity: exit, overflow: 'hidden' }}>
      <Img
        src={staticFile('remotion/prompt-input-reference.png')}
        style={{ height: '100%', objectFit: 'contain', width: '100%' }}
      />

      <div
        style={{
          alignItems: 'center',
          background: '#fdffff',
          display: 'flex',
          height: 43,
          left: 241,
          overflow: 'hidden',
          position: 'absolute',
          top: 334,
          width: 650,
        }}
      >
        <span
          style={{
            color: '#202124',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: 19,
            fontWeight: 400,
            letterSpacing: 0,
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {PROMPT.slice(0, visibleCharacters)}
          {showCursor ? <span style={{ borderRight: '1.5px solid #202124', marginLeft: 1 }}>&nbsp;</span> : null}
        </span>
      </div>

    </AbsoluteFill>
  )
}

function ChartScene() {
  const frame = useCurrentFrame()
  const enter = progress(frame, 0, 20)
  const scale = progress(frame, 0, 34, [0.992, 1])

  return (
    <AbsoluteFill style={{ alignItems: 'center', background: '#ffffff', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
      <Img
        src={staticFile('remotion/chart-reference.png')}
        style={{
          height: '100%',
          objectFit: 'contain',
          opacity: enter,
          transform: `scale(${scale})`,
          width: '100%',
        }}
      />
    </AbsoluteFill>
  )
}

export function PromptToChartExactVideo() {
  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      <Sequence durationInFrames={PROMPT_SCENE_DURATION}>
        <PromptInputScene />
      </Sequence>
      <Sequence from={PROMPT_SCENE_DURATION} durationInFrames={150}>
        <ChartScene />
      </Sequence>
    </AbsoluteFill>
  )
}
