'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import x from './notas.module.css'

/** Menu flutuante ancorado num elemento (ou num ponto); fecha ao clicar fora ou com Esc. */
export function Menu({ ancora, onFechar, children, alinhar = 'inicio', className }: {
  ancora: HTMLElement | { x: number; y: number } | null; onFechar: () => void; children: ReactNode; alinhar?: 'inicio' | 'fim'; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  useLayoutEffect(() => {
    if (!ancora || !ref.current) return
    const r = 'getBoundingClientRect' in ancora ? ancora.getBoundingClientRect() : { left: ancora.x, right: ancora.x, bottom: ancora.y, top: ancora.y }
    const menu = ref.current.getBoundingClientRect()
    let left = alinhar === 'fim' ? r.right - menu.width : r.left
    let top = r.bottom + 4
    left = Math.max(8, Math.min(left, window.innerWidth - menu.width - 8))
    if (top + menu.height > window.innerHeight - 8) top = Math.max(8, r.top - menu.height - 4)
    setPos({ top, left })
  }, [ancora, alinhar])
  useEffect(() => {
    const fora = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onFechar() }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    const t = setTimeout(() => window.addEventListener('mousedown', fora))
    window.addEventListener('keydown', esc)
    return () => { clearTimeout(t); window.removeEventListener('mousedown', fora); window.removeEventListener('keydown', esc) }
  }, [onFechar])
  if (!ancora) return null
  return createPortal(<div ref={ref} role="menu" className={`${x.menu} ${className ?? ''}`} style={pos ?? { visibility: 'hidden', top: 0, left: 0 }}
    onMouseDown={e => e.stopPropagation()}>{children}</div>, document.body)
}

export function ItemMenu({ icone: Icone, children, atalho, onClick, perigo, direita }: {
  icone?: React.ComponentType<{ size?: number }>; children: ReactNode; atalho?: string; onClick?: () => void; perigo?: boolean; direita?: ReactNode
}) {
  return <button type="button" role="menuitem" className={`${x.menuItem} ${perigo ? x.danger : ''}`} onClick={onClick}>
    {Icone && <Icone size={16} />}<span>{children}</span>{atalho && <small>{atalho}</small>}{direita}
  </button>
}

export const Chave = ({ ligada }: { ligada: boolean }) => <span className={`${x.switch} ${ligada ? x.switchOn : ''}`} aria-hidden />
