import { useRef, useState } from 'react'

export function useZoomPan(initial = 1) {
  const [zoom, setZoom] = useState(initial)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const last = useRef({ x: 0, y: 0 })

  const onWheel: React.WheelEventHandler = (e) => {
    e.preventDefault()
    const next = Math.min(5, Math.max(0.25, zoom + (e.deltaY > 0 ? -0.1 : 0.1)))
    setZoom(Number(next.toFixed(2)))
  }
  const onMouseDown: React.MouseEventHandler = (e) => {
    dragging.current = true
    last.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseUp = () => { dragging.current = false }
  const onMouseLeave = () => { dragging.current = false }
  const onMouseMove: React.MouseEventHandler = (e) => {
    if (!dragging.current) return
    const dx = e.clientX - last.current.x
    const dy = e.clientY - last.current.y
    last.current = { x: e.clientX, y: e.clientY }
    setOffset((p) => ({ x: p.x + dx, y: p.y + dy }))
  }

  const reset = () => { setZoom(initial); setOffset({ x: 0, y: 0 }) }

  return { zoom, setZoom, offset, setOffset, onWheel, onMouseDown, onMouseUp, onMouseLeave, onMouseMove, reset }
}

