import { useId, type ReactNode } from 'react';

/** Dimensional icons used in the tab bar, today's card and the module cards. */
export function HotelIcon({ name, tone = 'pink' }: { name: 'home' | 'calendar' | 'people' | 'bed' | 'chart' | 'report'; tone?: 'pink' | 'green' | 'orange' }) {
  const id = useId().replace(/:/g, '');
  const g = (key: string, a: string, b: string) => <linearGradient id={`${key}${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>;
  const cal = { pink: ['#ff9aa8', '#e9506a'], green: ['#7fe0a4', '#2fae68'], orange: ['#ffc46b', '#f08a24'] }[tone];
  const shadow = <ellipse cx="24" cy="44.5" rx="15" ry="2.4" fill="#0b1d33" opacity=".22" />;
  const icons: Record<string, ReactNode> = {
    home: <>{shadow}
      <path d="M10 22 L24 10 L38 22 V41 H10 Z" fill={`url(#w${id})`} /><path d="M38 22 V41 H34 V25 Z" fill="#e7d9c6" />
      <path d="M5 23.5 L24 7 L43 23.5 L40 26.5 L24 13 L8 26.5 Z" fill={`url(#o${id})`} /><rect x="20" y="28" width="8" height="13" rx="1.5" fill="#d9772a" /><rect x="13" y="27" width="5" height="5" rx="1" fill="#9fd3ff" /></>,
    calendar: <>{shadow}
      <rect x="7" y="10" width="34" height="32" rx="6" fill={`url(#w${id})`} /><path d="M7 16 C7 12.7 9.7 10 13 10 H35 C38.3 10 41 12.7 41 16 V20 H7 Z" fill={`url(#c${id})`} />
      {[16, 32].map(x => <rect key={x} x={x - 1.6} y="6" width="3.2" height="8" rx="1.6" fill={cal[1]} />)}
      {[0, 1, 2].flatMap(c => [0, 1].map(r => <rect key={`${c}${r}`} x={13 + c * 8} y={24 + r * 8} width="6" height="5" rx="1.2" fill={c === 1 && r === 0 ? cal[1] : '#e6e9ef'} />))}</>,
    people: <>{shadow}
      <circle cx="17" cy="17" r="6.5" fill={`url(#v${id})`} /><path d="M6 39 C6 29 10.5 25 17 25 C23.5 25 28 29 28 39 Z" fill={`url(#v${id})`} />
      <circle cx="31" cy="15" r="7.5" fill={`url(#b${id})`} /><path d="M18 41 C18 30 24 25 31 25 C38 25 43 30 43 41 Z" fill={`url(#b${id})`} /></>,
    bed: <>{shadow}
      <rect x="6" y="14" width="36" height="14" rx="5" fill={`url(#b${id})`} /><rect x="10" y="18" width="12" height="7" rx="3" fill="#dcecff" /><rect x="26" y="18" width="12" height="7" rx="3" fill="#dcecff" />
      <rect x="4" y="26" width="40" height="10" rx="4" fill={`url(#b${id})`} /><rect x="4" y="26" width="40" height="4" rx="2" fill="#8fc1ff" opacity=".7" /><rect x="7" y="36" width="4" height="6" rx="1.5" fill="#2f5fc0" /><rect x="37" y="36" width="4" height="6" rx="1.5" fill="#2f5fc0" /></>,
    chart: <>{shadow}
      {[[8, 14], [19, 22], [30, 32]].map(([x, h]) => <g key={x}><rect x={x} y={42 - h} width="10" height={h} rx="2.4" fill={`url(#b${id})`} /><rect x={x + 7} y={42 - h} width="3" height={h} rx="1.5" fill="#000" opacity=".14" /></g>)}</>,
    report: <>{shadow}
      <path d="M12 5 H30 L38 13 V41 C38 42.1 37.1 43 36 43 H12 C10.9 43 10 42.1 10 41 V7 C10 5.9 10.9 5 12 5 Z" fill={`url(#w${id})`} stroke="#d5dbe5" strokeWidth="1" /><path d="M30 5 V13 H38 Z" fill="#dfe5ee" />
      {[19, 24, 29, 34].map((y, k) => <rect key={y} x="15" y={y} width={k === 3 ? 11 : 18} height="2.4" rx="1.2" fill="#b9c4d4" />)}</>,
  };
  return <svg viewBox="0 0 48 48" aria-hidden="true">
    <defs>{g('w', '#ffffff', '#e6ebf2')}{g('o', '#ffb25c', '#e8711f')}{g('c', cal[0], cal[1])}{g('v', '#c6b6ff', '#7d6be8')}{g('b', '#8fc4ff', '#3d73e0')}</defs>
    {icons[name]}
  </svg>;
}

/** Sun on the horizon, rising or setting. */
export function SunHorizon({ setting = false }: { setting?: boolean }) {
  return <svg viewBox="0 0 32 32" aria-hidden="true"><g stroke="#ffb12b" strokeWidth="2" strokeLinecap="round" fill="none">
    <path d="M8 21 A8 8 0 0 1 24 21" /><path d="M4 25 H28" /><path d="M16 6 V9 M6 11 L8 13 M26 11 L24 13 M2 19 H5 M27 19 H30" />
    <path d={setting ? 'M13 15 L16 18 L19 15' : 'M13 17 L16 14 L19 17'} strokeWidth="1.6" />
  </g></svg>;
}
