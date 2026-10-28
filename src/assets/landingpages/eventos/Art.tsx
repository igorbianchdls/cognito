import { useId } from 'react';

const useSvgId = () => useId().replace(/:/g, '');

export function LotusLogo({ className }: { className?: string }) {
  return <svg viewBox="0 0 48 44" className={className} aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <path d="M24 6 C30 14 30 24 24 32 C18 24 18 14 24 6 Z" />
    <path d="M24 32 C20 22 12 18 6 18 C7 26 14 32 24 32 Z" /><path d="M24 32 C28 22 36 18 42 18 C41 26 34 32 24 32 Z" />
    <path d="M24 32 C16 30 8 32 3 36 C10 39 18 37 24 32 Z" /><path d="M24 32 C32 30 40 32 45 36 C38 39 30 37 24 32 Z" />
    <path d="M24 32 V40" /><path d="M24 14 C25 19 25 24 24 28" />
  </g></svg>;
}

export function ClipboardArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f1d7b5" /><stop offset="1" stopColor="#c8955f" /></linearGradient><linearGradient id={`p${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffdf8" /><stop offset="1" stopColor="#efe6d8" /></linearGradient></defs>
    <ellipse cx="62" cy="104" rx="40" ry="4.5" fill="#2b1608" opacity=".25" />
    <rect x="30" y="14" width="64" height="88" rx="8" fill="#a8743f" transform="translate(4 3)" />
    <rect x="30" y="14" width="64" height="88" rx="8" fill={`url(#b${id})`} />
    <rect x="37" y="22" width="50" height="74" rx="4" fill={`url(#p${id})`} />
    <rect x="48" y="8" width="28" height="12" rx="5" fill="#8a5a2c" /><rect x="52" y="5" width="20" height="8" rx="4" fill="#b98a55" />
    {[34, 50, 66, 80].map((y, i) => <g key={y}><rect x="42" y={y} width="9" height="9" rx="2" fill="#fff" stroke="#c9b394" /><path d={`M43.5 ${y + 4.5} l3 3 l5 -6`} stroke="#3f8f5a" strokeWidth="2" fill="none" strokeLinecap="round" opacity={i < 3 ? 1 : 0} /><rect x="56" y={y + 2} width={22 - (i % 2) * 6} height="2.6" rx="1.3" fill="#cbb79a" /><rect x="56" y={y + 6} width="14" height="2.2" rx="1.1" fill="#e0d3bf" /></g>)}
    <path d="M18 92 C14 80 18 70 26 66 C26 76 24 84 18 92 Z" fill="#6f9a5a" /><path d="M20 94 C26 84 34 82 40 84 C34 90 28 94 20 94 Z" fill="#88b06d" /><rect x="14" y="92" width="16" height="10" rx="3" fill="#c98f5c" />
  </svg>;
}

export function BouquetArt() {
  const id = useSvgId();
  const rose = (x: number, y: number, r: number, k: string) => <g key={k}><circle cx={x} cy={y} r={r} fill={`url(#r${id})`} /><path d={`M${x - r * .5} ${y} a${r * .5} ${r * .5} 0 1 1 ${r} 0`} fill="none" stroke="#d9c3a8" strokeWidth="1.2" /><circle cx={x} cy={y - r * .1} r={r * .3} fill="none" stroke="#d9c3a8" strokeWidth="1" /></g>;
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><radialGradient id={`r${id}`} cx=".4" cy=".35" r=".7"><stop offset="0" stopColor="#fffaf2" /><stop offset=".7" stopColor="#f3e6d3" /><stop offset="1" stopColor="#e2cdb0" /></radialGradient></defs>
    <ellipse cx="60" cy="104" rx="30" ry="4" fill="#2b1608" opacity=".25" />
    <path d="M50 66 L56 102 L64 102 L70 66 Z" fill="#7f9a62" /><path d="M48 70 L72 70 L66 84 L54 84 Z" fill="#e9dcc6" /><path d="M54 76 C58 80 62 80 66 76" stroke="#c2a57f" strokeWidth="2" fill="none" />
    {[[26, 50, 30], [94, 46, 20], [30, 30, 210], [90, 26, 160]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="12" ry="5" fill="#6f9a5a" transform={`rotate(${r} ${x} ${y})`} />)}
    {[rose(40, 46, 12, 'a'), rose(62, 40, 14, 'b'), rose(82, 48, 12, 'c'), rose(50, 26, 11, 'd'), rose(73, 24, 11, 'e'), rose(60, 58, 11, 'f')]}
    {[[34, 62], [88, 64], [44, 14], [80, 12], [60, 10]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke="#e7d9c4" />)}
  </svg>;
}

export function GuestsArt() {
  const id = useSvgId();
  const person = (x: number, s: number, tone: string, k: string, tie = false) => <g key={k} transform={`translate(${x} 0) scale(${s})`}>
    <path d="M-22 100 C-22 72 -14 62 0 62 C14 62 22 72 22 100 Z" fill={tone} />
    <circle cx="0" cy="40" r="17" fill={`url(#h${id})`} />
    {tie && <path d="M-4 64 L0 72 L4 64 L0 62 Z M-2 72 L0 86 L2 72 Z" fill="#2b1a10" />}
  </g>;
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><radialGradient id={`h${id}`} cx=".38" cy=".32" r=".75"><stop offset="0" stopColor="#f7e3cc" /><stop offset="1" stopColor="#d4ac80" /></radialGradient></defs>
    <ellipse cx="60" cy="104" rx="46" ry="4.5" fill="#2b1608" opacity=".25" />
    {[person(28, .82, '#f1e5d6', 'a'), person(92, .82, '#f1e5d6', 'b'), person(60, 1, '#c99a68', 'c', true)]}
  </svg>;
}

export function CameraArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><linearGradient id={`c${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8c79b" /><stop offset="1" stopColor="#b8864f" /></linearGradient><radialGradient id={`l${id}`} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#5d6a7e" /><stop offset=".55" stopColor="#1d2430" /><stop offset="1" stopColor="#0a0d12" /></radialGradient></defs>
    <ellipse cx="60" cy="102" rx="46" ry="4.5" fill="#2b1608" opacity=".25" />
    <rect x="40" y="22" width="30" height="14" rx="4" fill="#2a2a2e" />
    <rect x="12" y="32" width="96" height="62" rx="12" fill="#26262b" />
    <rect x="12" y="44" width="96" height="40" fill={`url(#c${id})`} />
    <rect x="18" y="26" width="16" height="8" rx="3" fill="#3a3a40" />
    <circle cx="62" cy="63" r="27" fill="#1a1a1e" /><circle cx="62" cy="63" r="22" fill="#2f3239" /><circle cx="62" cy="63" r="16" fill={`url(#l${id})`} /><circle cx="56" cy="57" r="4" fill="#fff" opacity=".35" />
    <rect x="92" y="38" width="10" height="5" rx="2" fill="#d4a46a" />
  </svg>;
}
