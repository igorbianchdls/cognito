import { useId, type ReactNode } from 'react';

const useSvgId = () => useId().replace(/:/g, '');
const pink = (id: string) => <defs>
  <linearGradient id={`k${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffd6e2" /><stop offset=".55" stopColor="#f59bb8" /><stop offset="1" stopColor="#e2678f" /></linearGradient>
  <radialGradient id={`r${id}`} cx=".35" cy=".3" r=".85"><stop offset="0" stopColor="#ffe3ec" /><stop offset=".55" stopColor="#f6a3c0" /><stop offset="1" stopColor="#e0709a" /></radialGradient>
</defs>;

export function LotusLogo({ className }: { className?: string }) {
  return <svg viewBox="0 0 48 40" className={className} aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
    <path d="M24 4 C30 12 30 24 24 34 C18 24 18 12 24 4 Z" /><path d="M24 34 C21 22 13 15 5 14 C5 25 13 33 24 34 Z" /><path d="M24 34 C27 22 35 15 43 14 C43 25 35 33 24 34 Z" />
    <path d="M24 34 C15 33 7 30 2 25" /><path d="M24 34 C33 33 41 30 46 25" />
  </g></svg>;
}

export function LotusArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">{pink(id)}
    <ellipse cx="60" cy="102" rx="40" ry="4.5" fill="#3a1420" opacity=".2" />
    <path d="M60 92 C38 90 18 80 10 60 C30 58 48 70 60 92 Z" fill={`url(#k${id})`} opacity=".85" /><path d="M60 92 C82 90 102 80 110 60 C90 58 72 70 60 92 Z" fill={`url(#k${id})`} opacity=".85" />
    <path d="M60 92 C40 78 32 54 38 28 C52 40 60 64 60 92 Z" fill={`url(#r${id})`} /><path d="M60 92 C80 78 88 54 82 28 C68 40 60 64 60 92 Z" fill={`url(#r${id})`} />
    <path d="M60 92 C48 70 48 40 60 14 C72 40 72 70 60 92 Z" fill={`url(#k${id})`} /><path d="M58 30 C55 46 55 62 58 78" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".45" />
  </svg>;
}

export function PeopleArt() {
  const id = useSvgId();
  const person = (x: number, s: number, k: string) => <g key={k} transform={`translate(${x} 0) scale(${s})`}><path d="M-24 100 C-24 70 -14 60 0 60 C14 60 24 70 24 100 Z" fill={`url(#r${id})`} /><circle cx="0" cy="38" r="17" fill={`url(#r${id})`} /><circle cx="-5" cy="32" r="5" fill="#fff" opacity=".35" /></g>;
  return <svg viewBox="0 0 120 110" aria-hidden="true">{pink(id)}<ellipse cx="60" cy="104" rx="44" ry="4.5" fill="#3a1420" opacity=".2" />{[person(40, .86, 'a'), person(76, 1, 'b')]}</svg>;
}

export function BottlesArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">{pink(id)}
    <ellipse cx="62" cy="102" rx="46" ry="4.5" fill="#3a1420" opacity=".2" />
    <rect x="22" y="40" width="28" height="60" rx="8" fill="#fbe6ec" /><rect x="30" y="26" width="12" height="16" rx="3" fill="#f2b3c4" /><path d="M36 26 V14 H50" stroke="#f2b3c4" strokeWidth="5" fill="none" strokeLinecap="round" />
    <rect x="52" y="22" width="30" height="78" rx="9" fill={`url(#k${id})`} /><rect x="60" y="10" width="14" height="14" rx="3" fill="#e2678f" />
    <rect x="84" y="58" width="24" height="42" rx="7" fill="#f8cdd9" /><rect x="88" y="50" width="16" height="10" rx="3" fill="#f2b3c4" />
    <path d="M58 32 V88" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".35" />
  </svg>;
}

export function ChartArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">{pink(id)}
    {[[18, 34], [44, 52], [70, 72]].map(([x, h]) => <g key={x}><rect x={x} y={100 - h} width="22" height={h} rx="4" fill={`url(#k${id})`} /><rect x={x} y={100 - h} width="8" height={h} rx="4" fill="#ffd6e2" opacity=".7" /></g>)}
    <path d="M14 64 L40 40 L58 50 L96 14" stroke="#e2678f" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M84 12 H98 V26" stroke="#e2678f" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function CalendarArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">{pink(id)}
    <rect x="16" y="20" width="88" height="80" rx="14" fill="#fde7ee" /><path d="M16 34 C16 26 22 20 30 20 H90 C98 20 104 26 104 34 V44 H16 Z" fill={`url(#k${id})`} />
    {[36, 84].map(x => <rect key={x} x={x - 4} y="10" width="8" height="20" rx="4" fill="#e2678f" />)}
    <path d="M60 60 C60 54 52 52 50 58 C48 52 40 54 40 60 C40 68 50 74 50 74 C50 74 60 68 60 60 Z" transform="translate(10 4)" fill="#e2678f" />
  </svg>;
}

export function StarArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 120 110" aria-hidden="true">{pink(id)}<path d="M60 8 L74 40 L108 44 L82 66 L90 100 L60 82 L30 100 L38 66 L12 44 L46 40 Z" fill={`url(#k${id})`} strokeLinejoin="round" stroke="#e2678f" strokeWidth="3" /><path d="M48 46 L56 30" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".5" /></svg>;
}

/** Small pastel illustration for each procedure (no photos available). */
export function ProcedureArt({ art }: { art: string }) {
  const id = useSvgId();
  const face = <g><path d="M50 14 C30 14 22 32 24 52 C26 72 38 88 50 88 C62 88 74 72 76 52 C78 32 70 14 50 14 Z" fill="#f6d9c8" /><path d="M24 40 C26 18 44 8 60 12 C76 16 82 34 78 48 C70 30 50 26 30 44 Z" fill="#8a5a44" /><path d="M38 54 Q42 50 46 54 M54 54 Q58 50 62 54" stroke="#6b4434" strokeWidth="2" fill="none" strokeLinecap="round" /><path d="M44 70 Q50 74 56 70" stroke="#d47c8a" strokeWidth="2.4" fill="none" strokeLinecap="round" /></g>;
  const shapes: Record<string, ReactNode> = {
    face: <g>{face}<path d="M30 46 C38 40 62 40 70 46 C72 58 66 70 50 72 C34 70 28 58 30 46 Z" fill="#fff" opacity=".55" /></g>,
    roller: <g>{face}<g transform="rotate(-35 70 60)"><rect x="56" y="40" width="28" height="14" rx="7" fill="#f2b3c4" /><rect x="68" y="54" width="4" height="34" rx="2" fill="#c9a24e" /></g></g>,
    drop: <g><path d="M50 10 C64 32 78 46 78 62 C78 78 66 90 50 90 C34 90 22 78 22 62 C22 46 36 32 50 10 Z" fill={`url(#k${id})`} /><path d="M36 60 C36 70 42 78 50 80" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".6" /></g>,
    syringe: <g transform="rotate(-40 50 50)"><rect x="20" y="42" width="52" height="16" rx="4" fill="#fde7ee" stroke="#e2678f" strokeWidth="2" /><rect x="24" y="45" width="30" height="10" rx="2" fill={`url(#k${id})`} /><rect x="72" y="48" width="18" height="4" fill="#9aa3ad" /><rect x="8" y="46" width="12" height="8" fill="#e2678f" /><rect x="4" y="38" width="5" height="24" rx="2" fill="#e2678f" />{[30, 38, 46, 54, 62].map(x => <path key={x} d={`M${x} 42 V48`} stroke="#e2678f" strokeWidth="1.2" />)}</g>,
    lips: <g><path d="M14 50 C24 36 38 34 50 42 C62 34 76 36 86 50 C74 70 26 70 14 50 Z" fill={`url(#k${id})`} /><path d="M14 50 C30 54 70 54 86 50" stroke="#c4526c" strokeWidth="2.4" fill="none" /><path d="M36 58 C42 62 50 62 56 60" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".5" /></g>,
    laser: <g><rect x="54" y="8" width="20" height="44" rx="8" fill="#e9eef2" stroke="#9aa3ad" strokeWidth="2" transform="rotate(30 64 30)" /><path d="M48 52 L30 82" stroke="#f05a7e" strokeWidth="4" strokeLinecap="round" /><circle cx="28" cy="86" r="8" fill="#f05a7e" opacity=".35" /><circle cx="28" cy="86" r="4" fill="#f05a7e" /></g>,
    hands: <g><path d="M10 70 C24 52 40 50 54 56 L80 50 C88 48 92 58 84 62 L60 70 C70 72 80 76 88 74" stroke="#e8b9a3" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 40 C30 34 60 34 86 40" stroke={`url(#k${id})`} strokeWidth="8" fill="none" strokeLinecap="round" opacity=".7" /></g>,
    body: <g><path d="M38 10 C34 30 30 40 34 52 C38 64 30 76 32 92 H68 C70 76 62 64 66 52 C70 40 66 30 62 10 Z" fill="#f6d9c8" /><path d="M34 52 C44 56 56 56 66 52" stroke="#e2678f" strokeWidth="3" strokeDasharray="4 4" fill="none" /></g>,
    lotus: <g transform="translate(-10 -6) scale(1)"><LotusShape id={id} /></g>,
  };
  return <svg viewBox="0 0 100 100" aria-hidden="true">{pink(id)}{shapes[art] ?? shapes.face}</svg>;
}
function LotusShape({ id }: { id: string }) {
  return <g><path d="M60 92 C40 78 32 54 38 28 C52 40 60 64 60 92 Z" fill={`url(#r${id})`} /><path d="M60 92 C80 78 88 54 82 28 C68 40 60 64 60 92 Z" fill={`url(#r${id})`} /><path d="M60 92 C48 70 48 40 60 14 C72 40 72 70 60 92 Z" fill={`url(#k${id})`} /></g>;
}
