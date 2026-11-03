/**
 * Декоративни елементи на парка: пейки, фенери, огради, лехи, фонтан,
 * далечни планини и дървета. Всички са чист SVG в общия стил.
 * Параметърът s (мащаб) се използва за перспектива — по-далеч = по-малко.
 */
import { OUTLINE as O } from '../art/Attractions'

export function ParkDefs() {
  return (
    <defs>
      <linearGradient id="pp-wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e5a465" />
        <stop offset="1" stopColor="#b8733f" />
      </linearGradient>
      <linearGradient id="pp-stone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f3ecff" />
        <stop offset="1" stopColor="#c9bde6" />
      </linearGradient>
      <radialGradient id="pp-lamp-glow">
        <stop offset="0" stopColor="#fff6a8" stopOpacity="0.9" />
        <stop offset="1" stopColor="#fff6a8" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="pp-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#b5f4fa" />
        <stop offset="1" stopColor="#4fc9e0" />
      </linearGradient>
      <linearGradient id="pp-mountain" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#e3d9ff" />
        <stop offset="1" stopColor="#c7b4ff" />
      </linearGradient>
      <radialGradient id="pp-sunglow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff8c4" stopOpacity="0.9" />
        <stop offset="0.5" stopColor="#fff3a0" stopOpacity="0.35" />
        <stop offset="1" stopColor="#fff3a0" stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

/** Мека светлина около слънцето. */
export function SunGlow({ x, y, r = 360 }: { x: number; y: number; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill="url(#pp-sunglow)" />
}

/** Далечни планини с бели върхове (най-задният план). */
export function FarMountains({ w, base, height = 150 }: { w: number; base: number; height?: number }) {
  const k = height / 150
  const peaks = Math.max(4, Math.round(w / 320))
  const step = w / peaks
  let d = `M0 ${base}`
  const caps: string[] = []
  for (let i = 0; i < peaks; i++) {
    const x0 = i * step
    const top = base - height - ((i * 53) % 70) * k
    const px = x0 + step * 0.5
    d += ` L${px} ${top} L${x0 + step} ${base}`
    caps.push(`M${px - 30 * k} ${top + 36 * k} L${px} ${top} L${px + 30 * k} ${top + 36 * k} q${-10 * k} ${-6 * k} ${-15 * k} ${4 * k} q${-8 * k} ${-10 * k} ${-15 * k} 0 q${-6 * k} ${-10 * k} ${-15 * k} ${-4 * k}z`)
  }
  d += ` V${base + 40} H0 Z`
  return (
    <g opacity="0.85">
      <path d={d} fill="url(#pp-mountain)" stroke="#a68cf0" strokeWidth="3" strokeLinejoin="round" />
      {caps.map((c, i) => (
        <path key={i} d={c} fill="#fff" opacity="0.9" />
      ))}
    </g>
  )
}

/** Редица далечни дървета — среден план, приглушени цветове. */
export function DistantTrees({ w, y, color = '#5cbf7a', s = 1 }: { w: number; y: number; color?: string; s?: number }) {
  const n = Math.ceil(w / (46 * s))
  return (
    <g opacity="0.9">
      {Array.from({ length: n }, (_, i) => {
        const x = i * 46 * s + ((i * 17) % 20)
        const r = (20 + ((i * 7) % 12)) * s
        return (
          <g key={i}>
            <rect x={x - 3 * s} y={y - 6 * s} width={6 * s} height={14 * s} fill="#9a6a45" />
            <circle cx={x} cy={y - r} r={r} fill={color} stroke={O} strokeOpacity="0.25" strokeWidth="2" />
            <circle cx={x - r * 0.35} cy={y - r * 1.3} r={r * 0.25} fill="#fff" opacity="0.18" />
          </g>
        )
      })}
    </g>
  )
}

/** Декоративна ограда с колчета между x1 и x2. */
export function Fence({ x1, x2, y, s = 1, color = '#fff' }: { x1: number; x2: number; y: number; s?: number; color?: string }) {
  const gap = 22 * s
  const n = Math.floor((x2 - x1) / gap)
  const h = 34 * s
  return (
    <g>
      <rect x={x1} y={y - h * 0.72} width={x2 - x1} height={5 * s} rx={2 * s} fill={color} stroke={O} strokeWidth={2 * s} />
      <rect x={x1} y={y - h * 0.36} width={x2 - x1} height={5 * s} rx={2 * s} fill={color} stroke={O} strokeWidth={2 * s} />
      {Array.from({ length: n + 1 }, (_, i) => {
        const x = x1 + i * gap
        return (
          <path
            key={i}
            d={`M${x - 4 * s} ${y} V${y - h + 5 * s} L${x} ${y - h} L${x + 4 * s} ${y - h + 5 * s} V${y} Z`}
            fill={i % 4 === 0 ? '#ff8cc0' : color}
            stroke={O}
            strokeWidth={2 * s}
            strokeLinejoin="round"
          />
        )
      })}
    </g>
  )
}

/** Фенер с топла светлина. Основата на стълба е (x, y). */
export function Lamp({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="14" ry="4" fill={O} opacity="0.15" />
      <circle cx="0" cy="-92" r="34" fill="url(#pp-lamp-glow)" className="lamp-glow" />
      <rect x="-3" y="-80" width="6" height="80" rx="3" fill="#5e2fb0" stroke={O} strokeWidth="2" />
      <rect x="-9" y="-6" width="18" height="8" rx="3" fill="#7d45d0" stroke={O} strokeWidth="2" />
      <path d="M-11 -82 h22 l-4 -18 h-14 z" fill="#fff6a8" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M-13 -100 h26 l-13 -10 z" fill="#9b5de5" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="0" cy="-112" r="3" fill="#ffd23f" stroke={O} strokeWidth="1.5" />
    </g>
  )
}

/** Дървена пейка. Средата на основата е (x, y). */
export function Bench({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx="0" cy="2" rx="42" ry="6" fill={O} opacity="0.15" />
      <path d="M-32 0 v-18 M32 0 v-18 M-28 -18 v-26 M28 -18 v-26" stroke={O} strokeWidth="5" strokeLinecap="round" />
      <rect x="-38" y="-24" width="76" height="9" rx="3" fill="url(#pp-wood)" stroke={O} strokeWidth="2.5" />
      <rect x="-36" y="-48" width="72" height="8" rx="3" fill="url(#pp-wood)" stroke={O} strokeWidth="2.5" />
      <rect x="-36" y="-37" width="72" height="8" rx="3" fill="url(#pp-wood)" stroke={O} strokeWidth="2.5" />
    </g>
  )
}

/** Кръгла леха с цветя. Центърът е (x, y). */
export function FlowerBed({ x, y, s = 1, rx = 70, palette = ['#ff5fa2', '#ffd23f', '#9b5de5', '#ff9f43'] }: { x: number; y: number; s?: number; rx?: number; palette?: string[] }) {
  const ry = rx * 0.34
  const flowers = Math.round(rx / 9)
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="6" rx={rx + 6} ry={ry + 6} fill={O} opacity="0.12" />
      <ellipse cx="0" cy="0" rx={rx + 4} ry={ry + 4} fill="url(#pp-stone)" stroke={O} strokeWidth="3" />
      <ellipse cx="0" cy="-3" rx={rx - 4} ry={ry - 4} fill="#8a5a3c" />
      {Array.from({ length: flowers }, (_, i) => {
        const a = (i / flowers) * Math.PI * 2
        const fx = Math.cos(a) * (rx - 18) * (i % 2 ? 0.55 : 0.9)
        const fy = Math.sin(a) * (ry - 8) * (i % 2 ? 0.55 : 0.9) - 6
        const c = palette[i % palette.length]
        return (
          <g key={i} transform={`translate(${fx.toFixed(1)} ${fy.toFixed(1)})`}>
            <path d="M0 4 V-8" stroke="#3a9e44" strokeWidth="3" strokeLinecap="round" />
            <circle cx="-5" cy="-8" r="4" fill="#58c46a" />
            {[0, 72, 144, 216, 288].map((d) => (
              <circle key={d} cx={5 * Math.cos((d * Math.PI) / 180)} cy={-12 + 5 * Math.sin((d * Math.PI) / 180)} r="4.2" fill={c} stroke={O} strokeWidth="1.2" />
            ))}
            <circle cx="0" cy="-12" r="3" fill="#fff6a8" stroke={O} strokeWidth="1" />
          </g>
        )
      })}
    </g>
  )
}

/** Фонтан с плавно пулсираща вода. Центърът на басейна е (x, y). */
export function Fountain({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="10" rx="82" ry="24" fill={O} opacity="0.14" />
      <ellipse cx="0" cy="0" rx="76" ry="24" fill="url(#pp-stone)" stroke={O} strokeWidth="3" />
      <ellipse cx="0" cy="-4" rx="64" ry="17" fill="url(#pp-water)" stroke={O} strokeWidth="2" />
      <ellipse cx="-18" cy="-8" rx="18" ry="4" fill="#fff" opacity="0.6" />
      <rect x="-9" y="-46" width="18" height="40" rx="6" fill="url(#pp-stone)" stroke={O} strokeWidth="2.5" />
      <ellipse cx="0" cy="-46" rx="28" ry="8" fill="url(#pp-stone)" stroke={O} strokeWidth="2.5" />
      <ellipse cx="0" cy="-48" rx="22" ry="5" fill="url(#pp-water)" />
      <g className="fountain-water">
        <path d="M0 -50 C -4 -80 -26 -84 -34 -60" fill="none" stroke="#7fe3f0" strokeWidth="5" strokeLinecap="round" />
        <path d="M0 -50 C 4 -80 26 -84 34 -60" fill="none" stroke="#7fe3f0" strokeWidth="5" strokeLinecap="round" />
        <path d="M0 -50 V-86" stroke="#b5f4fa" strokeWidth="6" strokeLinecap="round" />
        <circle cx="0" cy="-92" r="5" fill="#b5f4fa" />
      </g>
      {[-36, 0, 36].map((dx) => (
        <circle key={dx} className="fountain-drop" style={{ animationDelay: `${(dx + 36) / 60}s` }} cx={dx} cy="-12" r="3" fill="#fff" opacity="0.8" />
      ))}
    </g>
  )
}

/** Малък храст за преден план. */
export function SmallBush({ x, y, s = 1, color = '#58c46a' }: { x: number; y: number; s?: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="40" ry="7" fill={O} opacity="0.15" />
      <path d="M-38 0 a18 18 0 0 1 10 -26 a22 22 0 0 1 38 -6 a19 19 0 0 1 30 20 a11 11 0 0 1 -2 12 z" fill={color} stroke={O} strokeWidth="3" strokeLinejoin="round" />
      <path d="M-22 -22 a14 14 0 0 1 18 -6" fill="none" stroke="#b8f5a8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="-6" cy="-14" r="4" fill="#ff5fa2" stroke={O} strokeWidth="1.5" />
      <circle cx="16" cy="-10" r="4" fill="#ffd23f" stroke={O} strokeWidth="1.5" />
    </g>
  )
}
