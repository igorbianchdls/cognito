import { useId } from 'react';

const useSvgId = () => useId().replace(/:/g, '');

export function HouseLogo({ className }: { className?: string }) {
  return <svg viewBox="0 0 48 44" className={className} aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
    <path d="M5 21 L24 5 L43 21" /><path d="M10 17 V40 H22 V28 H31" /><path d="M38 17 V40 H28" />
  </g></svg>;
}

export function HouseArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><linearGradient id={`w${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fbf6ee" /><stop offset="1" stopColor="#e6d8c4" /></linearGradient><linearGradient id={`r${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c8794" /><stop offset="1" stopColor="#4e5865" /></linearGradient><linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd38a" /><stop offset="1" stopColor="#f0a24a" /></linearGradient></defs>
    <ellipse cx="60" cy="102" rx="48" ry="5" fill="#2b1608" opacity=".28" />
    <path d="M8 96 L30 84 L106 84 L112 96 Z" fill="#cdbfa8" /><rect x="10" y="90" width="44" height="8" rx="3" fill="#f3ede3" transform="rotate(-8 30 94)" />
    <path d="M22 86 V52 L48 34 L74 52 V86 Z" fill={`url(#w${id})`} /><path d="M74 86 V56 H104 V86 Z" fill="#efe5d6" />
    <path d="M16 55 L48 30 L80 55 L76 58 L48 37 L20 58 Z" fill={`url(#r${id})`} /><path d="M70 58 L74 52 H108 L104 58 Z" fill="#5d6773" />
    <rect x="30" y="60" width="12" height="12" rx="1.5" fill={`url(#g${id})`} /><rect x="52" y="64" width="12" height="22" rx="1.5" fill="#8a5a33" />
    <rect x="80" y="62" width="18" height="12" rx="1.5" fill={`url(#g${id})`} /><path d="M89 62 V74 M80 68 H98" stroke="#fff" strokeWidth="1" opacity=".7" />
    <rect x="58" y="22" width="7" height="14" fill="#8b7f73" />
    <circle cx="14" cy="80" r="8" fill="#6f9a5a" /><circle cx="106" cy="80" r="7" fill="#88b06d" />
  </svg>;
}

export function CalculatorArt() {
  const id = useSvgId();
  const coins = (x: number, n: number, k: string) => <g key={k}>{Array.from({ length: n }, (_, i) => <g key={i}><ellipse cx={x} cy={96 - i * 6} rx="11" ry="4" fill="#b8862f" /><rect x={x - 11} y={90 - i * 6} width="22" height="6" fill={`url(#c${id})`} /><ellipse cx={x} cy={90 - i * 6} rx="11" ry="4" fill="#f6d27a" stroke="#c99a3c" strokeWidth=".8" /></g>)}</g>;
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><linearGradient id={`c${id}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c8932f" /><stop offset=".5" stopColor="#f2cd70" /><stop offset="1" stopColor="#b7832a" /></linearGradient><linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4a4d55" /><stop offset="1" stopColor="#1f2127" /></linearGradient></defs>
    <ellipse cx="62" cy="102" rx="50" ry="5" fill="#2b1608" opacity=".28" />
    <g transform="rotate(-10 40 60)"><rect x="12" y="16" width="52" height="80" rx="7" fill={`url(#b${id})`} /><rect x="18" y="22" width="40" height="15" rx="2" fill="#b9c7a7" />
      {Array.from({ length: 16 }, (_, k) => <rect key={k} x={19 + (k % 4) * 10} y={43 + Math.floor(k / 4) * 12} width="8" height="9" rx="1.6" fill={k % 4 === 3 ? '#d98a3a' : '#e9e6e0'} />)}</g>
    {[coins(76, 7, 'a'), coins(98, 5, 'b'), coins(88, 3, 'c')]}
  </svg>;
}

export function HelmetArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><radialGradient id={`h${id}`} cx=".38" cy=".3" r=".8"><stop offset="0" stopColor="#ffe08a" /><stop offset=".6" stopColor="#f4b52e" /><stop offset="1" stopColor="#c98612" /></radialGradient></defs>
    <ellipse cx="60" cy="100" rx="50" ry="6" fill="#2b1608" opacity=".3" />
    <path d="M6 84 C6 78 20 74 60 74 C100 74 114 78 114 84 C114 90 100 92 60 92 C20 92 6 90 6 84 Z" fill="#d99a1e" />
    <path d="M18 80 C18 46 36 22 60 22 C84 22 102 46 102 80 Z" fill={`url(#h${id})`} />
    <path d="M52 23 C50 40 50 60 52 80 H68 C70 60 70 40 68 23 C63 21 57 21 52 23 Z" fill="#f7c64a" stroke="#d99a1e" strokeWidth="1.2" />
    <path d="M34 34 C30 44 28 58 28 74" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".35" fill="none" />
  </svg>;
}

export function ChartArt() {
  const id = useSvgId();
  const bar = (x: number, h: number, k: string) => <g key={k}><path d={`M${x} 88 V${88 - h} L${x + 8} ${84 - h} V84 Z`} fill="#d9d2c6" /><rect x={x + 8} y={84 - h} width="12" height={h} fill={`url(#b${id})`} /><path d={`M${x} ${88 - h} L${x + 8} ${84 - h} H${x + 20} L${x + 12} ${88 - h} Z`} fill="#fff" /><rect x={x} y={88 - h} width="12" height={h} fill="#f4efe7" /><rect x={x} y={88 - h * .45} width="12" height={h * .45} fill="#e4b56a" /></g>;
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9e2d6" /><stop offset="1" stopColor="#c7bba8" /></linearGradient></defs>
    <ellipse cx="60" cy="102" rx="50" ry="5" fill="#2b1608" opacity=".28" />
    <path d="M6 92 L60 70 L116 86 L62 108 Z" fill="#f7f3ec" /><path d="M6 92 L62 108 L62 104 L8 89 Z" fill="#d8cfc0" />
    {[16, 24, 32].map(y => <path key={y} d={`M${24 + y} ${96 - y / 3} L${70 + y} ${84 - y / 3}`} stroke="#cfc4b2" strokeWidth="1.2" />)}
    {[bar(30, 22, 'a'), bar(48, 34, 'b'), bar(66, 48, 'c'), bar(84, 64, 'd')]}
    <path d="M22 62 L44 50 L62 54 L92 24" stroke="#e7a23a" strokeWidth="3" fill="none" strokeLinecap="round" /><path d="M86 22 L94 22 L93 30" stroke="#e7a23a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
