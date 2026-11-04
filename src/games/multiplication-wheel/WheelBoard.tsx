import type { SVGProps } from 'react'
import { OUTLINE as O } from '../../components/art/Attractions'
import { Kid } from './KidArt'
import { MAX_PER_CABIN } from './logic'

/** Обработчици на указателя (от usePointerDrag) за кабинка i. */
type Bind = (i: number) => object

interface Props {
  cabins: number[]
  locked: (i: number) => boolean
  onAdd: (i: number) => void
  onRemove: (i: number) => void
  /** Указател върху кабинката: докосване добавя, влачене премества/маха. */
  bindCabin?: Bind
  highlight?: number | null
  over?: number | null
  disabled?: boolean
  /** Празнична обиколка след верен отговор. */
  spinning?: boolean
  size: number
}

import { CX, CY, R, VB_H, VB_W, cabinSize, kidLayout } from './wheelGeometry'

/** Цветове на покривчетата: основен цвят, райе. */
const CANOPY: [string, string][] = [
  ['#ff4f93', '#ffd23f'],
  ['#9b5de5', '#ffd23f'],
  ['#2ed1c4', '#fff6a8'],
  ['#ff9f43', '#fff6a8'],
  ['#ff4f93', '#fff'],
  ['#6bd66b', '#fff6a8'],
]

/** Една кабинка-гондола: покривче с райета, лампички, купа със звезда. */
function Gondola({ i, w, h, count, locked }: { i: number; w: number; h: number; count: number; locked: boolean }) {
  const [main, stripe] = CANOPY[i % CANOPY.length]
  const stripes = 6
  const sw = w / stripes
  const clipId = `gondola-canopy-${i}`
  const kids = kidLayout(count, w, h)
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={`M${-w * 0.52} ${h * 0.22} Q${-w * 0.52} ${h * 0.05} 0 ${h * 0.035} Q${w * 0.52} ${h * 0.05} ${w * 0.52} ${h * 0.22} Z`} />
        </clipPath>
      </defs>
      {/* сянка */}
      <ellipse cx="0" cy={h * 1.02} rx={w * 0.4} ry={h * 0.04} fill={O} opacity="0.18" />
      {/* вътрешност (небе зад децата) */}
      <rect x={-w * 0.44} y={h * 0.2} width={w * 0.88} height={h * 0.46} rx={w * 0.06} fill={locked ? '#efe2ff' : '#ffe9f4'} stroke={O} strokeWidth="3" />
      {/* странични стълбчета */}
      {[-1, 1].map((d) => (
        <rect key={d} x={d * w * 0.44 - 5} y={h * 0.19} width="10" height={h * 0.44} rx="5" fill="#ffd23f" stroke={O} strokeWidth="3" />
      ))}
      {/* деца — броят съвпада точно със стойността */}
      {kids.map((p, k) => (
        <Kid key={k} x={p.x} y={p.y} s={p.s} v={i * 11 + k} className="kid--seat" />
      ))}
      {/* купа */}
      <path
        d={`M${-w * 0.5} ${h * 0.6} H${w * 0.5} Q${w * 0.47} ${h * 0.95} 0 ${h * 0.98} Q${-w * 0.47} ${h * 0.95} ${-w * 0.5} ${h * 0.6} Z`}
        fill="url(#wb-bowl)"
        stroke={O}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d={`M${-w * 0.4} ${h * 0.75} Q0 ${h * 0.82} ${w * 0.4} ${h * 0.75}`} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="5" strokeLinecap="round" />
      <rect x={-w * 0.53} y={h * 0.565} width={w * 1.06} height={h * 0.075} rx={h * 0.035} fill="url(#wb-gold)" stroke={O} strokeWidth="3" />
      {Array.from({ length: 7 }, (_, k) => (
        <circle key={k} cx={-w * 0.45 + (k * w * 0.9) / 6} cy={h * 0.603} r={Math.max(3, w * 0.016)} fill="#fff6a8" className="bulb" style={{ animationDelay: `${(k % 3) * 0.3}s` }} />
      ))}
      {locked ? (
        <g transform={`translate(0 ${h * 0.82})`}>
          <rect x={-w * 0.25} y={-h * 0.065} width={w * 0.5} height={h * 0.13} rx={h * 0.06} fill="#9b5de5" stroke={O} strokeWidth="3" />
          <text y={h * 0.035} textAnchor="middle" className="art-text" fontSize={Math.max(14, w * 0.085)} fill="#fff">
            образец
          </text>
        </g>
      ) : (
        <path
          transform={`translate(0 ${h * 0.8}) scale(${w / 230})`}
          d="M0 -17 l5 10.5 11.5 1.7 -8.3 8 2 11.4 -10.2 -5.4 -10.2 5.4 2 -11.4 -8.3 -8 11.5 -1.7z"
          fill="url(#wb-gold)"
          stroke={O}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}
      {/* покривче на райета */}
      <path d={`M${-w * 0.52} ${h * 0.22} Q${-w * 0.52} ${h * 0.05} 0 ${h * 0.035} Q${w * 0.52} ${h * 0.05} ${w * 0.52} ${h * 0.22} Z`} fill={main} />
      <g clipPath={`url(#${clipId})`}>
        {Array.from({ length: stripes }, (_, k) =>
          k % 2 ? <rect key={k} x={-w * 0.5 + k * sw} y={h * 0.02} width={sw} height={h * 0.22} fill={stripe} /> : null,
        )}
        <ellipse cx={-w * 0.15} cy={h * 0.1} rx={w * 0.22} ry={h * 0.04} fill="#fff" opacity="0.35" />
      </g>
      <path d={`M${-w * 0.52} ${h * 0.22} Q${-w * 0.52} ${h * 0.05} 0 ${h * 0.035} Q${w * 0.52} ${h * 0.05} ${w * 0.52} ${h * 0.22} Z`} fill="none" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      {/* назъбен ръб на покривчето */}
      {Array.from({ length: stripes }, (_, k) => (
        <path key={k} d={`M${-w * 0.52 + k * (w * 1.04) / stripes} ${h * 0.22} a${(w * 0.52) / stripes} ${h * 0.05} 0 0 0 ${(w * 1.04) / stripes} 0 z`} fill={k % 2 ? stripe : main} stroke={O} strokeWidth="2.5" />
      ))}
      <rect x={-w * 0.54} y={h * 0.205} width={w * 1.08} height={h * 0.035} rx={h * 0.017} fill="url(#wb-gold)" stroke={O} strokeWidth="2.5" />
    </g>
  )
}

/**
 * Илюстровано виенско колело с n кабинки. Всяка кабинка е бутон:
 * докосване добавя дете, бутонът „−“ маха. Кабинките висят изправени
 * и при празничното завъртане.
 */
export function WheelBoard({ cabins, locked, onAdd, onRemove, bindCabin, highlight, over, disabled, spinning, size }: Props) {
  const n = cabins.length
  const { w, h } = cabinSize(n)
  const bulbs = 40
  const truss = Array.from({ length: n * 4 + 1 }, (_, k) => {
    const a = (k * Math.PI) / (n * 2)
    const r = k % 2 === 0 ? R - 34 : R - 78
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <svg className={`wheel-board ${spinning ? 'is-spinning' : ''}`} width={size} height={(size * VB_H) / VB_W} viewBox={`0 0 ${VB_W} ${VB_H}`} role="group" aria-label={`Виенско колело с ${n} кабинки`}>
      <defs>
        <linearGradient id="wb-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a0" />
          <stop offset="0.5" stopColor="#ffc928" />
          <stop offset="1" stopColor="#e08a00" />
        </linearGradient>
        <linearGradient id="wb-pink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8cc0" />
          <stop offset="1" stopColor="#d63384" />
        </linearGradient>
        <linearGradient id="wb-bowl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6fae" />
          <stop offset="1" stopColor="#c2185b" />
        </linearGradient>
        <linearGradient id="wb-leg" x1="0" x2="1">
          <stop offset="0" stopColor="#ff8cc0" />
          <stop offset="0.5" stopColor="#e0408a" />
          <stop offset="1" stopColor="#a8236a" />
        </linearGradient>
        <radialGradient id="wb-hub" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#ffb3d3" />
          <stop offset="1" stopColor="#d63384" />
        </radialGradient>
        <radialGradient id="wb-glow">
          <stop offset="0" stopColor="#fff6a8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff6a8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* крака, лампи и платформа */}
      {[
        [CX - 30, CY, CX - 250, 940],
        [CX + 30, CY, CX + 250, 940],
      ].map(([x1, y1, x2, y2], k) => (
        <g key={k}>
          <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={O} strokeWidth="40" strokeLinecap="round" />
          <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke="url(#wb-leg)" strokeWidth="28" strokeLinecap="round" />
          {Array.from({ length: 7 }, (_, j) => {
            const t = 0.25 + j * 0.11
            return <circle key={j} className="bulb" style={{ animationDelay: `${(j % 3) * 0.25}s` }} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r="6" fill="#fff6a8" stroke={O} strokeWidth="1.5" />
          })}
        </g>
      ))}
      {[600, 720, 840].map((y) => {
        const dx = 250 * ((y - CY) / (940 - CY))
        return (
          <g key={y}>
            <path d={`M${CX - 30 - dx + 30 * ((y - CY) / (940 - CY))} ${y} H${CX + 30 + dx - 30 * ((y - CY) / (940 - CY))}`} stroke={O} strokeWidth="14" strokeLinecap="round" />
            <path d={`M${CX - 30 - dx + 30 * ((y - CY) / (940 - CY))} ${y} H${CX + 30 + dx - 30 * ((y - CY) / (940 - CY))}`} stroke="url(#wb-gold)" strokeWidth="7" strokeLinecap="round" />
          </g>
        )
      })}
      <path d={`M${CX - 300} 960 L${CX - 270} 922 H${CX + 270} L${CX + 300} 960 Z`} fill="url(#wb-pink)" stroke={O} strokeWidth="5" strokeLinejoin="round" />
      <rect x={CX - 320} y="956" width="640" height="32" rx="14" fill="url(#wb-pink)" stroke={O} strokeWidth="5" />
      {Array.from({ length: 16 }, (_, k) => (
        <circle key={k} className="bulb" style={{ animationDelay: `${(k % 4) * 0.25}s` }} cx={CX - 290 + k * (580 / 15)} cy="972" r="7" fill="#fff6a8" stroke={O} strokeWidth="1.5" />
      ))}

      <g transform={`translate(${CX} ${CY})`}>
        <circle r={R + 40} fill="url(#wb-glow)" opacity="0.35" />
        <g className="wheel-rotor">
          {/* спици */}
          {Array.from({ length: n * 2 }, (_, k) => {
            const a = (k * Math.PI) / n - Math.PI / 2
            return (
              <g key={k}>
                <line x1="0" y1="0" x2={(R - 20) * Math.cos(a)} y2={(R - 20) * Math.sin(a)} stroke={O} strokeWidth={k % 2 ? 8 : 14} strokeLinecap="round" />
                <line x1="0" y1="0" x2={(R - 20) * Math.cos(a)} y2={(R - 20) * Math.sin(a)} stroke={k % 2 ? '#ffd23f' : '#ff6fae'} strokeWidth={k % 2 ? 3.5 : 7} strokeLinecap="round" />
              </g>
            )
          })}
          {/* решетка между двата обръча */}
          <polyline points={truss} fill="none" stroke={O} strokeWidth="9" strokeLinejoin="round" />
          <polyline points={truss} fill="none" stroke="url(#wb-gold)" strokeWidth="4.5" strokeLinejoin="round" />
          <circle r={R - 78} fill="none" stroke={O} strokeWidth="14" />
          <circle r={R - 78} fill="none" stroke="#ff6fae" strokeWidth="7" />
          {/* външен обръч с лампички */}
          <circle r={R} fill="none" stroke={O} strokeWidth="46" />
          <circle r={R} fill="none" stroke="url(#wb-pink)" strokeWidth="36" />
          <circle r={R - 16} fill="none" stroke="url(#wb-gold)" strokeWidth="5" />
          <circle r={R + 16} fill="none" stroke="url(#wb-gold)" strokeWidth="5" />
          {Array.from({ length: bulbs }, (_, k) => {
            const a = (k * 2 * Math.PI) / bulbs
            return <circle key={k} className="bulb" style={{ animationDelay: `${(k % 4) * 0.3}s` }} cx={R * Math.cos(a)} cy={R * Math.sin(a)} r="8" fill="#fff6a8" stroke="#e08a00" strokeWidth="2" />
          })}
          {/* кабинки */}
          {cabins.map((count, i) => {
            const a = (i * 2 * Math.PI) / n - Math.PI / 2
            const isLocked = locked(i)
            const minusR = Math.max(24, w * 0.11)
            return (
              <g key={i} transform={`translate(${(R * Math.cos(a)).toFixed(1)} ${(R * Math.sin(a)).toFixed(1)})`}>
                <g className="wheel-cabin-upright">
                  <circle r="13" fill="url(#wb-gold)" stroke={O} strokeWidth="3" />
                  <g
                    className={`wheel-cabin ${highlight === i ? 'is-hinted' : ''} ${over === i ? 'is-over' : ''} ${isLocked ? 'is-locked' : ''}`}
                    data-drop={`cabin:${i}`}
                    role="button"
                    tabIndex={disabled || isLocked ? -1 : 0}
                    aria-label={`Кабинка ${i + 1}: ${count} ${count === 1 ? 'дете' : 'деца'}${isLocked ? ', образец' : '. Докосни, за да добавиш дете.'}`}
                    {...((bindCabin && !disabled ? bindCabin(i) : {}) as SVGProps<SVGGElement>)}
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
                    {/* активна зона за докосване — цялата кабинка */}
                    <rect className="wheel-cabin__body" x={-w * 0.54} y={-h * 0.02} width={w * 1.08} height={h * 1.05} rx={w * 0.12} />
                    <g className="wheel-cabin__art">
                      <Gondola i={i} w={w} h={h} count={count} locked={isLocked} />
                    </g>
                    {/* номер на кабинката — на върха на покривчето */}
                    <g transform={`translate(0 ${h * 0.02})`}>
                      <circle r={Math.max(20, w * 0.1)} fill="#fff" stroke={O} strokeWidth="4" />
                      <circle r={Math.max(20, w * 0.1) - 5} fill="none" stroke="#9b5de5" strokeWidth="2" />
                      <text y={Math.max(20, w * 0.1) * 0.38} textAnchor="middle" className="art-text" fontSize={Math.max(22, w * 0.11)} fill="#5e2fb0">
                        {i + 1}
                      </text>
                    </g>
                    {/* брой деца в кабинката (последен текст — за тестовете) */}
                    <g transform={`translate(${w * 0.44} ${h * 0.2})`}>
                      <rect x={-w * 0.09 - 6} y={-15} width={w * 0.18 + 12} height="30" rx="15" fill={count === MAX_PER_CABIN ? '#ff9f43' : '#fff6a8'} stroke={O} strokeWidth="3" />
                      <text y="7" textAnchor="middle" className="art-text" fontSize="20" fill={O}>
                        {count}
                      </text>
                    </g>
                  </g>
                  {/* „−“ в долния ляв ъгъл на купата — без да излиза извън кабинката */}
                  {!isLocked && !disabled && count > 0 && (
                    <g
                      className="wheel-minus"
                      role="button"
                      tabIndex={0}
                      aria-label={`Махни дете от кабинка ${i + 1}`}
                      transform={`translate(${-w * 0.4} ${h * 0.86})`}
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
              </g>
            )
          })}
        </g>
        {/* главина със звезда */}
        <circle r="62" fill="url(#wb-gold)" stroke={O} strokeWidth="6" />
        <circle r="48" fill="url(#wb-hub)" stroke={O} strokeWidth="4" />
        <path d="M0 -34 l10 20.5 22.5 3.3 -16.3 15.8 3.9 22.4 -20.1 -10.6 -20.1 10.6 3.9 -22.4 -16.3 -15.8 22.5 -3.3z" fill="url(#wb-gold)" stroke={O} strokeWidth="3.5" strokeLinejoin="round" />
        {Array.from({ length: 12 }, (_, k) => {
          const a = (k * Math.PI) / 6
          return <circle key={k} className="bulb" style={{ animationDelay: `${(k % 3) * 0.3}s` }} cx={55 * Math.cos(a)} cy={55 * Math.sin(a)} r="4" fill="#fff6a8" />
        })}
      </g>
    </svg>
  )
}

/** Нощен фон на увеселителния парк зад колелото (само декор). */
export function ParkNightBackdrop() {
  return (
    <svg className="wheel-backdrop" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="wn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b1f86" />
          <stop offset="0.55" stopColor="#6a3fc9" />
          <stop offset="1" stopColor="#b07ae8" />
        </linearGradient>
      </defs>
      <rect width="1000" height="700" fill="url(#wn-sky)" />
      {Array.from({ length: 34 }, (_, k) => {
        const x = (k * 293) % 1000
        const y = 20 + ((k * 137) % 330)
        const s = 3 + (k % 3) * 2.5
        return (
          <path
            key={k}
            className="twinkle"
            style={{ animationDelay: `${(k % 6) * 0.4}s` }}
            d={`M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`}
            fill={k % 3 ? '#fff6a8' : '#fff'}
          />
        )
      })}
      {/* далечни шатри и влакче */}
      <g opacity="0.75">
        <path d="M30 560 L120 430 L210 560 Z" fill="#ff8cc0" stroke="#3b2a5a" strokeWidth="4" />
        <path d="M120 430 L95 560 M120 430 L145 560" stroke="#ffd23f" strokeWidth="10" />
        <path d="M120 430 v-30" stroke="#3b2a5a" strokeWidth="4" />
        <path d="M120 400 l26 8 -26 8z" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="2.5" />
        <path d="M790 560 L880 440 L970 560 Z" fill="#c39bff" stroke="#3b2a5a" strokeWidth="4" />
        <path d="M880 440 L855 560 M880 440 L905 560" stroke="#ff8cc0" strokeWidth="10" />
        <path d="M600 560 C 640 430 690 430 720 500 S 790 440 820 520" fill="none" stroke="#9b5de5" strokeWidth="12" />
        {[640, 690, 740, 790].map((x) => (
          <path key={x} d={`M${x} ${470 + (x % 3) * 10} V560`} stroke="#9b5de5" strokeWidth="5" />
        ))}
      </g>
      {/* хълм и храсти */}
      <path d="M0 600 Q500 540 1000 600 V700 H0 Z" fill="#4b2a95" />
      {[90, 260, 740, 910].map((x, k) => (
        <g key={x} transform={`translate(${x} 640)`}>
          <circle cx="-34" cy="0" r="38" fill="#3fa64f" stroke="#2a1f4a" strokeWidth="4" />
          <circle cx="20" cy="-16" r="46" fill="#4fc46a" stroke="#2a1f4a" strokeWidth="4" />
          <circle cx="60" cy="6" r="32" fill="#3fa64f" stroke="#2a1f4a" strokeWidth="4" />
          <circle cx={k % 2 ? 0 : 30} cy="-24" r="6" fill="#ff8cc0" />
        </g>
      ))}
    </svg>
  )
}
