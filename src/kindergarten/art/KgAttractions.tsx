/**
 * Петте атракции на приказния парк — оригинални SVG илюстрации в поле 240×240.
 * Обща визуална идентичност с училищния парк (очертания, обем, светлини), но по-мека пастелна гама.
 */
import type { ReactNode } from 'react'
import type { KgAttractionId } from '../curriculum/types'

const O = '#4a3560'
const SW = 3

export interface KgArtProps {
  x?: number
  y?: number
  size?: number
  className?: string
}

function Frame({ x, y, size = 240, className, children, label }: KgArtProps & { children: ReactNode; label: string }) {
  return (
    <svg x={x} y={y} width={size} height={size} viewBox="0 0 240 240" className={`kg-art ${className ?? ''}`} role="img" aria-label={label} overflow="visible">
      {children}
    </svg>
  )
}

const Shadow = ({ rx = 84, cy = 226 }: { rx?: number; cy?: number }) => <ellipse cx="120" cy={cy} rx={rx} ry="10" fill={O} opacity="0.16" />

function Pennant({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 24} stroke={O} strokeWidth={SW} strokeLinecap="round" />
      <path className="flag-wave" d={`M${x} ${y} q 12 -3 22 3 q -5 5 0 11 q -10 -6 -22 -2 z`} fill={color} stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
    </g>
  )
}

function Lights({ points }: { points: [number, number][] }) {
  return (
    <g>
      {points.map(([cx, cy], i) => (
        <circle key={i} className="bulb" cx={cx} cy={cy} r="3.4" fill="#fffbd0" stroke={O} strokeWidth="1.4" style={{ animationDelay: `${(i % 4) * 0.15}s` }} />
      ))}
    </g>
  )
}

/** Конче за въртележката (страничен изглед). */
function Pony({ x, y, s = 1, color, mane }: { x: number; y: number; s?: number; color: string; mane: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-22 6 C -24 -6 -10 -12 4 -10 L 12 -22 C 16 -30 28 -30 30 -20 C 32 -12 26 -6 20 -4 L 18 8 C 14 16 -16 18 -22 6 Z" fill={color} stroke={O} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M12 -22 C 6 -26 2 -18 6 -12 C 0 -14 -2 -6 4 -4" fill={mane} stroke={O} strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="24" cy="-20" r="2" fill={O} />
      <path d="M-14 14 L -16 26 M -2 16 L -2 28 M 10 14 L 12 26" stroke={O} strokeWidth="3" strokeLinecap="round" />
      <path d="M-24 2 C -32 4 -34 12 -30 18" fill="none" stroke={mane} strokeWidth="5" strokeLinecap="round" />
      <rect x="-8" y="-12" width="14" height="8" rx="3" fill="#ffd25e" stroke={O} strokeWidth="2" />
    </g>
  )
}

// ───────────── 1. Вълшебната въртележка ─────────────
export function CarouselArt(p: KgArtProps) {
  const scallop = Array.from({ length: 9 }, (_, i) => i)
  return (
    <Frame {...p} label="Вълшебната въртележка">
      <defs>
        <linearGradient id="kga-car-roof" x1="0" x2="1">
          <stop offset="0" stopColor="#ffc2d8" />
          <stop offset="1" stopColor="#ff8fbb" />
        </linearGradient>
        <linearGradient id="kga-car-base" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c8b6ff" />
          <stop offset="1" stopColor="#9a82f0" />
        </linearGradient>
      </defs>
      <Shadow rx={92} />
      {/* платформа */}
      <ellipse cx="120" cy="204" rx="96" ry="20" fill="url(#kga-car-base)" stroke={O} strokeWidth={SW} />
      <path d="M24 204 v 10 c 0 12 192 12 192 0 v -10" fill="#8a70e0" stroke={O} strokeWidth={SW} />
      <Lights points={[40, 64, 88, 112, 136, 160, 184, 200].map((x) => [x, 214 - Math.abs(120 - x) * 0.04] as [number, number])} />
      {/* стълбове */}
      {[52, 92, 148, 188].map((x, i) => (
        <g key={x}>
          <line x1={x} y1="96" x2={x} y2={196 + (i === 0 || i === 3 ? -4 : 2)} stroke="#e6b84a" strokeWidth="5" strokeLinecap="round" />
          <line x1={x} y1="96" x2={x} y2="196" stroke="#fff3c0" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
        </g>
      ))}
      <rect x="112" y="90" width="16" height="110" rx="6" fill="#ffe08a" stroke={O} strokeWidth={SW} />
      <Pony x={60} y={150} s={0.95} color="#fff7f0" mane="#ff9ec4" />
      <Pony x={176} y={160} s={0.95} color="#fff1c9" mane="#8fd3ff" />
      <Pony x={120} y={168} s={1.1} color="#e9fff3" mane="#b9a3ff" />
      {/* покрив */}
      <path d="M120 22 L 222 92 L 18 92 Z" fill="url(#kga-car-roof)" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path key={i} d={`M120 22 L ${30 + i * 36} 92 L ${48 + i * 36} 92 Z`} fill="#fff6fa" opacity="0.75" />
      ))}
      <path d="M18 92 H 222" stroke={O} strokeWidth={SW} />
      {scallop.map((i) => (
        <path key={i} d={`M${18 + i * 22.6} 92 q 11.3 16 22.6 0`} fill={i % 2 ? '#ff8fbb' : '#fff2b3'} stroke={O} strokeWidth="2.6" />
      ))}
      <Lights points={[30, 54, 78, 102, 126, 150, 174, 198, 214].map((x) => [x, 92] as [number, number])} />
      {/* звезда на върха */}
      <path d="M120 2 l 5 10 11 1.5 -8 7.5 2 11 -10 -5.5 -10 5.5 2 -11 -8 -7.5 11 -1.5 z" fill="#ffd25e" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
    </Frame>
  )
}

// ───────────── 2. Кулата на великаните ─────────────
export function GiantsTowerArt(p: KgArtProps) {
  return (
    <Frame {...p} label="Кулата на великаните">
      <defs>
        <linearGradient id="kga-gt-stone" x1="0" x2="1">
          <stop offset="0" stopColor="#e6dcff" />
          <stop offset="0.6" stopColor="#c9b8f5" />
          <stop offset="1" stopColor="#a690e2" />
        </linearGradient>
        <linearGradient id="kga-gt-roof" x1="0" x2="1">
          <stop offset="0" stopColor="#9be7ff" />
          <stop offset="1" stopColor="#5cbde8" />
        </linearGradient>
      </defs>
      <Shadow rx={78} />
      {/* кула */}
      <path d="M78 214 L 86 70 L 154 70 L 166 214 Z" fill="url(#kga-gt-stone)" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      {[
        [92, 96, 22],
        [124, 90, 26],
        [88, 132, 26],
        [124, 128, 30],
        [96, 168, 20],
        [140, 172, 18],
      ].map(([x, y, w], i) => (
        <rect key={i} x={x} y={y} width={w} height="12" rx="5" fill="#f4eeff" stroke={O} strokeWidth="1.6" opacity="0.7" />
      ))}
      {/* линийка за измерване */}
      <rect x="160" y="84" width="14" height="128" rx="4" fill="#fff3b0" stroke={O} strokeWidth="2.4" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1="160" y1={96 + i * 13} x2={i % 2 ? 166 : 170} y2={96 + i * 13} stroke={O} strokeWidth="2" />
      ))}
      {/* покрив */}
      <path d="M72 74 L 120 14 L 168 74 Z" fill="url(#kga-gt-roof)" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M120 14 L 104 74 M120 14 L 136 74" stroke="#d8f6ff" strokeWidth="3" opacity="0.8" />
      <Pennant x={120} y={-8} color="#ff9ec4" />
      {/* голям и малък прозорец */}
      <rect x="96" y="104" width="30" height="40" rx="15" fill="#ffe9a8" stroke={O} strokeWidth={SW} />
      <path d="M111 104 v 40 M96 124 h 30" stroke={O} strokeWidth="2" />
      <rect x="134" y="112" width="14" height="18" rx="7" fill="#ffe9a8" stroke={O} strokeWidth="2.4" />
      {/* голяма врата */}
      <path d="M96 214 V 178 C 96 158 144 158 144 178 V 214 Z" fill="#b07a4a" stroke={O} strokeWidth={SW} />
      <path d="M120 162 V 214" stroke={O} strokeWidth="2.2" />
      <circle cx="132" cy="192" r="3" fill="#ffd25e" stroke={O} strokeWidth="1.5" />
      {/* голям ботуш на великана и малко ботушче */}
      <g transform="translate(26 176)">
        <path d="M14 0 H 40 V 22 C 52 22 64 28 64 38 H 6 C 6 26 10 18 14 14 Z" fill="#ff9e6b" stroke={O} strokeWidth="2.8" strokeLinejoin="round" />
        <rect x="10" y="-6" width="34" height="10" rx="4" fill="#ffd25e" stroke={O} strokeWidth="2.4" />
      </g>
      <g transform="translate(180 200)">
        <path d="M6 0 H 18 V 10 C 24 10 30 12 30 18 H 2 C 2 12 4 8 6 6 Z" fill="#8fd3ff" stroke={O} strokeWidth="2.4" strokeLinejoin="round" />
      </g>
    </Frame>
  )
}

// ───────────── 3. Приказният лабиринт ─────────────
export function LabyrinthArt(p: KgArtProps) {
  const hedge = (d: string, k: string) => <path key={k} d={d} fill="#7fd08f" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
  return (
    <Frame {...p} label="Приказният лабиринт">
      <defs>
        <linearGradient id="kga-lab-ground" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#d6f5d8" />
          <stop offset="1" stopColor="#a8e3b0" />
        </linearGradient>
      </defs>
      <Shadow rx={100} />
      {/* основа в перспектива */}
      <path d="M20 206 L 54 108 H 186 L 220 206 Z" fill="url(#kga-lab-ground)" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      {/* пътечка */}
      <path d="M108 206 C 108 180 150 176 150 156 C 150 140 100 140 100 124 C 100 116 116 112 120 108" fill="none" stroke="#ffe9b8" strokeWidth="14" strokeLinecap="round" />
      <path d="M108 206 C 108 180 150 176 150 156 C 150 140 100 140 100 124 C 100 116 116 112 120 108" fill="none" stroke="#e9c27a" strokeWidth="2.4" strokeDasharray="4 8" strokeLinecap="round" />
      {/* жив плет */}
      {hedge('M40 172 L 50 142 H 84 V 156 H 64 L 58 172 Z', 'a')}
      {hedge('M128 186 H 196 L 192 172 H 132 Z', 'b')}
      {hedge('M60 126 H 92 V 136 H 58 Z', 'c')}
      {hedge('M120 126 H 176 L 180 138 H 124 Z', 'd')}
      {hedge('M166 156 H 206 L 202 144 H 168 Z', 'e')}
      {[
        [56, 146],
        [74, 148],
        [146, 176],
        [176, 176],
        [140, 130],
        [164, 130],
        [184, 148],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#ff9ec4" stroke={O} strokeWidth="1.2" />
      ))}
      {/* арка-вход */}
      <path d="M72 108 V 60 C 72 22 168 22 168 60 V 108 H 150 V 64 C 150 42 90 42 90 64 V 108 Z" fill="#7fd08f" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <path d="M78 60 C 80 34 160 34 162 60" fill="none" stroke="#b9f0c2" strokeWidth="5" strokeLinecap="round" />
      {[
        [84, 46, '#ff9ec4'],
        [104, 32, '#ffd25e'],
        [136, 32, '#b9a3ff'],
        [156, 46, '#8fd3ff'],
        [120, 28, '#ff9ec4'],
      ].map(([x, y, c], i) => (
        <g key={i}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx={+x + 5 * Math.cos((a * Math.PI) / 180)} cy={+y + 5 * Math.sin((a * Math.PI) / 180)} rx="4" ry="4" fill={c as string} stroke={O} strokeWidth="1" />
          ))}
          <circle cx={x as number} cy={y as number} r="3" fill="#fff6c0" />
        </g>
      ))}
      {/* зайче наднича */}
      <g transform="translate(176 92)">
        <ellipse cx="-6" cy="-22" rx="5" ry="14" fill="#fff" stroke={O} strokeWidth="2.4" />
        <ellipse cx="8" cy="-22" rx="5" ry="14" fill="#fff" stroke={O} strokeWidth="2.4" />
        <ellipse cx="-6" cy="-22" rx="2" ry="9" fill="#ffc2d8" />
        <ellipse cx="8" cy="-22" rx="2" ry="9" fill="#ffc2d8" />
        <circle cx="1" cy="0" r="14" fill="#fff" stroke={O} strokeWidth="2.6" />
        <circle cx="-4" cy="-2" r="2" fill={O} />
        <circle cx="6" cy="-2" r="2" fill={O} />
        <ellipse cx="1" cy="4" rx="2.4" ry="1.6" fill="#ff8fa3" />
      </g>
    </Frame>
  )
}

// ───────────── 4. Часовникът на чудесата ─────────────
export function WonderClockArt(p: KgArtProps) {
  return (
    <Frame {...p} label="Часовникът на чудесата">
      <defs>
        <linearGradient id="kga-clk-wall" x1="0" x2="1">
          <stop offset="0" stopColor="#ffe7b0" />
          <stop offset="1" stopColor="#ffc96b" />
        </linearGradient>
        <linearGradient id="kga-clk-day" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#bfeaff" />
          <stop offset="1" stopColor="#e9f8ff" />
        </linearGradient>
        <linearGradient id="kga-clk-night" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6e5cc7" />
          <stop offset="1" stopColor="#9b8ae6" />
        </linearGradient>
      </defs>
      <Shadow rx={74} />
      {/* къщичка */}
      <path d="M58 214 V 96 H 182 V 214 Z" fill="url(#kga-clk-wall)" stroke={O} strokeWidth={SW} />
      <path d="M46 100 L 120 30 L 194 100 Z" fill="#ff9ec4" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${62 + i * 32} 96 q 16 -12 32 0`} fill="none" stroke="#ffd1e3" strokeWidth="4" strokeLinecap="round" />
      ))}
      {/* кукувичка */}
      <rect x="106" y="54" width="28" height="26" rx="6" fill="#fff6dd" stroke={O} strokeWidth="2.4" />
      <g className="kg-cuckoo">
        <circle cx="120" cy="66" r="8" fill="#8fd3ff" stroke={O} strokeWidth="2" />
        <path d="M127 66 l 7 -2 -7 4 z" fill="#ffb03a" stroke={O} strokeWidth="1.4" />
        <circle cx="122" cy="64" r="1.6" fill={O} />
      </g>
      {/* циферблат: ден и нощ */}
      <circle cx="120" cy="138" r="44" fill="#fff" stroke={O} strokeWidth={SW} />
      <path d="M120 98 A 40 40 0 0 1 120 178 Z" fill="url(#kga-clk-night)" />
      <path d="M120 98 A 40 40 0 0 0 120 178 Z" fill="url(#kga-clk-day)" />
      <circle cx="100" cy="124" r="9" fill="#ffd25e" stroke={O} strokeWidth="1.6" />
      <path d="M144 118 a 9 9 0 1 0 6 14 a 7 7 0 1 1 -6 -14 z" fill="#fff6c0" stroke={O} strokeWidth="1.6" />
      {[
        [138, 150],
        [150, 146],
        [132, 162],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.8" fill="#fff6c0" />
      ))}
      <circle cx="120" cy="138" r="40" fill="none" stroke={O} strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6
        return <circle key={i} cx={120 + 34 * Math.sin(a)} cy={138 - 34 * Math.cos(a)} r={i % 3 ? 1.6 : 3} fill={O} />
      })}
      <line x1="120" y1="138" x2="120" y2="112" stroke={O} strokeWidth="4" strokeLinecap="round" className="kg-clock-hand" />
      <line x1="120" y1="138" x2="138" y2="146" stroke={O} strokeWidth="4" strokeLinecap="round" />
      <circle cx="120" cy="138" r="4.5" fill="#ff9ec4" stroke={O} strokeWidth="1.6" />
      {/* махало */}
      <g className="kg-pendulum">
        <line x1="120" y1="182" x2="120" y2="200" stroke={O} strokeWidth="2.6" />
        <circle cx="120" cy="204" r="8" fill="#ffd25e" stroke={O} strokeWidth="2.4" />
      </g>
      {/* цветя */}
      {[64, 176].map((x) => (
        <g key={x}>
          <path d={`M${x} 214 v -18`} stroke="#4fae5a" strokeWidth="3" />
          <circle cx={x} cy="192" r="7" fill={x < 120 ? '#ff9ec4' : '#b9a3ff'} stroke={O} strokeWidth="1.8" />
          <circle cx={x} cy="192" r="2.6" fill="#fff3a0" />
        </g>
      ))}
    </Frame>
  )
}

// ───────────── 5. Градът на фигурите ─────────────
export function ShapeTownArt(p: KgArtProps) {
  return (
    <Frame {...p} label="Градът на фигурите">
      <Shadow rx={100} />
      <path d="M14 214 H 226" stroke={O} strokeWidth={SW} strokeLinecap="round" />
      {/* квадратна къща с триъгълен покрив */}
      <rect x="22" y="132" width="66" height="82" fill="#fff0b3" stroke={O} strokeWidth={SW} />
      <path d="M14 136 L 55 88 L 96 136 Z" fill="#ff9e6b" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      <rect x="34" y="148" width="18" height="18" fill="#8fd3ff" stroke={O} strokeWidth="2.4" />
      <rect x="60" y="176" width="18" height="38" rx="2" fill="#c98a5a" stroke={O} strokeWidth="2.4" />
      {/* кръгла кула с кръгли прозорци */}
      <rect x="96" y="70" width="52" height="144" rx="26" fill="#d6c8ff" stroke={O} strokeWidth={SW} />
      <path d="M92 82 L 122 26 L 152 82 Z" fill="#ff9ec4" stroke={O} strokeWidth={SW} strokeLinejoin="round" />
      {[104, 138, 172].map((y) => (
        <circle key={y} cx="122" cy={y} r="11" fill="#fff6c0" stroke={O} strokeWidth="2.4" />
      ))}
      <Pennant x={122} y={6} color="#8fd3ff" />
      {/* правоъгълна къща */}
      <rect x="156" y="120" width="66" height="94" fill="#b8f0c8" stroke={O} strokeWidth={SW} />
      <rect x="150" y="108" width="78" height="16" rx="4" fill="#5cbde8" stroke={O} strokeWidth={SW} />
      {[
        [166, 136],
        [196, 136],
        [166, 168],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="20" height="24" rx="3" fill="#fff6c0" stroke={O} strokeWidth="2.4" />
      ))}
      <path d="M198 214 V 182 C 198 172 216 172 216 182 V 214 Z" fill="#c98a5a" stroke={O} strokeWidth="2.4" />
      {/* малки фигури по тревата */}
      <circle cx="34" cy="224" r="6" fill="#ff9ec4" stroke={O} strokeWidth="1.8" />
      <rect x="196" y="218" width="12" height="12" fill="#ffd25e" stroke={O} strokeWidth="1.8" />
      <path d="M100 230 l 8 -14 8 14 z" fill="#8fd3ff" stroke={O} strokeWidth="1.8" strokeLinejoin="round" />
    </Frame>
  )
}

export const KG_ATTRACTION_ART: Record<KgAttractionId, (p: KgArtProps) => ReactNode> = {
  carousel: CarouselArt,
  'giants-tower': GiantsTowerArt,
  labyrinth: LabyrinthArt,
  'wonder-clock': WonderClockArt,
  'shape-town': ShapeTownArt,
}
