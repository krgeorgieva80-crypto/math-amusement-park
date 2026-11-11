import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { useApp } from './AppContext'

/**
 * Игрова сцена с логическа резолюция и мащабиране.
 * Хоризонтално: височина 900 логически пиксела, ширина според екрана
 * (16:9 → 1600, 4:3 → 1200, 21:9 → 2100). Вертикално (телефон/таблет):
 * ширина 900, височина 1200–2000. Така всичко се вижда без скролиране.
 *
 * Четимост: сцената подава мащаба си като CSS променлива --s, за да може CSS
 * да гарантира минимален РЕАЛЕН размер на текста и на зоните за докосване
 * (вж. „Типографска система“ в index.css). Режимът (ui-phone / ui-compact / ui-regular / ui-roomy)
 * се определя от реалния размер на игралното поле, а не само от резолюцията.
 */
export type StageTier = 'phone' | 'compact' | 'regular' | 'roomy'
export interface StageInfo {
  width: number
  height: number
  scale: number
  portrait: boolean
  /** Режим според реалния размер на игралното поле. */
  tier: StageTier
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

/**
 * Реалният размер на игралното поле (в CSS пиксели) определя режима:
 * телефон — под ~500 px по късата страна: телефоните имат собствени подредби, минимумите за таблет не важат;
 * компактен — полето е по-малко от ~720 px по късата страна (напр. 960×600, малък таблет);
 * просторен — поне ~1000 px по късата страна и ~1500 по дългата (голям монитор, интерактивен дисплей).
 */
// eslint-disable-next-line react-refresh/only-export-components
export function stageTier(width: number, height: number, scale: number, portrait: boolean): StageTier {
  const short = (portrait ? width : height) * scale
  const long = (portrait ? height : width) * scale
  if (short < 500) return 'phone'
  if (short < 720) return 'compact'
  if (short >= 1000 && long >= 1500) return 'roomy'
  return 'regular'
}

export function Stage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState(measure)
  const { settings } = useApp()

  useLayoutEffect(() => {
    const onResize = () => setDims(measure())
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  const tier = stageTier(dims.width, dims.height, dims.scale, dims.portrait)
  const info: StageInfo = {
    width: dims.width,
    height: dims.height,
    scale: dims.scale,
    portrait: dims.portrait,
    tier,
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
        className={`stage ${dims.portrait ? 'is-portrait' : 'is-landscape'} ui-${tier} ${settings.animationsOn ? '' : 'no-motion'}`}
        style={{ width: dims.width, height: dims.height, left: dims.left, top: dims.top, transform: `scale(${dims.scale})`, '--s': dims.scale } as CSSProperties}
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
