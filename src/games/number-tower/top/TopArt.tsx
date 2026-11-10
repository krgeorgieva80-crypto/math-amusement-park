/**
 * „Върхът на кулата“ — илюстрации: висока приказна кула с три зали и златен връх; магически ключ.
 * Само рисунка (SVG), без логика.
 */
import { OUTLINE as O } from '../../../components/art/Attractions'

export type HallState = 'locked' | 'current' | 'done'

/** Височината на кулата (единици на viewBox) и средите на частите — за „камерата“. */
export const TOWER_VB = { w: 600, h: 2000 }
export const FOCUS_Y = { base: 1700, halls: [1355, 955, 570], top: 220 }

const Bulbs = ({ x, y, w, n }: { x: number; y: number; w: number; n: number }) => (
  <>
    {Array.from({ length: n }, (_, k) => (
      <circle key={k} className="bulb" style={{ animationDelay: `${(k % 3) * 0.3}s` }} cx={x + (k * w) / (n - 1)} cy={y} r="6" fill="#fff6a8" stroke={O} strokeWidth="2" />
    ))}
  </>
)

/** Заключено / отворено катинарче или ключ върху вратата на залата. */
function HallBadge({ state, x, y }: { state: HallState; x: number; y: number }) {
  if (state === 'done')
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r="34" fill="#ffd23f" stroke={O} strokeWidth="5" />
        <path d="M-14 4 a10 10 0 1 1 0.1 0 M-4 4 H18 M10 4 v8 M16 4 v6" fill="none" stroke={O} strokeWidth="5" strokeLinecap="round" />
      </g>
    )
  if (state === 'locked')
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r="34" fill="#cbb9ff" stroke={O} strokeWidth="5" />
        <path d="M-10 -2 V-10 a10 10 0 0 1 20 0 V-2" fill="none" stroke={O} strokeWidth="5" />
        <rect x="-15" y="-3" width="30" height="22" rx="5" fill="#9b5de5" stroke={O} strokeWidth="4" />
      </g>
    )
  return (
    <g transform={`translate(${x} ${y})`} className="tt-badge-now">
      <circle r="34" fill="#fff6a8" stroke={O} strokeWidth="5" />
      <path d="M0 -18 l5 11 12 1.5 -9 8 2.5 12 -10.5 -6 -10.5 6 2.5 -12 -9 -8 12 -1.5z" fill="#ffd23f" stroke={O} strokeWidth="3" />
    </g>
  )
}

/** Прозорецът на зала 1: каменна стълба. */
const StairsWindow = () => (
  <g>
    <rect x="-150" y="-120" width="300" height="230" rx="20" fill="#7e5bd6" />
    {Array.from({ length: 6 }, (_, k) => (
      <g key={k}>
        <rect x={-130 + k * 44} y={80 - k * 34} width="52" height={34 + k * 34} fill="#cdbfa8" stroke={O} strokeWidth="4" />
        <rect x={-130 + k * 44} y={80 - k * 34} width="52" height="10" fill="#efe4cf" stroke={O} strokeWidth="3" />
      </g>
    ))}
    <path d="M100 -100 l6 12 13 2 -9 9 2 13 -12 -6 -12 6 2 -13 -9 -9 13 -2z" fill="#fff6a8" stroke={O} strokeWidth="3" />
  </g>
)
/** Прозорецът на зала 2: мост над пропаст. */
const BridgeWindow = () => (
  <g>
    <rect x="-150" y="-120" width="300" height="230" rx="20" fill="#7fd8f0" />
    <ellipse cx="-80" cy="-70" rx="40" ry="16" fill="#fff" opacity="0.9" />
    <ellipse cx="70" cy="-90" rx="34" ry="13" fill="#fff" opacity="0.9" />
    <path d="M-150 110 V20 Q-120 0 -100 30 V110 Z M150 110 V10 Q120 -6 100 30 V110 Z" fill="#8d6e63" stroke={O} strokeWidth="4" />
    {[-90, -54, -18, 18, 54].map((x, k) => (
      <rect key={x} x={x} y={k === 2 ? 42 : 30} width="34" height="16" rx="5" fill={k === 2 ? '#2ed1c4' : '#ffd23f'} stroke={O} strokeWidth="3" opacity={k === 2 ? 0.55 : 1} />
    ))}
    <path d="M-100 28 Q0 -14 100 28" fill="none" stroke="#5d4037" strokeWidth="4" strokeDasharray="8 6" />
  </g>
)
/** Прозорецът на зала 3: обсерватория с кристал и сандък. */
const ObservatoryWindow = () => (
  <g>
    <rect x="-150" y="-120" width="300" height="230" rx="20" fill="#2a1660" />
    {[
      [-110, -90],
      [-60, -60],
      [90, -95],
      [120, -40],
      [-20, -100],
    ].map(([x, y], k) => (
      <circle key={k} cx={x} cy={y} r="4" fill="#fff6a8" />
    ))}
    <path d="M-20 60 l30 -90 30 90 -30 30z" fill="#7ef2e7" stroke={O} strokeWidth="4" />
    <path d="M10 -30 V90" stroke="#fff" strokeWidth="3" opacity="0.6" />
    <rect x="-120" y="50" width="80" height="54" rx="10" fill="#ff9f43" stroke={O} strokeWidth="4" />
    <rect x="-120" y="50" width="80" height="18" rx="8" fill="#ffd23f" stroke={O} strokeWidth="4" />
    <circle cx="-80" cy="80" r="7" fill="#ffd23f" stroke={O} strokeWidth="3" />
    <path d="M60 100 L110 10 L124 18 L76 106 Z" fill="#9b5de5" stroke={O} strokeWidth="4" />
  </g>
)

const HALL_ART = [StairsWindow, BridgeWindow, ObservatoryWindow]
const HALL_COLORS: [string, string][] = [
  ['#ff8cc0', '#ffc2dc'],
  ['#2ed1c4', '#a8f5ee'],
  ['#9b5de5', '#d2b6ff'],
]
const HALL_NAMES = ['Стълбата на числата', 'Мостът на загадките', 'Обсерваторията на числата']

/** Цялата кула отвън: градина и порта, три зали, златен връх. */
export function TowerOutside({ states, topLit }: { states: [HallState, HallState, HallState]; topLit: boolean }) {
  const hallY = [1150, 760, 380]
  return (
    <svg className="tt-tower" viewBox={`0 0 ${TOWER_VB.w} ${TOWER_VB.h}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <linearGradient id="tt-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a0" />
          <stop offset="1" stopColor="#ffb400" />
        </linearGradient>
        <radialGradient id="tt-glow">
          <stop offset="0" stopColor="#fff6a8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff6a8" stopOpacity="0" />
        </radialGradient>
        <pattern id="tt-bricks" width="60" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 H60 M30 0 V20 M0 20 V40 M60 20 V40" stroke="rgba(59,42,90,0.13)" strokeWidth="3" fill="none" />
        </pattern>
      </defs>

      {/* градина */}
      <ellipse cx="300" cy="1960" rx="330" ry="70" fill="#6bd66b" stroke={O} strokeWidth="6" />
      <path d="M250 1990 Q300 1900 300 1830 Q300 1900 350 1990 Z" fill="#f4e2c0" stroke={O} strokeWidth="5" />
      {[
        [90, 1930, '#ff5fa2'],
        [140, 1955, '#ffd23f'],
        [460, 1935, '#9b5de5'],
        [510, 1960, '#ff9f43'],
      ].map(([x, y, c]) => (
        <g key={`${x}`} transform={`translate(${x} ${y})`}>
          <path d="M0 0 V24" stroke="#3e9a3e" strokeWidth="5" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={10 * Math.cos((a * Math.PI) / 180)} cy={10 * Math.sin((a * Math.PI) / 180)} r="8" fill={c as string} stroke={O} strokeWidth="2.5" />
          ))}
          <circle r="6" fill="#fff6a8" stroke={O} strokeWidth="2.5" />
        </g>
      ))}

      {/* основа с порта */}
      <rect x="90" y="1560" width="420" height="300" rx="30" fill="#ffb3d3" stroke={O} strokeWidth="8" />
      <rect x="90" y="1560" width="420" height="300" rx="30" fill="url(#tt-bricks)" />
      <path d="M220 1860 V1700 Q300 1600 380 1700 V1860 Z" fill="url(#tt-gold)" stroke={O} strokeWidth="7" />
      <path d="M300 1640 V1860" stroke={O} strokeWidth="5" />
      <circle cx="285" cy="1770" r="8" fill={O} />
      <circle cx="315" cy="1770" r="8" fill={O} />
      {[150, 450].map((x) => (
        <g key={x}>
          <rect x={x - 14} y="1640" width="28" height="44" rx="8" fill="#fff6a8" stroke={O} strokeWidth="4" />
          <circle cx={x} cy="1662" r="30" fill="url(#tt-glow)" />
        </g>
      ))}
      <Bulbs x={110} y={1575} w={380} n={12} />

      {/* трите зали (отдолу нагоре) */}
      {[0, 1, 2].map((h) => {
        const y = hallY[h]
        const Art = HALL_ART[h]
        const [c, light] = HALL_COLORS[h]
        const st = states[h]
        return (
          <g key={h} className={`tt-hall tt-hall--${st}`}>
            <rect x="70" y={y} width="460" height="390" rx="34" fill={c} stroke={O} strokeWidth="8" />
            <rect x="70" y={y} width="460" height="390" rx="34" fill="url(#tt-bricks)" />
            <rect x="90" y={y + 14} width="420" height="26" rx="13" fill={light} opacity="0.7" />
            {/* корниз */}
            <rect x="52" y={y - 14} width="496" height="36" rx="18" fill={light} stroke={O} strokeWidth="6" />
            <Bulbs x={80} y={y + 4} w={440} n={12} />
            {/* прозорецът със сцената на залата */}
            <g transform={`translate(300 ${y + 200})`}>
              <Art />
              <rect x="-150" y="-120" width="300" height="230" rx="20" fill={st === 'locked' ? 'rgba(42,22,96,0.45)' : 'none'} stroke={O} strokeWidth="7" />
            </g>
            {/* табела с името */}
            <g transform={`translate(300 ${y + 352})`}>
              <rect x="-160" y="-24" width="320" height="44" rx="14" fill="#fffaf0" stroke={O} strokeWidth="5" />
              <text x="0" y="9" textAnchor="middle" className="art-text" fontSize="26" fill={O}>
                {HALL_NAMES[h]}
              </text>
            </g>
            <HallBadge state={st} x={505} y={y + 60} />
          </g>
        )
      })}

      {/* златният връх */}
      <g className={`tt-top ${topLit ? 'is-lit' : ''}`}>
        <circle cx="300" cy="170" r="190" fill="url(#tt-glow)" className="tt-top__glow" />
        <path d="M90 380 Q300 120 510 380 Z" fill="url(#tt-gold)" stroke={O} strokeWidth="8" />
        <path d="M150 380 Q300 190 450 380" fill="none" stroke="#fff6a8" strokeWidth="6" opacity="0.7" />
        <rect x="282" y="120" width="36" height="110" rx="10" fill="url(#tt-gold)" stroke={O} strokeWidth="6" />
        <path d="M300 30 l18 38 42 6 -30 29 7 41 -37 -19 -37 19 7 -41 -30 -29 42 -6z" fill={topLit ? '#ffd23f' : '#d6c6ff'} stroke={O} strokeWidth="6" className="tt-top__star" />
        <Bulbs x={110} y={378} w={380} n={13} />
      </g>
    </svg>
  )
}

/** Магически ключ (златен или тъмен — още неполучен). */
export function MagicKey({ size = 64, got = true }: { size?: number; got?: boolean }) {
  return (
    <svg viewBox="0 0 120 60" width={size} height={size / 2} aria-hidden="true" className={`tt-key ${got ? 'is-got' : ''}`}>
      <circle cx="24" cy="30" r="18" fill={got ? 'url(#tt-key-gold)' : '#cbb9ff'} stroke={O} strokeWidth="5" />
      <circle cx="24" cy="30" r="7" fill="#fffaf0" stroke={O} strokeWidth="4" />
      <rect x="40" y="25" width="70" height="11" rx="5" fill={got ? '#ffc928' : '#cbb9ff'} stroke={O} strokeWidth="4" />
      <rect x="86" y="34" width="9" height="15" rx="3" fill={got ? '#ffc928' : '#cbb9ff'} stroke={O} strokeWidth="4" />
      <rect x="100" y="34" width="9" height="11" rx="3" fill={got ? '#ffc928' : '#cbb9ff'} stroke={O} strokeWidth="4" />
      <defs>
        <linearGradient id="tt-key-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3a0" />
          <stop offset="1" stopColor="#ffb400" />
        </linearGradient>
      </defs>
    </svg>
  )
}
