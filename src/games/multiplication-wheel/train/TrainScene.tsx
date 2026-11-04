import type { SVGProps } from 'react'
import { OUTLINE as O } from '../../../components/art/Attractions'
import { Kid } from '../KidArt'
import { MAX_PER_CABIN } from '../logic'
import { CAR_H, CAR_W, GAP, LOCO_W, carKids, type TrainLayout } from './trainGeometry'

/** Обработчици на указателя (от usePointerDrag) за вагонче i. */
type Bind = (i: number) => object

interface Props {
  layout: TrainLayout
  cars: number[]
  /** Колко деца трябва да има във всяко вагонче (за открояване на попълнените). */
  target: number
  locked: (i: number) => boolean
  onAdd: (i: number) => void
  onRemove: (i: number) => void
  bindCar?: Bind
  highlight?: number | null
  over?: number | null
  disabled?: boolean
  /** Ширина на рисунката в логически пиксели. */
  size: number
  /** Броене след успех: вагончета с номер < counted са преброени; counted−1 е текущото. */
  counted?: number | null
  totals?: number[]
  /** Празнично „чух-чух“ след броенето. */
  departing?: boolean
}

/** Цветове на вагончетата: тяло, райе на покривчето. */
const PAINT: [string, string][] = [
  ['#ff4f93', '#ffd23f'],
  ['#2ed1c4', '#fff6a8'],
  ['#9b5de5', '#ffd23f'],
  ['#ff9f43', '#fff6a8'],
  ['#6bd66b', '#fff6a8'],
  ['#4d8df0', '#ffd23f'],
]

function Wheel({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="train-wheel">
        <circle r={r} fill="#3b2a5a" stroke={O} strokeWidth="4" />
        <circle r={r * 0.78} fill="url(#tr-gold)" stroke={O} strokeWidth="3" />
        {[0, 1, 2].map((k) => (
          <path key={k} d={`M${-r * 0.7} 0 H${r * 0.7}`} stroke={O} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${k * 60})`} />
        ))}
        <circle r={r * 0.24} fill="#ff4f93" stroke={O} strokeWidth="3" />
      </g>
    </g>
  )
}

/** Локомотив, който гледа наляво: усмихнат котел, комин с пушек и кабина с машинист. */
function Locomotive() {
  const w = LOCO_W
  const h = CAR_H
  return (
    <g className="train-loco">
      <ellipse cx={w * 0.5} cy={h + 4} rx={w * 0.46} ry="9" fill={O} opacity="0.18" />
      {/* пушек */}
      <g className="train-smoke-group" aria-hidden="true">
        {[0, 1, 2].map((k) => (
          <circle key={k} className="train-smoke" style={{ animationDelay: `${k * 0.6}s` }} cx={70 - k * 8} cy={-4 - k * 22} r={14 + k * 6} fill="#fff" stroke="#d9d2ef" strokeWidth="3" />
        ))}
      </g>
      {/* комин */}
      <path d="M56 70 L52 32 H40 L46 12 H96 L102 32 H90 L86 70 Z" fill="#3b2a5a" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <rect x="40" y="8" width="62" height="12" rx="6" fill="url(#tr-gold)" stroke={O} strokeWidth="3" />
      {/* кабина */}
      <rect x="160" y="34" width="92" height={h - 86} rx="12" fill="url(#tr-purple)" stroke={O} strokeWidth="4" />
      <rect x="174" y="48" width="64" height="60" rx="12" fill="#bfefff" stroke={O} strokeWidth="3.5" />
      <svg x="174" y="48" width="64" height="60" viewBox="-32 -60 64 60" overflow="hidden">
        <Kid x={0} y={4} s={52} v={23} />
        {/* фуражка на машиниста */}
        <path d="M-17 -48 Q0 -62 17 -48 V-42 H-17 Z" fill="#4d8df0" stroke={O} strokeWidth="2" />
        <path d="M-19 -42 H22" stroke={O} strokeWidth="4" strokeLinecap="round" />
      </svg>
      <path d="M148 34 Q206 6 264 34 Z" fill="url(#tr-gold)" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <rect x="146" y="28" width="120" height="12" rx="6" fill="#ff4f93" stroke={O} strokeWidth="3" />
      {/* котел */}
      <rect x="34" y="70" width="140" height="76" rx="34" fill="url(#tr-pink)" stroke={O} strokeWidth="4" />
      {[80, 128].map((x) => (
        <rect key={x} x={x} y="70" width="12" height="76" fill="url(#tr-gold)" stroke={O} strokeWidth="3" />
      ))}
      <path d="M62 82 Q110 76 160 82" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="6" strokeLinecap="round" />
      {/* купол */}
      <path d="M100 72 Q100 46 116 46 Q132 46 132 72 Z" fill="url(#tr-gold)" stroke={O} strokeWidth="3.5" strokeLinejoin="round" />
      {/* усмихнато лице на котела */}
      <circle cx="40" cy="108" r="40" fill="url(#tr-face)" stroke={O} strokeWidth="4" />
      <circle cx="40" cy="108" r="33" fill="none" stroke="url(#tr-gold)" strokeWidth="4" />
      <ellipse cx="28" cy="100" rx="5" ry="7" fill={O} />
      <ellipse cx="52" cy="100" rx="5" ry="7" fill={O} />
      <circle cx="29.5" cy="97.5" r="1.8" fill="#fff" />
      <circle cx="53.5" cy="97.5" r="1.8" fill="#fff" />
      <ellipse cx="20" cy="114" rx="6" ry="4" fill="#ff8cc0" opacity="0.8" />
      <ellipse cx="60" cy="114" rx="6" ry="4" fill="#ff8cc0" opacity="0.8" />
      <path d="M28 116 Q40 128 52 116" fill="none" stroke={O} strokeWidth="3.5" strokeLinecap="round" />
      {/* фар */}
      <rect x="26" y="58" width="28" height="18" rx="6" fill="url(#tr-gold)" stroke={O} strokeWidth="3" />
      <circle cx="40" cy="67" r="6" fill="#fff6a8" className="bulb" />
      {/* шаси, решетка и колела */}
      <rect x="14" y={h - 66} width={w - 6} height="22" rx="8" fill="#c2185b" stroke={O} strokeWidth="4" />
      {Array.from({ length: 8 }, (_, k) => (
        <circle key={k} cx={34 + k * 30} cy={h - 55} r="4.5" fill="#fff6a8" className="bulb" style={{ animationDelay: `${(k % 3) * 0.3}s` }} />
      ))}
      <path d={`M14 ${h - 64} L-8 ${h - 22} H34 Z`} fill="url(#tr-gold)" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <path d={`M60 ${h - 30} H206`} stroke={O} strokeWidth="7" strokeLinecap="round" />
      <path d={`M60 ${h - 30} H206`} stroke="url(#tr-gold)" strokeWidth="3" strokeLinecap="round" />
      <Wheel x={60} y={h - 26} r={24} />
      <Wheel x={118} y={h - 26} r={24} />
      <Wheel x={206} y={h - 34} r={32} />
      {/* скачване с първото вагонче */}
      <rect x={w - 4} y={h - 52} width={GAP + 8} height="10" rx="5" fill="#3b2a5a" stroke={O} strokeWidth="2.5" />
    </g>
  )
}

/** Едно вагонче: покривче на райета, деца отвътре, предница с номер и брой. */
function CarArt({ i, count, locked, full }: { i: number; count: number; locked: boolean; full: boolean }) {
  const w = CAR_W
  const h = CAR_H
  const [main, stripe] = PAINT[i % PAINT.length]
  const stripes = 6
  const sw = w / stripes
  const clip = `tr-canopy-${i}`
  const roof = `M${w * 0.02} ${h * 0.2} Q${w * 0.02} ${h * 0.04} ${w * 0.5} ${h * 0.03} Q${w * 0.98} ${h * 0.04} ${w * 0.98} ${h * 0.2} Z`
  const kids = carKids(count, w, h)
  const bodyTop = h * 0.56
  const bodyBot = h - 40
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={roof} />
        </clipPath>
      </defs>
      <ellipse cx={w / 2} cy={h + 4} rx={w * 0.44} ry="8" fill={O} opacity="0.18" />
      {/* вътрешност */}
      <rect x={w * 0.07} y={h * 0.19} width={w * 0.86} height={h * 0.42} rx="10" fill={locked ? '#efe2ff' : full ? '#e6ffe0' : '#fff3fa'} stroke={O} strokeWidth="3" />
      {[0.07, 0.93].map((fx) => (
        <rect key={fx} x={w * fx - 6} y={h * 0.18} width="12" height={h * 0.42} rx="6" fill="url(#tr-gold)" stroke={O} strokeWidth="3" />
      ))}
      {/* децата — броят съвпада точно със стойността */}
      {kids.map((p, k) => (
        <Kid key={k} x={p.x} y={p.y} s={p.s} v={i * 11 + k} className="kid--seat" />
      ))}
      {/* предница */}
      <path d={`M0 ${bodyTop} H${w} V${bodyBot - 12} Q${w} ${bodyBot} ${w - 12} ${bodyBot} H12 Q0 ${bodyBot} 0 ${bodyBot - 12} Z`} fill={main} stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <path d={`M10 ${bodyTop + 14} H${w - 10}`} stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
      <rect x="-4" y={bodyTop - 8} width={w + 8} height="16" rx="8" fill="url(#tr-gold)" stroke={O} strokeWidth="3" />
      {Array.from({ length: 7 }, (_, k) => (
        <circle key={k} cx={14 + (k * (w - 28)) / 6} cy={bodyTop} r="4.5" fill="#fff6a8" className="bulb" style={{ animationDelay: `${(k % 3) * 0.3}s` }} />
      ))}
      {/* номер на вагончето */}
      <g transform={`translate(${w / 2} ${(bodyTop + bodyBot) / 2 + 4})`}>
        <circle r="23" fill="#fff" stroke={O} strokeWidth="4" />
        <circle r="18" fill="none" stroke="#9b5de5" strokeWidth="2" />
        <text y="9" textAnchor="middle" className="art-text" fontSize="26" fill="#5e2fb0">
          {i + 1}
        </text>
      </g>
      {/* шаси и колела */}
      <rect x="8" y={bodyBot - 2} width={w - 16} height="14" rx="6" fill="#3b2a5a" stroke={O} strokeWidth="3" />
      <Wheel x={w * 0.24} y={h - 22} r={21} />
      <Wheel x={w * 0.76} y={h - 22} r={21} />
      {/* покривче на райета */}
      <path d={roof} fill={main} />
      <g clipPath={`url(#${clip})`}>
        {Array.from({ length: stripes }, (_, k) => (k % 2 ? <rect key={k} x={k * sw} y="0" width={sw} height={h * 0.22} fill={stripe} /> : null))}
        <ellipse cx={w * 0.34} cy={h * 0.1} rx={w * 0.2} ry={h * 0.035} fill="#fff" opacity="0.35" />
      </g>
      <path d={roof} fill="none" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      {Array.from({ length: stripes }, (_, k) => (
        <path key={k} d={`M${w * 0.02 + (k * w * 0.96) / stripes} ${h * 0.2} a${(w * 0.48) / stripes} ${h * 0.045} 0 0 0 ${(w * 0.96) / stripes} 0 z`} fill={k % 2 ? stripe : main} stroke={O} strokeWidth="2.5" />
      ))}
      <rect x={w * 0.01} y={h * 0.185} width={w * 0.98} height={h * 0.035} rx={h * 0.017} fill="url(#tr-gold)" stroke={O} strokeWidth="2.5" />
      {locked && (
        <g transform={`translate(${w / 2} ${h * 0.035})`}>
          <rect x="-50" y="-17" width="100" height="32" rx="16" fill="#9b5de5" stroke={O} strokeWidth="3" />
          <text y="7" textAnchor="middle" className="art-text" fontSize="20" fill="#fff">
            образец
          </text>
        </g>
      )}
    </g>
  )
}

/**
 * Илюстровано влакче с n вагончета. Всяко вагонче е бутон: докосване добавя
 * дете, „−“ маха. Вагончетата с правилния брой деца светват в зелено.
 */
export function TrainScene({ layout: L, cars, target, locked, onAdd, onRemove, bindCar, highlight, over, disabled, size, counted, totals, departing }: Props) {
  const n = cars.length
  const scale = size / L.width
  // „−“ е поне ~46 логически пиксела, но не много по-голям от предницата
  const minusR = Math.min(50, Math.max(24, 32 / scale))
  return (
    <svg
      className={`train-scene ${departing ? 'is-departing' : ''}`}
      width={size}
      height={(size * L.height) / L.width}
      viewBox={`0 0 ${L.width} ${L.height}`}
      role="group"
      aria-label={`Влакче с ${n} ${n === 1 ? 'вагонче' : 'вагончета'}`}
    >
      <defs>
        <linearGradient id="tr-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a0" />
          <stop offset="0.5" stopColor="#ffc928" />
          <stop offset="1" stopColor="#e08a00" />
        </linearGradient>
        <linearGradient id="tr-pink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff8cc0" />
          <stop offset="1" stopColor="#d63384" />
        </linearGradient>
        <linearGradient id="tr-purple" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b98cf0" />
          <stop offset="1" stopColor="#7a3fd0" />
        </linearGradient>
        <radialGradient id="tr-face" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset="1" stopColor="#ffcf5a" />
        </radialGradient>
      </defs>

      {/* релси с траверси и завои */}
      <g className="train-rails" aria-hidden="true">
        {L.rails.map((r, k) => (
          <g key={k}>
            {Array.from({ length: Math.max(0, Math.floor((r.x2 - r.x1) / 28)) }, (_, j) => (
              <rect key={j} x={r.x1 + 6 + j * 28} y={r.y + 4} width="16" height="16" rx="3" fill="#9a6a3a" stroke={O} strokeWidth="2" />
            ))}
            <path d={`M${r.x1} ${r.y + 6} H${r.x2}`} stroke={O} strokeWidth="8" strokeLinecap="round" />
            <path d={`M${r.x1} ${r.y + 6} H${r.x2}`} stroke="#d8d4e8" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        ))}
        {L.turns.map((t, k) => (
          <g key={k}>
            <path d={`M${t.x} ${t.y1 + 6} A${70} ${(t.y2 - t.y1) / 2} 0 0 ${t.side === 1 ? 1 : 0} ${t.x} ${t.y2 + 6}`} fill="none" stroke="#9a6a3a" strokeWidth="18" strokeDasharray="14 12" />
            <path d={`M${t.x} ${t.y1 + 6} A${70} ${(t.y2 - t.y1) / 2} 0 0 ${t.side === 1 ? 1 : 0} ${t.x} ${t.y2 + 6}`} fill="none" stroke={O} strokeWidth="8" strokeLinecap="round" />
            <path d={`M${t.x} ${t.y1 + 6} A${70} ${(t.y2 - t.y1) / 2} 0 0 ${t.side === 1 ? 1 : 0} ${t.x} ${t.y2 + 6}`} fill="none" stroke="#d8d4e8" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        ))}
      </g>

      <g className="train-body">
        <g transform={`translate(${L.loco.x} ${L.loco.y})`}>
          <Locomotive />
        </g>
        {/* скачвания между вагончетата в един ред */}
        {L.cars.slice(1).map((c, k) => {
          const p = L.cars[k]
          if (p.row !== c.row) return null
          const x = Math.min(p.x, c.x) + CAR_W - 4
          return <rect key={k} x={x} y={c.y + CAR_H - 52} width={GAP + 8} height="10" rx="5" fill="#3b2a5a" stroke={O} strokeWidth="2.5" aria-hidden="true" />
        })}
        {cars.map((count, i) => {
          const pos = L.cars[i]
          const isLocked = locked(i)
          const full = count === target
          const cls = [
            'train-car',
            full ? 'is-full' : '',
            highlight === i ? 'is-hinted' : '',
            over === i ? 'is-over' : '',
            isLocked ? 'is-locked' : '',
            counted != null && i < counted ? 'is-counted' : '',
            counted != null && i === counted - 1 ? 'is-counting' : '',
          ].join(' ')
          return (
            <g key={i} transform={`translate(${pos.x} ${pos.y})`}>
              <g
                className={cls}
                data-drop={`car:${i}`}
                role="button"
                tabIndex={disabled || isLocked ? -1 : 0}
                aria-label={`Вагонче ${i + 1}: ${count} ${count === 1 ? 'дете' : 'деца'}${full ? ', попълнено' : ''}${isLocked ? ', образец' : '. Докосни, за да добавиш дете.'}`}
                {...((bindCar && !disabled ? bindCar(i) : {}) as SVGProps<SVGGElement>)}
                onKeyDown={(e) => {
                  if (disabled) return
                  if (e.key === 'Enter' || e.key === ' ' || e.key === '+') {
                    e.preventDefault()
                    onAdd(i)
                  } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '-') {
                    e.preventDefault()
                    onRemove(i)
                  }
                }}
              >
                {/* активна зона — цялото вагонче */}
                <rect className="train-car__body" x="-8" y="-8" width={CAR_W + 16} height={CAR_H + 10} rx="22" />
                <g className="train-car__art">
                  <CarArt i={i} count={count} locked={isLocked} full={full} />
                </g>
                {/* знак „попълнено“ */}
                {full && (
                  <g className="train-car__check" transform={`translate(${CAR_W * 0.12} ${CAR_H * 0.06})`} aria-hidden="true">
                    <circle r="19" fill="#4fc46a" stroke={O} strokeWidth="3.5" />
                    <path d="M-9 0 L-2 8 L10 -7" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
                {/* брой деца във вагончето (последен текст — за тестовете) */}
                <g transform={`translate(${CAR_W * 0.84} ${CAR_H * 0.56 + 31})`}>
                  <rect x="-24" y="-17" width="48" height="34" rx="17" fill={full ? '#bff5b0' : count === MAX_PER_CABIN ? '#ff9f43' : '#fff6a8'} stroke={O} strokeWidth="3" />
                  <text y="8" textAnchor="middle" className="art-text" fontSize="23" fill={O}>
                    {count}
                  </text>
                </g>
              </g>
              {/* натрупаната сума над преброеното вагонче */}
              {counted != null && totals && i < counted && (
                <g className="train-tally" transform={`translate(${CAR_W / 2} -30)`} aria-hidden="true">
                  <rect x="-42" y="-24" width="84" height="48" rx="24" fill="url(#tr-gold)" stroke={O} strokeWidth="4" />
                  <text y="12" textAnchor="middle" className="art-text" fontSize="31" fill={O}>
                    {totals[i]}
                  </text>
                </g>
              )}
              {/* „−“ в долния ляв ъгъл на предницата */}
              {!isLocked && !disabled && count > 0 && (
                <g
                  className="wheel-minus train-minus"
                  role="button"
                  tabIndex={0}
                  aria-label={`Махни дете от вагонче ${i + 1}`}
                  transform={`translate(${Math.max(minusR - 6, 30)} ${CAR_H * 0.56 + 31})`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(i)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRemove(i)
                    }
                  }}
                >
                  <circle r={minusR} fill="#fff" stroke={O} strokeWidth="4" />
                  <circle r={minusR - 5} fill="#ff8cc0" />
                  <path d={`M${-minusR * 0.45} 0 H${minusR * 0.45}`} stroke={O} strokeWidth="6" strokeLinecap="round" />
                </g>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

/** Слънчев фон зад влакчето: небе, облачета, гирлянди и хълмове (само декор). */
export function TrainBackdrop() {
  return (
    <svg className="wheel-backdrop train-backdrop" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="tb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fc8ff" />
          <stop offset="0.7" stopColor="#a8e6ff" />
          <stop offset="1" stopColor="#e2f7ff" />
        </linearGradient>
      </defs>
      <rect width="1000" height="700" fill="url(#tb-sky)" />
      <circle cx="880" cy="90" r="54" fill="#ffe066" stroke="#ffb703" strokeWidth="6" />
      {[
        [140, 110, 1],
        [480, 70, 0.8],
        [700, 160, 0.7],
      ].map(([x, y, s], k) => (
        <g key={k} transform={`translate(${x} ${y}) scale(${s})`} opacity="0.95">
          <ellipse cx="0" cy="0" rx="70" ry="30" fill="#fff" />
          <circle cx="-30" cy="-16" r="30" fill="#fff" />
          <circle cx="18" cy="-24" r="36" fill="#fff" />
        </g>
      ))}
      {/* гирлянд с флагчета */}
      <path d="M0 40 Q250 110 500 40 T1000 40" fill="none" stroke="#3b2a5a" strokeWidth="3" />
      {Array.from({ length: 16 }, (_, k) => {
        const x = 30 + k * 62
        const t = (x % 500) / 500
        const y = 40 + 70 * 4 * t * (1 - t) * 0.5
        return <path key={k} d={`M${x - 14} ${y} L${x + 14} ${y} L${x} ${y + 28} Z`} fill={['#ff4f93', '#ffd23f', '#2ed1c4', '#9b5de5'][k % 4]} stroke="#3b2a5a" strokeWidth="2.5" />
      })}
      <path d="M0 560 Q250 480 520 540 T1000 520 V700 H0 Z" fill="#7fd36b" />
      <path d="M0 620 Q300 570 600 610 T1000 600 V700 H0 Z" fill="#5cbf55" />
      {[70, 300, 690, 930].map((x, k) => (
        <g key={x} transform={`translate(${x} ${600 + (k % 2) * 20})`}>
          <circle cx="-26" cy="0" r="30" fill="#3fa64f" stroke="#2a5a2a" strokeWidth="3" />
          <circle cx="14" cy="-12" r="36" fill="#4fc46a" stroke="#2a5a2a" strokeWidth="3" />
          <circle cx={k % 2 ? 0 : 20} cy="-22" r="6" fill="#ff8cc0" />
        </g>
      ))}
    </svg>
  )
}
