import type { SVGProps } from 'react'
import { OUTLINE as O } from '../../components/art/Attractions'
import { MAX_PER_CABIN } from './logic'

const CABIN_COLORS = ['#ff5fa2', '#ffd23f', '#2ed1c4', '#9b5de5', '#6bd66b', '#ff9f43', '#ff8cc0', '#7ff5ea', '#b67cff', '#ffe066']
const KID_COLORS = ['#ffcf9e', '#f2b07c', '#ffd9b8', '#e8a372']
const HAIR = ['#3b2a5a', '#7a4b1e', '#e89a00', '#c2185b']

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

/** Малко дете-пътник (усмихнато личице). */
function Kid({ x, y, r, i }: { x: number; y: number; r: number; i: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={KID_COLORS[i % KID_COLORS.length]} stroke={O} strokeWidth="1.6" />
      <path d={`M${-r} ${-r * 0.15} a${r} ${r} 0 0 1 ${r * 2} 0 q${-r} ${-r * 0.55} ${-r * 2} 0z`} fill={HAIR[i % HAIR.length]} />
      <circle cx={-r * 0.35} cy={r * 0.1} r={r * 0.13} fill={O} />
      <circle cx={r * 0.35} cy={r * 0.1} r={r * 0.13} fill={O} />
      <path d={`M${-r * 0.35} ${r * 0.42} q${r * 0.35} ${r * 0.3} ${r * 0.7} 0`} fill="none" stroke={O} strokeWidth="1.4" strokeLinecap="round" />
    </g>
  )
}

/**
 * Виенско колело с n кабинки. Всяка кабинка е бутон: докосване добавя
 * дете, бутонът „−“ маха. Кабинките висят изправени и при въртене.
 */
export function WheelBoard({ cabins, locked, onAdd, onRemove, bindCabin, highlight, over, disabled, spinning, size }: Props) {
  const n = cabins.length
  const C = 360
  // по-малко кабинки → по-големи (удобни за докосване на дъска и таблет)
  const R = 245
  const cw = n > 8 ? 116 : n > 6 ? 136 : 158
  const ch = n > 8 ? 100 : n > 6 ? 116 : 132
  return (
    <svg className={`wheel-board ${spinning ? 'is-spinning' : ''}`} width={size} height={size} viewBox="-30 -40 780 820" role="group" aria-label={`Колело с ${n} кабинки`}>
      <defs>
        <linearGradient id="wb-leg" x1="0" x2="1">
          <stop offset="0" stopColor="#c39bff" />
          <stop offset="1" stopColor="#7d45d0" />
        </linearGradient>
        <radialGradient id="wb-hub" cx="0.35" cy="0.35">
          <stop offset="0" stopColor="#ffc2dc" />
          <stop offset="1" stopColor="#d63384" />
        </radialGradient>
      </defs>
      {/* крака и основа */}
      <ellipse cx={C} cy="738" rx="250" ry="16" fill={O} opacity="0.18" />
      {[
        [C, C, 170, 730],
        [C, C, 550, 730],
      ].map(([x1, y1, x2, y2], k) => (
        <g key={k}>
          <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={O} strokeWidth="26" strokeLinecap="round" />
          <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke="url(#wb-leg)" strokeWidth="16" strokeLinecap="round" />
        </g>
      ))}
      <rect x="130" y="716" width="460" height="26" rx="12" fill="#ffd23f" stroke={O} strokeWidth="5" />
      <g transform={`translate(${C} ${C})`}>
        <g className="wheel-rotor">
          <circle r={R} fill="none" stroke={O} strokeWidth="18" />
          <circle r={R} fill="none" stroke="#2ed1c4" strokeWidth="9" />
          <circle r={R - 40} fill="none" stroke={O} strokeWidth="9" />
          <circle r={R - 40} fill="none" stroke="#ffd23f" strokeWidth="4" />
          {cabins.map((_, i) => {
            const a = (i * 2 * Math.PI) / n - Math.PI / 2
            return <line key={i} x1="0" y1="0" x2={R * Math.cos(a)} y2={R * Math.sin(a)} stroke={O} strokeWidth="6" />
          })}
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * Math.PI) / 12
            return <circle key={i} className="bulb" style={{ animationDelay: `${(i % 4) * 0.3}s` }} cx={R * Math.cos(a)} cy={R * Math.sin(a)} r="5" fill="#fff6a8" stroke={O} strokeWidth="1.5" />
          })}
          {cabins.map((count, i) => {
            const a = (i * 2 * Math.PI) / n - Math.PI / 2
            const isLocked = locked(i)
            const cols = count <= 4 ? 2 : count <= 9 ? 3 : 5
            const rows = Math.max(1, Math.ceil(count / cols))
            const kr = Math.min((cw - 20) / cols / 2 - 2, (ch - 34) / rows / 2 - 2, 19)
            return (
              <g key={i} transform={`translate(${(R * Math.cos(a)).toFixed(1)} ${(R * Math.sin(a)).toFixed(1)})`}>
                <g className="wheel-cabin-upright">
                  <line x1="0" y1="0" x2="0" y2="14" stroke={O} strokeWidth="4" />
                  <circle r="8" fill="#ffd23f" stroke={O} strokeWidth="3" />
                  <g
                    className={`wheel-cabin ${highlight === i ? 'is-hinted' : ''} ${over === i ? 'is-over' : ''} ${isLocked ? 'is-locked' : ''}`}
                    data-drop={`cabin:${i}`}
                    role="button"
                    tabIndex={disabled || isLocked ? -1 : 0}
                    aria-label={`Кабинка ${i + 1}: ${count} ${count === 1 ? 'дете' : 'деца'}${isLocked ? ', заключена' : '. Докосни, за да добавиш дете.'}`}
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
                    {/* покривче и тяло */}
                    <path d={`M${-cw / 2 - 6} 24 Q0 6 ${cw / 2 + 6} 24 Z`} fill={CABIN_COLORS[i % CABIN_COLORS.length]} stroke={O} strokeWidth="4" strokeLinejoin="round" />
                    <rect className="wheel-cabin__body" x={-cw / 2} y="22" width={cw} height={ch} rx="20" fill="#fffaf0" stroke={O} strokeWidth="5" />
                    <rect x={-cw / 2} y={22 + ch - 18} width={cw} height="18" rx="9" fill={CABIN_COLORS[i % CABIN_COLORS.length]} opacity="0.8" />
                    {/* деца */}
                    <g>
                      {Array.from({ length: count }, (_, k) => {
                        const r = Math.floor(k / cols)
                        const col = k % cols
                        const inRow = Math.min(cols, count - r * cols)
                        const x = (col - (inRow - 1) / 2) * (kr * 2 + 4)
                        const y = 22 + 12 + kr + r * (kr * 2 + 4) + (ch - 30 - rows * (kr * 2 + 4)) / 2
                        return <Kid key={k} x={x} y={y} r={kr} i={k + i} />
                      })}
                    </g>
                    {/* номер на кабинката */}
                    <g transform={`translate(${-cw / 2 + 4} 18)`}>
                      <circle r="15" fill={isLocked ? '#9b5de5' : '#fff'} stroke={O} strokeWidth="3" />
                      <text y="6" textAnchor="middle" className="art-text" fontSize="17" fill={isLocked ? '#fff' : O}>
                        {i + 1}
                      </text>
                    </g>
                    {/* брой деца в кабинката */}
                    <g transform={`translate(${cw / 2 - 4} 18)`}>
                      <rect x="-19" y="-15" width="38" height="30" rx="15" fill={count === MAX_PER_CABIN ? '#ff9f43' : '#ffd23f'} stroke={O} strokeWidth="3" />
                      <text y="7" textAnchor="middle" className="art-text" fontSize="19" fill={O}>
                        {count}
                      </text>
                    </g>
                  </g>
                  {/* бутон „−“ под кабинката */}
                  {!isLocked && !disabled && count > 0 && (
                    <g
                      className="wheel-minus"
                      role="button"
                      tabIndex={0}
                      aria-label={`Махни дете от кабинка ${i + 1}`}
                      transform={`translate(0 ${22 + ch + 22})`}
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
                      <circle r="24" fill="#ff8cc0" stroke={O} strokeWidth="4" />
                      <path d="M-11 0 H11" stroke={O} strokeWidth="6" strokeLinecap="round" />
                    </g>
                  )}
                  {isLocked && (
                    <g transform={`translate(0 ${22 + ch + 20})`} aria-hidden="true">
                      <rect x="-40" y="-16" width="80" height="32" rx="16" fill="#9b5de5" stroke={O} strokeWidth="3" />
                      <text y="7" textAnchor="middle" className="art-text" fontSize="17" fill="#fff">
                        образец
                      </text>
                    </g>
                  )}
                </g>
              </g>
            )
          })}
        </g>
        <circle r="34" fill="url(#wb-hub)" stroke={O} strokeWidth="6" />
        <text y="12" textAnchor="middle" className="art-text" fontSize="36" fill="#fff" stroke={O} strokeWidth="2" paintOrder="stroke">
          ·
        </text>
      </g>
    </svg>
  )
}
