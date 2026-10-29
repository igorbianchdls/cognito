import { useId, type ReactNode } from 'react';
import type { Category } from './data';

const useSvgId = () => useId().replace(/:/g, '');

export function LeafLogo({ className }: { className?: string }) {
  return <svg viewBox="0 0 40 48" className={className} aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M20 46 C20 30 20 16 20 3" /><path d="M20 44 C12 36 9 24 11 10 C16 18 19 30 20 44" /><path d="M20 44 C28 36 31 24 29 10 C24 18 21 30 20 44" />
    <path d="M19 45 C10 41 4 32 3 20 C10 26 15 35 19 45" /><path d="M21 45 C30 41 36 32 37 20 C30 26 25 35 21 45" />
  </g></svg>;
}

/** Shade a hex colour by a factor (<1 darker, >1 lighter). */
function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(f > 1 ? v + (255 - v) * (f - 1) : v * f))));
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

const shapes: Record<string, string> = {
  dress: 'M44 14 L40 6 L36 14 C30 18 30 26 32 34 L18 92 C34 98 66 98 82 92 L68 34 C70 26 70 18 64 14 L60 6 L56 14 C53 18 47 18 44 14 Z',
  blazer: 'M38 8 L50 16 L62 8 L80 16 C84 40 84 70 82 94 L66 96 L64 56 L36 56 L34 96 L18 94 C16 70 16 40 20 16 Z',
  top: 'M36 10 C40 14 46 18 50 18 C54 18 60 14 64 10 L66 30 C72 40 74 52 70 66 C58 70 42 70 30 66 C26 52 28 40 34 30 Z',
  pants: 'M30 8 H70 L76 94 H58 L50 34 L42 94 H24 Z',
  skirt: 'M34 10 H66 L84 86 C64 94 36 94 16 86 Z',
  set: 'M34 6 C40 10 46 12 50 12 C54 12 60 10 66 6 L70 22 C70 30 66 36 64 40 H36 C34 36 30 30 30 22 Z M32 46 H68 L80 94 C62 98 38 98 20 94 Z',
  bag: 'M22 40 H78 L84 92 H16 Z',
};
const kindOf: Record<Category, string> = { Vestidos: 'dress', Blusas: 'top', Calças: 'pants', Conjuntos: 'set', Saias: 'skirt', Acessórios: 'bag' };

/** Flat product illustration for the catalogue; the name refines the silhouette. */
export function GarmentArt({ category, name, color }: { category: Category; name: string; color: string }) {
  const id = useSvgId();
  const kind = /blazer|cardig/i.test(name) ? 'blazer' : /bolsa|tote/i.test(name) ? 'bag' : /óculos/i.test(name) ? 'glasses' : /cinto/i.test(name) ? 'belt' : /brinco/i.test(name) ? 'earrings' : /len[çc]o/i.test(name) ? 'scarf' : kindOf[category];
  const dark = shade(color, .7);
  const accessory: Record<string, ReactNode> = {
    glasses: <g fill={`url(#g${id})`} stroke={dark} strokeWidth="2"><path d="M10 44 C10 36 18 34 30 34 C42 34 46 38 46 46 C46 58 38 64 28 64 C16 64 10 56 10 44 Z" /><path d="M90 44 C90 36 82 34 70 34 C58 34 54 38 54 46 C54 58 62 64 72 64 C84 64 90 56 90 44 Z" /><path d="M46 44 C48 40 52 40 54 44" fill="none" /></g>,
    belt: <g><rect x="6" y="42" width="88" height="16" rx="4" fill={`url(#g${id})`} stroke={dark} /><rect x="38" y="36" width="24" height="28" rx="4" fill="none" stroke="#c9a24e" strokeWidth="4" /><path d="M50 40 V60" stroke="#c9a24e" strokeWidth="3" />{[70, 78, 86].map(x => <circle key={x} cx={x} cy="50" r="2" fill={dark} />)}</g>,
    earrings: <g>{[34, 66].map(x => <g key={x}><circle cx={x} cy="22" r="4" fill="#d6b16a" /><path d={`M${x} 26 C${x - 12} 46 ${x - 12} 66 ${x} 74 C${x + 12} 66 ${x + 12} 46 ${x} 26 Z`} fill="#e7c477" stroke="#b98d3a" strokeWidth="1.5" /></g>)}</g>,
    scarf: <g><path d="M12 22 H88 L50 86 Z" fill={`url(#g${id})`} stroke={dark} strokeWidth="1.2" strokeLinejoin="round" />{[[34, 34], [58, 30], [48, 50], [40, 66], [66, 44]].map(([x, y], k) => <circle key={k} cx={x} cy={y} r="4" fill="#fff" opacity=".7" />)}</g>,
  };
  return <svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={shade(color, 1.18)} /><stop offset="1" stopColor={shade(color, .82)} /></linearGradient></defs>
    {accessory[kind] ?? <>
        {kind === 'bag' && <path d="M36 40 C36 22 64 22 64 40" fill="none" stroke={shade(color, .7)} strokeWidth="5" strokeLinecap="round" />}
        <path d={shapes[kind]} fill={`url(#g${id})`} stroke={shade(color, .75)} strokeWidth="1.2" strokeLinejoin="round" />
        {kind === 'dress' && <path d="M32 34 C44 38 56 38 68 34" stroke={shade(color, .7)} strokeWidth="2.4" fill="none" />}
        {kind === 'blazer' && <><path d="M38 8 L50 40 L62 8" stroke={shade(color, .7)} strokeWidth="1.6" fill="none" /><circle cx="50" cy="48" r="2" fill="#c9a24e" /></>}
        {kind === 'pants' && <path d="M50 10 V32" stroke={shade(color, .72)} strokeWidth="1.4" />}
        {kind === 'skirt' && [30, 42, 54, 66].map(x => <path key={x} d={`M${x + 4} 12 L${x - 4} 90`} stroke={shade(color, .85)} strokeWidth="1" />)}
        {kind === 'bag' && <rect x="44" y="50" width="12" height="6" rx="2" fill="#d6b16a" />}
      </>}
  </svg>;
}

export function BlouseArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd3e2" /><stop offset=".55" stopColor="#f79ac0" /><stop offset="1" stopColor="#e2679c" /></linearGradient></defs>
    <ellipse cx="60" cy="104" rx="36" ry="4.5" fill="#3a1420" opacity=".22" />
    <path d="M42 12 C48 18 54 20 60 20 C66 20 72 18 78 12 L106 26 L96 48 L86 44 L88 98 C70 104 50 104 32 98 L34 44 L24 48 L14 26 Z" fill={`url(#b${id})`} />
    <path d="M48 14 C54 26 66 26 72 14" fill="none" stroke="#fff" strokeWidth="2.6" opacity=".7" />
    <path d="M40 30 C38 50 38 70 40 90" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".25" />
  </svg>;
}

export function PeopleArt() {
  const id = useSvgId();
  const person = (x: number, s: number, k: string) => <g key={k} transform={`translate(${x} 0) scale(${s})`}>
    <path d="M-24 100 C-24 70 -14 60 0 60 C14 60 24 70 24 100 Z" fill={`url(#p${id})`} /><circle cx="0" cy="38" r="17" fill={`url(#p${id})`} /><circle cx="-5" cy="32" r="5" fill="#fff" opacity=".35" />
  </g>;
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><radialGradient id={`p${id}`} cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#ffe0ea" /><stop offset=".55" stopColor="#f6a3c0" /><stop offset="1" stopColor="#e0709a" /></radialGradient></defs>
    <ellipse cx="60" cy="104" rx="44" ry="4.5" fill="#3a1420" opacity=".22" />
    {[person(40, .86, 'a'), person(76, 1, 'b')]}
  </svg>;
}

export function BoxArt() {
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <ellipse cx="60" cy="102" rx="44" ry="5" fill="#3a1420" opacity=".22" />
    <path d="M18 36 L60 22 L102 36 L60 50 Z" fill="#f2c491" /><path d="M18 36 L60 50 V98 L18 84 Z" fill="#e3a868" /><path d="M102 36 L60 50 V98 L102 84 Z" fill="#cc8a4c" />
    <path d="M38 29 L80 43 V58 L72 55 V44 L31 31 Z" fill="#f8dcb7" /><path d="M24 64 L36 68 M24 70 L32 73" stroke="#a96d36" strokeWidth="2" strokeLinecap="round" />
  </svg>;
}

export function MegaphoneArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><linearGradient id={`m${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffc3d6" /><stop offset=".6" stopColor="#f37aa4" /><stop offset="1" stopColor="#d9547f" /></linearGradient></defs>
    <ellipse cx="58" cy="102" rx="40" ry="4.5" fill="#3a1420" opacity=".22" />
    <path d="M22 50 L82 18 L82 88 L22 66 Z" fill={`url(#m${id})`} /><ellipse cx="82" cy="53" rx="10" ry="35" fill="#e86a95" /><ellipse cx="82" cy="53" rx="6" ry="27" fill="#f9b6cb" />
    <rect x="12" y="48" width="14" height="20" rx="4" fill="#d9547f" /><path d="M34 66 L40 92 H52 L48 70 Z" fill="#e86a95" />
    <path d="M100 34 L110 28 M102 53 H114 M100 72 L110 78" stroke="#f37aa4" strokeWidth="3.5" strokeLinecap="round" />
  </svg>;
}

export function BagArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    <defs><linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffc6d8" /><stop offset=".6" stopColor="#f5809f" /><stop offset="1" stopColor="#e05d84" /></linearGradient></defs>
    <path d="M42 40 C42 14 78 14 78 40" fill="none" stroke="#e05d84" strokeWidth="6" strokeLinecap="round" /><path d="M24 38 H96 L102 100 H18 Z" fill={`url(#g${id})`} /><path d="M34 46 C32 62 32 78 34 92" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".3" />
  </svg>;
}

export function GrowthArt() {
  return <svg viewBox="0 0 120 110" aria-hidden="true">
    {[[20, 34], [44, 52], [68, 70]].map(([x, h]) => <g key={x}><rect x={x} y={100 - h} width="20" height={h} rx="3" fill="#f5809f" /><rect x={x} y={100 - h} width="7" height={h} rx="3" fill="#ffc6d8" opacity=".7" /></g>)}
    <path d="M14 66 L42 40 L60 50 L96 14" stroke="#e05d84" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M84 12 H98 V26" stroke="#e05d84" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
