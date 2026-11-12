/**
 * Приказни фонове: горска поляна (за играта с мечетата), карта на парка и начален екран.
 * Меки пастелни тонове; всички сцени се разтягат по размера на сцената (w × h).
 */
import { Cloud } from '../../components/scenery/Scenery'

const O = '#4a3560'

export function KgDefs() {
  return (
    <defs>
      <linearGradient id="kg-sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#bfe8ff" />
        <stop offset="0.6" stopColor="#e6f6ff" />
        <stop offset="1" stopColor="#fff4e2" />
      </linearGradient>
      <linearGradient id="kg-meadow" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#b8ecb0" />
        <stop offset="1" stopColor="#8fd48f" />
      </linearGradient>
      <linearGradient id="kg-hill-far" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#cdeccf" />
        <stop offset="1" stopColor="#b3e0b8" />
      </linearGradient>
      <linearGradient id="kg-hill-mid" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#a9e0a6" />
        <stop offset="1" stopColor="#92d394" />
      </linearGradient>
      <radialGradient id="kg-sunglow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff6c8" stopOpacity="0.95" />
        <stop offset="1" stopColor="#fff6c8" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="kg-path" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff0cf" />
        <stop offset="1" stopColor="#f6dca8" />
      </linearGradient>
      <linearGradient id="kg-river" x1="0" x2="1">
        <stop offset="0" stopColor="#a8dcff" />
        <stop offset="1" stopColor="#c9ecff" />
      </linearGradient>
    </defs>
  )
}

function SoftSun({ x, y, r = 60 }: { x: number; y: number; r?: number }) {
  return (
    <g className="kg-sun">
      <circle cx={x} cy={y} r={r * 2.4} fill="url(#kg-sunglow)" />
      <circle cx={x} cy={y} r={r} fill="#ffe489" stroke="#f5c451" strokeWidth="6" />
      <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.28} fill="#fff6c8" opacity="0.8" />
    </g>
  )
}

/** Кръгло листно дърво с меки сенки. */
export function RoundTree({ x, y, s = 1, tone = 0 }: { x: number; y: number; s?: number; tone?: number }) {
  const greens = [
    ['#8fd88a', '#6cc56f', '#4fae5a'],
    ['#a3e39a', '#7fd081', '#5cba64'],
    ['#7ccf86', '#5dbb70', '#45a35a'],
  ][tone % 3]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="4" rx="46" ry="9" fill={O} opacity="0.12" />
      <path d="M-9 0 C -8 -26 -6 -44 -4 -60 H 4 C 6 -44 8 -26 9 0 Z" fill="#b07a4a" stroke={O} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="-24" cy="-74" r="30" fill={greens[1]} stroke={O} strokeWidth="3" />
      <circle cx="24" cy="-76" r="32" fill={greens[1]} stroke={O} strokeWidth="3" />
      <circle cx="0" cy="-104" r="38" fill={greens[0]} stroke={O} strokeWidth="3" />
      <path d="M-20 -118 q 14 -14 32 -8" fill="none" stroke="#e4ffd8" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <circle cx="-14" cy="-90" r="4" fill="#ff8fa3" stroke={O} strokeWidth="1.5" />
      <circle cx="16" cy="-100" r="4" fill="#ff8fa3" stroke={O} strokeWidth="1.5" />
      <circle cx="28" cy="-72" r="4" fill="#ff8fa3" stroke={O} strokeWidth="1.5" />
    </g>
  )
}

/** Борче. */
export function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="4" rx="34" ry="7" fill={O} opacity="0.12" />
      <rect x="-6" y="-20" width="12" height="22" rx="3" fill="#a0683c" stroke={O} strokeWidth="2.6" />
      <path d="M0 -150 L 32 -96 H 18 L 40 -58 H 24 L 46 -18 H -46 L -24 -58 H -40 L -18 -96 H -32 Z" fill="#69c27a" stroke={O} strokeWidth="3" strokeLinejoin="round" />
      <path d="M0 -150 L 32 -96 H 18 L 40 -58 H 24 L 46 -18 H 0 Z" fill="#4fae66" opacity="0.6" />
    </g>
  )
}

export function Mushroom({ x, y, s = 1, color = '#ff8fa3' }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="18" ry="4" fill={O} opacity="0.15" />
      <path d="M-7 0 C -8 -10 -6 -18 -5 -22 H 5 C 6 -18 8 -10 7 0 Z" fill="#fff6e6" stroke={O} strokeWidth="2.4" />
      <path d="M-22 -20 C -22 -40 22 -40 22 -20 Z" fill={color} stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="-9" cy="-28" r="3.5" fill="#fff" />
      <circle cx="6" cy="-32" r="3" fill="#fff" />
      <circle cx="12" cy="-24" r="2.4" fill="#fff" />
    </g>
  )
}

export function Daisy({ x, y, s = 1, color = '#fff' }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 V 18" stroke="#4fae5a" strokeWidth="3" strokeLinecap="round" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx={6 * Math.cos((a * Math.PI) / 180)} cy={6 * Math.sin((a * Math.PI) / 180)} rx="5" ry="4" fill={color} stroke={O} strokeWidth="1.2" />
      ))}
      <circle cx="0" cy="0" r="4" fill="#ffd25e" stroke={O} strokeWidth="1.2" />
    </g>
  )
}

function GrassTuft({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M-10 0 q 2 -14 4 -18 q 1 10 4 14 q 2 -12 6 -18 q 0 12 2 16 q 3 -8 8 -10 q -4 8 -4 16 z"
      fill="#6cc56f"
      stroke={O}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  )
}

export function Butterfly({ x, y, color = '#b9a3ff' }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} className="kg-butterfly">
      <ellipse cx="-8" cy="-4" rx="9" ry="7" fill={color} stroke={O} strokeWidth="1.6" />
      <ellipse cx="8" cy="-4" rx="9" ry="7" fill={color} stroke={O} strokeWidth="1.6" />
      <ellipse cx="-6" cy="6" rx="6" ry="5" fill="#ffd1e3" stroke={O} strokeWidth="1.4" />
      <ellipse cx="6" cy="6" rx="6" ry="5" fill="#ffd1e3" stroke={O} strokeWidth="1.4" />
      <rect x="-1.6" y="-8" width="3.2" height="18" rx="1.6" fill={O} />
    </g>
  )
}

/** Горска поляна за „Нахрани трите мечета“. */
export function GladeScene({ w, h, horizon }: { w: number; h: number; horizon: number }) {
  const far = `M0 ${horizon - 20} C ${w * 0.15} ${horizon - 120} ${w * 0.3} ${horizon - 50} ${w * 0.45} ${horizon - 90} S ${w * 0.75} ${horizon - 130} ${w} ${horizon - 60} V ${h} H0 Z`
  const mid = `M0 ${horizon + 20} C ${w * 0.2} ${horizon - 30} ${w * 0.4} ${horizon + 20} ${w * 0.6} ${horizon - 10} S ${w * 0.85} ${horizon - 20} ${w} ${horizon + 10} V ${h} H0 Z`
  const ground = `M0 ${horizon + 50} C ${w * 0.3} ${horizon + 20} ${w * 0.7} ${horizon + 60} ${w} ${horizon + 30} V ${h} H0 Z`
  const treesBack = Array.from({ length: Math.ceil(w / 150) + 1 }, (_, i) => i * 150 + (i % 2) * 40 - 20)
  return (
    <svg className="kg-scene" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <KgDefs />
      <rect width={w} height={h} fill="url(#kg-sky)" />
      <SoftSun x={w * 0.86} y={h * 0.13} r={Math.min(w, h) * 0.06} />
      <Cloud x={w * 0.12} y={h * 0.1} s={1} speed={90} />
      <Cloud x={w * 0.5} y={h * 0.16} s={0.8} speed={120} delay={-30} />
      <path d={far} fill="url(#kg-hill-far)" />
      {treesBack.map((x, i) => (i % 3 === 1 ? <Pine key={x} x={x} y={horizon - 10 + (i % 2) * 14} s={0.75} /> : <RoundTree key={x} x={x} y={horizon - 4 + (i % 2) * 16} s={0.8} tone={i} />))}
      <path d={mid} fill="url(#kg-hill-mid)" />
      <path d={ground} fill="url(#kg-meadow)" />
      {Array.from({ length: Math.ceil(w / 90) }, (_, i) => (
        <GrassTuft key={i} x={i * 90 + 30} y={horizon + 70 + ((i * 37) % 60)} s={1.2} />
      ))}
      {Array.from({ length: Math.ceil(w / 120) }, (_, i) => (
        <Daisy key={i} x={i * 120 + 60} y={h - 40 - ((i * 53) % 90)} s={1.3} color={['#fff', '#ffd1e3', '#e6dcff'][i % 3]} />
      ))}
      <Mushroom x={w * 0.06} y={h - 50} s={1.6} />
      <Mushroom x={w * 0.95} y={h - 70} s={1.3} color="#b9a3ff" />
      <Butterfly x={w * 0.3} y={horizon - 40} />
      <Butterfly x={w * 0.7} y={horizon - 70} color="#ffd25e" />
    </svg>
  )
}

/** Фон на картата на приказния парк: ливада с дъга, езерце и пътека между атракциите. */
export function KgMapScene({ w, h, path }: { w: number; h: number; path: string }) {
  const horizon = h * 0.18
  return (
    <svg className="kg-scene" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <KgDefs />
      <rect width={w} height={h} fill="url(#kg-meadow)" />
      <rect width={w} height={horizon + 40} fill="url(#kg-sky)" />
      <path
        d={`M0 ${horizon + 10} C ${w * 0.2} ${horizon - 40} ${w * 0.45} ${horizon + 20} ${w * 0.65} ${horizon - 20} S ${w * 0.9} ${horizon} ${w} ${horizon - 10} V ${horizon + 60} H0 Z`}
        fill="url(#kg-hill-far)"
      />
      <path d={`M0 ${horizon + 40} C ${w * 0.3} ${horizon + 10} ${w * 0.6} ${horizon + 50} ${w} ${horizon + 25} V ${h} H0 Z`} fill="url(#kg-meadow)" />
      {/* дъга */}
      {['#ffb3c7', '#ffd59a', '#fff3a6', '#bdf0c4', '#b8dcff', '#d6c8ff'].map((c, i) => (
        <path
          key={c}
          d={`M${w * 0.18} ${horizon + 30} A ${w * 0.32 - i * 14} ${h * 0.22 - i * 12} 0 0 1 ${w * 0.82} ${horizon + 30}`}
          fill="none"
          stroke={c}
          strokeWidth="14"
          opacity="0.55"
          transform={`translate(${i * 14} 0)`}
        />
      ))}
      <Cloud x={w * 0.08} y={h * 0.05} s={0.9} speed={100} />
      <Cloud x={w * 0.62} y={h * 0.03} s={0.7} speed={140} delay={-40} />
      {/* езерце с лилии */}
      {(() => {
        const px = w > h ? w * 0.92 : w * 0.76
        const py = w > h ? h * 0.92 : h * 0.93
        const r = Math.min(w, h) * 0.11
        return (
          <g>
            <ellipse cx={px} cy={py} rx={r * 1.25} ry={r * 0.55} fill="#e8c88a" />
            <ellipse cx={px} cy={py} rx={r * 1.15} ry={r * 0.48} fill="url(#kg-river)" stroke="#7fc2e8" strokeWidth="4" />
            <path d={`M${px - r * 0.6} ${py - r * 0.1} q ${r * 0.3} -${r * 0.12} ${r * 0.6} 0`} fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            {[
              [-0.45, 0.12],
              [0.35, -0.05],
            ].map(([dx, dy], i) => (
              <g key={i}>
                <ellipse cx={px + dx * r} cy={py + dy * r} rx={r * 0.18} ry={r * 0.09} fill="#7fd08f" stroke={O} strokeWidth="2" />
                <circle cx={px + dx * r} cy={py + dy * r - 4} r="6" fill="#ffc2d8" stroke={O} strokeWidth="1.6" />
              </g>
            ))}
          </g>
        )
      })()}
      {/* пътека */}
      <path d={path} fill="none" stroke="#e8c88a" strokeWidth="64" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke="url(#kg-path)" strokeWidth="54" strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" strokeDasharray="14 30" strokeLinecap="round" />
      {/* украси */}
      {[
        [0.04, 0.32, 0],
        [0.95, 0.3, 1],
        [0.03, 0.88, 2],
        [0.5, 0.97, 1],
        [0.97, 0.95, 0],
      ].map(([x, y, t], i) => (
        <RoundTree key={i} x={w * x} y={h * y} s={0.9} tone={t} />
      ))}
      <Pine x={w * 0.9} y={h * 0.82} s={0.8} />
      {Array.from({ length: 14 }, (_, i) => (
        <Daisy key={i} x={((i * 271) % 97) * w * 0.0103} y={h * 0.3 + ((i * 131) % 67) * h * 0.0104} s={1.2} color={['#fff', '#ffd1e3', '#e6dcff', '#fff3a6'][i % 4]} />
      ))}
      <Mushroom x={w * 0.24} y={h * 0.96} s={1.4} />
      <Butterfly x={w * 0.4} y={h * 0.3} />
    </svg>
  )
}

/** Фон на началния екран: два свята — приказна ливада (ляво) и увеселителен парк (дясно). */
export function ChooserScene({ w, h }: { w: number; h: number }) {
  const horizon = h * 0.62
  return (
    <svg className="kg-scene" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <KgDefs />
      <rect width={w} height={h} fill="url(#kg-sky)" />
      <SoftSun x={w * 0.5} y={h * 0.14} r={Math.min(w, h) * 0.06} />
      <Cloud x={w * 0.08} y={h * 0.08} s={1} speed={90} />
      <Cloud x={w * 0.7} y={h * 0.12} s={0.8} speed={120} delay={-30} />
      <path
        d={`M0 ${horizon} C ${w * 0.2} ${horizon - 110} ${w * 0.4} ${horizon - 30} ${w * 0.55} ${horizon - 70} S ${w * 0.85} ${horizon - 120} ${w} ${horizon - 40} V ${h} H0 Z`}
        fill="url(#kg-hill-far)"
      />
      <path d={`M0 ${horizon + 40} C ${w * 0.3} ${horizon} ${w * 0.6} ${horizon + 50} ${w} ${horizon + 20} V ${h} H0 Z`} fill="url(#kg-meadow)" />
      {Array.from({ length: Math.ceil(w / 160) }, (_, i) => (
        <Daisy key={i} x={i * 160 + 50} y={h - 30 - ((i * 47) % 60)} s={1.3} color={['#fff', '#ffd1e3', '#e6dcff'][i % 3]} />
      ))}
      <RoundTree x={w * 0.04} y={h * 0.9} s={1.1} />
      <RoundTree x={w * 0.97} y={h * 0.92} s={1.1} tone={1} />
    </svg>
  )
}
