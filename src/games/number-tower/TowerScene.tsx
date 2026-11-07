/**
 * „Кулата на числата“ — илюстрирана кула (прототип, Етап 1).
 * Цветни етажи с прозорци и табелки с числа, магическа врата, асансьор
 * в стъклена шахта и звезден връх. Само рисунка — без игрова логика.
 */
import type { ReactNode } from 'react'
import { OUTLINE as O } from '../../components/art/Attractions'

export const FLOOR_COLORS: [string, string][] = [
  ['#ff5fa2', '#ffb3d3'],
  ['#9b5de5', '#d2b6ff'],
  ['#2ed1c4', '#a8f5ee'],
  ['#ffd23f', '#fff3a0'],
  ['#ff9f43', '#ffd2a3'],
  ['#6bd66b', '#c4f5b8'],
  ['#4d8df0', '#b9d3ff'],
]

export interface Floor {
  /** Числото на табелката (или null — празно място). */
  label: string | null
  /** placed — построен; ghost — празно място за поставяне; next — следващото празно; hidden — тайният прозорец; wrong — не е на мястото си. */
  state?: 'placed' | 'ghost' | 'next' | 'hidden' | 'glow' | 'wrong' | 'locked'
}

interface Props {
  floors: Floor[]
  /** Етажът, на който е асансьорът (0 — долу); null — без асансьор. */
  elevatorAt?: number | null
  /** Звездният връх свети. */
  topLit?: boolean
  /** Подписи вляво от етажите (напр. интервали за асансьора). */
  side?: (string | null)[]
  width: number
  children?: ReactNode
  /** Докосване на етаж (индекс отдолу нагоре). */
  onFloor?: (i: number) => void
  /** Ключ за пускане при влачене (data-drop) — за цялата кула. */
  dropId?: string
  /** Празничното изграждане: етажите „падат“ един след друг. */
  celebrate?: boolean
}

const W = 560
const FLOOR_H = 112
const BASE_H = 190
const TOP_H = 230

function Sparkle({ x, y, s, c = '#fff6a8', d = 0 }: { x: number; y: number; s: number; c?: string; d?: number }) {
  return (
    <path
      className="twinkle"
      style={{ animationDelay: `${d}s` }}
      d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`}
      fill={c}
    />
  )
}

/** Звездният връх: купол, кула с флагче и голяма звезда. */
function StarTop({ lit }: { lit: boolean }) {
  return (
    <g className={`nt-top ${lit ? 'is-lit' : ''}`}>
      <circle cx={W / 2} cy="70" r="92" fill="url(#nt-glow)" className="nt-top__glow" />
      <path d={`M${W / 2 - 150} 230 Q${W / 2} 120 ${W / 2 + 150} 230 Z`} fill="url(#nt-dome)" stroke={O} strokeWidth="6" strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((k) => (
        <path key={k} d={`M${W / 2} 128 L${W / 2 - 150 + k * 75} 230`} stroke="#fff" strokeOpacity="0.35" strokeWidth="5" />
      ))}
      <rect x={W / 2 - 158} y="222" width="316" height="20" rx="10" fill="url(#nt-gold)" stroke={O} strokeWidth="5" />
      {Array.from({ length: 11 }, (_, k) => (
        <circle key={k} className="bulb" style={{ animationDelay: `${(k % 3) * 0.3}s` }} cx={W / 2 - 140 + k * 28} cy="232" r="5" fill="#fff6a8" />
      ))}
      <path d={`M${W / 2} 132 V60`} stroke={O} strokeWidth="8" />
      <path
        d={`M${W / 2} 0 l17 35 38 5.5 -27.5 27 6.5 38 -34 -18 -34 18 6.5 -38 -27.5 -27 38 -5.5z`}
        transform={`translate(0 6)`}
        fill={lit ? '#ffe066' : '#d9c9f2'}
        stroke={O}
        strokeWidth="6"
        strokeLinejoin="round"
        className="nt-top__star"
      />
    </g>
  )
}

/** Един етаж: стена с цвят, два прозореца и табелка с числото. */
function FloorArt({ f, i, y }: { f: Floor; i: number; y: number }) {
  const [main, light] = FLOOR_COLORS[i % FLOOR_COLORS.length]
  if (f.state === 'ghost' || f.state === 'next')
    return (
      // анимацията е на вътрешната група — CSS transform не измества позицията (атрибута transform)
      <g transform={`translate(${W / 2 - 170} ${y})`}>
        <g className={`nt-floor is-ghost ${f.state === 'next' ? 'is-next' : ''}`}>
          <rect width="340" height={FLOOR_H - 8} rx="22" fill="rgba(255,255,255,0.18)" stroke="#fff6a8" strokeWidth="5" strokeDasharray="16 12" />
          <text x="170" y={FLOOR_H / 2 + 12} textAnchor="middle" className="art-text" fontSize="40" fill="#fff6a8">
            ?
          </text>
        </g>
      </g>
    )
  const hidden = f.state === 'hidden'
  const glow = f.state === 'glow'
  // табелката се разширява за многоцифрените числа (4. клас), а шрифтът следва дължината — числото се вижда изцяло
  const len = (f.label ?? '').length
  const plateW = len > 5 ? 250 : 176
  const ww = plateW > 200 ? 13 : 22
  const numSize = Math.min(50, Math.floor((plateW - 26) / Math.max(1, len * 0.62)))
  return (
    <g transform={`translate(${W / 2 - 170} ${y})`}>
      <g className={`nt-floor ${glow ? 'is-glow' : ''} ${f.state === 'wrong' ? 'is-wrong' : ''} ${f.state === 'locked' ? 'is-locked' : ''}`}>
        <rect width="340" height={FLOOR_H - 8} rx="22" fill={main} stroke={O} strokeWidth="6" />
        <rect x="10" y="8" width="320" height="18" rx="9" fill={light} opacity="0.55" />
        {/* прозорчета */}
        {/* при широка табелка прозорчетата стават по-тесни и не се застъпват с числото */}
        {(plateW > 200 ? [26, 314] : [38, 302]).map((cx) => (
          <g key={cx}>
            <path d={`M${cx - ww} ${FLOOR_H - 28} V42 Q${cx - ww} 26 ${cx} 26 Q${cx + ww} 26 ${cx + ww} 42 V${FLOOR_H - 28} Z`} fill="#bfefff" stroke={O} strokeWidth="4" />
            <path d={`M${cx} 28 V${FLOOR_H - 28} M${cx - ww} 58 H${cx + ww}`} stroke={O} strokeWidth="3" />
          </g>
        ))}
        {/* табелката с числото — голям прозорец в средата */}
        <rect x={170 - plateW / 2} y="16" width={plateW} height={FLOOR_H - 40} rx="18" fill={hidden ? '#2a1660' : '#fffaf0'} stroke={O} strokeWidth="5" className="nt-floor__plate" />
        {hidden ? (
          <text x="170" y={FLOOR_H / 2 + 16} textAnchor="middle" className="art-text" fontSize="52" fill="#fff6a8">
            ?
          </text>
        ) : (
          <text x="170" y={FLOOR_H / 2 + 14} textAnchor="middle" className="art-text nt-floor__num" fontSize={numSize} fill={O}>
            {f.label}
          </text>
        )}
        {/* лампички по ръба */}
        {Array.from({ length: 8 }, (_, k) => (
          <circle key={k} className="bulb" style={{ animationDelay: `${(k % 3) * 0.25}s` }} cx={24 + k * 41} cy={FLOOR_H - 8} r="4.5" fill="#fff6a8" />
        ))}
      </g>
    </g>
  )
}

/** Цялата кула: основа с магическа врата, етажи (отдолу нагоре), асансьорна шахта и връх. */
export function TowerScene({ floors, elevatorAt = null, topLit = false, side, width, children, onFloor, dropId, celebrate = false }: Props) {
  const H = TOP_H + floors.length * FLOOR_H + BASE_H
  // място вляво за подписите (по-широко, ако има дълги интервали)
  const SIDE_W = side?.some((x) => x && x.length > 9) ? 260 : side?.length ? 170 : 100
  const yOf = (i: number) => TOP_H + (floors.length - 1 - i) * FLOOR_H
  return (
    <svg
      className={`nt-tower ${celebrate ? 'is-celebrate' : ''}`}
      data-drop={dropId}
      width={width}
      height={(width * H) / (W + 100 + SIDE_W)}
      viewBox={`${-SIDE_W} 0 ${W + 100 + SIDE_W} ${H}`}
      role="img"
      aria-label="Кулата на числата"
    >
      <defs>
        <linearGradient id="nt-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a0" />
          <stop offset="0.5" stopColor="#ffc928" />
          <stop offset="1" stopColor="#e08a00" />
        </linearGradient>
        <linearGradient id="nt-dome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b98cf0" />
          <stop offset="1" stopColor="#6a3fc9" />
        </linearGradient>
        <linearGradient id="nt-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd2e6" />
          <stop offset="1" stopColor="#ff8cc0" />
        </linearGradient>
        <linearGradient id="nt-shaft" x1="0" x2="1">
          <stop offset="0" stopColor="#bfefff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#7fdcf7" stopOpacity="0.35" />
        </linearGradient>
        <radialGradient id="nt-glow">
          <stop offset="0" stopColor="#fff6a8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff6a8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nt-door" cx="0.5" cy="0.6">
          <stop offset="0" stopColor="#fff6a8" />
          <stop offset="0.6" stopColor="#ff9f43" />
          <stop offset="1" stopColor="#9b5de5" />
        </radialGradient>
      </defs>

      {/* асансьорна шахта вдясно */}
      <g>
        <rect x={W / 2 + 178} y={TOP_H + 6} width="86" height={floors.length * FLOOR_H + 40} rx="16" fill="url(#nt-shaft)" stroke={O} strokeWidth="5" />
        {floors.map((_, i) => (
          <path key={i} d={`M${W / 2 + 178} ${yOf(i) + FLOOR_H - 4} H${W / 2 + 264}`} stroke={O} strokeOpacity="0.35" strokeWidth="3" />
        ))}
        <path d={`M${W / 2 + 221} ${TOP_H} V${TOP_H + floors.length * FLOOR_H + 40}`} stroke="#3b2a5a" strokeOpacity="0.4" strokeWidth="3" strokeDasharray="6 6" />
        {elevatorAt !== null && (
          <g className="nt-lift" style={{ transform: `translateY(${yOf(elevatorAt) - yOf(0)}px)` }}>
            <g transform={`translate(${W / 2 + 184} ${yOf(0) + 8})`}>
              <rect width="74" height={FLOOR_H - 24} rx="14" fill="#ffd23f" stroke={O} strokeWidth="5" />
              <rect x="8" y="10" width="58" height="44" rx="8" fill="#bfefff" stroke={O} strokeWidth="3.5" />
              {/* Звездичката в асансьора */}
              <path d="M37 18 l5 10 11 1.6 -8 7.8 1.9 11 -9.9 -5.2 -9.9 5.2 1.9 -11 -8 -7.8 11 -1.6z" fill="#ffd23f" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
              <circle cx="33" cy="33" r="1.8" fill={O} />
              <circle cx="41" cy="33" r="1.8" fill={O} />
              <rect x="14" y={FLOOR_H - 44} width="46" height="10" rx="5" fill="#ff5fa2" stroke={O} strokeWidth="2.5" />
            </g>
          </g>
        )}
      </g>

      {/* етажите */}
      {floors.map((f, i) =>
        onFloor ? (
          <g
            key={i}
            className="nt-floor-btn"
            data-floor={i}
            data-drop={`floor:${i}`}
            data-state={f.state ?? 'placed'}
            role="button"
            tabIndex={0}
            aria-label={f.label ? `Етаж ${i + 1}: ${f.label}` : `Етаж ${i + 1}: празно място`}
            style={{ animationDelay: celebrate ? `${i * 0.12}s` : undefined }}
            onClick={() => onFloor(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onFloor(i)
              }
            }}
          >
            <rect x={W / 2 - 180} y={yOf(i) - 4} width="360" height={FLOOR_H} rx="24" className="nt-floor-btn__hit" />
            <FloorArt f={f} i={i} y={yOf(i)} />
          </g>
        ) : (
          <FloorArt key={i} f={f} i={i} y={yOf(i)} />
        ),
      )}

      {/* подписи вляво (напр. интервали) */}
      {side?.map((s, i) =>
        s ? (
          <g key={i} transform={`translate(${-(SIDE_W - 50)} ${yOf(i) + 26})`}>
            <rect width={SIDE_W - 20} height="54" rx="27" fill="#fffaf0" stroke={O} strokeWidth="4" />
            <text x={(SIDE_W - 20) / 2} y="37" textAnchor="middle" className="art-text" fontSize="24" fill="#5e2fb0">
              {s}
            </text>
          </g>
        ) : null,
      )}

      {/* основа с магическа врата */}
      <g transform={`translate(0 ${TOP_H + floors.length * FLOOR_H})`}>
        <rect x={W / 2 - 200} y="0" width="400" height="150" rx="26" fill="url(#nt-stone)" stroke={O} strokeWidth="6" />
        {Array.from({ length: 6 }, (_, k) => (
          <rect key={k} x={W / 2 - 186 + k * 64} y="14" width="52" height="24" rx="8" fill="#fff" opacity="0.35" />
        ))}
        <path d={`M${W / 2 - 58} 150 V78 Q${W / 2 - 58} 26 ${W / 2} 26 Q${W / 2 + 58} 26 ${W / 2 + 58} 78 V150 Z`} fill="url(#nt-door)" stroke={O} strokeWidth="6" className="nt-door" />
        <path d={`M${W / 2} 30 V150`} stroke={O} strokeWidth="4" />
        <circle cx={W / 2 - 14} cy="104" r="6" fill="#ffd23f" stroke={O} strokeWidth="3" />
        <circle cx={W / 2 + 14} cy="104" r="6" fill="#ffd23f" stroke={O} strokeWidth="3" />
        <Sparkle x={W / 2 - 30} y={62} s={8} />
        <Sparkle x={W / 2 + 34} y={84} s={6} d={0.6} />
        <rect x={W / 2 - 230} y="146" width="460" height="34" rx="17" fill="#9b5de5" stroke={O} strokeWidth="6" />
        {Array.from({ length: 14 }, (_, k) => (
          <circle key={k} className="bulb" style={{ animationDelay: `${(k % 4) * 0.25}s` }} cx={W / 2 - 208 + k * 32} cy="163" r="6" fill="#fff6a8" stroke={O} strokeWidth="1.5" />
        ))}
      </g>

      <StarTop lit={topLit} />
      {children}
    </svg>
  )
}

/** Фон: здрачно небе с облачета, звезди и хълмове (общ за атракцията). */
export function TowerBackdrop() {
  return (
    <svg className="nt-backdrop" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="nt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a34b0" />
          <stop offset="0.55" stopColor="#c271d6" />
          <stop offset="1" stopColor="#ffb3a8" />
        </linearGradient>
      </defs>
      <rect width="1000" height="700" fill="url(#nt-sky)" />
      {Array.from({ length: 30 }, (_, k) => (
        <Sparkle key={k} x={(k * 337) % 1000} y={20 + ((k * 131) % 280)} s={3 + (k % 3) * 2.5} d={(k % 5) * 0.4} c={k % 3 ? '#fff6a8' : '#fff'} />
      ))}
      {[
        [150, 170, 1],
        [760, 120, 0.8],
      ].map(([x, y, s], k) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`} opacity="0.85">
          <ellipse rx="80" ry="30" fill="#fff" />
          <circle cx="-34" cy="-16" r="32" fill="#fff" />
          <circle cx="22" cy="-26" r="40" fill="#fff" />
        </g>
      ))}
      <path d="M0 560 Q250 480 520 540 T1000 520 V700 H0 Z" fill="#7fd36b" />
      <path d="M0 620 Q300 570 600 610 T1000 600 V700 H0 Z" fill="#5cbf55" />
    </svg>
  )
}
