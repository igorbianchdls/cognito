import { useId } from 'react';
import type { Art, Material } from './data';

/** Mixes a hex color with white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16), target = amount > 0 ? 255 : 0, a = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * a).toString(16).padStart(2, '0');
  return `#${mix(n >> 16)}${mix((n >> 8) & 255)}${mix(n & 255)}`;
}
const useSvgId = () => useId().replace(/:/g, '');
const skies: [string, string, string][] = [['#8fb4de', '#f6d3b3', '#ffe3b8'], ['#7f9fcf', '#f4b08a', '#ffd29b'], ['#a8c5e6', '#f2dcc4', '#fff0d6']];

function Palm({ x, h, flip = false }: { x: number; h: number; flip?: boolean }) {
  const s = flip ? -1 : 1, top = 104 - h;
  const leaf = (dx: number, dy: number, c: string) => <path d={`M${x + 2 * s} ${top} q${dx * .5 * s} ${dy - 8} ${dx * s} ${dy}`} stroke={c} strokeWidth="3.2" strokeLinecap="round" fill="none" />;
  return <g>
    <path d={`M${x} 104 q${4 * s} ${-h / 2} ${2 * s} ${-h}`} stroke="#7a5534" strokeWidth="2.4" fill="none" />
    {leaf(16, 6, '#2f7a43')}{leaf(-14, 7, '#2f7a43')}{leaf(10, -4, '#3f9152')}{leaf(-10, -3, '#3f9152')}{leaf(18, 13, '#25693a')}{leaf(-17, 14, '#25693a')}
  </g>;
}

function Block({ x, w, floors, tone, depth, cols, id }: { x: number; w: number; floors: number; tone: string; depth: number; cols: number; id: string }) {
  const fh = Math.min(11.5, 78 / floors), h = floors * fh + 5, base = 100, top = base - h, cw = w / cols;
  return <g>
    <polygon points={`${x + w},${top} ${x + w + depth},${top - depth * .45} ${x + w + depth},${base - depth * .45} ${x + w},${base}`} fill={shade(tone, -.22)} />
    {Array.from({ length: floors }, (_, f) => { const y = top + 4 + f * fh, rise = (depth - 4) * .45; return <polygon key={f} points={`${x + w + 2},${y - .9} ${x + w + depth - 2},${y - .9 - rise} ${x + w + depth - 2},${y + 3.1 - rise} ${x + w + 2},${y + 3.1}`} fill="#55657a" opacity=".55" />; })}
    <polygon points={`${x},${top} ${x + depth},${top - depth * .45} ${x + w + depth},${top - depth * .45} ${x + w},${top}`} fill={shade(tone, .25)} />
    <rect x={x} y={top} width={w} height={h} fill={`url(#f${id})`} />
    <rect x={x + w * .62} y={top} width={cw * .7} height={h} fill={shade(tone, -.32)} opacity=".55" />
    {Array.from({ length: floors }, (_, f) => Array.from({ length: cols }, (_, c) => {
      const wx = x + c * cw + cw * .18, wy = top + 4 + f * fh;
      return <g key={`${f}-${c}`}>
        <rect x={wx} y={wy} width={cw * .64} height={fh * .58} rx=".6" fill={`url(#w${id})`} />
        {(c + f) % 2 === 0 && <rect x={wx - 1} y={wy + fh * .58} width={cw * .64 + 2} height="1.6" fill="#fff" opacity=".9" />}
      </g>;
    }))}
    <rect x={x - 1.5} y={top - 2} width={w + 3} height="2.5" fill={shade(tone, -.1)} />
  </g>;
}

/** Illustrated residential building used on project cards. */
export function Building({ art, className }: { art: Art; className?: string }) {
  const id = useSvgId(), [a, b, c] = skies[art.sky];
  const w = 96 + Math.min(art.floors, 10) * 2, x = art.wing ? 92 : 68;
  return <svg viewBox="0 0 240 110" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
    <defs>
      <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={a} /><stop offset=".7" stopColor={b} /><stop offset="1" stopColor={c} /></linearGradient>
      <linearGradient id={`f${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={shade(art.tone, .18)} /><stop offset="1" stopColor={art.tone} /></linearGradient>
      <linearGradient id={`w${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9db6cf" /><stop offset=".5" stopColor="#4c5e74" /><stop offset="1" stopColor="#2f3b4b" /></linearGradient>
    </defs>
    <rect width="240" height="110" fill={`url(#s${id})`} />
    <circle cx="196" cy="34" r="14" fill="#fff4dc" opacity=".55" />
    <path d="M0 92 L14 92 L14 78 L26 78 L26 86 L40 86 L40 72 L50 72 L50 92 L190 92 L190 80 L204 80 L204 70 L216 70 L216 84 L240 84 L240 110 L0 110 Z" fill="#c9cfd8" opacity=".55" />
    {art.wing && <Block x={30} w={58} floors={Math.max(3, art.floors - 3)} tone={shade(art.tone, -.05)} depth={8} cols={4} id={id} />}
    <Block x={x} w={w} floors={art.floors} tone={art.tone} depth={16} cols={6} id={id} />
    <rect y="100" width="240" height="10" fill="#7fae5b" />
    <rect y="104" width="240" height="6" fill="#d9cbb3" />
    {[20, 52, 86, 150, 186, 222].map((bx, i) => <ellipse key={bx} cx={bx} cy={101} rx={i % 2 ? 11 : 8} ry="5" fill={i % 2 ? '#4f8f45' : '#3d7a3a'} />)}
    <Palm x={14} h={38} /><Palm x={26} h={28} flip /><Palm x={216} h={40} flip /><Palm x={230} h={30} />
  </svg>;
}

export function CoinsArt() {
  const id = useSvgId();
  const coin = (cx: number, cy: number, key: string) => <g key={key}><ellipse cx={cx} cy={cy + 5} rx="20" ry="7" fill="#b9791c" /><rect x={cx - 20} y={cy} width="40" height="5" fill="#c98a24" /><ellipse cx={cx} cy={cy} rx="20" ry="7" fill={`url(#c${id})`} /><ellipse cx={cx} cy={cy} rx="13" ry="4.2" fill="none" stroke="#fff3c4" strokeOpacity=".6" /></g>;
  return <svg viewBox="0 0 96 86" aria-hidden="true">
    <defs><linearGradient id={`c${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffe6a0" /><stop offset=".6" stopColor="#f2bf4f" /><stop offset="1" stopColor="#d9962c" /></linearGradient></defs>
    <ellipse cx="50" cy="80" rx="38" ry="4" fill="#5b3a12" opacity=".13" />
    {[0, 1, 2, 3, 4, 5].map(i => coin(36, 70 - i * 6, `a${i}`))}
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => coin(62, 72 - i * 6, `b${i}`))}
  </svg>;
}

export function BlocksArt() {
  const cube = (x: number, y: number, s: number, key: string) => <g key={key}>
    <polygon points={`${x},${y} ${x + s},${y - s / 2} ${x + 2 * s},${y} ${x + s},${y + s / 2}`} fill="#d9cfc0" />
    <polygon points={`${x},${y} ${x + s},${y + s / 2} ${x + s},${y + 1.6 * s} ${x},${y + 1.1 * s}`} fill="#b7aa96" />
    <polygon points={`${x + s},${y + s / 2} ${x + 2 * s},${y} ${x + 2 * s},${y + 1.1 * s} ${x + s},${y + 1.6 * s}`} fill="#9c8f7c" />
    <path d={`M${x + 4} ${y + 2} l${s - 6} ${s / 2 - 3}`} stroke="#fff" strokeOpacity=".35" strokeWidth=".8" />
  </g>;
  return <svg viewBox="0 0 96 86" aria-hidden="true">
    <ellipse cx="48" cy="80" rx="40" ry="4" fill="#3d2e1a" opacity=".14" />
    {[cube(8, 56, 16, 'a'), cube(40, 56, 16, 'b'), cube(24, 64, 16, 'c'), cube(56, 64, 16, 'd'), cube(24, 38, 16, 'e'), cube(40, 46, 16, 'f'), cube(32, 22, 16, 'g')]}
  </svg>;
}

export function HelmetArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 100 86" aria-hidden="true">
    <defs><radialGradient id={`h${id}`} cx=".38" cy=".3" r=".8"><stop offset="0" stopColor="#fbe9cf" /><stop offset=".55" stopColor="#e8c79c" /><stop offset="1" stopColor="#c99c66" /></radialGradient></defs>
    <ellipse cx="50" cy="78" rx="42" ry="5" fill="#3d2e1a" opacity=".15" />
    <path d="M6 66 C6 60 20 58 50 58 C80 58 96 61 96 67 C96 73 80 74 50 74 C20 74 6 72 6 66 Z" fill="#c99a62" />
    <path d="M16 62 C16 34 30 16 52 16 C74 16 86 34 86 62 Z" fill={`url(#h${id})`} />
    <path d="M44 17 C46 30 46 46 45 62 L57 62 C56 46 56 30 58 17 C54 16 48 16 44 17 Z" fill="#dcb582" />
    <path d="M24 46 C26 32 34 24 44 21" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>;
}

export function CraneArt() {
  const lattice = (x1: number, y1: number, x2: number, y2: number, n: number, vertical: boolean) => Array.from({ length: n }, (_, i) => {
    const t0 = i / n, t1 = (i + 1) / n;
    const p = (t: number, side: number) => vertical ? [x1 + side * (x2 - x1), y1 + t * (y2 - y1)] : [x1 + t * (x2 - x1), y1 + side * (y2 - y1)];
    const [a, b] = [p(t0, 0), p(t1, 1)], [c, d] = [p(t0, 1), p(t1, 0)];
    return <g key={i}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} /><line x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} /></g>;
  });
  return <svg viewBox="0 0 110 96" aria-hidden="true">
    <ellipse cx="44" cy="91" rx="30" ry="3.5" fill="#3d2e1a" opacity=".15" />
    <g stroke="#e3a12c" strokeWidth="1.6">
      <rect x="38" y="20" width="12" height="68" fill="none" strokeWidth="2.4" />
      {lattice(38, 20, 50, 88, 8, true)}
      <rect x="6" y="18" width="98" height="7" fill="none" strokeWidth="2.2" />
      {lattice(6, 18, 104, 25, 14, false)}
    </g>
    <polygon points="40,18 44,4 48,18" fill="#f0b443" />
    <line x1="44" y1="5" x2="10" y2="18" stroke="#8a6a3a" strokeWidth=".8" /><line x1="44" y1="5" x2="100" y2="18" stroke="#8a6a3a" strokeWidth=".8" />
    <rect x="8" y="25" width="16" height="12" rx="1.5" fill="#9b8a75" /><rect x="40" y="26" width="10" height="8" rx="1" fill="#f6c45e" stroke="#c98a24" />
    <line x1="88" y1="25" x2="88" y2="52" stroke="#4b4036" strokeWidth=".9" />
    <path d="M85 52 h6 v3 a3 3 0 0 1 -6 0 Z" fill="#4b4036" />
    <rect x="30" y="86" width="28" height="5" rx="1" fill="#b48a52" />
  </svg>;
}

/** Stylised Recife metropolitan area; project pins are positioned on top in percent. */
export function RecifeMap({ className }: { className?: string }) {
  return <svg viewBox="0 0 300 300" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
    <rect width="300" height="300" fill="#ece4d6" />
    <path d="M232 0 C222 40 236 70 226 104 C216 140 238 170 230 206 C222 244 236 270 232 300 L300 300 L300 0 Z" fill="#b8d6e4" />
    <path d="M226 104 C216 140 238 170 230 206" stroke="#f4ead6" strokeWidth="5" fill="none" />
    {[[40, 60, 34, 20], [150, 240, 30, 18], [90, 170, 22, 16], [190, 40, 20, 14]].map(([cx, cy, rx, ry]) => <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} fill="#cfe0bd" />)}
    <path d="M0 150 C40 140 70 168 110 156 C150 144 170 120 200 130 C214 135 222 140 229 140" stroke="#a7cfe0" strokeWidth="7" fill="none" strokeLinecap="round" />
    <path d="M110 156 C120 190 160 196 200 214 C214 220 222 226 231 228" stroke="#a7cfe0" strokeWidth="4" fill="none" />
    <g stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round">
      <path d="M0 96 C60 104 120 92 226 104" /><path d="M0 230 C80 222 150 250 230 246" /><path d="M150 0 C146 80 168 160 160 300" /><path d="M60 0 C70 90 50 200 74 300" /><path d="M0 40 L232 16" />
    </g>
    <g stroke="#ddd2c0" strokeWidth="1" fill="none">
      {Array.from({ length: 12 }, (_, i) => <path key={`h${i}`} d={`M0 ${20 + i * 24} L226 ${14 + i * 25}`} />)}
      {Array.from({ length: 10 }, (_, i) => <path key={`v${i}`} d={`M${12 + i * 24} 0 L${18 + i * 22} 300`} />)}
    </g>
    <text x="196" y="182" fill="#fff" fontSize="15" fontWeight="600" opacity=".95">Recife</text>
    <text x="190" y="60" fill="#9c8f7c" fontSize="8" fontWeight="600">Olinda</text>
    <text x="186" y="22" fill="#9c8f7c" fontSize="8" fontWeight="600">Paulista</text>
    <text x="14" y="122" fill="#9c8f7c" fontSize="8" fontWeight="600">Camaragibe</text>
    <text x="100" y="286" fill="#9c8f7c" fontSize="8" fontWeight="600">Jaboatão</text>
  </svg>;
}

export function MaterialIcon({ icon }: { icon: Material['icon'] }) {
  return <svg viewBox="0 0 36 36" aria-hidden="true">
    <ellipse cx="18" cy="32" rx="13" ry="2.4" fill="#3d2e1a" opacity=".12" />
    {icon === 'cement' && <g><path d="M7 11 L27 9 L30 29 L8 31 Z" fill="#cdbfa7" /><path d="M7 11 L27 9 L28 14 L7.6 16 Z" fill="#b9a98d" /><rect x="12" y="19" width="12" height="5" rx="1" fill="#efe7d8" transform="rotate(-5 18 21)" /></g>}
    {icon === 'steel' && <g>{[0, 1, 2, 3, 4].map(i => <g key={i}><rect x="4" y={9 + i * 4.4} width="28" height="3.2" rx="1.6" fill={i % 2 ? '#5d636b' : '#3f454c'} /><circle cx="31" cy={10.6 + i * 4.4} r="1.6" fill="#8a9099" /></g>)}</g>}
    {icon === 'brick' && <g>{[[4, 20], [16, 20], [10, 13], [22, 13]].map(([x, y]) => <g key={`${x}${y}`}><rect x={x} y={y} width="11" height="7" rx="1" fill="#c8693a" /><rect x={x + 2} y={y + 2} width="2.4" height="3" fill="#8f4322" /><rect x={x + 6.4} y={y + 2} width="2.4" height="3" fill="#8f4322" /></g>)}<rect x="10" y="27" width="11" height="3" fill="#a8542b" /></g>}
    {icon === 'pipe' && <g>{[0, 1, 2].map(i => <g key={i}><rect x="5" y={10 + i * 6} width="25" height="5" rx="2.5" fill="#e9ecef" stroke="#b6bcc4" strokeWidth=".6" /><ellipse cx="30" cy={12.5 + i * 6} rx="1.8" ry="2.5" fill="#9aa1aa" /></g>)}</g>}
    {icon === 'sand' && <path d="M4 30 C8 18 14 10 18 10 C22 10 28 18 32 30 Z" fill="#e2c48f" />}
    {icon === 'tile' && <g><polygon points="6,18 18,12 30,18 18,24" fill="#efe9e1" stroke="#cfc6b9" /><polygon points="6,18 18,24 18,28 6,22" fill="#d7cfc3" /><polygon points="18,24 30,18 30,22 18,28" fill="#c4bbae" /></g>}
  </svg>;
}
