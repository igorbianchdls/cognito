import { useId } from 'react';
import type { ProductIcon } from './data';

const useSvgId = () => useId().replace(/:/g, '');

export function CoinsArt() {
  const id = useSvgId();
  const coin = (cx: number, cy: number, key: string) => <g key={key}><ellipse cx={cx} cy={cy + 5} rx="22" ry="7.5" fill="#d9465b" /><rect x={cx - 22} y={cy} width="44" height="5" fill="#e4566a" /><ellipse cx={cx} cy={cy} rx="22" ry="7.5" fill={`url(#c${id})`} /><ellipse cx={cx} cy={cy} rx="14" ry="4.5" fill="none" stroke="#fff" strokeOpacity=".45" /></g>;
  return <svg viewBox="0 0 96 86" aria-hidden="true">
    <defs><linearGradient id={`c${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffb3bd" /><stop offset=".6" stopColor="#f77b8b" /><stop offset="1" stopColor="#ea5a6e" /></linearGradient></defs>
    <ellipse cx="48" cy="80" rx="38" ry="4" fill="#9b2c3c" opacity=".12" />
    {[0, 1, 2, 3, 4].map(i => coin(34, 70 - i * 7, `a${i}`))}
    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => coin(60, 72 - i * 7, `b${i}`))}
  </svg>;
}

export function PawArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 96 86" aria-hidden="true">
    <defs><radialGradient id={`p${id}`} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#ffc2ca" /><stop offset=".6" stopColor="#f77b8b" /><stop offset="1" stopColor="#e2566b" /></radialGradient></defs>
    <ellipse cx="48" cy="80" rx="30" ry="3.6" fill="#9b2c3c" opacity=".12" />
    <path d="M48 40 C62 40 72 54 70 64 C68 72 58 72 48 69 C38 72 28 72 26 64 C24 54 34 40 48 40 Z" fill={`url(#p${id})`} />
    {[[24, 34, -20], [38, 22, -6], [58, 22, 6], [72, 34, 20]].map(([x, y, r]) => <ellipse key={x} cx={x} cy={y} rx="8" ry="11" transform={`rotate(${r} ${x} ${y})`} fill={`url(#p${id})`} />)}
    <ellipse cx="40" cy="50" rx="6" ry="3" fill="#fff" opacity=".35" />
  </svg>;
}

export function ClientsArt() {
  const id = useSvgId();
  return <svg viewBox="0 0 96 86" aria-hidden="true">
    <defs><radialGradient id={`b${id}`} cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#ffc2ca" /><stop offset=".65" stopColor="#f47386" /><stop offset="1" stopColor="#df5066" /></radialGradient></defs>
    <ellipse cx="48" cy="80" rx="36" ry="4" fill="#9b2c3c" opacity=".12" />
    <circle cx="48" cy="18" r="11" fill={`url(#b${id})`} /><path d="M30 50 C30 36 66 36 66 50 Z" fill={`url(#b${id})`} />
    <circle cx="24" cy="36" r="10" fill={`url(#b${id})`} /><path d="M8 72 C8 52 40 52 40 72 Z" fill={`url(#b${id})`} />
    <circle cx="58" cy="44" r="11" fill={`url(#b${id})`} /><path d="M40 76 C40 60 76 60 76 76 Z" fill={`url(#b${id})`} />
    <circle cx="72" cy="66" r="12" fill="#fff" /><circle cx="72" cy="66" r="10" fill="#2d2a32" /><path d="M72 60 V72 M66 66 H78" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
  </svg>;
}

export function BoxArt() {
  return <svg viewBox="0 0 96 86" aria-hidden="true">
    <ellipse cx="48" cy="80" rx="36" ry="4" fill="#9b2c3c" opacity=".12" />
    <polygon points="14,26 48,14 82,26 48,38" fill="#ffc7cf" />
    <polygon points="14,26 48,38 48,78 14,64" fill="#f58a99" />
    <polygon points="48,38 82,26 82,64 48,78" fill="#e86a7e" />
    <polygon points="38,17.5 46,14.7 80,27 72,30" fill="#e4566a" /><polygon points="72,30 80,27 80,40 72,43" fill="#cf4459" />
    <path d="M18 30 L44 40" stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" />
  </svg>;
}

export function ProductArt({ icon }: { icon: ProductIcon }) {
  return <svg viewBox="0 0 36 36" aria-hidden="true">
    <ellipse cx="18" cy="32" rx="12" ry="2.2" fill="#9b2c3c" opacity=".1" />
    {icon === 'food' && <g><path d="M9 8 L27 8 L29 30 L7 30 Z" fill="#f2735a" /><rect x="9" y="5" width="18" height="4" rx="1" fill="#d65a43" /><rect x="11" y="14" width="14" height="9" rx="2" fill="#ffe7cf" /><circle cx="18" cy="18.5" r="2.4" fill="#d65a43" /></g>}
    {icon === 'shampoo' && <g><rect x="11" y="12" width="14" height="19" rx="4" fill="#f5a3c7" /><rect x="15" y="6" width="6" height="7" rx="1.5" fill="#d96aa0" /><rect x="19" y="4" width="6" height="2.6" rx="1.3" fill="#d96aa0" /><rect x="14" y="17" width="8" height="7" rx="2" fill="#fff" opacity=".75" /></g>}
    {icon === 'pill' && <g><rect x="6" y="10" width="24" height="16" rx="3" fill="#6fb8f2" /><rect x="6" y="10" width="24" height="5" rx="2" fill="#4a9be0" /><rect x="11" y="18" width="14" height="4" rx="2" fill="#fff" /></g>}
    {icon === 'treat' && <g transform="rotate(-25 18 18)"><rect x="8" y="15" width="20" height="6" rx="3" fill="#c98b5a" /><circle cx="8" cy="15" r="3.6" fill="#c98b5a" /><circle cx="8" cy="21" r="3.6" fill="#c98b5a" /><circle cx="28" cy="15" r="3.6" fill="#c98b5a" /><circle cx="28" cy="21" r="3.6" fill="#c98b5a" /></g>}
    {icon === 'litter' && <g><polygon points="8,12 18,7 28,12 18,17" fill="#e9ebef" /><polygon points="8,12 18,17 18,30 8,25" fill="#c9ced6" /><polygon points="18,17 28,12 28,25 18,30" fill="#b1b8c2" /></g>}
    {icon === 'toy' && <g><circle cx="18" cy="19" r="10" fill="#7ccf9c" /><path d="M9 16 C14 20 22 20 27 16" stroke="#fff" strokeWidth="1.6" fill="none" /><path d="M10 24 C15 21 21 21 26 24" stroke="#fff" strokeWidth="1.6" fill="none" /></g>}
  </svg>;
}
