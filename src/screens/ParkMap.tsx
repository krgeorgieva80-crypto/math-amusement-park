import { useState } from 'react'
import { ATTRACTIONS, type Attraction, type AttractionId } from '../attractions/registry'
import { useApp } from '../core/AppContext'
import { useStage } from '../core/Stage'
import { bestStars } from '../core/storage'
import { Bush, Flower, SkyAndHills, SkyDefs, Tree } from '../components/scenery/Scenery'
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

type Pt = { x: number; y: number }

/** Позиции на атракционите — „змийка“, за да ги свързва една алея. */
function layout(w: number, h: number, portrait: boolean): Pt[] {
  if (portrait) {
    const cols = [0.27, 0.73]
    const rows = [0.2, 0.42, 0.64, 0.86]
    return ATTRACTIONS.map((_, i) => {
      const r = Math.floor(i / 2)
      const c = r % 2 === 0 ? i % 2 : 1 - (i % 2)
      return { x: w * cols[c], y: h * rows[r] }
    })
  }
  const cols = [0.125, 0.375, 0.625, 0.875]
  const rows = [0.38, 0.77]
  return ATTRACTIONS.map((_, i) => {
    const r = Math.floor(i / 4)
    const c = r === 0 ? i % 4 : 3 - (i % 4)
    return { x: w * cols[c], y: h * rows[r] }
  })
}

/** Плавна крива през точките (Catmull-Rom → Безие). */
function smoothPath(pts: Pt[]): string {
  let d = `M${pts[0].x} ${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    d += ` C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`
  }
  return d
}

export function ParkMap({ grade, onOpen, onHome, onChangeGrade, onTeacher }: Props) {
  const { width: w, height: h, portrait } = useStage()
  const { play, results, settings } = useApp()
  const [wobble, setWobble] = useState<AttractionId | null>(null)
  const pts = layout(w, h, portrait)
  const artSize = portrait ? Math.min(220, (h - 140) / 4 - 60) : 236
  const base = pts.map((p) => ({ x: p.x, y: p.y + artSize * 0.42 }))
  const route = smoothPath([{ x: base[0].x - (portrait ? 160 : 150), y: base[0].y + (portrait ? -60 : 40) }, ...base])
  const horizon = portrait ? 170 : 150

  const totalStars = DIFFICULTIES.reduce((acc, d) => acc + (bestStars(results, 'magic-tokens', grade, d) ?? 0), 0)

  const open = (a: Attraction) => {
    if (a.status === 'ready') {
      play('drop')
      onOpen(a.id)
    } else {
      play('locked')
      setWobble(a.id)
      window.setTimeout(() => setWobble(null), 700)
    }
  }

  return (
    <div className="screen park-map">
      <svg className="scene" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <SkyDefs />
        <SkyAndHills w={w} h={h} horizon={horizon} />
        <rect x="0" y={horizon + 30} width={w} height={h} fill="url(#grass)" />
        <path d={`M0 ${horizon + 40} Q ${w / 2} ${horizon + 5} ${w} ${horizon + 40}`} fill="none" stroke="#3b2a5a" strokeOpacity="0.2" strokeWidth="3" />
        {/* тревни шарки */}
        {Array.from({ length: 40 }, (_, i) => {
          const x = ((i * 397) % w) + 10
          const y = horizon + 70 + ((i * 211) % (h - horizon - 90))
          return <path key={i} d={`M${x} ${y} q4 -10 8 0 q4 -10 8 0`} fill="none" stroke="#3fa64f" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        })}
        {/* езерце */}
        <g transform={portrait ? `translate(${w * 0.5} ${h * 0.535})` : `translate(${w * 0.5} ${h * 0.575})`}>
          <ellipse rx={portrait ? 70 : 110} ry={portrait ? 34 : 38} fill="#7fe3f0" stroke="#3b2a5a" strokeWidth="3" />
          <ellipse rx={portrait ? 46 : 74} ry={portrait ? 18 : 22} fill="#b5f4fa" />
          <ellipse cx={portrait ? 20 : 30} cy="4" rx="16" ry="7" fill="#6bd66b" stroke="#3b2a5a" strokeWidth="2" />
        </g>
        {/* алея */}
        <path d={route} fill="none" stroke="#e0a94a" strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" />
        <path d={route} fill="none" stroke="url(#path)" strokeWidth="54" strokeLinecap="round" strokeLinejoin="round" />
        <path d={route} fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="5" strokeDasharray="2 22" strokeLinecap="round" />
        {/* дървета и цветя между атракционите */}
        {portrait ? (
          <>
            <Tree x={w * 0.5} y={h * 0.32} s={0.7} />
            <Tree x={w * 0.5} y={h * 0.72} s={0.7} color="#3fb85f" />
            <Bush x={60} y={h - 30} s={0.9} />
            <Bush x={w - 70} y={h - 24} s={0.9} />
          </>
        ) : (
          <>
            <Tree x={w * 0.25} y={h * 0.6} s={0.7} />
            <Tree x={w * 0.75} y={h * 0.6} s={0.75} color="#3fb85f" />
            <Bush x={w * 0.5} y={h - 8} s={0.9} />
            <Bush x={30} y={h * 0.6} s={0.8} />
            <Bush x={w - 30} y={h * 0.6} s={0.8} />
          </>
        )}
        {[0.06, 0.31, 0.44, 0.56, 0.69, 0.94].map((fx, i) => (
          <Flower key={fx} x={w * fx} y={portrait ? h * (0.35 + (i % 3) * 0.19) : h * (0.55 + (i % 2) * 0.08)} color={['#ff5fa2', '#ffd23f', '#9b5de5'][i % 3]} s={1.2} />
        ))}
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
        <div className="map-title">
          <Icon name="map" size={34} />
          Карта на парка
        </div>
        <div className="top-bar__spacer" />
        <div className="star-counter" title="Събрани звезди">
          <Icon name="star" size={34} />
          <span>{totalStars}</span>
        </div>
        <RoundButton icon="teacher" label="За учителя" color="turquoise" onClick={onTeacher} />
        <SoundControl />
      </div>

      {ATTRACTIONS.map((a, i) => {
        const ready = a.status === 'ready'
        const best = ready ? Math.max(0, ...DIFFICULTIES.map((d) => bestStars(results, a.id, grade, d) ?? 0)) : 0
        return (
          <button
            key={a.id}
            type="button"
            className={`map-spot ${ready ? 'is-ready' : 'is-soon'} ${wobble === a.id ? 'is-wobble' : ''}`}
            style={{ left: pts[i].x, top: pts[i].y, animationDelay: `${i * 0.06}s` }}
            onClick={() => open(a)}
            aria-label={ready ? `${a.name} — играй` : `${a.name} — очаквай скоро`}
          >
            <span className="map-spot__number">{i + 1}</span>
            <span className="map-spot__art">
              <a.Art size={artSize} />
            </span>
            <span className="map-spot__sign" style={{ ['--sign' as string]: a.color }}>
              {a.name}
            </span>
            {ready ? (
              <span className="map-spot__play">
                <Icon name="play" size={26} /> Играй!
                {best > 0 && <StarRow stars={best} size={22} />}
              </span>
            ) : (
              <span className="map-spot__soon">
                <Icon name="lock" size={22} /> Очаквай скоро
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
