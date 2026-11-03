import type { ReactNode } from 'react'
import { OUTLINE as O } from './Attractions'

export type MascotMood = 'happy' | 'cheer' | 'think' | 'encourage'

/** Звездичка — талисманът на парка, който дава инструкции и насърчава. */
export function Mascot({ mood = 'happy', size = 180, className = '' }: { mood?: MascotMood; size?: number; className?: string }) {
  const mouth =
    mood === 'cheer' ? (
      <path d="M-16 8 Q0 30 16 8 Z" fill="#c2185b" stroke={O} strokeWidth="3" strokeLinejoin="round" />
    ) : mood === 'think' ? (
      <path d="M-8 14 Q2 10 10 14" fill="none" stroke={O} strokeWidth="4" strokeLinecap="round" />
    ) : (
      <path d="M-13 9 Q0 24 13 9" fill="none" stroke={O} strokeWidth="4" strokeLinecap="round" />
    )
  return (
    <svg className={`mascot mascot--${mood} ${className}`} width={size} height={size} viewBox="-70 -70 140 140" aria-hidden="true" overflow="visible">
      <defs>
        <radialGradient id="mascot-body" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#fffbd1" />
          <stop offset="0.5" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#ffa91f" />
        </radialGradient>
      </defs>
      <ellipse cx="0" cy="66" rx="34" ry="6" fill={O} opacity="0.15" className="mascot__shadow" />
      <g className="mascot__body">
        {/* ръчички */}
        <g className={mood === 'cheer' ? 'mascot__arms--up' : 'mascot__arms'}>
          <path d="M-42 4 q-18 -6 -24 -22" fill="none" stroke={O} strokeWidth="9" strokeLinecap="round" />
          <path d="M-42 4 q-18 -6 -24 -22" fill="none" stroke="#ffc928" strokeWidth="5" strokeLinecap="round" />
          <path d="M42 4 q18 -6 24 -22" fill="none" stroke={O} strokeWidth="9" strokeLinecap="round" />
          <path d="M42 4 q18 -6 24 -22" fill="none" stroke="#ffc928" strokeWidth="5" strokeLinecap="round" />
        </g>
        <path
          d="M0 -62 L16 -22 L59 -19 L26 9 L37 52 L0 29 L-37 52 L-26 9 L-59 -19 L-16 -22 Z"
          fill="url(#mascot-body)"
          stroke={O}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M-6 -46 L-12 -28" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
        {/* шапчица */}
        <path d="M-14 -50 L0 -84 L14 -50 Z" fill="#ff5fa2" stroke={O} strokeWidth="3" strokeLinejoin="round" transform="rotate(14)" />
        <circle cx="20" cy="-82" r="6" fill="#2ed1c4" stroke={O} strokeWidth="2.5" />
        {/* лице */}
        <g className="mascot__eyes">
          <ellipse cx="-12" cy="-6" rx="5.5" ry="7" fill={O} />
          <ellipse cx="12" cy="-6" rx="5.5" ry="7" fill={O} />
          <circle cx="-10" cy="-9" r="2" fill="#fff" />
          <circle cx="14" cy="-9" r="2" fill="#fff" />
        </g>
        <ellipse cx="-24" cy="8" rx="7" ry="4.5" fill="#ff8cc0" opacity="0.8" />
        <ellipse cx="24" cy="8" rx="7" ry="4.5" fill="#ff8cc0" opacity="0.8" />
        <g transform="translate(0 2)">{mouth}</g>
      </g>
    </svg>
  )
}

/** Талисман с балонче за реч. */
export function MascotSays({ children, mood, size = 150, side = 'left' }: { children: ReactNode; mood?: MascotMood; size?: number; side?: 'left' | 'right' }) {
  return (
    <div className={`mascot-says mascot-says--${side}`}>
      <Mascot mood={mood} size={size} />
      <div className="speech-bubble">{children}</div>
    </div>
  )
}
