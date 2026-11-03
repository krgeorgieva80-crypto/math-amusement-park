import { formatNumber } from '../../games/magic-tokens/logic'
import { OUTLINE as O } from './Attractions'

interface Palette {
  light: string
  main: string
  dark: string
  text: string
}

const PALETTES: Record<string, Palette> = {
  yellow: { light: '#fff59d', main: '#ffd23f', dark: '#e89a00', text: '#5a3a00' },
  green: { light: '#b8f5a8', main: '#6bd66b', dark: '#2f8f3c', text: '#123d18' },
  pink: { light: '#ffc2dc', main: '#ff5fa2', dark: '#c2185b', text: '#4a0526' },
  turquoise: { light: '#b3fff6', main: '#2ed1c4', dark: '#0f8a80', text: '#033b36' },
  purple: { light: '#dcc4ff', main: '#9b5de5', dark: '#5e2fb0', text: '#ffffff' },
  orange: { light: '#ffd8a8', main: '#ff9f43', dark: '#d1660a', text: '#4a2000' },
}

/** Всяка стойност има постоянен цвят във всички класове. */
const VALUE_COLOR: Record<number, keyof typeof PALETTES> = {
  1: 'yellow',
  2: 'green',
  5: 'pink',
  10: 'turquoise',
  20: 'purple',
  50: 'orange',
  100: 'purple',
  1000: 'pink',
  10000: 'green',
}

/** Цветен игрален жетон с назъбен ръб, обем и блясък. */
export function TokenCoin({ value, size = 110, className = '', dimmed = false }: { value: number; size?: number; className?: string; dimmed?: boolean }) {
  const name = VALUE_COLOR[value] ?? 'yellow'
  const p = PALETTES[name]
  const label = formatNumber(value)
  const digits = String(value).length
  const fontSize = digits <= 2 ? 36 : digits === 3 ? 29 : digits === 4 ? 23 : 18
  const gid = `tk-${name}`
  return (
    <svg className={`token-coin ${dimmed ? 'is-dimmed' : ''} ${className}`} width={size} height={size} viewBox="-52 -52 104 104" aria-hidden="true">
      <defs>
        <radialGradient id={gid} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor={p.light} />
          <stop offset="0.55" stopColor={p.main} />
          <stop offset="1" stopColor={p.dark} />
        </radialGradient>
      </defs>
      {/* ръб (дебелина на жетона) */}
      <circle cx="0" cy="4" r="46" fill={p.dark} stroke={O} strokeWidth="3" />
      <circle cx="0" cy="0" r="46" fill={`url(#${gid})`} stroke={O} strokeWidth="3" />
      {/* назъбвания */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x="-6" y="-46" width="12" height="11" rx="3" fill="#fff" opacity="0.85" transform={`rotate(${i * 45 + 22.5})`} />
      ))}
      <circle r="33" fill={p.main} stroke={O} strokeWidth="2.5" />
      <circle r="28" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" strokeDasharray="4 5" />
      <path d="M-24 -18 A30 30 0 0 1 8 -30" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="5" strokeLinecap="round" />
      <text
        x="0"
        y={fontSize * 0.36}
        textAnchor="middle"
        fontSize={fontSize}
        className="token-coin__value"
        fill={p.text}
        stroke={p.text === '#ffffff' ? O : '#ffffff'}
        strokeWidth={p.text === '#ffffff' ? 3 : 2.5}
        paintOrder="stroke"
      >
        {label}
      </text>
    </svg>
  )
}
