/**
 * Илюстрирано дете (до раменете) за кабинките на колелото.
 * Всеки вариант има различни прическа, цвят на кожата, дрехи и аксесоари.
 * (x, y) е долната среда на фигурката, s — ширината ѝ.
 */
import { OUTLINE as O } from '../../components/art/Attractions'

const SKIN = ['#ffd9b8', '#f5c193', '#e0a172', '#c98656', '#ffe3c9', '#a86b45']
const HAIR = ['#3b2414', '#7a4b1e', '#e8b23a', '#1f1530', '#b5541f', '#5a3218', '#f2d16b']
const SHIRT = ['#2ed1c4', '#ff5fa2', '#9b5de5', '#ffd23f', '#6bd66b', '#ff9f43', '#4d8df0', '#ff8cc0']
const STYLES = ['short', 'long', 'ponytail', 'curly', 'bob', 'braids', 'spiky'] as const
type Style = (typeof STYLES)[number]

/** Детерминиран вид по номер — едно и също дете изглежда еднакво при всяко рисуване. */
function kidLook(v: number) {
  const n = Math.abs(v)
  return {
    skin: SKIN[(n * 5 + 1) % SKIN.length],
    hair: HAIR[(n * 3 + 2) % HAIR.length],
    shirt: SHIRT[(n * 7 + 3) % SHIRT.length],
    style: STYLES[(n * 4 + 1) % STYLES.length] as Style,
    glasses: n % 9 === 4,
    bow: n % 5 === 2,
  }
}

export function Kid({ x, y, s, v, className = '' }: { x: number; y: number; s: number; v: number; className?: string }) {
  const k = kidLook(v)
  const r = s * 0.31 // радиус на главата
  const hy = -s * 0.72 // център на главата
  const lw = Math.max(1, s * 0.035)
  const hairBack = (() => {
    switch (k.style) {
      case 'long':
        return <path d={`M${-r * 1.08} ${hy - r * 0.1} Q${-r * 1.15} ${hy + r * 1.5} ${-r * 0.7} ${hy + r * 1.55} H${r * 0.7} Q${r * 1.15} ${hy + r * 1.5} ${r * 1.08} ${hy - r * 0.1} Z`} fill={k.hair} stroke={O} strokeWidth={lw} />
      case 'bob':
        return <path d={`M${-r * 1.1} ${hy} Q${-r * 1.2} ${hy + r * 1.05} ${-r * 0.55} ${hy + r * 1.0} H${r * 0.55} Q${r * 1.2} ${hy + r * 1.05} ${r * 1.1} ${hy} Z`} fill={k.hair} stroke={O} strokeWidth={lw} />
      case 'ponytail':
        return (
          <g>
            <ellipse cx={r * 1.05} cy={hy - r * 0.05} rx={r * 0.45} ry={r * 0.7} fill={k.hair} stroke={O} strokeWidth={lw} transform={`rotate(-25 ${r * 1.05} ${hy})`} />
            <circle cx={r * 0.82} cy={hy - r * 0.45} r={r * 0.17} fill="#ff5fa2" stroke={O} strokeWidth={lw * 0.8} />
          </g>
        )
      case 'braids':
        return (
          <g>
            {[-1, 1].map((d) => (
              <g key={d}>
                <path d={`M${d * r * 0.85} ${hy + r * 0.2} q${d * r * 0.25} ${r * 0.6} ${d * r * 0.05} ${r * 1.2}`} stroke={k.hair} strokeWidth={r * 0.36} strokeLinecap="round" fill="none" />
                <circle cx={d * r * 0.9} cy={hy + r * 1.42} r={r * 0.13} fill="#ffd23f" stroke={O} strokeWidth={lw * 0.7} />
              </g>
            ))}
          </g>
        )
      default:
        return null
    }
  })()
  const hairFront = (() => {
    switch (k.style) {
      case 'curly':
        return (
          <g fill={k.hair} stroke={O} strokeWidth={lw}>
            {[-0.85, -0.45, 0, 0.45, 0.85].map((dx, i) => (
              <circle key={i} cx={dx * r} cy={hy - r * (0.75 - Math.abs(dx) * 0.35)} r={r * 0.42} />
            ))}
          </g>
        )
      case 'spiky':
        return (
          <path
            d={`M${-r * 1.0} ${hy - r * 0.05} L${-r * 0.85} ${hy - r * 0.95} L${-r * 0.45} ${hy - r * 0.75} L${-r * 0.2} ${hy - r * 1.25} L${r * 0.15} ${hy - r * 0.8} L${r * 0.5} ${hy - r * 1.15} L${r * 0.65} ${hy - r * 0.7} L${r * 1.0} ${hy - r * 0.85} L${r * 1.0} ${hy - r * 0.05} Q${r * 0.4} ${hy - r * 0.55} ${-r * 1.0} ${hy - r * 0.05} Z`}
            fill={k.hair}
            stroke={O}
            strokeWidth={lw}
            strokeLinejoin="round"
          />
        )
      default:
        // кичур/бретон за останалите прически
        return (
          <path
            d={`M${-r * 1.02} ${hy + r * 0.05} Q${-r * 1.05} ${hy - r * 1.15} ${0} ${hy - r * 1.08} Q${r * 1.05} ${hy - r * 1.15} ${r * 1.02} ${hy + r * 0.05} Q${r * 0.75} ${hy - r * 0.35} ${r * 0.15} ${hy - r * 0.42} Q${-r * 0.2} ${hy - r * 0.2} ${-r * 0.55} ${hy - r * 0.4} Q${-r * 0.85} ${hy - r * 0.3} ${-r * 1.02} ${hy + r * 0.05} Z`}
            fill={k.hair}
            stroke={O}
            strokeWidth={lw}
            strokeLinejoin="round"
          />
        )
    }
  })()
  return (
    <g className={`kid ${className}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
      {hairBack}
      {/* дрехи */}
      <path d={`M${-s * 0.46} 0 Q${-s * 0.46} ${-s * 0.34} ${-s * 0.16} ${-s * 0.38} H${s * 0.16} Q${s * 0.46} ${-s * 0.34} ${s * 0.46} 0 Z`} fill={k.shirt} stroke={O} strokeWidth={lw} />
      <path d={`M${-s * 0.13} ${-s * 0.38} Q0 ${-s * 0.22} ${s * 0.13} ${-s * 0.38}`} fill="#fff" stroke={O} strokeWidth={lw * 0.8} />
      {/* врат, уши, глава */}
      <rect x={-r * 0.32} y={hy + r * 0.75} width={r * 0.64} height={r * 0.5} fill={k.skin} />
      <circle cx={-r * 0.98} cy={hy + r * 0.1} r={r * 0.2} fill={k.skin} stroke={O} strokeWidth={lw} />
      <circle cx={r * 0.98} cy={hy + r * 0.1} r={r * 0.2} fill={k.skin} stroke={O} strokeWidth={lw} />
      <circle cx="0" cy={hy} r={r} fill={k.skin} stroke={O} strokeWidth={lw} />
      {hairFront}
      {k.bow && <path d={`M${r * 0.35} ${hy - r * 0.95} l${r * 0.35} ${-r * 0.22} v${r * 0.44} z M${r * 0.35} ${hy - r * 0.95} l${-r * 0.35} ${-r * 0.22} v${r * 0.44} z`} fill="#ff5fa2" stroke={O} strokeWidth={lw * 0.8} />}
      {/* лице */}
      <ellipse cx={-r * 0.38} cy={hy + r * 0.08} rx={r * 0.13} ry={r * 0.17} fill={O} />
      <ellipse cx={r * 0.38} cy={hy + r * 0.08} rx={r * 0.13} ry={r * 0.17} fill={O} />
      <circle cx={-r * 0.34} cy={hy + r * 0.02} r={r * 0.05} fill="#fff" />
      <circle cx={r * 0.42} cy={hy + r * 0.02} r={r * 0.05} fill="#fff" />
      {k.glasses && (
        <g fill="none" stroke={O} strokeWidth={lw * 0.9}>
          <circle cx={-r * 0.38} cy={hy + r * 0.08} r={r * 0.27} />
          <circle cx={r * 0.38} cy={hy + r * 0.08} r={r * 0.27} />
          <path d={`M${-r * 0.11} ${hy + r * 0.06} h${r * 0.22}`} />
        </g>
      )}
      <ellipse cx={-r * 0.62} cy={hy + r * 0.42} rx={r * 0.16} ry={r * 0.1} fill="#ff8cc0" opacity="0.7" />
      <ellipse cx={r * 0.62} cy={hy + r * 0.42} rx={r * 0.16} ry={r * 0.1} fill="#ff8cc0" opacity="0.7" />
      <path d={`M${-r * 0.3} ${hy + r * 0.42} Q0 ${hy + r * 0.82} ${r * 0.3} ${hy + r * 0.42} Z`} fill="#c2185b" stroke={O} strokeWidth={lw * 0.8} strokeLinejoin="round" />
    </g>
  )
}
