import { ArrowUp, BookOpen, Globe, Image as ImageIcon, Mic, Plus, Signature, Telescope } from 'lucide-react'
import type { ReactNode } from 'react'
import { Easing, Img, staticFile } from 'remotion'

import { Composer, TEXT, iv, p, pop } from './ChatGptVendasCardReplica'

/**
 * Calling the plugin with "@" in the ChatGPT composer: "@" lists the plugins, "@O" leaves only "Otto ERP",
 * a tap turns it into a mention chip and the request is typed after it. The sent bubble keeps the chip.
 * Coordinates follow the replica's 1792px-tall screen (the reel shifts the bottom chrome up).
 */

export type MentionMessage = { lines: string[]; send: number; typing: number[] }

const OTTO = 'Otto ERP'
const MUTED = '#8e8e8e'

const OttoMark = ({ size }: { size: number }) => <Img src={staticFile('logoOttoIcon.svg')} style={{ flex: 'none', height: size, objectFit: 'contain', width: size }} />

function Chip({ size = 34 }: { size?: number }) {
  return (
    <>
      <OttoMark size={size} />
      <span style={{ marginLeft: 8 }}>{OTTO}</span>
    </>
  )
}

/** Sent request with the plugin chip in front, like "[N] Notion teste". */
export function MentionBubble({ at, frame, lines, top }: { at: number; frame: number; lines: string[]; top: number }) {
  const s = pop(frame, at)
  if (frame < at) return null
  return (
    <div style={{ background: '#f4f4f4', borderRadius: 38, color: TEXT, fontSize: 31, lineHeight: '50px', opacity: s, padding: '24px 34px 22px 30px', position: 'absolute', right: 33, top, transform: `translateY(${(1 - s) * 40}px) scale(${0.96 + s * 0.04})`, transformOrigin: 'right bottom' }}>
      {lines.map((line, i) => (
        <div key={i} style={{ alignItems: 'center', display: 'flex', whiteSpace: 'nowrap' }}>
          {i === 0 ? (
            <>
              <Chip />
              <span style={{ marginLeft: 10 }}>{line}</span>
            </>
          ) : (
            line
          )}
        </div>
      ))}
    </div>
  )
}

const PLUGINS: { icon: ReactNode; label: string }[] = [
  { icon: <ImageIcon color="#2f9bff" size={44} strokeWidth={2} style={iv(44, 2)} />, label: 'Criar imagem' },
  { icon: <Telescope color="#2f6fe8" size={44} strokeWidth={2} style={iv(44, 2)} />, label: 'Pesquisa aprofundada' },
  { icon: <Globe color="#2fa8f0" size={44} strokeWidth={2} style={iv(44, 2)} />, label: 'Buscar' },
  { icon: <BookOpen color="#e0703f" size={44} strokeWidth={2} style={iv(44, 2)} />, label: 'Estudar' },
  { icon: <Signature color={TEXT} size={44} strokeWidth={2} style={iv(44, 2)} />, label: 'Desenhar' },
  { icon: <OttoMark size={44} />, label: OTTO },
]

const BOX_TOP = 1540
const BOX_H = 184
const ROW_H = 96

function SearchCircle() {
  return (
    <svg fill="none" height={50} stroke={TEXT} strokeLinecap="round" strokeWidth={2.2} viewBox="0 0 24 24" width={50}>
      <path d="M4.5 15.5a8.5 8.5 0 1 1 15 0" />
      <circle cx={12} cy={12.5} r={3} />
      <path d="M14.2 14.7l2.3 2.3" />
    </svg>
  )
}

/**
 * Idle: the replica's single-row composer. While `message` is being typed: "@" → plugin list → "@O" → Otto ERP
 * only → tap → chip + request (two-row composer, like the app with text in it).
 */
export function MentionComposer({ frame, message }: { frame: number; message?: MentionMessage }) {
  if (!message || frame < message.typing[0] || frame >= message.send) return <Composer frame={frame} messages={[]} />

  const [t0, t1] = message.typing
  const span = Math.max(1, t1 - t0)
  const atO = t0 + span * 0.18
  const tap = t0 + span * 0.32
  const textFrom = t0 + span * 0.4
  const chip = frame >= tap + 1
  const full = message.lines.join(' ')
  const typed = full.slice(0, Math.floor(full.length * p(frame, textFrom, Math.max(textFrom + 1, t1), [0, 1], Easing.linear)))
  const caret = Math.floor(frame / 8) % 2 === 0
  const pressed = frame >= message.send - 3

  const listOpen = frame < tap + 3
  const rows = frame < atO ? PLUGINS : PLUGINS.slice(-1)
  const listH = frame < atO ? ROW_H * 5.5 + 12 : ROW_H + 24
  const listIn = pop(frame, t0)

  return (
    <>
      {listOpen ? (
        <div style={{ background: '#fff', borderRadius: 44, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', height: listH, left: 24, opacity: listIn * (1 - p(frame, tap + 1, tap + 3)), overflow: 'hidden', padding: '12px 16px', position: 'absolute', right: 24, top: BOX_TOP - 16 - listH, transform: `translateY(${(1 - listIn) * 20}px)` }}>
          {rows.map((row, i) => {
            const highlight = i === 0
            const tapped = row.label === OTTO && frame >= tap && frame < tap + 3
            return (
              <div key={row.label} style={{ alignItems: 'center', background: tapped ? '#e4e4e4' : highlight ? '#f0f0f0' : 'transparent', borderRadius: 30, display: 'flex', gap: 28, height: ROW_H, padding: '0 24px 0 28px' }}>
                <span style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', width: 48 }}>{row.icon}</span>
                <span style={{ color: TEXT, flex: 1, fontSize: 33 }}>{row.label}</span>
                <span style={{ color: MUTED, fontSize: 30 }}>Plugin</span>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* bottom stays put; the text wraps and the box grows upward, like the app */}
      <div style={{ background: '#f0f0f0', borderRadius: 46, left: 24, minHeight: BOX_H, position: 'absolute', right: 24, top: BOX_TOP + BOX_H, transform: 'translateY(-100%)' }}>
        <div style={{ color: TEXT, fontSize: 31, lineHeight: '48px', padding: '31px 34px 0' }}>
          {chip ? (
            <>
              <span style={{ alignItems: 'center', display: 'inline-flex', marginRight: 10, verticalAlign: 'top' }}>
                <Chip />
              </span>
              {typed}
            </>
          ) : (
            frame < atO ? '@' : '@O'
          )}
          {caret ? <span style={{ background: '#2f7cf6', display: 'inline-block', height: 38, marginLeft: 2, verticalAlign: 'middle', width: 3 }} /> : null}
        </div>
        <div style={{ height: 105, position: 'relative' }}>
          <span style={{ left: 30, position: 'absolute', top: 31 }}>
            <Plus color={TEXT} size={46} strokeWidth={2} style={iv(46, 2)} />
          </span>
          <span style={{ left: 516, position: 'absolute', top: 29 }}>
            <SearchCircle />
          </span>
          <span style={{ left: 614, position: 'absolute', top: 29 }}>
            <Mic color={TEXT} size={46} strokeWidth={2} style={iv(46, 2)} />
          </span>
          <span style={{ alignItems: 'center', background: TEXT, borderRadius: 99, display: 'flex', height: 64, justifyContent: 'center', left: 700, position: 'absolute', top: 23, transform: `scale(${pressed ? 0.88 : 1})`, width: 64 }}>
            <ArrowUp color="#fff" size={36} strokeWidth={2.6} style={iv(36, 2.6)} />
          </span>
        </div>
      </div>
    </>
  )
}
