import { useRef, useState } from 'react'
import { ATTRACTIONS, type Attraction, type AttractionId } from '../attractions/registry'
import { useApp } from '../core/AppContext'
import { useStage } from '../core/Stage'
import { bestStars } from '../core/storage'
import { GuideStar } from '../components/art/Mascot'
import { Bench, DistantTrees, FarMountains, Fence, FlowerBed, Fountain, Lamp, ParkDefs, SmallBush, SunGlow } from '../components/scenery/ParkProps'
import { Cloud, SkyDefs, Sun, Tree } from '../components/scenery/Scenery'
import { StarRow } from '../components/ui/Effects'
import { RoundButton } from '../components/ui/GameButton'
import { Icon } from '../components/ui/Icon'
import { SoundControl } from '../components/ui/SoundControl'
import { DIFFICULTIES, type Grade } from '../games/magic-tokens/logic'

interface Props {
  grade: Grade
  onOpen: (id: AttractionId) => void
  onHome: () => void
  onChangeGrade: () => void
  onTeacher: () => void
}

/** Място на атракцион: x — център, y — точката, където стъпва на земята. */
type Spot = { x: number; y: number; size: number }

const GUIDE_TIPS = ['Избери атракцион и играй!', '„Вълшебните жетони“ те чакат!', 'Другите атракциони отварят скоро.']

/**
 * Разположение в парка. Хоризонтално: заден ред (по-малки атракциони,
 * по-далеч) и преден ред (по-големи). Вертикално: 4 реда по 2.
 */
function layout(w: number, h: number, portrait: boolean): Record<AttractionId, Spot> {
  if (portrait) {
    const base = Math.min(h * 0.125, 210)
    const rows = [0.29, 0.5, 0.71, 0.915].map((f, i) => ({ y: h * f, size: Math.round(base + i * 8) }))
    const at = (r: number, c: number): Spot => ({ x: w * (c === 0 ? 0.27 : 0.73), ...rows[r] })
    return {
      'number-tower': at(0, 0),
      'multiplication-wheel': at(0, 1),
      'task-train': at(1, 0),
      'clock-tower': at(1, 1),
      'balloon-challenge': at(2, 0),
      'magic-tokens': at(2, 1),
      'shape-castle': at(3, 0),
      'wonder-shop': at(3, 1),
    }
  }
  const back = { y: h * 0.47, size: 196 }
  const front = { y: h * 0.83, size: 232 }
  return {
    'number-tower': { x: w * 0.13, ...back },
    'multiplication-wheel': { x: w * 0.37, ...back },
    'task-train': { x: w * 0.63, ...back },
    'clock-tower': { x: w * 0.87, ...back },
    'balloon-challenge': { x: w * 0.13, ...front },
    'magic-tokens': { x: w * 0.38, ...front },
    'shape-castle': { x: w * 0.62, ...front },
    'wonder-shop': { x: w * 0.87, ...front },
  }
}

/** Плавна крива през точките (Catmull-Rom → Безие). */
function smooth(pts: { x: number; y: number }[]): string {
  let d = `M${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    d += ` C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`
  }
  return d
}

/** Алея: тъмен ръб, пясъчна настилка и светла средна линия. */
function Walk({ d, width }: { d: string; width: number }) {
  return (
    <g>
      <path d={d} fill="none" stroke="#d39a3f" strokeWidth={width + 8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#ffe3a0" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth={Math.max(3, width * 0.08)} strokeDasharray={`${width * 0.15} ${width * 0.5}`} strokeLinecap="round" />
    </g>
  )
}

/** Улица в перспектива — по-широка отпред. */
function Avenue({ cx, top, bottom, wTop, wBottom }: { cx: number; top: number; bottom: number; wTop: number; wBottom: number }) {
  return (
    <g>
      <path d={`M${cx - wTop / 2} ${top} L${cx + wTop / 2} ${top} L${cx + wBottom / 2} ${bottom} L${cx - wBottom / 2} ${bottom} Z`} fill="url(#path)" stroke="#d39a3f" strokeWidth="5" strokeLinejoin="round" />
      <path d={`M${cx} ${top} V${bottom}`} stroke="#fff" strokeOpacity="0.45" strokeWidth="5" strokeDasharray="8 22" />
    </g>
  )
}

export function ParkMap({ grade, onOpen, onHome, onChangeGrade, onTeacher }: Props) {
  const { width: w, height: h, portrait } = useStage()
  const { play, results, settings } = useApp()
  const [wobble, setWobble] = useState<AttractionId | null>(null)
  const [guideMsg, setGuideMsg] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const spots = layout(w, h, portrait)
  const horizon = portrait ? 200 : 178
  // На по-тесни хоризонтални екрани (4:3) фонтанът се смалява, за да не закрива атракционите.
  const fountainScale = Math.min(1, Math.max(0.6, (w - 1100) / 500))

  const totalStars = DIFFICULTIES.reduce((acc, d) => acc + (bestStars(results, 'magic-tokens', grade, d) ?? 0), 0)

  const say = (msg: string) => {
    setGuideMsg(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setGuideMsg(null), 2600)
  }

  const open = (a: Attraction) => {
    if (a.status === 'ready') {
      play('drop')
      onOpen(a.id)
    } else {
      play('locked')
      setWobble(a.id)
      say(`„${a.name}“ ще отвори скоро!`)
      window.setTimeout(() => setWobble(null), 700)
    }
  }

  // Алеи
  const row = (ids: AttractionId[], extend: number) => {
    const pts = ids.map((id) => ({ x: spots[id].x, y: spots[id].y + 6 }))
    return smooth([{ x: pts[0].x - extend, y: pts[0].y + 4 }, ...pts, { x: pts[pts.length - 1].x + extend, y: pts[pts.length - 1].y + 4 }])
  }

  return (
    <div className="screen park-map">
      <svg className="scene" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <SkyDefs />
        <ParkDefs />
        <defs>
          <linearGradient id="map-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a6ec98" />
            <stop offset="0.45" stopColor="#7fdc78" />
            <stop offset="1" stopColor="#4fb85b" />
          </linearGradient>
        </defs>
        {/* заден план */}
        <rect width={w} height={h} fill="url(#sky)" />
        <SunGlow x={w - 120} y={80} r={260} />
        <Sun x={w - 120} y={80} r={44} />
        <Cloud x={w * 0.1} y={30} s={0.6} speed={150} />
        <Cloud x={w * 0.55} y={50} s={0.5} speed={180} delay={70} />
        <FarMountains w={w} base={horizon + 10} />
        <path d={`M0 ${horizon} C ${w * 0.2} ${horizon - 60} ${w * 0.4} ${horizon - 10} ${w * 0.55} ${horizon - 40} S ${w * 0.85} ${horizon - 50} ${w} ${horizon - 20} V ${h} H0 Z`} fill="url(#hill-far)" stroke="#3b2a5a" strokeOpacity="0.2" strokeWidth="3" />
        <DistantTrees w={w} y={horizon + 18} s={0.55} color="#6cc786" />
        <path d={`M0 ${horizon + 22} Q ${w / 2} ${horizon + 2} ${w} ${horizon + 22} V ${h} H0 Z`} fill="url(#map-ground)" stroke="#3b2a5a" strokeOpacity="0.2" strokeWidth="3" />
        <Fence x1={-10} x2={w + 10} y={horizon + 46} s={0.6} />
        {/* тревни шарки */}
        {Array.from({ length: 46 }, (_, i) => {
          const x = ((i * 397) % w) + 10
          const y = horizon + 70 + ((i * 211) % (h - horizon - 90))
          const s = 0.6 + (y / h) * 0.7
          return <path key={i} d={`M${x} ${y} q${4 * s} ${-10 * s} ${8 * s} 0 q${4 * s} ${-10 * s} ${8 * s} 0`} fill="none" stroke="#3fa64f" strokeWidth={2 + s} strokeLinecap="round" opacity="0.5" />
        })}

        {portrait ? (
          <>
            <Avenue cx={w / 2} top={spots['number-tower'].y} bottom={h + 10} wTop={40} wBottom={110} />
            {[
              ['number-tower', 'multiplication-wheel'],
              ['task-train', 'clock-tower'],
              ['balloon-challenge', 'magic-tokens'],
              ['shape-castle', 'wonder-shop'],
            ].map((pair, i) => (
              <Walk key={i} d={row(pair as AttractionId[], 70)} width={30 + i * 6} />
            ))}
            <Fountain x={w / 2} y={h * 0.61} s={0.62} />
            <Tree x={w / 2} y={h * 0.41} s={0.55} />
            <Tree x={w / 2} y={h * 0.81} s={0.6} color="#3fb85f" />
            <Lamp x={w / 2 - 50} y={h * 0.97} s={0.8} />
          </>
        ) : (
          <>
            <Avenue cx={w / 2} top={spots['task-train'].y} bottom={h + 10} wTop={44} wBottom={130} />
            <Walk d={row(['number-tower', 'multiplication-wheel', 'task-train', 'clock-tower'], 140)} width={34} />
            <Walk d={row(['balloon-challenge', 'magic-tokens', 'shape-castle', 'wonder-shop'], 160)} width={52} />
            {[0.25, 0.75].map((f) => (
              <Walk key={f} d={`M${w * f} ${spots['number-tower'].y + 8} C ${w * f} ${h * 0.62} ${w * f} ${h * 0.7} ${w * f} ${spots['magic-tokens'].y + 8}`} width={30} />
            ))}
            {/* площад с фонтан */}
            <ellipse cx={w / 2} cy={h * 0.65} rx={118 * fountainScale} ry={34 * fountainScale} fill="url(#pp-stone)" stroke="#3b2a5a" strokeOpacity="0.5" strokeWidth="3" />
            <Fountain x={w / 2} y={h * 0.645} s={0.9 * fountainScale} />
            <Bench x={w / 2} y={h * 0.535} s={0.55} />
            {/* дървета в задния план */}
            {[0.25, 0.5, 0.75].map((f, i) => (
              <Tree key={f} x={w * f + (i === 1 ? 110 : 0)} y={h * 0.4} s={0.5} color={i % 2 ? '#3fb85f' : '#4fc46a'} />
            ))}
            <Tree x={22} y={h * 0.7} s={0.75} />
            <Tree x={w - 22} y={h * 0.7} s={0.75} color="#3fb85f" />
            {/* фенери покрай улицата */}
            <Lamp x={w / 2 - 52} y={h * 0.75} s={0.62} />
            <Lamp x={w / 2 + 52} y={h * 0.75} s={0.62} />
            <FlowerBed x={w * 0.255} y={h * 0.94} s={0.62} />
            <FlowerBed x={w * 0.745} y={h * 0.94} s={0.62} palette={['#2ed1c4', '#ffd23f', '#ff5fa2', '#9b5de5']} />
            <SmallBush x={-6} y={h - 4} s={0.9} />
            <SmallBush x={w + 6} y={h - 4} s={0.9} color="#4fc46a" />
          </>
        )}

        {/* площадки под атракционите */}
        {ATTRACTIONS.map((a) => {
          const s = spots[a.id]
          return <ellipse key={a.id} cx={s.x} cy={s.y + 4} rx={s.size * 0.46} ry={s.size * 0.09} fill="url(#pp-stone)" stroke="#3b2a5a" strokeOpacity="0.45" strokeWidth="3" />
        })}
      </svg>

      <div className="top-bar">
        <RoundButton icon="home" label="Начало" color="yellow" onClick={onHome} />
        <button
          type="button"
          className="grade-badge"
          onClick={settings.studentCanChoose ? onChangeGrade : undefined}
          disabled={!settings.studentCanChoose}
          title={settings.studentCanChoose ? 'Смени класа' : 'Класът е избран от учителя'}
        >
          {grade}. клас
        </button>
        {w >= 1500 && (
          <div className="map-title">
            <Icon name="map" size={34} />
            Карта на парка
          </div>
        )}
        <GuideStar className="map-guide" tips={GUIDE_TIPS} size={portrait ? 84 : 92} message={guideMsg} mood={guideMsg ? 'think' : 'wave'} />
        <div className="top-bar__spacer" />
        <div className="star-counter" title="Събрани звезди">
          <Icon name="star" size={34} />
          <span>{totalStars}</span>
        </div>
        <RoundButton icon="teacher" label="За учителя" color="turquoise" onClick={onTeacher} />
        <SoundControl />
      </div>

      {/* Предните атракциони се рисуват последни, за да са пред задните. */}
      {[...ATTRACTIONS]
        .sort((a, b) => spots[a.id].y - spots[b.id].y)
        .map((a, i) => {
          const s = spots[a.id]
          const ready = a.status === 'ready'
          const best = ready ? Math.max(0, ...DIFFICULTIES.map((d) => bestStars(results, a.id, grade, d) ?? 0)) : 0
          return (
            <button
              key={a.id}
              type="button"
              className={`map-spot ${ready ? 'is-ready' : 'is-soon'} ${wobble === a.id ? 'is-wobble' : ''}`}
              style={{ left: s.x, top: s.y - s.size, width: s.size + 80, animationDelay: `${i * 0.06}s` }}
              onClick={() => open(a)}
              aria-label={ready ? `${a.name} — играй` : `${a.name} — очаквай скоро`}
            >
              <span className="map-spot__art" style={{ width: s.size, height: s.size }}>
                <a.Art size={s.size} />
              </span>
              <span className="park-sign" style={{ ['--trim' as string]: a.color }}>
                <span className="park-sign__name">{a.name}</span>
                {!ready && (
                  <span className="park-sign__soon">
                    <Icon name="lock" size={15} /> Очаквай скоро
                  </span>
                )}
              </span>
              {ready && (
                <span className="map-spot__play">
                  <Icon name="play" size={24} /> Играй!
                  {best > 0 && <StarRow stars={best} size={22} />}
                </span>
              )}
            </button>
          )
        })}
    </div>
  )
}
