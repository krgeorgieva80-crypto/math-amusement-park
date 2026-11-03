/** Декоративни SVG елементи за фоновете на парка. */
import type { CSSProperties } from 'react'
import { OUTLINE as O } from '../art/Attractions'

export function SkyDefs() {
  return (
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#6fd6ff" />
        <stop offset="0.55" stopColor="#b5ecff" />
        <stop offset="1" stopColor="#fff3c4" />
      </linearGradient>
      <radialGradient id="sun" cx="0.45" cy="0.4">
        <stop offset="0" stopColor="#fffbd1" />
        <stop offset="0.6" stopColor="#ffe45c" />
        <stop offset="1" stopColor="#ffc928" />
      </radialGradient>
      <linearGradient id="hill-far" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c7b4ff" />
        <stop offset="1" stopColor="#a68cf0" />
      </linearGradient>
      <linearGradient id="hill-mid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8fe39a" />
        <stop offset="1" stopColor="#58c46a" />
      </linearGradient>
      <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7fdc78" />
        <stop offset="1" stopColor="#4fb85b" />
      </linearGradient>
      <linearGradient id="path" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffe9a8" />
        <stop offset="1" stopColor="#ffd27a" />
      </linearGradient>
      <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#3b2a5a" floodOpacity="0.25" />
      </filter>
    </defs>
  )
}

export function Sun({ x, y, r = 70 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="spin-very-slow">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M-12 ${-r - 14} L0 ${-r - 48} L12 ${-r - 14} Z`} fill="#ffe45c" opacity="0.75" transform={`rotate(${i * 30})`} />
        ))}
      </g>
      <circle r={r} fill="url(#sun)" stroke="#ffb020" strokeWidth="4" />
      <circle cx={-r * 0.32} cy={-r * 0.1} r={r * 0.09} fill={O} />
      <circle cx={r * 0.32} cy={-r * 0.1} r={r * 0.09} fill={O} />
      <circle cx={-r * 0.5} cy={r * 0.18} r={r * 0.13} fill="#ff8cc0" opacity="0.6" />
      <circle cx={r * 0.5} cy={r * 0.18} r={r * 0.13} fill="#ff8cc0" opacity="0.6" />
      <path d={`M${-r * 0.25} ${r * 0.2} Q0 ${r * 0.45} ${r * 0.25} ${r * 0.2}`} fill="none" stroke={O} strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

export function Cloud({ x, y, s = 1, speed = 60, delay = 0 }: { x: number; y: number; s?: number; speed?: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="cloud-drift" style={{ animationDuration: `${speed}s`, animationDelay: `${-delay}s` } as CSSProperties}>
        <path
          d="M30 60 a30 30 0 0 1 20 -48 a40 40 0 0 1 72 4 a28 28 0 0 1 44 30 a20 20 0 0 1 -6 14 z"
          fill="#fff"
          stroke="#cfe6f5"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M50 30 a20 20 0 0 1 24 -10" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
      </g>
    </g>
  )
}

/** Гирлянд от триъгълни флагчета между две точки. */
export function Bunting({ x1, x2, y, sag = 40, count = 14 }: { x1: number; x2: number; y: number; sag?: number; count?: number }) {
  const colors = ['#ff5fa2', '#ffd23f', '#2ed1c4', '#9b5de5', '#6bd66b']
  const mid = (x1 + x2) / 2
  const pointAt = (t: number) => {
    const x = x1 + (x2 - x1) * t
    const yy = y + sag * 4 * t * (1 - t)
    return [x, yy] as const
  }
  return (
    <g className="bunting">
      <path d={`M${x1} ${y} Q ${mid} ${y + sag * 2} ${x2} ${y}`} fill="none" stroke={O} strokeWidth="3" />
      {Array.from({ length: count }, (_, i) => {
        const t = (i + 0.5) / count
        const [x, yy] = pointAt(t)
        const w = ((x2 - x1) / count) * 0.42
        return (
          <path
            key={i}
            className="bunting__flag"
            style={{ animationDelay: `${(i % 5) * 0.2}s`, transformOrigin: `${x}px ${yy}px` }}
            d={`M${x - w} ${yy} L${x + w} ${yy} L${x} ${yy + w * 2.1} Z`}
            fill={colors[i % colors.length]}
            stroke={O}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )
      })}
    </g>
  )
}

export function Tree({ x, y, s = 1, color = '#4fc46a' }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="4" rx="34" ry="8" fill={O} opacity="0.15" />
      <rect x="-8" y="-50" width="16" height="54" rx="6" fill="#b8733f" stroke={O} strokeWidth="3" />
      <circle cx="0" cy="-80" r="44" fill={color} stroke={O} strokeWidth="3" />
      <circle cx="-26" cy="-60" r="24" fill={color} stroke={O} strokeWidth="3" />
      <circle cx="26" cy="-60" r="24" fill={color} stroke={O} strokeWidth="3" />
      <path d="M-30 -62 a40 40 0 0 1 60 0" fill={color} />
      <circle cx="-14" cy="-96" r="10" fill="#fff" opacity="0.3" />
      <circle cx="14" cy="-70" r="5" fill="#ff5fa2" stroke={O} strokeWidth="2" />
      <circle cx="-18" cy="-74" r="5" fill="#ff5fa2" stroke={O} strokeWidth="2" />
      <circle cx="6" cy="-104" r="5" fill="#ff5fa2" stroke={O} strokeWidth="2" />
    </g>
  )
}

export function Flower({ x, y, color = '#ff5fa2', s = 1 }: { x: number; y: number; color?: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="flower-sway">
      <path d="M0 0 V-18" stroke="#3a9e44" strokeWidth="3" strokeLinecap="round" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={7 * Math.cos((a * Math.PI) / 180)} cy={-22 + 7 * Math.sin((a * Math.PI) / 180)} r="5.5" fill={color} stroke={O} strokeWidth="1.5" />
      ))}
      <circle cx="0" cy="-22" r="4.5" fill="#ffd23f" stroke={O} strokeWidth="1.5" />
    </g>
  )
}

export function Bush({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-50 0 a22 22 0 0 1 14 -32 a28 28 0 0 1 48 -6 a24 24 0 0 1 38 26 a14 14 0 0 1 0 12 z" fill="#58c46a" stroke={O} strokeWidth="3" strokeLinejoin="round" />
      <path d="M-28 -26 a18 18 0 0 1 22 -8" fill="none" stroke="#a6ef9e" strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

/** Летящ балон за фона. */
export function FloatingBalloon({ x, y, color, delay = 0, s = 1 }: { x: number; y: number; color: string; delay?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="balloon-rise" style={{ animationDelay: `${-delay}s` }}>
        <path d="M0 30 q-8 20 4 40 q8 16 -2 30" fill="none" stroke={O} strokeWidth="2" />
        <ellipse cx="0" cy="0" rx="24" ry="30" fill={color} stroke={O} strokeWidth="3" />
        <path d="M-5 30 h10 l-5 -6 z" fill={color} stroke={O} strokeWidth="2" />
        <ellipse cx="-9" cy="-11" rx="5" ry="10" fill="#fff" opacity="0.5" transform="rotate(20 -9 -11)" />
      </g>
    </g>
  )
}

/** Небе + слънце + облаци + хълмове — общ фон за екраните. */
export function SkyAndHills({ w, h, horizon }: { w: number; h: number; horizon: number }) {
  const far = `M0 ${horizon} C ${w * 0.12} ${horizon - 120} ${w * 0.25} ${horizon - 40} ${w * 0.36} ${horizon - 90} S ${w * 0.62} ${horizon - 150} ${w * 0.75} ${horizon - 70} S ${w * 0.92} ${horizon - 120} ${w} ${horizon - 60} V ${h} H0 Z`
  const mid = `M0 ${horizon + 40} C ${w * 0.15} ${horizon - 30} ${w * 0.3} ${horizon + 30} ${w * 0.45} ${horizon} S ${w * 0.75} ${horizon - 40} ${w} ${horizon + 20} V ${h} H0 Z`
  return (
    <g>
      <rect width={w} height={h} fill="url(#sky)" />
      <Sun x={w - 150} y={130} r={64} />
      <Cloud x={w * 0.05} y={60} s={0.9} speed={70} />
      <Cloud x={w * 0.42} y={120} s={0.7} speed={90} delay={30} />
      <Cloud x={w * 0.7} y={40} s={1} speed={80} delay={50} />
      <path d={far} fill="url(#hill-far)" stroke={O} strokeWidth="3" strokeOpacity="0.25" />
      <path d={mid} fill="url(#hill-mid)" stroke={O} strokeWidth="3" strokeOpacity="0.3" />
    </g>
  )
}
