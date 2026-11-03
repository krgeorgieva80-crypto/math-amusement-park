import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

/**
 * Игрова сцена с логическа резолюция и мащабиране.
 * Хоризонтално: височина 900 логически пиксела, ширина според екрана
 * (16:9 → 1600, 4:3 → 1200, 21:9 → 2100). Вертикално (телефон/таблет):
 * ширина 900, височина 1200–2000. Така всичко се вижда без скролиране.
 */
export interface StageInfo {
  width: number
  height: number
  scale: number
  portrait: boolean
  ref: RefObject<HTMLDivElement | null>
  /** Превръща координати от екрана в координати на сцената. */
  toStage: (clientX: number, clientY: number) => { x: number; y: number }
}

const StageContext = createContext<StageInfo | null>(null)

function measure() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const aspect = vw / vh
  if (aspect >= 1) {
    const height = 900
    const width = Math.round(Math.min(2100, Math.max(1200, height * aspect)))
    const scale = Math.min(vw / width, vh / height)
    return { width, height, scale, portrait: false, left: (vw - width * scale) / 2, top: (vh - height * scale) / 2 }
  }
  const width = 900
  const height = Math.round(Math.min(2000, Math.max(1200, width / aspect)))
  const scale = Math.min(vw / width, vh / height)
  return { width, height, scale, portrait: true, left: (vw - width * scale) / 2, top: (vh - height * scale) / 2 }
}

export function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState(measure)

  useLayoutEffect(() => {
    const onResize = () => setDims(measure())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  const info: StageInfo = {
    width: dims.width,
    height: dims.height,
    scale: dims.scale,
    portrait: dims.portrait,
    ref,
    toStage: (clientX, clientY) => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return { x: clientX, y: clientY }
      return { x: (clientX - rect.left) / dims.scale, y: (clientY - rect.top) / dims.scale }
    },
  }

  return (
    <div className="stage-viewport">
      <div
        ref={ref}
        className={`stage ${dims.portrait ? 'is-portrait' : 'is-landscape'}`}
        style={{ width: dims.width, height: dims.height, left: dims.left, top: dims.top, transform: `scale(${dims.scale})` }}
      >
        <StageContext.Provider value={info}>{children}</StageContext.Provider>
      </div>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStage(): StageInfo {
  const ctx = useContext(StageContext)
  if (!ctx) throw new Error('useStage трябва да се използва в Stage')
  return ctx
}
