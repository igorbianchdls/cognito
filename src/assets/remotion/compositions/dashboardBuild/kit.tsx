import type { CSSProperties, ReactNode } from 'react'

// Shared look for the "Criando um Dashboard" videos: colors, icons and small building blocks for cards.

export const ink = '#0b1534', muted = '#5b6478', grid = '#e7ebf3', blue = '#1d6ff2', green = '#16a34a', red = '#dc2626'

export type IconName = 'home' | 'megaphone' | 'layers' | 'image' | 'users' | 'grid' | 'bars' | 'eye' | 'cursor' | 'target' | 'coins' | 'calendar' | 'chevron' | 'arrow' | 'info'
  | 'dots' | 'down' | 'heart' | 'play' | 'comment' | 'reels' | 'story' | 'female' | 'male' | 'key' | 'percent' | 'card' | 'monitor' | 'phone' | 'tablet' | 'sparkle' | 'search' | 'screen' | 'chevronRight'
const iconPaths: Record<IconName, string> = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  megaphone: 'M3 10v4a1 1 0 0 0 1 1h3l7 4V5L7 9H4a1 1 0 0 0-1 1zM7 15l1.5 5M18 8.5a5 5 0 0 1 0 7',
  layers: 'M12 3l9 5-9 5-9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5',
  image: 'M4 4h16v16H4zM9 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM4 17l5-5 4 4 3-3 4 4',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 7',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  bars: 'M5 20v-6M12 20V8M19 20V4',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  cursor: 'M5 3l14 7-6 2-2 6z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12.5v-1',
  coins: 'M12 9c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  chevron: 'M6 9l6 6 6-6',
  chevronRight: 'M9 6l6 6-6 6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8v.5',
  dots: 'M12 5v.5M12 12v.5M12 19v.5',
  down: 'M12 5v14M6 13l6 6 6-6',
  heart: 'M12 20s-7.5-4.6-9.2-9.4A5 5 0 0 1 12 6.3a5 5 0 0 1 9.2 4.3C19.5 15.4 12 20 12 20z',
  play: 'M7 4.5l12 7.5-12 7.5z',
  comment: 'M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z',
  reels: 'M4 4h16v16H4zM4 9h16M9 4l2.5 5M15 4l2.5 5M10.5 12.5v5l4-2.5z',
  story: 'M12 3a9 9 0 1 1-8.5 6M12 8.5v7M8.5 12h7',
  female: 'M12 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 12.5v8M8.5 17h7',
  male: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21a7 7 0 0 1 14 0',
  key: 'M15 3a6 6 0 1 1-5.2 9L3 18.8V21h3v-2h2v-2h2l1.2-1.2A6 6 0 0 1 15 3zM16.5 7.5v.5',
  percent: 'M19 5L5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  card: 'M3 6h18v12H3zM3 10h18M7 15h4',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  phone: 'M7 2h10v20H7zM11 18h2',
  tablet: 'M5 3h14v18H5zM11 17h2',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  screen: 'M3 5h18v12H3zM3 14h18',
}
export function Icon({ name, size = 24, color = 'currentColor', width = 2 }: { name: IconName; size?: number; color?: string; width?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'block' }}>
    <path d={iconPaths[name]} />
  </svg>
}

export const card: CSSProperties = { position: 'absolute', inset: 0, background: '#fff', borderRadius: 20, boxShadow: '0 1px 2px rgb(16 24 40 / .04), 0 10px 30px rgb(16 24 40 / .06), 0 0 0 1px #e9edf5' }
export const text = (style: CSSProperties, children: ReactNode) => <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', ...style }}>{children}</div>
export const cardTitle = (t: ReactNode, extra?: ReactNode) => text({ gap: 10, color: ink, fontSize: 23, fontWeight: 700, letterSpacing: -0.3 }, <>{t}{extra}</>)
export const num = (v: number, cents = false) => v.toLocaleString('pt-BR', { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })

/** An up or down arrow followed by the change, e.g. "↑ +12,8%". */
export function Change({ v, up, color = green, size = 19 }: { v: string; up: boolean; color?: string; size?: number }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color, fontSize: size, fontWeight: 700 }}>
    <span style={{ transform: `rotate(${up ? -90 : 90}deg)`, display: 'inline-flex' }}><Icon name="arrow" size={size + 1} color={color} width={2.6} /></span>{v}
  </span>
}

/** Smooth line through the points (Catmull-Rom as cubic Béziers). */
export function smooth(pts: (readonly [number, number])[]) {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

/** Google Ads mark, drawn with shapes: a yellow and a blue bar meeting at the top, and a green dot. */
export function GoogleAdsLogo({ size = 46 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" style={{ flexShrink: 0, display: 'block' }}>
    <path d="M10.5 37 L22 11" stroke="#FBBC04" strokeWidth={11} strokeLinecap="round" />
    <path d="M26 11 L38 37" stroke="#4285F4" strokeWidth={11} strokeLinecap="round" />
    <circle cx={10.5} cy={37} r={5.8} fill="#34A853" />
  </svg>
}

/** Meta mark, drawn as a stretched infinity loop in Meta blue. */
export function MetaLogo({ size = 46 }: { size?: number }) {
  return <svg width={size * 1.5} height={size} viewBox="0 0 72 48" style={{ flexShrink: 0, display: 'block' }}>
    <defs><linearGradient id="meta-logo" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#0064E0" /><stop offset="0.5" stopColor="#0082FB" /><stop offset="1" stopColor="#0064E0" /></linearGradient></defs>
    <path d="M36 21 C30 12 25 9 19 9 C11 9 6 18 6 27 C6 34 9 39 15 39 C21 39 26 32 36 21 C46 9 51 9 56 9 C63 9 66 18 66 27 C66 34 63 39 57 39 C51 39 46 32 36 21 Z"
      fill="none" stroke="url(#meta-logo)" strokeWidth={7} strokeLinejoin="round" />
  </svg>
}

export type Scene = 'chair' | 'kitchen' | 'sofa'
/** Simple made-up product photos: warm interiors drawn with shapes. */
export function SceneArt({ scene }: { scene: Scene }) {
  return <svg viewBox="0 0 160 140" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
    <defs><linearGradient id={`wall-${scene}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f1e4d3" /><stop offset="1" stopColor="#dcc3a3" /></linearGradient></defs>
    <rect width={160} height={140} fill={`url(#wall-${scene})`} />
    <rect y={108} width={160} height={32} fill="#c9a47c" />
    {scene === 'chair' && <g>
      <rect x={20} y={20} width={2} height={88} fill="#d8c2a6" />
      <rect x={52} y={44} width={58} height={44} rx={14} fill="#ead9c3" />
      <rect x={44} y={70} width={74} height={22} rx={10} fill="#f3e6d4" />
      <rect x={40} y={60} width={12} height={32} rx={6} fill="#e4d0b6" /><rect x={110} y={60} width={12} height={32} rx={6} fill="#e4d0b6" />
      <path d="M50 92l-4 18M112 92l4 18" stroke="#8a6a48" strokeWidth={3} strokeLinecap="round" />
      <rect x={124} y={84} width={20} height={24} rx={3} fill="#a37b52" />
    </g>}
    {scene === 'kitchen' && <g>
      <rect x={0} y={78} width={160} height={30} fill="#b88a5c" />
      <rect x={0} y={74} width={160} height={6} fill="#efe6da" />
      {[8, 48, 88, 128].map(x => <rect key={x} x={x} y={84} width={32} height={20} rx={2} fill="#c79a6b" />)}
      <rect x={10} y={22} width={140} height={22} rx={2} fill="#c49468" />
      <rect x={14} y={46} width={132} height={3} fill="#ffe7b0" opacity={0.9} />
      <circle cx={40} cy={64} r={6} fill="#e9dccb" /><rect x={100} y={58} width={10} height={16} rx={2} fill="#8fa77e" />
    </g>}
    {scene === 'sofa' && <g>
      <rect x={24} y={58} width={90} height={30} rx={10} fill="#e2d2bd" />
      <rect x={18} y={78} width={104} height={24} rx={10} fill="#ecdfcd" />
      <path d="M28 102l-2 8M112 102l2 8" stroke="#8a6a48" strokeWidth={3} strokeLinecap="round" />
      <rect x={128} y={88} width={18} height={20} rx={3} fill="#efe6da" />
      {[[-30, 0], [0, -6], [28, 2], [-14, -14], [16, -16]].map(([r, dy], i) => <ellipse key={i} cx={137} cy={70 + dy} rx={6} ry={18} fill={i % 2 ? '#5f8a4b' : '#77a35d'} transform={`rotate(${r} 137 ${88})`} />)}
    </g>}
  </svg>
}

