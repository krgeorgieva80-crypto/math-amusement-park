/**
 * Преходът между мисиите: малка карта на приказната пътечка (вход → 5 мисии → домът на зайчето).
 * Зайчето подскача от едната полянка до следващата, после следващата сцена се разкрива като кръг, който расте
 * от мястото на зайчето. Целият преход е около 2 секунди и се прескача с едно докосване (или Enter).
 * При намалено движение зайчето е направо на новото място, а картата само избледнява.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { GameButton } from '../../../components/ui/GameButton'
import { Bunny, BunnyHome, Bush, Flower, GiftArt, MazeDefs, MissionIcon } from './MazeArt'
import type { MissionId } from './logic'

type Pt = { x: number; y: number }
/** Точки на пътечката: 0 — входът, 1…5 — мисиите, 6 — домът. */
const MAP = {
  wide: {
    w: 1000,
    h: 560,
    pts: [
      { x: 70, y: 440 },
      { x: 210, y: 250 },
      { x: 380, y: 420 },
      { x: 530, y: 220 },
      { x: 690, y: 410 },
      { x: 830, y: 220 },
      { x: 930, y: 430 },
    ],
    decor: [
      { x: 40, y: 170, f: 0 },
      { x: 300, y: 545, f: 1 },
      { x: 600, y: 540, f: 1 },
      { x: 700, y: 120, f: 0 },
      { x: 985, y: 190, f: 1 },
      { x: 380, y: 110, f: 1 },
    ],
  },
  tall: {
    w: 560,
    h: 1000,
    pts: [
      { x: 90, y: 935 },
      { x: 320, y: 830 },
      { x: 130, y: 660 },
      { x: 410, y: 530 },
      { x: 150, y: 395 },
      { x: 410, y: 270 },
      { x: 250, y: 140 },
    ],
    decor: [
      { x: 520, y: 950, f: 1 },
      { x: 520, y: 690, f: 0 },
      { x: 30, y: 520, f: 1 },
      { x: 520, y: 400, f: 1 },
      { x: 40, y: 240, f: 0 },
      { x: 500, y: 90, f: 1 },
    ],
  },
}

const ORDER: MissionId[] = ['fork', 'hide', 'chicks', 'stones', 'door']
const FLOWERS = ['#ff7aa8', '#ffd25e', '#9b8cff', '#ff9f43', '#5ec8f0']

/** Отсечка (кубична крива на Catmull-Rom) между точка i и i+1. */
function segment(p: Pt[], i: number) {
  const a = p[Math.max(0, i - 1)]
  const b = p[i]
  const c = p[i + 1]
  const d = p[Math.min(p.length - 1, i + 2)]
  const c1 = { x: b.x + (c.x - a.x) / 6, y: b.y + (c.y - a.y) / 6 }
  const c2 = { x: c.x - (d.x - b.x) / 6, y: c.y - (d.y - b.y) / 6 }
  return `C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${c.x} ${c.y}`
}

const HOP_MS = 1500
const HOLD_MS = 380
const REVEAL_MS = 650
const STILL_HOLD_MS = 1200
const SKIP_AFTER_MS = 450

export type JourneyKind = 'start' | 'next' | 'home' | 'resume'

export function MazeJourney({
  from,
  to,
  kind,
  stars,
  box,
  motion,
  onReveal,
  onDone,
  onRestart,
  onLand,
}: {
  /** Номер на точката (0 — входът, 1…5 — мисиите, 6 — домът). */
  from: number
  to: number
  kind: JourneyKind
  /** Колко мисии са завършени (толкова звездички светят по пътечката). */
  stars: number
  box: { w: number; h: number }
  motion: boolean
  /** Започва разкриването на сцената: къде е зайчето (в % от мястото). */
  onReveal: (at: { x: number; y: number }) => void
  onDone: () => void
  /** Само при продължено приключение: „Отначало“. */
  onRestart?: () => void
  onLand?: () => void
}) {
  const map = box.h > box.w * 1.05 ? MAP.tall : MAP.wide
  const P = map.pts
  const bunny = useRef<SVGGElement>(null)
  const seg = useRef<SVGPathElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<'hop' | 'hold' | 'out'>(from === to || !motion ? 'hold' : 'hop')
  const finished = useRef(false)
  const timers = useRef<number[]>([])
  const raf = useRef(0)
  const moving = from !== to
  const dir = P[to].x < P[from].x ? -1 : 1

  // мястото на картата в мястото на сцената (preserveAspectRatio meet) → % за кръга на разкриването
  const fit = Math.min(box.w / map.w, box.h / map.h)
  const toPct = (p: Pt) => ({ x: ((box.w - map.w * fit) / 2 + p.x * fit) / box.w, y: ((box.h - map.h * fit) / 2 + (p.y - 20) * fit) / box.h })

  const place = (p: Pt, lift = 0) => bunny.current?.setAttribute('transform', `translate(${p.x} ${p.y + 40 - lift})`)

  const clear = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
    cancelAnimationFrame(raf.current)
  }
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))

  const reveal = () => {
    if (finished.current) return
    finished.current = true
    clear()
    place(P[to])
    setStage('out')
    onReveal(toPct(P[to]))
    later(onDone, motion ? REVEAL_MS : 350)
  }

  useEffect(() => {
    root.current?.focus({ preventScroll: true })
    born.current = performance.now()
    if (!moving || !motion) {
      place(P[to])
      if (moving) onLand?.()
      later(reveal, motion ? STILL_HOLD_MS + 200 : STILL_HOLD_MS)
      return clear
    }
    place(P[from])
    const path = seg.current!
    const len = path.getTotalLength()
    const t0 = performance.now()
    const hops = Math.max(2, Math.round(len / 90))
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / HOP_MS)
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      const q = path.getPointAtLength(e * len)
      place(q, Math.abs(Math.sin(Math.PI * e * hops)) * 34)
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else {
        onLand?.()
        setStage('hold')
        later(reveal, HOLD_MS)
      }
    }
    raf.current = requestAnimationFrame(tick)
    return clear
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // докосване прескача прехода — но не второто докосване от „Продължи“ (двойно докосване)
  const born = useRef(Infinity)
  const skip = () => {
    if (performance.now() - born.current > SKIP_AFTER_MS) reveal()
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      skip()
    }
  }

  const full = `M ${P[0].x} ${P[0].y} ` + P.slice(0, -1).map((_, i) => segment(P, i)).join(' ')
  const lo = Math.min(from, to)
  const part = moving ? `M ${P[lo].x} ${P[lo].y} ${segment(P, lo)}` : ''
  // пройденото: от входа до текущата точка (с толкова звездички)
  const walkedTo = moving ? from : to
  const walked = walkedTo > 0 ? `M ${P[0].x} ${P[0].y} ` + P.slice(0, walkedTo).map((_, i) => segment(P, i)).join(' ') : ''
  const backward = moving && from > to
  const end = P[P.length - 1]
  return (
    <div
      ref={root}
      className={`kg-maze__journey is-${stage} ${kind === 'home' ? 'is-home' : ''}`}
      data-journey={kind}
      data-from={from}
      data-to={to}
      role="button"
      tabIndex={0}
      aria-label="Пътечката на зайчето. Докосни, за да продължиш."
      onClick={skip}
      onKeyDown={onKey}
    >
      <svg viewBox={`0 0 ${map.w} ${map.h}`} preserveAspectRatio="xMidYMid meet" width={box.w} height={box.h} aria-hidden="true">
        <MazeDefs />
        {map.decor.map((d, i) =>
          d.f ? (
            <g key={i} transform={`translate(${d.x} ${d.y})`}>
              <Flower color={FLOWERS[i % FLOWERS.length]} s={1.1} />
            </g>
          ) : (
            <g key={i} transform={`translate(${d.x} ${d.y}) scale(0.55)`}>
              <Bush />
            </g>
          ),
        )}
        <path d={full} fill="none" stroke="#4a3560" strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" />
        <path d={full} fill="none" stroke="url(#mz-path)" strokeWidth="48" strokeLinecap="round" strokeLinejoin="round" />
        {walked && <path d={walked} fill="none" stroke="#ffd25e" strokeWidth="9" strokeDasharray="2 18" strokeLinecap="round" />}
        {part && <path ref={seg} d={part} fill="none" stroke="none" />}
        {/* входът — арка от жив плет */}
        <g transform={`translate(${P[0].x} ${P[0].y + 30})`}>
          <path d="M-46 0 V -56 A 46 46 0 0 1 46 -56 V 0" fill="none" stroke="#4a3560" strokeWidth="26" strokeLinecap="round" />
          <path d="M-46 0 V -56 A 46 46 0 0 1 46 -56 V 0" fill="none" stroke="#7cc96f" strokeWidth="17" strokeLinecap="round" />
        </g>
        {/* домът на зайчето */}
        <g transform={`translate(${end.x} ${end.y + 10}) scale(0.5)`}>
          <BunnyHome lit={kind === 'home'} />
        </g>
        {ORDER.map((id, i) => {
          const p = P[i + 1]
          const got = i < stars
          const isTo = i + 1 === to && kind !== 'home'
          return (
            <g key={id} transform={`translate(${p.x} ${p.y})`} className={`mz-node ${got ? 'is-got' : ''} ${isTo ? 'is-to' : ''}`} data-node={id}>
              {isTo && <circle className="mz-node__ring" r="74" />}
              <circle r="60" fill={got ? '#fff3c4' : '#fffaf0'} stroke="#4a3560" strokeWidth="6" />
              <svg x="-48" y="-50" width="96" height="96" viewBox="0 0 100 100" overflow="visible">
                <MissionIcon id={id} />
              </svg>
              <g transform="translate(-50 46)">
                <circle r="20" fill={got ? '#ffd25e' : '#ffffff'} stroke="#4a3560" strokeWidth="4" />
                <text y="9" textAnchor="middle" className="mz-node__num">
                  {i + 1}
                </text>
              </g>
              {got && (
                <g className={`mz-node__star ${i === stars - 1 && kind !== 'resume' ? 'is-new' : ''}`} transform="translate(46 -48) scale(0.5)">
                  <GiftArt id="star" />
                </g>
              )}
            </g>
          )
        })}
        <g ref={bunny} data-bunny="1" transform={`translate(${P[from].x} ${P[from].y + 40})`}>
          <g transform={`scale(${0.56 * (backward ? -1 : dir)} 0.56)`}>
            <Bunny mood={stage === 'hop' ? 'look' : 'happy'} />
          </g>
        </g>
      </svg>
      {onRestart && (
        <div className="kg-maze__journey-restart" onClick={(e) => e.stopPropagation()}>
          <GameButton color="yellow" size="md" icon="refresh" onClick={onRestart} data-restart="1">
            Отначало
          </GameButton>
        </div>
      )}
    </div>
  )
}
