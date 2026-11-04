import { OUTLINE as O } from '../../../components/art/Attractions'

/** Цветове на секторите — редуват се, съседните винаги са различни. */
const SECTOR_COLORS = ['#ff5fa2', '#ffd23f', '#2ed1c4', '#9b5de5', '#ff9f43', '#6bd66b', '#4d8df0', '#ff8cc0', '#b67cff', '#3fc9a8', '#ffb703']
/** Числата върху светлите сектори са тъмни, върху наситените — бели. */
const LIGHT = new Set(['#ffd23f', '#ffb703', '#6bd66b', '#2ed1c4', '#3fc9a8', '#ff8cc0'])

export const SW_VB_W = 1000
export const SW_VB_H = 1080
const CX = 500
const CY = 470
const R = 400

interface Props {
  sectors: number[]
  /** Текущо завъртане в градуси (по часовника). */
  rotation: number
  /** Продължителност на прехода (мс); 0 — без анимация. */
  duration: number
  /** Сектор, на който е спряло колелото (свети). */
  winner: number | null
  /** Надпис в средата — таблицата, напр. „3 ·“. */
  hub: string
  spinning: boolean
  size: number
  onSpin?: () => void
  disabled?: boolean
}

function sectorPath(i: number, n: number, r: number): string {
  const a0 = ((i - 0.5) * 2 * Math.PI) / n - Math.PI / 2
  const a1 = ((i + 0.5) * 2 * Math.PI) / n - Math.PI / 2
  const p = (a: number) => `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`
  return `M0 0 L${p(a0)} A${r} ${r} 0 0 1 ${p(a1)} Z`
}

/**
 * Голямо илюстрирано колело на късмета с числата 1…10 (и 0 по избор).
 * Стрелката е отгоре; секторът под нея е множителят.
 */
export function SpinWheel({ sectors, rotation, duration, winner, hub, spinning, size, onSpin, disabled }: Props) {
  const n = sectors.length
  const inner = R - 34
  const bulbs = 36
  const fontSize = n > 10 ? 92 : 100
  return (
    <svg
      className={`spin-wheel ${spinning ? 'is-spinning' : ''} ${winner !== null && !spinning ? 'has-winner' : ''}`}
      width={size}
      height={(size * SW_VB_H) / SW_VB_W}
      viewBox={`0 0 ${SW_VB_W} ${SW_VB_H}`}
      role="img"
      aria-label={winner !== null && !spinning ? `Колелото спря на ${sectors[winner]}` : `Колело с числата ${sectors.join(', ')}`}
    >
      <defs>
        <linearGradient id="sw-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a0" />
          <stop offset="0.5" stopColor="#ffc928" />
          <stop offset="1" stopColor="#e08a00" />
        </linearGradient>
        <linearGradient id="sw-pink" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff8cc0" />
          <stop offset="1" stopColor="#d63384" />
        </linearGradient>
        <radialGradient id="sw-shine" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sw-hub" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#ffb3d3" />
          <stop offset="1" stopColor="#d63384" />
        </radialGradient>
        <radialGradient id="sw-glow">
          <stop offset="0" stopColor="#fff6a8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff6a8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* стойка и платформа */}
      {[-1, 1].map((d) => (
        <g key={d}>
          <path d={`M${CX + d * 40} ${CY} L${CX + d * 230} 1010`} stroke={O} strokeWidth="44" strokeLinecap="round" />
          <path d={`M${CX + d * 40} ${CY} L${CX + d * 230} 1010`} stroke="url(#sw-pink)" strokeWidth="30" strokeLinecap="round" />
        </g>
      ))}
      <path d={`M${CX - 290} 1040 L${CX - 260} 1000 H${CX + 260} L${CX + 290} 1040 Z`} fill="url(#sw-pink)" stroke={O} strokeWidth="5" strokeLinejoin="round" />
      <rect x={CX - 310} y="1036" width="620" height="34" rx="15" fill="url(#sw-pink)" stroke={O} strokeWidth="5" />
      {Array.from({ length: 15 }, (_, k) => (
        <circle key={k} className="bulb" style={{ animationDelay: `${(k % 4) * 0.25}s` }} cx={CX - 280 + k * 40} cy="1053" r="7" fill="#fff6a8" stroke={O} strokeWidth="1.5" />
      ))}

      <g transform={`translate(${CX} ${CY})`}>
        <circle r={R + 40} fill="url(#sw-glow)" opacity="0.4" />
        {/* въртящата се част */}
        <g className="spin-rotor" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${duration}ms`, transitionProperty: duration ? 'transform' : 'none' }}>
          <circle r={R + 8} fill={O} />
          {sectors.map((v, i) => {
            const c = SECTOR_COLORS[i % SECTOR_COLORS.length]
            const a = ((i * 2 * Math.PI) / n) - Math.PI / 2
            const tr = inner * 0.7
            return (
              <g key={i} className={`spin-sector ${winner === i && !spinning ? 'is-winner' : ''}`}>
                <path d={sectorPath(i, n, inner)} fill={c} stroke={O} strokeWidth="6" strokeLinejoin="round" />
                <path className="spin-sector__glow" d={sectorPath(i, n, inner)} fill="#fff6a8" />
                <text
                  x={(tr * Math.cos(a)).toFixed(1)}
                  y={(tr * Math.sin(a)).toFixed(1)}
                  dy={fontSize * 0.36}
                  textAnchor="middle"
                  className="art-text spin-number"
                  fontSize={fontSize}
                  fill={LIGHT.has(c) ? O : '#fff'}
                  stroke={LIGHT.has(c) ? '#fff' : O}
                  strokeWidth="7"
                  paintOrder="stroke"
                  // числата остават изправени (6 и 9 не се бъркат), и докато колелото се върти
                  style={{ transform: `rotate(${-rotation}deg)`, transitionDuration: `${duration}ms`, transitionProperty: duration ? 'transform' : 'none' }}
                >
                  {v}
                </text>
              </g>
            )
          })}
          <circle r={inner} fill="url(#sw-shine)" pointerEvents="none" />
          {/* обръч с лампички */}
          <circle r={R - 14} fill="none" stroke="url(#sw-pink)" strokeWidth="40" />
          <circle r={R - 14} fill="none" stroke={O} strokeWidth="46" strokeOpacity="0" />
          <circle r={R - 36} fill="none" stroke="url(#sw-gold)" strokeWidth="6" />
          <circle r={R + 6} fill="none" stroke="url(#sw-gold)" strokeWidth="6" />
          {Array.from({ length: bulbs }, (_, k) => {
            const a = (k * 2 * Math.PI) / bulbs
            return <circle key={k} className="bulb" style={{ animationDelay: `${(k % 4) * 0.3}s` }} cx={(R - 14) * Math.cos(a)} cy={(R - 14) * Math.sin(a)} r="9" fill="#fff6a8" stroke="#e08a00" strokeWidth="2" />
          })}
        </g>
        {/* главина с таблицата */}
        <g
          className={`spin-hub ${onSpin && !disabled ? 'is-button' : ''}`}
          role={onSpin ? 'button' : undefined}
          tabIndex={onSpin && !disabled ? 0 : -1}
          aria-label={onSpin ? 'Завърти колелото' : undefined}
          onClick={() => !disabled && onSpin?.()}
          onKeyDown={(e) => {
            if (!disabled && onSpin && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault()
              onSpin()
            }
          }}
        >
          <circle r="118" fill="url(#sw-gold)" stroke={O} strokeWidth="7" />
          <circle r="98" fill="url(#sw-hub)" stroke={O} strokeWidth="5" />
          {Array.from({ length: 14 }, (_, k) => {
            const a = (k * Math.PI) / 7
            return <circle key={k} className="bulb" style={{ animationDelay: `${(k % 3) * 0.3}s` }} cx={108 * Math.cos(a)} cy={108 * Math.sin(a)} r="5" fill="#fff6a8" />
          })}
          <text y={hub.length > 3 ? 26 : 34} textAnchor="middle" className="art-text" fontSize={hub.length > 3 ? 70 : 92} fill="#fff" stroke={O} strokeWidth="8" paintOrder="stroke">
            {hub}
          </text>
        </g>
      </g>

      {/* стрелка-флагче отгоре */}
      <g className={`spin-pointer ${spinning ? 'is-ticking' : ''}`} transform={`translate(${CX} ${CY - R - 18})`}>
        <path d="M-46 -62 H46 Q56 -62 52 -50 L8 22 Q0 34 -8 22 L-52 -50 Q-56 -62 -46 -62 Z" fill="url(#sw-gold)" stroke={O} strokeWidth="6" strokeLinejoin="round" />
        <path d="M0 -40 l9 18 20 3 -14.5 14 3.4 20 -17.9 -9.4 -17.9 9.4 3.4 -20 -14.5 -14 20 -3z" fill="#ff5fa2" stroke={O} strokeWidth="3.5" strokeLinejoin="round" transform="scale(0.8) translate(0 -18)" />
      </g>
    </svg>
  )
}
