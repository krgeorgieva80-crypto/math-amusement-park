/**
 * Оригинални SVG илюстрации на атракционите.
 * Всяка илюстрация е в собствено поле 240×240 и може да се вгради
 * в друга SVG сцена (чрез x, y, size) или да се използва самостоятелно.
 * За замяна с професионална графика е достатъчно компонентът да върне <image>.
 */
import type { ReactNode } from 'react'
import { useApp } from '../../core/AppContext'

export const OUTLINE = '#3b2a5a'
const O = OUTLINE
const SW = 3

export interface ArtProps {
  x?: number
  y?: number
  size?: number
  className?: string
}

function Frame({ x, y, size = 240, className, children, label }: ArtProps & { children: ReactNode; label: string }) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 240 240"
      className={`art ${className ?? ''}`}
      role="img"
      aria-label={label}
      overflow="visible"
    >
      {children}
    </svg>
  )
}

const Shadow = ({ rx = 80, cy = 224 }: { rx?: number; cy?: number }) => (
  <ellipse cx="120" cy={cy} rx={rx} ry="10" fill={O} opacity="0.18" />
)

/** Малък развяващ се флаг. Върхът на пилона е (x, y). */
export function Flag({ x, y, color = '#ff5fa2', h = 22 }: { x: number; y: number; color?: string; h?: number }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + h} stroke={O} strokeWidth={SW} strokeLinecap="round" />
      <path className="flag-wave" d={`M${x} ${y} q 10 -4 20 2 q -4 5 0 10 q -10 -6 -20 -2 z`} fill={color} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
    </g>
  )
}

function Bulbs({ points, delayStep = 0.15 }: { points: [number, number][]; delayStep?: number }) {
  return (
    <g>
      {points.map(([cx, cy], i) => (
        <circle key={i} className="bulb" cx={cx} cy={cy} r="3.6" fill="#fff6a8" stroke={O} strokeWidth="1.5" style={{ animationDelay: `${(i % 4) * delayStep}s` }} />
      ))}
    </g>
  )
}

// ───────────────────────── 1. Кулата на числата ─────────────────────────
export function NumberTowerArt(p: ArtProps) {
  return (
    <Frame {...p} label="Кулата на числата">
      <defs>
        <linearGradient id="nt-body" x1="0" x2="1">
          <stop offset="0" stopColor="#ff8cc0" />
          <stop offset="0.5" stopColor="#ff5fa2" />
          <stop offset="1" stopColor="#d63384" />
        </linearGradient>
      </defs>
      <Shadow rx={62} />
      <rect x="66" y="196" width="108" height="24" rx="10" fill="#9b5de5" stroke={O} strokeWidth={SW} />
      <rect x="74" y="200" width="92" height="6" rx="3" fill="#c39bff" />
      <rect x="99" y="52" width="42" height="148" rx="8" fill="url(#nt-body)" stroke={O} strokeWidth={SW} />
      {[1, 2, 3, 4].map((n, i) => (
        <g key={n}>
          <circle cx="120" cy={178 - i * 34} r="13" fill="#ffd23f" stroke={O} strokeWidth="2.5" />
          <text x="120" y={184 - i * 34} textAnchor="middle" className="art-text" fontSize="17" fill={O}>
            {n}
          </text>
        </g>
      ))}
      <g className="tower-ride">
        <rect x="80" y="58" width="80" height="18" rx="9" fill="#2ed1c4" stroke={O} strokeWidth={SW} />
        {[90, 106, 134, 150].map((cx) => (
          <circle key={cx} cx={cx} cy="58" r="6" fill="#ffd23f" stroke={O} strokeWidth="2" />
        ))}
        <rect x="86" y="64" width="68" height="4" rx="2" fill="#a8f5ee" />
      </g>
      <rect x="88" y="42" width="64" height="14" rx="6" fill="#ffd23f" stroke={O} strokeWidth={SW} />
      <path d="M92 44 L120 12 L148 44 Z" fill="#9b5de5" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M120 12 L110 44 L130 44 Z" fill="#b67cff" />
      <circle cx="120" cy="12" r="5" fill="#ffd23f" stroke={O} strokeWidth="2.5" />
      <Flag x={120} y={-12} color="#2ed1c4" h={20} />
      <Bulbs points={[[95, 48], [107, 48], [120, 48], [133, 48], [145, 48]]} />
    </Frame>
  )
}

// ───────────────────────── 2. Вълшебните жетони ─────────────────────────
function MiniToken({ cx, cy, color, dark, label }: { cx: number; cy: number; color: string; dark: string; label: string }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy + 3} rx="15" ry="6" fill={dark} stroke={O} strokeWidth="2" />
      <ellipse cx={cx} cy={cy} rx="15" ry="6" fill={color} stroke={O} strokeWidth="2" />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize="8" className="art-text" fill={O}>
        {label}
      </text>
    </g>
  )
}

export function MagicTokensArt(p: ArtProps) {
  const stripes = [0, 1, 2, 3, 4, 5, 6, 7]
  return (
    <Frame {...p} label="Вълшебните жетони">
      <defs>
        <linearGradient id="mt-counter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b67cff" />
          <stop offset="1" stopColor="#7d45d0" />
        </linearGradient>
        <radialGradient id="mt-glow">
          <stop offset="0" stopColor="#fff6a8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff6a8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow rx={92} />
      {/* задна стена */}
      <rect x="44" y="80" width="152" height="80" fill="#3e2a78" stroke={O} strokeWidth={SW} />
      <circle cx="120" cy="118" r="40" fill="url(#mt-glow)" />
      {[60, 92, 150, 178].map((cx, i) => (
        <path key={cx} className="twinkle" style={{ animationDelay: `${i * 0.3}s` }} d={`M${cx} ${100 + (i % 2) * 22} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z`} fill="#ffd23f" />
      ))}
      {/* стълбове */}
      <rect x="40" y="72" width="12" height="142" rx="4" fill="#ffd23f" stroke={O} strokeWidth={SW} />
      <rect x="188" y="72" width="12" height="142" rx="4" fill="#ffd23f" stroke={O} strokeWidth={SW} />
      {/* навес на райета */}
      <path d="M26 58 Q120 10 214 58 Z" fill="#ff5fa2" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M120 22 L120 36" stroke={O} strokeWidth={SW} />
      <g>
        {stripes.map((i) => (
          <path
            key={i}
            d={`M${26 + i * 23.5} 58 h23.5 v18 a11.75 11.75 0 0 1 -23.5 0 z`}
            fill={i % 2 ? '#ffd23f' : '#ff5fa2'}
            stroke={O}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        ))}
      </g>
      <circle cx="120" cy="28" r="9" fill="#2ed1c4" stroke={O} strokeWidth={SW} />
      <path d="M120 22 l1.8 4 4.2.6-3 2.9.7 4.2-3.7-2-3.7 2 .7-4.2-3-2.9 4.2-.6z" fill="#fff6a8" />
      {/* летящи жетони */}
      <g className="float-a">
        <MiniToken cx={84} cy={118} color="#ffd23f" dark="#f4a300" label="1" />
      </g>
      <g className="float-b">
        <MiniToken cx={120} cy={104} color="#2ed1c4" dark="#149e94" label="10" />
      </g>
      <g className="float-c">
        <MiniToken cx={156} cy={120} color="#ff5fa2" dark="#d63384" label="5" />
      </g>
      {/* щанд */}
      <rect x="32" y="156" width="176" height="60" rx="8" fill="url(#mt-counter)" stroke={O} strokeWidth={SW} />
      <rect x="28" y="150" width="184" height="14" rx="6" fill="#ffd23f" stroke={O} strokeWidth={SW} />
      {[66, 120, 174].map((cx) => (
        <path key={cx} d={`M${cx} 176 l4 8 9 1.3-6.5 6.3 1.5 9-8-4.2-8 4.2 1.5-9-6.5-6.3 9-1.3z`} fill="#ffd23f" stroke={O} strokeWidth="2" strokeLinejoin="round" />
      ))}
      {/* купчинки жетони на щанда */}
      <MiniToken cx={70} cy={146} color="#6bd66b" dark="#3a9e44" label="2" />
      <MiniToken cx={70} cy={140} color="#6bd66b" dark="#3a9e44" label="2" />
      <MiniToken cx={170} cy={146} color="#9b5de5" dark="#6a3cb8" label="20" />
      <MiniToken cx={170} cy={140} color="#9b5de5" dark="#6a3cb8" label="20" />
      <MiniToken cx={170} cy={134} color="#9b5de5" dark="#6a3cb8" label="20" />
    </Frame>
  )
}

// ───────────────────────── 3. Колелото на умножението ─────────────────────────
export function FerrisWheelArt(p: ArtProps) {
  const cabins = ['#ff5fa2', '#ffd23f', '#2ed1c4', '#9b5de5', '#6bd66b', '#ff9f43']
  const R = 82
  const N = 12
  const truss = Array.from({ length: N * 2 + 1 }, (_, i) => {
    const a = (i * Math.PI) / N
    const r = i % 2 === 0 ? R : R - 11
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <Frame {...p} label="Колелото на умножението">
      <defs>
        <linearGradient id="fw-leg" x1="0" x2="1">
          <stop offset="0" stopColor="#c39bff" />
          <stop offset="1" stopColor="#7d45d0" />
        </linearGradient>
        <radialGradient id="fw-hub" cx="0.35" cy="0.35">
          <stop offset="0" stopColor="#ffc2dc" />
          <stop offset="1" stopColor="#d63384" />
        </radialGradient>
        <radialGradient id="fw-glow">
          <stop offset="0.55" stopColor="#fff6a8" stopOpacity="0" />
          <stop offset="0.8" stopColor="#fff6a8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff6a8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <Shadow rx={86} cy={226} />
      {/* задни крака */}
      <path d="M120 96 L78 212 M120 96 L162 212" stroke="#5e2fb0" strokeWidth="7" strokeLinecap="round" opacity="0.7" />
      <circle cx="120" cy="96" r="104" fill="url(#fw-glow)" />
      <g transform="translate(120 96)">
        <g className="spin-slow">
          <polyline points={truss} fill="none" stroke={O} strokeWidth="4.5" strokeLinejoin="round" />
          <polyline points={truss} fill="none" stroke="#7ff5ea" strokeWidth="2" strokeLinejoin="round" />
          <circle r={R} fill="none" stroke={O} strokeWidth="9" />
          <circle r={R} fill="none" stroke="#2ed1c4" strokeWidth="4.5" />
          <circle r={R - 11} fill="none" stroke={O} strokeWidth="6" />
          <circle r={R - 11} fill="none" stroke="#ffd23f" strokeWidth="2.5" />
          {Array.from({ length: N }, (_, i) => {
            const a = (i * 2 * Math.PI) / N
            return (
              <g key={i}>
                <line x1={15 * Math.cos(a)} y1={15 * Math.sin(a)} x2={(R - 11) * Math.cos(a)} y2={(R - 11) * Math.sin(a)} stroke={O} strokeWidth="3.5" />
                <line x1={15 * Math.cos(a)} y1={15 * Math.sin(a)} x2={(R - 11) * Math.cos(a)} y2={(R - 11) * Math.sin(a)} stroke="#e9dcff" strokeWidth="1.3" />
              </g>
            )
          })}
          <circle r="34" fill="none" stroke={O} strokeWidth="4" />
          <circle r="34" fill="none" stroke="#ff8cc0" strokeWidth="1.8" />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * Math.PI) / 12 + Math.PI / 24
            return <circle key={i} className="bulb" style={{ animationDelay: `${(i % 4) * 0.3}s` }} cx={R * Math.cos(a)} cy={R * Math.sin(a)} r="2.4" fill="#fff6a8" stroke={O} strokeWidth="0.8" />
          })}
          {Array.from({ length: N }, (_, i) => {
            const a = (i * 2 * Math.PI) / N
            const c = cabins[i % cabins.length]
            return (
              <g key={i} transform={`translate(${(R * Math.cos(a)).toFixed(1)} ${(R * Math.sin(a)).toFixed(1)})`}>
                <g className="spin-slow-reverse">
                  <line x1="0" y1="0" x2="0" y2="5" stroke={O} strokeWidth="2.5" />
                  <path d="M-10 5 Q0 0 10 5 V7 H-10 Z" fill={c} stroke={O} strokeWidth="2" strokeLinejoin="round" />
                  <path d="M-9 7 h18 v9 a5 5 0 0 1 -5 5 h-8 a5 5 0 0 1 -5 -5 z" fill={c} stroke={O} strokeWidth="2" strokeLinejoin="round" />
                  <rect x="-6.5" y="9" width="13" height="5" rx="1.5" fill="#fff" opacity="0.85" />
                  <path d="M-9 16 h18" stroke={O} strokeWidth="1.2" opacity="0.4" />
                </g>
              </g>
            )
          })}
        </g>
        <circle r="15" fill="url(#fw-hub)" stroke={O} strokeWidth={SW} />
        <path d="M0 -9 l2.6 5.4 5.9.8-4.3 4.1 1 5.9L0 14.4l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" transform="scale(0.8) translate(0 -2)" fill="#fff6a8" stroke={O} strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      {/* предни крака с решетка */}
      {[
        [120, 96, 62, 212],
        [120, 96, 178, 212],
      ].map(([x1, y1, x2, y2], k) => (
        <g key={k}>
          <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke={O} strokeWidth="13" strokeLinecap="round" />
          <path d={`M${x1} ${y1} L${x2} ${y2}`} stroke="url(#fw-leg)" strokeWidth="7.5" strokeLinecap="round" />
        </g>
      ))}
      {/* напречни греди — само под колелото */}
      {[186, 200].map((y) => {
        const dx = 58 * ((y - 96) / 116)
        return (
          <g key={y}>
            <path d={`M${120 - dx} ${y} L${120 + dx} ${y}`} stroke={O} strokeWidth="6" strokeLinecap="round" />
            <path d={`M${120 - dx} ${y} L${120 + dx} ${y}`} stroke="#ffd23f" strokeWidth="2" strokeLinecap="round" />
          </g>
        )
      })}
      <path d="M76 200 L164 186 M76 186 L164 200" stroke={O} strokeWidth="2.5" opacity="0.5" />
      {/* платформа и будка за билети */}
      <rect x="44" y="206" width="152" height="16" rx="6" fill="#ffd23f" stroke={O} strokeWidth={SW} />
      <rect x="50" y="209" width="140" height="4" rx="2" fill="#fff59d" />
      <path d="M58 222 h124 v6 h-124 z" fill="#e89a00" stroke={O} strokeWidth="2.5" />
      <g>
        <rect x="186" y="176" width="30" height="32" rx="3" fill="#fff1c9" stroke={O} strokeWidth="2.5" />
        <path d="M182 178 L201 164 L220 178 Z" fill="#ff5fa2" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="192" y="184" width="18" height="10" rx="2" fill="#7ff5ea" stroke={O} strokeWidth="1.8" />
      </g>
      <Flag x={34} y={176} color="#2ed1c4" h={34} />
    </Frame>
  )
}

// ───────────────────────── 4. Влакчето на задачите ─────────────────────────
const COASTER_PATH =
  'M-8 196 C 26 196 34 54 70 54 C 98 54 100 150 124 170 C 140 184 168 186 182 160 C 196 134 176 110 160 122 C 144 134 156 172 190 178 C 214 182 226 194 248 196'

/** Неподвижни позиции на вагончетата, когато анимациите са изключени. */
const PARKED: [number, number, number][] = [
  [86, 60, 20],
  [72, 54, 0],
  [57, 59, -18],
  [44, 72, -40],
]

export function CoasterArt(p: ArtProps) {
  const { settings } = useApp()
  const cars = ['#ff5fa2', '#ffd23f', '#2ed1c4', '#9b5de5']
  const posts: [number, number][] = [
    [30, 125],
    [98, 104],
    [124, 170],
    [210, 184],
  ]
  return (
    <Frame {...p} label="Влакчето на задачите">
      <defs>
        <linearGradient id="cs-rail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c39bff" />
          <stop offset="1" stopColor="#7d45d0" />
        </linearGradient>
      </defs>
      <Shadow rx={112} cy={226} />
      {/* решетъчна кула под първия връх */}
      <g>
        {[60, 80].map((x) => (
          <line key={x} x1={x} y1="62" x2={x} y2="214" stroke={O} strokeWidth="5" />
        ))}
        {[60, 80].map((x) => (
          <line key={`c${x}`} x1={x} y1="62" x2={x} y2="214" stroke="#ffd23f" strokeWidth="2" />
        ))}
        {Array.from({ length: 6 }, (_, i) => {
          const y = 70 + i * 24
          return <path key={i} d={`M60 ${y} L80 ${y + 24} M80 ${y} L60 ${y + 24}`} stroke={O} strokeWidth="1.8" opacity="0.7" />
        })}
      </g>
      {posts.map(([x, y]) => (
        <g key={x}>
          <line x1={x} y1={y + 4} x2={x} y2="214" stroke={O} strokeWidth="6" />
          <line x1={x} y1={y + 4} x2={x} y2="214" stroke="#ffd23f" strokeWidth="2.2" />
        </g>
      ))}
      {/* опора на примката */}
      <path d="M160 214 L170 176 L180 214" fill="none" stroke={O} strokeWidth="5" strokeLinejoin="round" />
      <path d="M160 214 L170 176 L180 214" fill="none" stroke="#ffd23f" strokeWidth="2" strokeLinejoin="round" />
      {/* релси: траверси, тяло, две релси */}
      <path d={COASTER_PATH} fill="none" stroke="#7a4b1e" strokeWidth="15" strokeDasharray="2.5 6" />
      <path d={COASTER_PATH} fill="none" stroke={O} strokeWidth="11" strokeLinecap="round" />
      <path d={COASTER_PATH} fill="none" stroke="url(#cs-rail)" strokeWidth="7" strokeLinecap="round" />
      <path d={COASTER_PATH} fill="none" stroke="#3e2a78" strokeWidth="1.6" />
      <path d={COASTER_PATH} fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="1 9" opacity="0.9" transform="translate(0 -2.4)" />
      <path id="coaster-track" d={COASTER_PATH} fill="none" stroke="none" />
      {cars.map((c, i) => {
        const body = (
          <>
            <path d="M-12 -18 h22 a4 4 0 0 1 4 4 v8 h-28 v-10 a2 2 0 0 1 2 -2 z" fill={c} stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M-10 -14 h18" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            <circle cx="-2" cy="-22" r="4.2" fill="#ffcf9e" stroke={O} strokeWidth="1.8" />
            <path d="M-6 -22 l-4 -7 M2 -22 l4 -7" stroke={O} strokeWidth="2" strokeLinecap="round" />
            <circle cx="-7" cy="-5" r="3.2" fill={O} />
            <circle cx="7" cy="-5" r="3.2" fill={O} />
          </>
        )
        if (!settings.animationsOn) {
          const [x, y, r] = PARKED[i]
          return (
            <g key={c} transform={`translate(${x} ${y}) rotate(${r})`}>
              {body}
            </g>
          )
        }
        return (
          <g key={c}>
            <animateMotion dur="6s" repeatCount="indefinite" rotate="auto" begin={`${-0.18 * i}s`} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.5 0 0.5 1">
              <mpath href="#coaster-track" />
            </animateMotion>
            {body}
          </g>
        )
      })}
      {/* тунел и гара */}
      <path d="M-8 218 V178 a22 22 0 0 1 44 0 V218 z" fill="#6bd66b" stroke={O} strokeWidth={SW} />
      <path d="M2 218 V184 a12 12 0 0 1 24 0 V218 z" fill="#2c6b3a" />
      <path d="M-4 176 a18 18 0 0 1 36 0" fill="none" stroke="#b8f5a8" strokeWidth="3" strokeLinecap="round" />
      <g>
        <rect x="210" y="170" width="6" height="46" fill={O} />
        <rect x="238" y="170" width="6" height="46" fill={O} />
        <path d="M200 172 L227 152 L254 172 Z" fill="#ff5fa2" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
        <path d="M206 172 h42" stroke="#ffd23f" strokeWidth="4" />
      </g>
      <rect x="-10" y="212" width="262" height="10" rx="5" fill="#ffd23f" stroke={O} strokeWidth={SW} />
      <Flag x={14} y={140} color="#ff5fa2" />
      <Flag x={227} y={130} color="#9b5de5" />
    </Frame>
  )
}

// ───────────────────────── 5. Магазинът за чудеса ─────────────────────────
function Gift({ x, y, w, color, ribbon }: { x: number; y: number; w: number; color: string; ribbon: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={w * 0.85} rx="3" fill={color} stroke={O} strokeWidth="2.5" />
      <rect x={x + w / 2 - 3} y={y} width="6" height={w * 0.85} fill={ribbon} />
      <path d={`M${x + w / 2} ${y} c -8 -10 -14 -2 0 0 c 8 -10 14 -2 0 0`} fill={ribbon} stroke={O} strokeWidth="2" />
    </g>
  )
}

export function ShopArt(p: ArtProps) {
  return (
    <Frame {...p} label="Магазинът за чудеса">
      <Shadow rx={90} />
      <rect x="44" y="92" width="152" height="124" rx="6" fill="#fff1c9" stroke={O} strokeWidth={SW} />
      <path d="M32 96 L60 50 H180 L208 96 Z" fill="#ff5fa2" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M60 50 H180 L170 64 H70 Z" fill="#ff8cc0" />
      {/* табела */}
      <rect x="78" y="28" width="84" height="28" rx="12" fill="#9b5de5" stroke={O} strokeWidth={SW} />
      <path className="twinkle" d="M120 32 l3 6.5 7 1-5 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5-5 7-1z" fill="#ffd23f" />
      {/* сенник */}
      {Array.from({ length: 7 }, (_, i) => (
        <path key={i} d={`M${40 + i * 22.86} 96 h22.86 v16 a11.43 11.43 0 0 1 -22.86 0 z`} fill={i % 2 ? '#fff' : '#2ed1c4'} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      ))}
      {/* витрина */}
      <rect x="56" y="128" width="78" height="56" rx="6" fill="#c9f6f2" stroke={O} strokeWidth={SW} />
      <rect x="62" y="134" width="20" height="44" rx="4" fill="#fff" opacity="0.5" />
      <Gift x={64} y={156} w={22} color="#ffd23f" ribbon="#ff5fa2" />
      <Gift x={92} y={150} w={28} color="#9b5de5" ribbon="#ffd23f" />
      <circle className="float-a" cx="110" cy="138" r="7" fill="#ff5fa2" stroke={O} strokeWidth="2" />
      {/* врата */}
      <path d="M146 216 V146 a18 18 0 0 1 36 0 V216 z" fill="#ff9f43" stroke={O} strokeWidth={SW} />
      <circle cx="173" cy="182" r="3" fill={O} />
      <path d="M152 150 a12 12 0 0 1 24 0" fill="none" stroke="#ffd23f" strokeWidth="3" />
      {/* подаръци отпред */}
      <Gift x={18} y={186} w={30} color="#2ed1c4" ribbon="#ff5fa2" />
      <Gift x={196} y={192} w={26} color="#6bd66b" ribbon="#ffd23f" />
    </Frame>
  )
}

// ───────────────────────── 6. Часовниковата кула ─────────────────────────
export function ClockTowerArt(p: ArtProps) {
  return (
    <Frame {...p} label="Часовниковата кула">
      <defs>
        <linearGradient id="ct-body" x1="0" x2="1">
          <stop offset="0" stopColor="#5fe6db" />
          <stop offset="1" stopColor="#149e94" />
        </linearGradient>
      </defs>
      <Shadow rx={64} />
      <rect x="66" y="198" width="108" height="22" rx="8" fill="#9b5de5" stroke={O} strokeWidth={SW} />
      <rect x="84" y="66" width="72" height="134" rx="6" fill="url(#ct-body)" stroke={O} strokeWidth={SW} />
      <rect x="76" y="58" width="88" height="16" rx="6" fill="#ffd23f" stroke={O} strokeWidth={SW} />
      <path d="M78 60 L120 8 L162 60 Z" fill="#ff5fa2" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M120 8 L104 60 H120 Z" fill="#ff8cc0" />
      <Flag x={120} y={-14} color="#ffd23f" h={22} />
      {/* циферблат */}
      <g transform="translate(120 106)">
        <circle r="30" fill="#ffd23f" stroke={O} strokeWidth={SW} />
        <circle r="24" fill="#fffdf2" stroke={O} strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6
          const r1 = i % 3 === 0 ? 17 : 20
          return <line key={i} x1={r1 * Math.sin(a)} y1={-r1 * Math.cos(a)} x2={22 * Math.sin(a)} y2={-22 * Math.cos(a)} stroke={O} strokeWidth={i % 3 === 0 ? 2.5 : 1.5} strokeLinecap="round" />
        })}
        <g className="clock-hour">
          <line x1="0" y1="0" x2="0" y2="-11" stroke={O} strokeWidth="4" strokeLinecap="round" />
        </g>
        <g className="clock-minute">
          <line x1="0" y1="0" x2="0" y2="-18" stroke="#ff5fa2" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle r="3" fill={O} />
      </g>
      {/* прозорци и врата */}
      <rect x="96" y="146" width="16" height="20" rx="8" fill="#3e2a78" stroke={O} strokeWidth="2.5" />
      <rect x="128" y="146" width="16" height="20" rx="8" fill="#3e2a78" stroke={O} strokeWidth="2.5" />
      <path d="M106 200 V184 a14 14 0 0 1 28 0 V200 z" fill="#ff9f43" stroke={O} strokeWidth={SW} />
      <Bulbs points={[[86, 66], [100, 66], [114, 66], [126, 66], [140, 66], [154, 66]]} />
    </Frame>
  )
}

// ───────────────────────── 7. Замъкът на фигурите ─────────────────────────
export function CastleArt(p: ArtProps) {
  const crenel = (x: number, y: number, n: number, w: number, color: string) =>
    Array.from({ length: n }, (_, i) => <rect key={i} x={x + i * w * 2} y={y} width={w} height={w} fill={color} stroke={O} strokeWidth="2.5" />)
  return (
    <Frame {...p} label="Замъкът на фигурите">
      <Shadow rx={100} />
      {/* стена */}
      <rect x="54" y="112" width="132" height="104" fill="#c39bff" stroke={O} strokeWidth={SW} />
      {crenel(54, 100, 7, 12, '#c39bff')}
      {/* кули */}
      <rect x="22" y="92" width="44" height="124" fill="#ff8cc0" stroke={O} strokeWidth={SW} />
      <rect x="174" y="92" width="44" height="124" fill="#ff8cc0" stroke={O} strokeWidth={SW} />
      <path d="M16 94 L44 40 L72 94 Z" fill="#ffd23f" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M168 94 L196 40 L224 94 Z" fill="#ffd23f" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Flag x={44} y={20} color="#2ed1c4" />
      <Flag x={196} y={20} color="#9b5de5" />
      {/* централна кула */}
      <rect x="94" y="64" width="52" height="60" fill="#2ed1c4" stroke={O} strokeWidth={SW} />
      <path d="M88 66 L120 18 L152 66 Z" fill="#6bd66b" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <Flag x={120} y={-4} color="#ff5fa2" />
      <circle cx="120" cy="92" r="13" fill="#fff6a8" stroke={O} strokeWidth={SW} />
      <circle cx="120" cy="92" r="6" fill="#ffd23f" className="twinkle" />
      {/* фигури — „скъпоценни камъни“ по стената */}
      <rect x="32" y="120" width="22" height="22" fill="#ffd23f" stroke={O} strokeWidth="2.5" />
      <circle cx="196" cy="131" r="12" fill="#6bd66b" stroke={O} strokeWidth="2.5" />
      <path d="M44 160 L56 182 H32 Z" fill="#2ed1c4" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M196 158 l12 7 v14 l-12 7 -12 -7 v-14 z" fill="#ffd23f" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M72 138 l10 -10 10 10 -10 10z" fill="#ff5fa2" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M148 138 l10 -10 10 10 -10 10z" fill="#ff5fa2" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      {/* порта */}
      <path d="M98 216 V172 a22 22 0 0 1 44 0 V216 z" fill="#7d45d0" stroke={O} strokeWidth={SW} />
      {[108, 120, 132].map((x) => (
        <line key={x} x1={x} y1="158" x2={x} y2="216" stroke="#3e2a78" strokeWidth="2.5" />
      ))}
      <rect x="12" y="210" width="216" height="10" rx="5" fill="#6bd66b" stroke={O} strokeWidth={SW} />
    </Frame>
  )
}

// ───────────────────────── 8. Балоненото предизвикателство ─────────────────────────
function Balloon({ cx, cy, color, cls, delay = 0 }: { cx: number; cy: number; color: string; cls: string; delay?: number }) {
  return (
    <g className={cls} style={{ animationDelay: `${delay}s` }}>
      <path d={`M${cx} ${cy + 22} Q ${cx - 6} ${cy + 44} ${120} 156`} fill="none" stroke={O} strokeWidth="1.5" />
      <ellipse cx={cx} cy={cy} rx="17" ry="21" fill={color} stroke={O} strokeWidth="2.5" />
      <path d={`M${cx - 4} ${cy + 24} h8 l-4 -5 z`} fill={color} stroke={O} strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx={cx - 6} cy={cy - 8} rx="4" ry="7" fill="#fff" opacity="0.55" transform={`rotate(20 ${cx - 6} ${cy - 8})`} />
    </g>
  )
}

export function BalloonArt(p: ArtProps) {
  return (
    <Frame {...p} label="Балоненото предизвикателство">
      <Shadow rx={86} />
      <Balloon cx={70} cy={70} color="#2ed1c4" cls="bob-a" />
      <Balloon cx={170} cy={68} color="#6bd66b" cls="bob-b" delay={0.4} />
      <Balloon cx={96} cy={44} color="#ffd23f" cls="bob-c" delay={0.2} />
      <Balloon cx={146} cy={40} color="#9b5de5" cls="bob-a" delay={0.6} />
      <Balloon cx={120} cy={74} color="#ff5fa2" cls="bob-b" />
      <Balloon cx={46} cy={112} color="#ff9f43" cls="bob-c" delay={0.5} />
      <Balloon cx={194} cy={110} color="#ff5fa2" cls="bob-a" delay={0.3} />
      {/* количка */}
      <rect x="54" y="150" width="132" height="54" rx="10" fill="#ffd23f" stroke={O} strokeWidth={SW} />
      {Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={62 + i * 20} y="150" width="10" height="54" fill="#ff9f43" opacity="0.8" />
      ))}
      <rect x="54" y="150" width="132" height="54" rx="10" fill="none" stroke={O} strokeWidth={SW} />
      <rect x="46" y="146" width="148" height="12" rx="6" fill="#ff5fa2" stroke={O} strokeWidth={SW} />
      <rect x="92" y="166" width="56" height="26" rx="8" fill="#fff" stroke={O} strokeWidth="2.5" />
      <text x="120" y="186" textAnchor="middle" fontSize="18" className="art-text" fill="#9b5de5">
        ?
      </text>
      <circle cx="76" cy="210" r="11" fill="#9b5de5" stroke={O} strokeWidth={SW} />
      <circle cx="164" cy="210" r="11" fill="#9b5de5" stroke={O} strokeWidth={SW} />
      <circle cx="76" cy="210" r="4" fill="#ffd23f" />
      <circle cx="164" cy="210" r="4" fill="#ffd23f" />
    </Frame>
  )
}
