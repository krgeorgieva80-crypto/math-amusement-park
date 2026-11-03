import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { useStage } from '../../core/Stage'

export type DragSource = 'supply' | 'tray'

export interface DragState {
  value: number
  source: DragSource
  x: number
  y: number
  overTray: boolean
}

interface Options {
  trayRef: RefObject<HTMLElement | null>
  /** Докосване без влачене. */
  onTap: (value: number, source: DragSource) => void
  /** Пускане след влачене; inTray — дали е пуснат в зоната. */
  onDrop: (value: number, source: DragSource, inTray: boolean) => void
  onStart?: (value: number, source: DragSource) => void
  disabled?: boolean
}

const DRAG_THRESHOLD = 10

/**
 * Влачене с мишка, писалка и пръст чрез Pointer Events.
 * Работи еднакво на компютър, таблет и интерактивна дъска.
 */
export function useTokenDrag({ trayRef, onTap, onDrop, onStart, disabled }: Options) {
  const { toStage } = useStage()
  const [drag, setDrag] = useState<DragState | null>(null)
  const pending = useRef<{ value: number; source: DragSource; startX: number; startY: number; id: number; active: boolean } | null>(null)

  const isOverTray = (clientX: number, clientY: number) => {
    const r = trayRef.current?.getBoundingClientRect()
    return !!r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
  }

  const bind = useCallback(
    (value: number, source: DragSource) => ({
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return
        // Втори пръст по време на влачене се пренебрегва.
        if (pending.current) return
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        pending.current = { value, source, startX: e.clientX, startY: e.clientY, id: e.pointerId, active: false }
      },
      onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
        const p = pending.current
        if (!p || p.id !== e.pointerId) return
        const { x, y } = toStage(e.clientX, e.clientY)
        if (!p.active) {
          const start = toStage(p.startX, p.startY)
          if (Math.hypot(x - start.x, y - start.y) < DRAG_THRESHOLD) return
          p.active = true
          onStart?.(p.value, p.source)
        }
        setDrag({ value: p.value, source: p.source, x, y, overTray: isOverTray(e.clientX, e.clientY) })
      },
      onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
        const p = pending.current
        if (!p || p.id !== e.pointerId) return
        pending.current = null
        setDrag(null)
        if (p.active) onDrop(p.value, p.source, isOverTray(e.clientX, e.clientY))
        else onTap(p.value, p.source)
      },
      onPointerCancel: () => {
        pending.current = null
        setDrag(null)
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled, onTap, onDrop, onStart, toStage],
  )

  return { drag, bind }
}
