import { useId } from 'react';
import type { Body } from './data';

/** Mixes a hex color with white (amount > 0) or black (amount < 0). */
export function shade(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16), target = amount > 0 ? 255 : 0, a = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * a).toString(16).padStart(2, '0');
  return `#${mix(n >> 16)}${mix((n >> 8) & 255)}${mix(n & 255)}`;
}

type Shape = { L: number; nose: number; belt: number; roof: number; ws: number; wf: number; wr: number; rb: number; tail: number; wheels: [number, number]; r: number };
const shapes: Record<Body, Shape> = {
  sedan: { L: 114, nose: 29, belt: 25, roof: 13, ws: 38, wf: 56, wr: 80, rb: 98, tail: 25, wheels: [28, 90], r: 8 },
  hatch: { L: 106, nose: 29, belt: 25, roof: 12, ws: 36, wf: 52, wr: 84, rb: 100, tail: 24, wheels: [26, 84], r: 8 },
  suv: { L: 114, nose: 24, belt: 21, roof: 7, ws: 34, wf: 50, wr: 98, rb: 110, tail: 20, wheels: [28, 92], r: 9 },
  pickup: { L: 116, nose: 25, belt: 22, roof: 9, ws: 34, wf: 48, wr: 66, rb: 70, tail: 22, wheels: [26, 94], r: 9 },
  sports: { L: 114, nose: 33, belt: 29, roof: 19, ws: 44, wf: 60, wr: 76, rb: 100, tail: 28, wheels: [28, 92], r: 8 },
  classic: { L: 116, nose: 28, belt: 26, roof: 15, ws: 40, wf: 54, wr: 82, rb: 96, tail: 26, wheels: [28, 94], r: 8 },
};

/** Side view of a vehicle, drawn so every OS card stays sharp at any size. */
export function Car({ body, color, className }: { body: Body; color: string; className?: string }) {
  const id = useId().replace(/:/g, '');
  const { L, nose, belt, roof, ws, wf, wr, rb, tail, wheels: [w1, w2], r } = shapes[body];
  const B = 41, R = r + 2, mid = body === 'pickup' ? wr - 6 : (wf + wr) / 2 + 2;
  const outline = `M6 ${B - 5} C6 ${nose + 3} 8 ${nose} 14 ${nose} L${ws} ${belt} C${ws + 6} ${roof + 5} ${wf - 6} ${roof} ${wf} ${roof} L${wr} ${roof} C${wr + 6} ${roof} ${rb - 4} ${belt - 3} ${rb} ${belt} L${L - 4} ${tail} C${L - 1} ${tail + 1} ${L} ${tail + 4} ${L} ${tail + 8} L${L} ${B - 3} C${L} ${B - 1} ${L - 2} ${B} ${L - 4} ${B} L${w2 + R} ${B} A${R} ${R} 0 0 0 ${w2 - R} ${B} L${w1 + R} ${B} A${R} ${R} 0 0 0 ${w1 - R} ${B} L10 ${B} C7 ${B} 6 ${B - 2} 6 ${B - 5} Z`;
  const front = `M${ws + 4} ${belt - 1} C${ws + 8} ${roof + 6} ${wf - 4} ${roof + 3} ${wf + 1} ${roof + 3} L${mid - 1.5} ${roof + 3} L${mid - 1.5} ${belt - 1} Z`;
  const rear = body === 'pickup' ? `M${mid + 1.5} ${roof + 3} L${wr - 1} ${roof + 3} L${wr + 1} ${belt - 1} L${mid + 1.5} ${belt - 1} Z` : `M${mid + 1.5} ${roof + 3} L${wr - 1} ${roof + 3} C${wr + 4} ${roof + 3} ${rb - 6} ${belt - 4} ${rb - 3} ${belt - 1} L${mid + 1.5} ${belt - 1} Z`;
  const light = color.toLowerCase() === '#f4f4f2';
  return <svg viewBox="0 0 120 54" className={className} aria-hidden="true">
    <defs>
      <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={shade(color, .38)} /><stop offset=".42" stopColor={color} /><stop offset="1" stopColor={shade(color, light ? -.22 : -.42)} /></linearGradient>
      <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5d7083" /><stop offset=".55" stopColor="#25303b" /><stop offset="1" stopColor="#141a20" /></linearGradient>
      <radialGradient id={`w${id}`}><stop offset=".25" stopColor="#f2f4f7" /><stop offset="1" stopColor="#9aa2ad" /></radialGradient>
    </defs>
    <ellipse cx={(6 + L) / 2} cy="50.5" rx={(L - 6) / 2 + 2} ry="2.6" fill="#0b0d10" opacity=".16" />
    <path d={outline} fill={`url(#b${id})`} stroke={shade(color, -.5)} strokeOpacity=".35" strokeWidth=".5" />
    <path d={front} fill={`url(#g${id})`} /><path d={rear} fill={`url(#g${id})`} />
    <path d={`M${ws + 8} ${belt + 1.2} L${body === 'pickup' ? rb : rb - 2} ${belt + 1.2}`} stroke="#fff" strokeOpacity=".45" strokeWidth=".9" strokeLinecap="round" />
    <path d={`M${mid} ${belt} L${mid} ${B - 3}`} stroke={shade(color, -.45)} strokeOpacity=".5" strokeWidth=".6" />
    {body === 'pickup' && <path d={`M${rb + 1} ${belt + 2} L${L - 3} ${belt + 2}`} stroke={shade(color, -.5)} strokeOpacity=".5" strokeWidth=".7" />}
    <rect x={mid - 9} y={belt + 4} width="5" height="1.4" rx=".7" fill={shade(color, -.45)} opacity=".7" /><rect x={mid + 5} y={belt + 4} width="5" height="1.4" rx=".7" fill={shade(color, -.45)} opacity=".7" />
    <path d={`M8 ${B - 6} L${L - 2} ${B - 6}`} stroke="#000" strokeOpacity=".14" strokeWidth="2.2" />
    <rect x="6.5" y={nose + 1} width="7" height="3" rx="1.5" fill="#fff7d6" stroke="#0003" strokeWidth=".4" />
    <rect x={L - 4} y={tail + 2} width="3.5" height="4" rx="1.2" fill="#c81d25" />
    {[w1, w2].map(x => <g key={x}>
      <circle cx={x} cy={B} r={r} fill="#1b1d21" /><circle cx={x} cy={B} r={r * .62} fill={`url(#w${id})`} />
      {[0, 72, 144, 216, 288].map(a => <line key={a} x1={x} y1={B} x2={x + Math.cos(a * Math.PI / 180) * r * .55} y2={B + Math.sin(a * Math.PI / 180) * r * .55} stroke="#7d8590" strokeWidth=".9" />)}
      <circle cx={x} cy={B} r="1.4" fill="#5d646e" />
    </g>)}
  </svg>;
}

export function CashArt() {
  const id = useId().replace(/:/g, '');
  const bill = (y: number, rot: number, key: number) => <g key={key} transform={`translate(0 ${y}) rotate(${rot} 46 40)`}>
    <rect x="14" y="26" width="64" height="30" rx="4" fill={`url(#c${id})`} stroke="#1f6b45" strokeWidth=".8" />
    <rect x="18" y="30" width="56" height="22" rx="3" fill="none" stroke="#d6f5e3" strokeOpacity=".7" strokeWidth=".8" />
    <circle cx="46" cy="41" r="7" fill="#d6f5e3" opacity=".75" /><text x="46" y="44.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#1f6b45">R$</text>
  </g>;
  return <svg viewBox="0 0 96 76" aria-hidden="true">
    <defs><linearGradient id={`c${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7fd9a5" /><stop offset=".55" stopColor="#3fae72" /><stop offset="1" stopColor="#25885a" /></linearGradient>
      <linearGradient id={`k${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe08a" /><stop offset="1" stopColor="#e2a521" /></linearGradient></defs>
    <ellipse cx="48" cy="70" rx="38" ry="4" fill="#0b0d10" opacity=".12" />
    {[bill(10, -6, 0), bill(4, 3, 1), bill(-2, -10, 2)]}
    <rect x="40" y="26" width="10" height="34" rx="2" fill="#f4efe1" transform="rotate(-10 46 40)" opacity=".95" />
    <g><ellipse cx="78" cy="62" rx="11" ry="4" fill="#c58c14" /><rect x="67" y="56" width="22" height="6" fill="#c58c14" /><ellipse cx="78" cy="56" rx="11" ry="4" fill={`url(#k${id})`} /></g>
    <g><ellipse cx="74" cy="52" rx="11" ry="4" fill="#c58c14" /><rect x="63" y="46" width="22" height="6" fill="#c58c14" /><ellipse cx="74" cy="46" rx="11" ry="4" fill={`url(#k${id})`} /></g>
  </svg>;
}

export function AlertArt() {
  const id = useId().replace(/:/g, '');
  const tri = 'M48 8 C51 8 53 9.6 54.6 12.4 L83 61 C86 66.5 83 72 76.6 72 L19.4 72 C13 72 10 66.5 13 61 L41.4 12.4 C43 9.6 45 8 48 8 Z';
  return <svg viewBox="0 0 96 82" aria-hidden="true">
    <defs><linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe066" /><stop offset=".6" stopColor="#ffbe1a" /><stop offset="1" stopColor="#f59e0b" /></linearGradient></defs>
    <ellipse cx="50" cy="77" rx="34" ry="3.6" fill="#0b0d10" opacity=".14" />
    <path d={tri} fill="#d9820a" transform="translate(4 3)" />
    <path d={tri} fill={`url(#a${id})`} />
    <path d="M44 16 C45.6 13.6 47 13 48 13" stroke="#fff" strokeOpacity=".7" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    <rect x="43.5" y="28" width="9" height="25" rx="4.5" fill="#3a2a10" /><circle cx="48" cy="62" r="5" fill="#3a2a10" />
  </svg>;
}

function gear(cx: number, cy: number, teeth: number, outer: number, inner: number) {
  const pts: string[] = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2, r = i % 4 < 2 ? outer : inner;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
}

export function PartsArt() {
  const id = useId().replace(/:/g, '');
  return <svg viewBox="0 0 96 80" aria-hidden="true">
    <defs><linearGradient id={`p${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f3ece0" /><stop offset=".6" stopColor="#d8cbb4" /><stop offset="1" stopColor="#b3a487" /></linearGradient>
      <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eef1f4" /><stop offset="1" stopColor="#9aa3ae" /></linearGradient></defs>
    <ellipse cx="48" cy="74" rx="38" ry="3.6" fill="#0b0d10" opacity=".12" />
    <polygon points={gear(40, 40, 10, 27, 21)} fill="#a8987a" transform="translate(2.5 3)" />
    <polygon points={gear(40, 40, 10, 27, 21)} fill={`url(#p${id})`} />
    <circle cx="40" cy="40" r="13" fill="#c7b89c" /><circle cx="40" cy="40" r="7" fill="#8f805f" /><circle cx="38" cy="38" r="3" fill="#f6f1e7" opacity=".6" />
    <polygon points={gear(74, 22, 8, 13, 9.5)} fill="#8e98a4" transform="translate(1.5 2)" />
    <polygon points={gear(74, 22, 8, 13, 9.5)} fill={`url(#s${id})`} /><circle cx="74" cy="22" r="4" fill="#6f7884" />
    <polygon points="74,52 83,57 83,67 74,72 65,67 65,57" fill="#8e98a4" transform="translate(1 2)" />
    <polygon points="74,52 83,57 83,67 74,72 65,67 65,57" fill={`url(#s${id})`} /><circle cx="74" cy="62" r="4" fill="#5f6873" />
  </svg>;
}
