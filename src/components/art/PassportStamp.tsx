/**
 * Уникален печат за всяка атракция: кръгъл „мастилен“ печат с назъбен ръб,
 * надпис в дъга, илюстрацията на атракцията в средата и звездички.
 * Празното поле е пунктирано, със силует.
 */
import type { ComponentType } from 'react'
import type { ArtProps } from './Attractions'

const INK = '#3b2a5a'

interface Props {
  Art: ComponentType<ArtProps>
  name: string
  motto: string
  color: string
  /** Втори цвят на печата. */
  accent: string
  size: number
  /** Печатът е ударен (атракцията е завършена). */
  stamped: boolean
  /** Нов печат — анимация „удар“. */
  fresh?: boolean
  grade: number
}

function arcText(id: string, r: number) {
  return <path id={id} d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`} fill="none" />
}

export function PassportStamp({ Art, name, motto, color, accent, size, stamped, fresh = false, grade }: Props) {
  const id = name.replace(/\s+/g, '-')
  const teeth = 36
  const R = 92
  const edge = Array.from({ length: teeth * 2 }, (_, k) => {
    const a = (k * Math.PI) / teeth
    const r = k % 2 ? R : R + 7
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  if (!stamped)
    return (
      <svg className="pp-stamp is-empty" width={size} height={size} viewBox="-110 -110 220 220" role="img" aria-label={`${name} — печатът още не е ударен`}>
        <circle r={R} fill="rgba(255,255,255,0.35)" stroke="#b9a9d6" strokeWidth="5" strokeDasharray="10 9" />
        <g opacity="0.16" transform="translate(-55 -60)">
          <Art size={110} />
        </g>
        <text y="70" textAnchor="middle" className="art-text" fontSize="17" fill="#9b8fb8">
          Очаква печат
        </text>
      </svg>
    )
  return (
    <svg className={`pp-stamp ${fresh ? 'is-fresh' : ''}`} width={size} height={size} viewBox="-110 -110 220 220" role="img" aria-label={`Печат: ${name}`}>
      <defs>
        {arcText(`pp-top-${id}`, 70)}
        <path id={`pp-bot-${id}`} d="M -74 0 A 74 74 0 0 0 74 0" fill="none" />
        <radialGradient id={`pp-fill-${id}`} cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset="1" stopColor="#fff1cf" />
        </radialGradient>
      </defs>
      <g className="pp-stamp__body" transform="rotate(-8)">
        <polygon points={edge} fill={color} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <circle r={R - 9} fill={`url(#pp-fill-${id})`} stroke={INK} strokeWidth="3.5" />
        <circle r={R - 17} fill="none" stroke={color} strokeWidth="4" strokeDasharray="2 6" strokeLinecap="round" />
        <circle r="50" fill={accent} opacity="0.25" />
        <g transform="translate(-50 -58)">
          <Art size={100} />
        </g>
        <text className="art-text pp-stamp__arc" fontSize="17" fill={INK}>
          <textPath href={`#pp-top-${id}`} startOffset="50%" textAnchor="middle">
            {name.toUpperCase()}
          </textPath>
        </text>
        <text className="art-text pp-stamp__arc" fontSize="14" fill={INK}>
          <textPath href={`#pp-bot-${id}`} startOffset="50%" textAnchor="middle">
            {motto} · {grade}. клас
          </textPath>
        </text>
        {[-1, 1].map((d) => (
          <path key={d} transform={`translate(${d * 76} 4) scale(0.55)`} d="M0 -17 l5 10.5 11.5 1.7 -8.3 8 2 11.4 -10.2 -5.4 -10.2 5.4 2 -11.4 -8.3 -8 11.5 -1.7z" fill="#ffd23f" stroke={INK} strokeWidth="3" />
        ))}
      </g>
    </svg>
  )
}
