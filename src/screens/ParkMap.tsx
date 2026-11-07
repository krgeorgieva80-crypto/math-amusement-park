import { useEffect, useRef, useState } from 'react'
import { ATTRACTIONS, type Attraction, type AttractionId } from '../attractions/registry'
import { useApp } from '../core/AppContext'
import { useStage } from '../core/Stage'
import { bestStars } from '../core/storage'
import { markPassportSeen, passportFor, passportNews } from '../core/passport'
import { PassportStamp } from '../components/art/PassportStamp'
import { Confetti } from '../components/ui/Effects'
import { GameButton } from '../components/ui/GameButton'
import { GuideStar } from '../components/art/Mascot'
import { Bench, DistantTrees, FarMountains, Fence, FlowerBed, Fountain, Lamp, ParkDefs, SmallBush, SunGlow } from '../components/scenery/ParkProps'
import { Cloud, SkyDefs, Tree } from '../components/scenery/Scenery'
import { StarRow } from '../components/ui/Effects'
import { RoundButton } from '../components/ui/GameButton'
import { Icon } from '../components/ui/Icon'
import { SoundControl } from '../components/ui/SoundControl'
import { GradeTicket } from '../components/ui/GradeTicket'
import { DIFFICULTIES, type Grade } from '../games/magic-tokens/logic'

interface Props {
  grade: Grade
  onOpen: (id: AttractionId) => void
  onHome: () => void
  onChangeGrade: () => void
  onTeacher: () => void
  /** Отваря паспорта (с току-що ударените печати за анимацията). */
  onPassport: (fresh: string[]) => void
}

type Pt = { x: number; y: number }
/** Място на атракцион: x — център, y — точката, където стъпва на земята. */
type Spot = Pt & { size: number }
type Deco =
  | { kind: 'tree'; x: number; y: number; s: number; alt?: boolean }
  | { kind: 'lamp' | 'bench' | 'bed' | 'bush'; x: number; y: number; s: number }

interface MapLayout {
  spots: Record<AttractionId, Spot>
  /** Мащаб на табелите (по-малки на тесни екрани). */
  signScale: number
  /** Ред, в който алеята обикаля атракционите. */
  route: Pt[]
  closed: boolean
  fountain: Spot
  decor: Deco[]
  horizon: number
  /** Будката на паспорта (само ако има място). */
  booth?: Spot
}

/** Пренасяне на дългите имена на два реда — табелите остават компактни. */
const SIGN_LINES: Partial<Record<AttractionId, string[]>> = {
  'multiplication-wheel': ['Колелото на', 'умножението'],
  'task-train': ['Влакчето', 'на задачите'],
  'wonder-shop': ['Магазинът', 'за чудеса'],
  'clock-tower': ['Часовниковата', 'кула'],
  'shape-castle': ['Замъкът', 'на фигурите'],
  'balloon-challenge': ['Балоненото', 'предизвикателство'],
}

const GUIDE_TIPS = ['Избери атракцион и играй!', '„Вълшебните жетони“ те чакат!', 'Качи се на „Колелото на умножението“!', 'Завърши всички игри в атракцион и вземи печат в паспорта!', 'Другите атракциони отварят скоро.']

/**
 * Хоризонтално: ръчно подредена, леко асиметрична композиция върху
 * еталонно платно 1600×900. При по-широки или по-тесни екрани позициите
 * се разтягат по ширина, а размерите се смаляват само при тесни екрани.
 */
function landscapeLayout(w: number): MapLayout {
  const kx = w / 1600
  const ks = Math.min(1, Math.pow(kx, 0.85))
  const X = (x: number) => w / 2 + (x - 800) * kx
  const S = (size: number) => Math.round(size * ks)
  const spots: Record<AttractionId, Spot> = {
    'number-tower': { x: X(162), y: 392, size: S(232) },
    'multiplication-wheel': { x: X(468), y: 362, size: S(250) },
    'task-train': { x: X(1118), y: 360, size: S(272) },
    'clock-tower': { x: X(1452), y: 420, size: S(232) },
    'balloon-challenge': { x: X(228), y: 745, size: S(240) },
    'magic-tokens': { x: X(630), y: 752, size: S(264) },
    'shape-castle': { x: X(1012), y: 762, size: S(250) },
    'wonder-shop': { x: X(1382), y: 760, size: S(240) },
  }
  const fountain = { x: X(792), y: 448, size: 0.82 * ks }
  const p = (id: AttractionId) => ({ x: spots[id].x, y: spots[id].y + 10 })
  const entrance = { x: X(820), y: 935 }
  return {
    booth: { x: X(824), y: 662, size: S(112) },
    spots,
    signScale: Math.max(0.78, ks),
    fountain,
    horizon: 122,
    closed: true,
    route: [entrance, p('magic-tokens'), p('balloon-challenge'), p('number-tower'), p('multiplication-wheel'), { x: fountain.x, y: fountain.y + 14 }, p('task-train'), p('clock-tower'), p('wonder-shop'), p('shape-castle')],
    decor: [
      { kind: 'tree', x: X(660), y: 300, s: 0.45 },
      { kind: 'tree', x: X(935), y: 292, s: 0.45, alt: true },
      { kind: 'tree', x: X(22), y: 610, s: 0.7 },
      { kind: 'tree', x: X(1580), y: 640, s: 0.7, alt: true },
      { kind: 'lamp', x: X(418), y: 640, s: 0.62 },
      { kind: 'lamp', x: X(1196), y: 640, s: 0.62 },
      { kind: 'bed', x: X(428), y: 862, s: 0.55 },
      { kind: 'bed', x: X(1196), y: 872, s: 0.5 },
      { kind: 'bush', x: -6, y: 900, s: 0.9 },
      { kind: 'bush', x: w + 6, y: 900, s: 0.9 },
    ],
  }
}

/**
 * Вертикално: две разместени колони. Редовете се разпределят според
 * наличната височина, а активната игра е долу вдясно — там има място
 * за бутона „Играй!“ под табелата.
 */
function portraitLayout(w: number, h: number): MapLayout {
  const base = Math.min(h * 0.098, 220)
  const size = (i: number) => Math.round(base + i * 5)
  const top0 = 165 + size(0)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const L = [0, 1, 2, 3].map((i) => lerp(top0, h - 130, i / 3))
  const R = [0, 1, 2, 3].map((i) => lerp(top0 + 22, h - 178, i / 3))
  const at = (fx: number, y: number, i: number): Spot => ({ x: w * fx, y, size: size(i) })
  const spots: Record<AttractionId, Spot> = {
    'number-tower': at(0.25, L[0], 0),
    'multiplication-wheel': at(0.73, R[0], 0),
    'task-train': at(0.29, L[1], 1),
    'clock-tower': at(0.75, R[1], 1),
    'balloon-challenge': at(0.25, L[2], 2),
    'wonder-shop': at(0.72, R[2], 2),
    'shape-castle': at(0.28, L[3], 3),
    'magic-tokens': at(0.73, R[3], 3),
  }
  const p = (id: AttractionId) => ({ x: spots[id].x, y: spots[id].y + 10 })
  return {
    spots,
    signScale: 0.86,
    fountain: { x: w * 0.51, y: (L[1] + L[2]) / 2 + 30, size: 0.5 },
    horizon: 150,
    closed: false,
    route: [{ x: w * 0.5, y: h + 30 }, p('magic-tokens'), p('shape-castle'), p('balloon-challenge'), p('wonder-shop'), p('clock-tower'), p('task-train'), p('number-tower'), p('multiplication-wheel')],
    decor: [
      { kind: 'tree', x: w * 0.5, y: (L[0] + L[1]) / 2 + 20, s: 0.45 },
      { kind: 'tree', x: w * 0.5, y: (L[2] + L[3]) / 2 + 40, s: 0.45, alt: true },
      { kind: 'bush', x: -6, y: h, s: 0.8 },
      { kind: 'bush', x: w + 6, y: h, s: 0.8 },
    ],
  }
}

/** Отсечки на плавна крива (Catmull-Rom → Безие) — всяка с отделна дебелина. */
function curveSegments(pts: Pt[], closed: boolean): { d: string; y: number }[] {
  const n = pts.length
  const get = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))])
  const count = closed ? n : n - 1
  return Array.from({ length: count }, (_, i) => {
    const p0 = get(i - 1)
    const p1 = get(i)
    const p2 = get(i + 1)
    const p3 = get(i + 2)
    const c1 = { x: p1.x + (p2.x - p0.x) / 5, y: p1.y + (p2.y - p0.y) / 5 }
    const c2 = { x: p2.x - (p3.x - p1.x) / 5, y: p2.y - (p3.y - p1.y) / 5 }
    return { d: `M${p1.x} ${p1.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`, y: (p1.y + p2.y) / 2 }
  })
}

/** Извита алея: по-тясна в далечината, по-широка отпред. */
function WindingPath({ route, closed, h }: { route: Pt[]; closed: boolean; h: number }) {
  const segs = curveSegments(route, closed).map((s) => ({ ...s, width: 24 + 30 * Math.min(1, s.y / h) }))
  return (
    <g>
      {segs.map((s, i) => (
        <path key={`e${i}`} d={s.d} fill="none" stroke="#d39a3f" strokeWidth={s.width + 8} strokeLinecap="round" />
      ))}
      {segs.map((s, i) => (
        <path key={`f${i}`} d={s.d} fill="none" stroke="#ffe3a0" strokeWidth={s.width} strokeLinecap="round" />
      ))}
      {segs.map((s, i) => (
        <path key={`l${i}`} d={s.d} fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth={Math.max(3, s.width * 0.09)} strokeDasharray={`${s.width * 0.18} ${s.width * 0.55}`} strokeLinecap="round" />
      ))}
    </g>
  )
}

function Decoration({ d }: { d: Deco }) {
  switch (d.kind) {
    case 'tree':
      return <Tree x={d.x} y={d.y} s={d.s} color={d.alt ? '#3fb85f' : '#4fc46a'} />
    case 'lamp':
      return <Lamp x={d.x} y={d.y} s={d.s} />
    case 'bench':
      return <Bench x={d.x} y={d.y} s={d.s} />
    case 'bed':
      return <FlowerBed x={d.x} y={d.y} s={d.s} />
    case 'bush':
      return <SmallBush x={d.x} y={d.y} s={d.s} />
  }
}

export function ParkMap({ grade, onOpen, onHome, onChangeGrade, onTeacher, onPassport }: Props) {
  const { width: w, height: h, portrait } = useStage()
  const { play, results, settings } = useApp()
  const [wobble, setWobble] = useState<AttractionId | null>(null)
  // при нова отметка в паспорта Звездичката го казва веднага при отваряне на картата
  const [guideMsg, setGuideMsg] = useState<string | null>(() => {
    const n = passportNews(passportFor(results, grade))
    return !n.stamps.length && n.games.length ? `В паспорта има нова отметка: „${n.games[n.games.length - 1]}“!` : null
  })
  const timer = useRef<number | undefined>(undefined)
  const map = portrait ? portraitLayout(w, h) : landscapeLayout(w)
  const { spots, horizon, fountain } = map

  // паспортът: изчислява се от резултатите; новото се показва веднъж
  const passport = passportFor(results, grade)
  const [news] = useState(() => passportNews(passport))
  const [showStamp, setShowStamp] = useState(news.stamps.length > 0)
  useEffect(() => {
    markPassportSeen(passport)
    if (guideMsg) timer.current = window.setTimeout(() => setGuideMsg(null), 3600)
    // само при отваряне на картата
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const freshIds = news.stamps.map((p) => p.attraction)

  const totalStars = ['magic-tokens', 'multiplication-wheel'].reduce((sum, game) => sum + DIFFICULTIES.reduce((acc, d) => acc + (bestStars(results, game, grade, d) ?? 0), 0), 0)

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
        {/* тесен заден план — само ивица небе, планини и ограда */}
        <rect width={w} height={h} fill="url(#sky)" />
        <SunGlow x={w - 120} y={50} r={200} />
        <Cloud x={w * 0.42} y={6} s={0.45} speed={170} delay={70} />
        <FarMountains w={w} base={horizon + 8} height={62} />
        <path d={`M0 ${horizon} C ${w * 0.2} ${horizon - 34} ${w * 0.4} ${horizon - 6} ${w * 0.55} ${horizon - 24} S ${w * 0.85} ${horizon - 30} ${w} ${horizon - 12} V ${h} H0 Z`} fill="url(#hill-far)" stroke="#3b2a5a" strokeOpacity="0.2" strokeWidth="3" />
        <DistantTrees w={w} y={horizon + 14} s={0.42} color="#6cc786" />
        <path d={`M0 ${horizon + 16} Q ${w / 2} ${horizon + 2} ${w} ${horizon + 16} V ${h} H0 Z`} fill="url(#map-ground)" stroke="#3b2a5a" strokeOpacity="0.2" strokeWidth="3" />
        <Fence x1={-10} x2={w + 10} y={horizon + 34} s={0.5} />
        {/* тревни шарки */}
        {Array.from({ length: 46 }, (_, i) => {
          const x = ((i * 397) % w) + 10
          const y = horizon + 60 + ((i * 211) % (h - horizon - 80))
          const s = 0.6 + (y / h) * 0.7
          return <path key={i} d={`M${x} ${y} q${4 * s} ${-10 * s} ${8 * s} 0 q${4 * s} ${-10 * s} ${8 * s} 0`} fill="none" stroke="#3fa64f" strokeWidth={2 + s} strokeLinecap="round" opacity="0.5" />
        })}

        <WindingPath route={map.route} closed={map.closed} h={h} />
        {/* площад с фонтан */}
        <ellipse cx={fountain.x} cy={fountain.y + 6} rx={128 * fountain.size} ry={38 * fountain.size} fill="url(#pp-stone)" stroke="#3b2a5a" strokeOpacity="0.5" strokeWidth="3" />
        <Fountain x={fountain.x} y={fountain.y} s={fountain.size} />
        {map.decor.map((d, i) => (
          <Decoration key={i} d={d} />
        ))}

        {/* площадки под атракционите */}
        {ATTRACTIONS.map((a) => {
          const s = spots[a.id]
          return <ellipse key={a.id} cx={s.x} cy={s.y + 4} rx={s.size * 0.44} ry={s.size * 0.085} fill="url(#pp-stone)" stroke="#3b2a5a" strokeOpacity="0.45" strokeWidth="3" />
        })}
      </svg>

      <div className="top-bar">
        <RoundButton icon="home" label="Начало" color="yellow" onClick={onHome} />
        <GradeTicket
          grade={grade}
          onClick={settings.studentCanChoose ? onChangeGrade : undefined}
          title={settings.studentCanChoose ? 'Смени класа' : 'Класът е избран от учителя'}
        />
        {w >= 1500 && (
          <div className="map-title">
            <Icon name="map" size={34} />
            Карта на парка
          </div>
        )}
        <GuideStar className="map-guide" tips={GUIDE_TIPS} size={portrait ? 84 : 88} message={guideMsg} mood={guideMsg ? 'think' : 'wave'} />
        <div className="top-bar__spacer" />
        <button type="button" className="passport-btn" onClick={() => (play('drop'), onPassport([]))} aria-label={`Приключенски паспорт: ${passport.stamps} от ${passport.pages.length} печата`}>
          <svg viewBox="0 0 40 48" aria-hidden="true">
            <rect x="3" y="2" width="34" height="44" rx="5" fill="#9b5de5" stroke="#3b2a5a" strokeWidth="3.5" />
            <rect x="8" y="2" width="4" height="44" fill="#7a3fd0" />
            <circle cx="23" cy="20" r="9" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="2.5" />
            <path d="M23 14 l2 4 4.5 .6 -3.3 3.2 .8 4.5 -4 -2.1 -4 2.1 .8 -4.5 -3.3 -3.2 4.5 -.6z" fill="#fff6a8" />
            <rect x="14" y="34" width="18" height="4" rx="2" fill="#fff6a8" />
          </svg>
          <span>
            {passport.stamps}/{passport.pages.length}
          </span>
        </button>
        <div className="star-counter" title="Събрани звезди">
          <Icon name="star" size={34} />
          <span>{totalStars}</span>
        </div>
        <RoundButton icon="teacher" label="За учителя" color="turquoise" onClick={onTeacher} />
        <SoundControl />
      </div>

      {/* будката на паспорта до входа на парка */}
      {map.booth && (
        <button type="button" className="passport-booth" style={{ left: map.booth.x, top: map.booth.y - map.booth.size, width: map.booth.size }} onClick={() => (play('drop'), onPassport([]))} aria-label="Будка „Паспорт“ — отвори паспорта">
          <svg viewBox="0 0 120 130" aria-hidden="true">
            <ellipse cx="60" cy="124" rx="50" ry="6" fill="#3b2a5a" opacity="0.2" />
            <rect x="16" y="52" width="88" height="70" rx="6" fill="#fffaf0" stroke="#3b2a5a" strokeWidth="4" />
            <rect x="26" y="62" width="68" height="34" rx="5" fill="#bfefff" stroke="#3b2a5a" strokeWidth="3" />
            <path d="M8 54 Q60 8 112 54 Z" fill="#ff5fa2" stroke="#3b2a5a" strokeWidth="4" strokeLinejoin="round" />
            {[0, 1, 2, 3].map((k) => (k % 2 ? <path key={k} d={`M60 14 L${8 + k * 26} 54 L${34 + k * 26} 54 Z`} fill="#ffd23f" stroke="#3b2a5a" strokeWidth="2.5" /> : null))}
            <rect x="4" y="50" width="112" height="10" rx="5" fill="#ffc928" stroke="#3b2a5a" strokeWidth="3" />
            {/* книжка-паспорт на гишето */}
            <g transform="translate(44 70) rotate(-8)">
              <rect width="30" height="22" rx="3" fill="#9b5de5" stroke="#3b2a5a" strokeWidth="2.5" />
              <circle cx="15" cy="11" r="6" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="2" />
            </g>
            <rect x="22" y="100" width="76" height="16" rx="5" fill="#9b5de5" stroke="#3b2a5a" strokeWidth="3" />
            <text x="60" y="113" textAnchor="middle" className="art-text" fontSize="13" fill="#fff">
              ПАСПОРТ
            </text>
          </svg>
        </button>
      )}

      {showStamp && news.stamps.length > 0 && (
        <div className="success-overlay passport-news" role="dialog" aria-label="Нов печат в паспорта">
          <Confetti seed={grade * 7} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <div className="success-card__title">Нов печат!</div>
            {news.stamps.map((p) => {
              const a = ATTRACTIONS.find((x) => x.id === p.attraction)!
              return <PassportStamp key={p.attraction} Art={a.Art} name={p.name} motto={p.motto} color={a.color} accent="#ffd23f" size={Math.round(Math.min(320, h * 0.36))} stamped fresh grade={grade} />
            })}
            <div className="success-card__praise">Завърши всички игри в „{news.stamps.map((p) => p.name).join('“ и „')}“!</div>
            <div className="passport-news__actions">
              <GameButton color="purple" size="lg" icon="next" onClick={() => (setShowStamp(false), onPassport(freshIds))}>
                Виж паспорта
              </GameButton>
              <GameButton color="green" size="lg" icon="map" onClick={() => setShowStamp(false)}>
                Към парка
              </GameButton>
            </div>
          </div>
        </div>
      )}

      {/* По-близките (по-ниско) атракциони се рисуват последни. */}
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
              style={{ left: s.x, top: s.y - s.size, width: s.size, animationDelay: `${i * 0.06}s`, ['--sign-scale' as string]: map.signScale }}
              onClick={() => open(a)}
              aria-label={ready ? `${a.name} — играй` : `${a.name} — очаквай скоро`}
            >
              <span className="map-spot__art" style={{ width: s.size, height: s.size }}>
                <a.Art size={s.size} />
              </span>
              <span className="park-sign" style={{ ['--trim' as string]: a.color }}>
                <span className="park-sign__name">
                  {(SIGN_LINES[a.id] ?? [a.name]).map((line) => (
                    <span key={line} className="park-sign__line">
                      {line}
                    </span>
                  ))}
                </span>
                {!ready && (
                  <span className="park-sign__soon">
                    <Icon name="lock" size={14} /> Очаквай скоро
                  </span>
                )}
                {/* „Играй!“ е в табелата — така няколко активни атракциона не се застъпват */}
                {ready && (
                  <span className="map-spot__play is-in-sign">
                    <Icon name="play" size={22} /> Играй!
                    {best > 0 && <StarRow stars={best} size={20} />}
                  </span>
                )}
              </span>
            </button>
          )
        })}
    </div>
  )
}
