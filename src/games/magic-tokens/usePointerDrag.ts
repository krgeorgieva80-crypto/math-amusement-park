import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useStage } from '../../core/Stage'

export interface DragInfo<T> {
  payload: T
  x: number
  y: number
  /** Ключът на зоната под пръста (атрибут data-drop) или null. */
  over: string | null
}

interface Options<T> {
  onTap: (payload: T) => void
  onDrop: (payload: T, target: string | null) => void
  onStart?: (payload: T) => void
  disabled?: boolean
}

const THRESHOLD = 10

/** Намира зоната за пускане под точката (елемент с data-drop). */
function dropTargetAt(clientX: number, clientY: number): string | null {
  for (const el of document.elementsFromPoint(clientX, clientY)) {
    const zone = (el as HTMLElement).closest?.('[data-drop]') as HTMLElement | null
    if (zone) return zone.dataset.drop ?? null
  }
  return null
}

/**
 * Влачене и докосване с Pointer Events — мишка, писалка и пръст.
 * Докосване без движение се отчита като „тап“.
 */
export function usePointerDrag<T>({ onTap, onDrop, onStart, disabled }: Options<T>) {
  const { toStage } = useStage()
  const [drag, setDrag] = useState<DragInfo<T> | null>(null)
  const pending = useRef<{ payload: T; sx: number; sy: number; id: number; active: boolean } | null>(null)

  const bind = (payload: T) => ({
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (disabled || pending.current || (e.pointerType === 'mouse' && e.button !== 0)) return
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.setPointerCapture(e.pointerId)
      pending.current = { payload, sx: e.clientX, sy: e.clientY, id: e.pointerId, active: false }
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const p = pending.current
      if (!p || p.id !== e.pointerId) return
      const cur = toStage(e.clientX, e.clientY)
      if (!p.active) {
        const start = toStage(p.sx, p.sy)
        if (Math.hypot(cur.x - start.x, cur.y - start.y) < THRESHOLD) return
        p.active = true
        onStart?.(p.payload)
      }
      setDrag({ payload: p.payload, x: cur.x, y: cur.y, over: dropTargetAt(e.clientX, e.clientY) })
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      const p = pending.current
      if (!p || p.id !== e.pointerId) return
      pending.current = null
      setDrag(null)
      if (p.active) onDrop(p.payload, dropTargetAt(e.clientX, e.clientY))
      else onTap(p.payload)
    },
    onPointerCancel: () => {
      pending.current = null
      setDrag(null)
    },
  })

  return { drag, bind }
}
