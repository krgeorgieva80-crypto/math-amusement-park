import { useMemo, type CSSProperties } from 'react'

const COLORS = ['#ffd23f', '#ff5fa2', '#2ed1c4', '#9b5de5', '#6bd66b', '#ff9f43']

/** Звезда с обем (SVG). */
export function StarShape({ filled = true, size = 64, className = '', style }: { filled?: boolean; size?: number; className?: string; style?: CSSProperties }) {
  const id = filled ? 'star-gold' : 'star-empty'
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {filled ? (
            <>
              <stop offset="0" stopColor="#fff27a" />
              <stop offset="0.55" stopColor="#ffc928" />
              <stop offset="1" stopColor="#ff9d1c" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="#e9e3f5" />
              <stop offset="1" stopColor="#c6bcdc" />
            </>
          )}
        </linearGradient>
      </defs>
      <path
        d="M32 4.5l8.3 17 18.7 2.6-13.6 13 3.3 18.5L32 46.8 15.3 55.6l3.3-18.5L5 24.1l18.7-2.6z"
        fill={`url(#${id})`}
        stroke={filled ? '#e07b00' : '#a99cc4'}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M32 12l5 10.5" stroke="#fff" strokeOpacity={filled ? 0.8 : 0.5} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function StarRow({ stars, max = 3, size = 72, animate = false }: { stars: number; max?: number; size?: number; animate?: boolean }) {
  return (
    <div className={`star-row ${animate ? 'is-animated' : ''}`} aria-label={`${stars} от ${max} звезди`}>
      {Array.from({ length: max }, (_, i) => (
        <StarShape key={i} filled={i < stars} size={size} className="star-row__star" style={{ animationDelay: `${0.25 + i * 0.22}s` }} />
      ))}
    </div>
  )
}

/** Конфети при успех — чист CSS, без библиотеки. */
export function Confetti({ count = 60, seed = 1 }: { count?: number; seed?: number }) {
  const pieces = useMemo(() => {
    let s = seed * 9301 + 49297
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }
    return Array.from({ length: count }, (_, i) => ({
      left: rnd() * 100,
      delay: rnd() * 0.6,
      duration: 1.8 + rnd() * 1.4,
      rotate: rnd() * 720 - 360,
      drift: rnd() * 200 - 100,
      color: COLORS[i % COLORS.length],
      shape: i % 3,
      size: 14 + rnd() * 14,
    }))
  }, [count, seed])

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`confetti__piece confetti__piece--${p.shape}`}
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              width: p.size,
              height: p.shape === 1 ? p.size * 0.45 : p.size,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--rot': `${p.rotate}deg`,
              '--drift': `${p.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

/** Искрици около елемент. */
export function Sparkles({ count = 8 }: { count?: number }) {
  return (
    <div className="sparkles" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="sparkles__s" style={{ '--a': `${(360 / count) * i}deg`, animationDelay: `${i * 0.05}s` } as CSSProperties} />
      ))}
    </div>
  )
}
