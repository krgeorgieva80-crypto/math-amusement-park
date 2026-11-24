/**
 * „Зайчето в лабиринта“ — оригинални SVG илюстрации (без растерни изображения).
 * Всеки елемент е нарисуван около точка (0, 0) — долу в средата — и се поставя с translate/scale.
 * Стил: меки пастелни тонове, плътен тъмнолилав контур, обем с градиенти, както останалите приказни герои.
 */
import type { ReactNode } from 'react'
import type { Gift, Treasure } from './logic'

const O = '#4a3560'

/** Общи градиенти за сцените (веднъж на SVG). */
export function MazeDefs() {
  return (
    <defs>
      <radialGradient id="mz-fur" cx="0.4" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.7" stopColor="#f6efe6" />
        <stop offset="1" stopColor="#e4d6c6" />
      </radialGradient>
      <linearGradient id="mz-hedge" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#8ee08a" />
        <stop offset="1" stopColor="#4fae5a" />
      </linearGradient>
      <linearGradient id="mz-path" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff2d2" />
        <stop offset="1" stopColor="#f3d79e" />
      </linearGradient>
      <linearGradient id="mz-water" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#9fdcff" />
        <stop offset="1" stopColor="#6cc3f2" />
      </linearGradient>
      <radialGradient id="mz-stone" cx="0.4" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#f3eef8" />
        <stop offset="1" stopColor="#b9b0c8" />
      </radialGradient>
      <radialGradient id="mz-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff7b0" stopOpacity="0.95" />
        <stop offset="1" stopColor="#fff7b0" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="mz-wood" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#e0a56c" />
        <stop offset="1" stopColor="#b9773f" />
      </linearGradient>
      <linearGradient id="mz-gold" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ffe98a" />
        <stop offset="1" stopColor="#f5b93a" />
      </linearGradient>
    </defs>
  )
}

export type BunnyMood = 'idle' | 'happy' | 'look'

/** Зайчето Скокльо: бяло, с розови уши и син шал. Височина ≈ 170, ширина ≈ 130. */
export function Bunny({ mood = 'idle', flip = false }: { mood?: BunnyMood; flip?: boolean }) {
  const happy = mood === 'happy'
  return (
    <g className={`mz-bunny is-${mood}`} transform={flip ? 'scale(-1 1)' : undefined}>
      <ellipse cx="0" cy="0" rx="52" ry="9" fill={O} opacity="0.16" />
      {/* уши */}
      <g className="mz-bunny__ears">
        <path d="M-26 -112 C -46 -150 -40 -196 -24 -200 C -8 -196 -6 -150 -12 -112 Z" fill="url(#mz-fur)" stroke={O} strokeWidth="4" strokeLinejoin="round" />
        <path d="M-24 -122 C -36 -152 -32 -184 -24 -186 C -16 -182 -16 -152 -18 -122 Z" fill="#ffc2d8" />
        <path d="M12 -112 C 10 -152 22 -192 38 -192 C 52 -186 40 -146 26 -110 Z" fill="url(#mz-fur)" stroke={O} strokeWidth="4" strokeLinejoin="round" />
        <path d="M18 -122 C 20 -150 28 -178 36 -178 C 42 -172 34 -146 26 -122 Z" fill="#ffc2d8" />
      </g>
      {/* тяло */}
      <ellipse cx="0" cy="-42" rx="44" ry="42" fill="url(#mz-fur)" stroke={O} strokeWidth="4" />
      <ellipse cx="0" cy="-34" rx="26" ry="26" fill="#fffaf4" />
      {/* опашка */}
      <circle cx="-44" cy="-26" r="14" fill="#fff" stroke={O} strokeWidth="3.5" />
      {/* крачета */}
      <ellipse cx="-24" cy="-6" rx="22" ry="11" fill="url(#mz-fur)" stroke={O} strokeWidth="3.5" />
      <ellipse cx="24" cy="-6" rx="22" ry="11" fill="url(#mz-fur)" stroke={O} strokeWidth="3.5" />
      {/* ръчички */}
      {happy ? (
        <>
          <path d="M-38 -62 C -58 -80 -62 -96 -52 -102" fill="none" stroke={O} strokeWidth="16" strokeLinecap="round" />
          <path d="M-38 -62 C -58 -80 -62 -96 -52 -102" fill="none" stroke="#f6efe6" strokeWidth="9" strokeLinecap="round" />
          <path d="M38 -62 C 58 -80 62 -96 52 -102" fill="none" stroke={O} strokeWidth="16" strokeLinecap="round" />
          <path d="M38 -62 C 58 -80 62 -96 52 -102" fill="none" stroke="#f6efe6" strokeWidth="9" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="-30" cy="-46" rx="10" ry="14" fill="url(#mz-fur)" stroke={O} strokeWidth="3.5" />
          <ellipse cx="30" cy="-46" rx="10" ry="14" fill="url(#mz-fur)" stroke={O} strokeWidth="3.5" />
        </>
      )}
      {/* шал */}
      <path d="M-34 -78 C -20 -68 20 -68 34 -78 L 34 -66 C 20 -56 -20 -56 -34 -66 Z" fill="#5fa8ff" stroke={O} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M18 -64 L 30 -36 L 16 -36 L 10 -60 Z" fill="#5fa8ff" stroke={O} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M-24 -70 H -14 M -4 -68 H 6 M 16 -70 H 26" stroke="#d7ecff" strokeWidth="4" strokeLinecap="round" />
      {/* глава */}
      <ellipse cx="0" cy="-104" rx="42" ry="36" fill="url(#mz-fur)" stroke={O} strokeWidth="4" />
      <ellipse cx="-22" cy="-94" rx="9" ry="6" fill="#ffb3c7" opacity="0.8" />
      <ellipse cx="22" cy="-94" rx="9" ry="6" fill="#ffb3c7" opacity="0.8" />
      {happy ? (
        <>
          <path d="M-22 -110 Q -14 -120 -6 -110" fill="none" stroke={O} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M6 -110 Q 14 -120 22 -110" fill="none" stroke={O} strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : (
        <g className="mz-bunny__eyes">
          <ellipse cx={mood === 'look' ? -11 : -14} cy="-110" rx="6.5" ry="8" fill={O} />
          <ellipse cx={mood === 'look' ? 17 : 14} cy="-110" rx="6.5" ry="8" fill={O} />
          <circle cx={mood === 'look' ? -9 : -12} cy="-113" r="2.4" fill="#fff" />
          <circle cx={mood === 'look' ? 19 : 16} cy="-113" r="2.4" fill="#fff" />
        </g>
      )}
      <path d="M-5 -98 Q 0 -94 5 -98 Q 0 -92 -5 -98 Z" fill="#ff8fa3" stroke={O} strokeWidth="2" strokeLinejoin="round" />
      <path d={happy ? 'M-10 -90 Q 0 -78 10 -90' : 'M-7 -89 Q 0 -84 7 -89'} fill={happy ? '#ff8fa3' : 'none'} stroke={O} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

/** Жив плет с цветчета: правоъгълник със заоблени краища (горен ляв ъгъл x, y). */
export function Hedge({ x, y, w, h, flowers = true }: { x: number; y: number; w: number; h: number; flowers?: boolean }) {
  const r = Math.min(h / 2, 50)
  const n = Math.max(1, Math.round(w / 90))
  return (
    <g className="mz-hedge">
      <rect x={x} y={y + 8} width={w} height={h} rx={r} fill="#3f9a4e" opacity="0.35" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="url(#mz-hedge)" stroke={O} strokeWidth="4" />
      {Array.from({ length: n }, (_, i) => (
        <path key={i} d={`M${x + ((i + 0.5) * w) / n - 22} ${y + h * 0.35} q 22 -18 44 0`} fill="none" stroke="#b5f0ae" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      ))}
      {flowers &&
        Array.from({ length: n }, (_, i) => (
          <circle key={`f${i}`} cx={x + ((i + 0.5) * w) / n + (i % 2 ? 16 : -12)} cy={y + h * (i % 2 ? 0.62 : 0.3)} r="7" fill={['#ff9ec4', '#ffd25e', '#b9a3ff', '#fff'][i % 4]} stroke={O} strokeWidth="2" />
        ))}
    </g>
  )
}

/** Малък храст (кръгъл). */
export function Bush({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <ellipse cx="0" cy="0" rx="62" ry="10" fill={O} opacity="0.14" />
      <path d="M-60 0 C -76 -30 -50 -62 -24 -52 C -18 -86 26 -86 30 -54 C 56 -64 78 -30 60 0 Z" fill="url(#mz-hedge)" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="-22" cy="-30" r="6" fill="#ff9ec4" stroke={O} strokeWidth="2" />
      <circle cx="18" cy="-46" r="6" fill="#fff" stroke={O} strokeWidth="2" />
      <circle cx="34" cy="-20" r="6" fill="#ffd25e" stroke={O} strokeWidth="2" />
    </g>
  )
}

export function Sun({ r = 60 }: { r?: number }) {
  return (
    <g className="mz-sun">
      <circle r={r * 2.2} fill="url(#mz-glow)" />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5
        return <line key={i} x1={Math.cos(a) * r * 1.25} y1={Math.sin(a) * r * 1.25} x2={Math.cos(a) * r * 1.6} y2={Math.sin(a) * r * 1.6} stroke="#f5c451" strokeWidth={r * 0.14} strokeLinecap="round" />
      })}
      <circle r={r} fill="#ffe489" stroke="#e7a93a" strokeWidth="5" />
      <circle cx={-r * 0.3} cy={-r * 0.1} r={r * 0.08} fill={O} />
      <circle cx={r * 0.3} cy={-r * 0.1} r={r * 0.08} fill={O} />
      <path d={`M${-r * 0.3} ${r * 0.2} Q 0 ${r * 0.45} ${r * 0.3} ${r * 0.2}`} fill="none" stroke={O} strokeWidth={r * 0.07} strokeLinecap="round" />
    </g>
  )
}

/** Хълмче с дърво (край на горната пътечка). */
export function HillTree() {
  return (
    <g>
      <path d="M-150 30 C -120 -40 120 -40 150 30 Z" fill="#a9e0a6" stroke={O} strokeWidth="4" />
      <rect x="-10" y="-120" width="20" height="110" rx="8" fill="url(#mz-wood)" stroke={O} strokeWidth="4" />
      <circle cx="0" cy="-150" r="62" fill="url(#mz-hedge)" stroke={O} strokeWidth="4" />
      <circle cx="-22" cy="-168" r="9" fill="#ff6b6b" stroke={O} strokeWidth="2" />
      <circle cx="26" cy="-140" r="9" fill="#ff6b6b" stroke={O} strokeWidth="2" />
      <circle cx="6" cy="-186" r="9" fill="#ff6b6b" stroke={O} strokeWidth="2" />
    </g>
  )
}

/** Езерце с патенце (край на долната пътечка). */
export function Pond() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="150" ry="58" fill="url(#mz-water)" stroke={O} strokeWidth="4" />
      <path d="M-90 -6 q 20 -10 40 0 M 30 14 q 20 -10 40 0" fill="none" stroke="#e3f6ff" strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(-30 4)">
        <ellipse cx="0" cy="-10" rx="34" ry="20" fill="#ffe066" stroke={O} strokeWidth="3.5" />
        <circle cx="24" cy="-36" r="16" fill="#ffe066" stroke={O} strokeWidth="3.5" />
        <path d="M38 -36 l 14 4 -14 5 z" fill="#ff9f43" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="28" cy="-40" r="3" fill={O} />
        <path d="M-14 -14 q 10 -10 22 -2" fill="none" stroke="#f5c451" strokeWidth="4" strokeLinecap="round" />
      </g>
      {[-110, 100].map((x) => (
        <g key={x} transform={`translate(${x} -2)`}>
          <ellipse rx="22" ry="9" fill="#7fd08f" stroke={O} strokeWidth="2.5" />
          <circle cx="4" cy="-6" r="6" fill="#ffc2d8" stroke={O} strokeWidth="2" />
        </g>
      ))}
    </g>
  )
}

/** Голяма гъба (височина ≈ 300). Шапчицата е от y=-300 до y=-170. */
export function BigMushroom() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="120" ry="16" fill={O} opacity="0.15" />
      <path d="M-42 0 C -48 -60 -40 -130 -34 -180 H 34 C 40 -130 48 -60 42 0 Z" fill="#fff4e2" stroke={O} strokeWidth="5" />
      <path d="M-20 -20 C -24 -70 -20 -120 -16 -160" fill="none" stroke="#f0dcc0" strokeWidth="8" strokeLinecap="round" />
      <path d="M-170 -170 C -170 -320 170 -320 170 -170 C 120 -156 -120 -156 -170 -170 Z" fill="#ff7f9c" stroke={O} strokeWidth="5" strokeLinejoin="round" />
      <path d="M-140 -186 C -110 -170 110 -170 140 -186" fill="none" stroke="#ffc2d0" strokeWidth="8" strokeLinecap="round" />
      {[
        [-90, -240, 20],
        [-10, -276, 16],
        [70, -246, 22],
        [124, -200, 12],
        [-130, -196, 12],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff" stroke={O} strokeWidth="3" />
      ))}
    </g>
  )
}

/** Плетена кошничка (височина ≈ 170); отворът е горе, около y=-120. */
export function Basket({ front = true, back = true }: { front?: boolean; back?: boolean }) {
  return (
    <g>
      {back && (
        <>
          <ellipse cx="0" cy="0" rx="110" ry="14" fill={O} opacity="0.15" />
          <path d="M-80 -120 C -80 -210 80 -210 80 -120" fill="none" stroke={O} strokeWidth="16" strokeLinecap="round" />
          <path d="M-80 -120 C -80 -210 80 -210 80 -120" fill="none" stroke="#d9a066" strokeWidth="9" strokeLinecap="round" />
          <ellipse cx="0" cy="-120" rx="96" ry="26" fill="#8a5a33" stroke={O} strokeWidth="5" />
        </>
      )}
      {front && (
        <>
          <path d="M-96 -120 C -92 -60 -76 -4 -60 0 H 60 C 76 -4 92 -60 96 -120 C 60 -100 -60 -100 -96 -120 Z" fill="url(#mz-wood)" stroke={O} strokeWidth="5" strokeLinejoin="round" />
          {[-80, -50, -20].map((y) => (
            <path key={y} d={`M${-90 + (y + 80) * 0.18} ${y} C -40 ${y + 14} 40 ${y + 14} ${90 - (y + 80) * 0.18} ${y}`} fill="none" stroke="#f0c48d" strokeWidth="5" strokeLinecap="round" />
          ))}
          <path d="M-96 -120 C -60 -100 60 -100 96 -120" fill="none" stroke={O} strokeWidth="5" />
        </>
      )}
    </g>
  )
}

/** Катеричка (височина ≈ 190), гледа надясно. */
export function Squirrel({ children }: { children?: ReactNode }) {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="60" ry="10" fill={O} opacity="0.15" />
      <path d="M-30 -20 C -110 -40 -110 -170 -50 -190 C -10 -200 0 -150 -30 -140 C -70 -126 -60 -70 -20 -60 Z" fill="#e58a3c" stroke={O} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M-60 -170 C -80 -150 -80 -110 -60 -90" fill="none" stroke="#f6b26b" strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="10" cy="-50" rx="36" ry="46" fill="#ef9a4c" stroke={O} strokeWidth="4.5" />
      <ellipse cx="16" cy="-44" rx="20" ry="30" fill="#ffe1bd" />
      <circle cx="20" cy="-118" r="34" fill="#ef9a4c" stroke={O} strokeWidth="4.5" />
      <path d="M0 -146 l -6 -26 18 16 Z M 32 -148 l 6 -26 8 22 Z" fill="#ef9a4c" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="30" cy="-122" r="5.5" fill={O} />
      <circle cx="32" cy="-124" r="2" fill="#fff" />
      <circle cx="52" cy="-110" r="5" fill={O} />
      <ellipse cx="20" cy="-104" rx="8" ry="5" fill="#ffb3c7" opacity="0.8" />
      <ellipse cx="-4" cy="-4" rx="18" ry="9" fill="#ef9a4c" stroke={O} strokeWidth="3.5" />
      <ellipse cx="26" cy="-4" rx="18" ry="9" fill="#ef9a4c" stroke={O} strokeWidth="3.5" />
      {children && <g transform="translate(48 -70)">{children}</g>}
      <ellipse cx="38" cy="-66" rx="11" ry="9" fill="#ef9a4c" stroke={O} strokeWidth="3.5" />
    </g>
  )
}

/** Съкровищата на катеричката (около 70 × 70, центрирани). */
export function TreasureArt({ id }: { id: Treasure }) {
  if (id === 'key')
    return (
      <g transform="rotate(-30)">
        <circle cx="-20" cy="0" r="20" fill="url(#mz-gold)" stroke={O} strokeWidth="4" />
        <circle cx="-20" cy="0" r="8" fill="#fff6d6" stroke={O} strokeWidth="3" />
        <path d="M0 -6 H 40 V 6 H 34 V 16 H 26 V 6 H 20 V 14 H 12 V 6 H 0 Z" fill="url(#mz-gold)" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      </g>
    )
  if (id === 'acorn')
    return (
      <g>
        <path d="M-20 -6 C -22 20 -6 34 0 36 C 6 34 22 20 20 -6 Z" fill="#d9a066" stroke={O} strokeWidth="4" />
        <path d="M-26 -8 C -26 -30 26 -30 26 -8 C 14 -2 -14 -2 -26 -8 Z" fill="#8a5a33" stroke={O} strokeWidth="4" strokeLinejoin="round" />
        <path d="M0 -24 q 4 -12 12 -14" fill="none" stroke={O} strokeWidth="4" strokeLinecap="round" />
        <path d="M-8 4 q -2 12 4 20" fill="none" stroke="#f0c48d" strokeWidth="4" strokeLinecap="round" />
      </g>
    )
  return (
    <g>
      <path d="M0 -36 C 26 -30 30 10 0 36 C -30 10 -26 -30 0 -36 Z" fill="#a8693a" stroke={O} strokeWidth="4" />
      {[-20, -6, 8, 22].map((y) => (
        <path key={y} d={`M${-20 + Math.abs(y) * 0.3} ${y} q ${20 - Math.abs(y) * 0.3} 8 ${40 - Math.abs(y) * 0.6} 0`} fill="none" stroke="#e0a56c" strokeWidth="4" strokeLinecap="round" />
      ))}
    </g>
  )
}

/** Пиленце (височина ≈ 90). */
export function Chick({ happy = false }: { happy?: boolean }) {
  return (
    <g className="mz-chick">
      <ellipse cx="0" cy="0" rx="36" ry="7" fill={O} opacity="0.16" />
      <path d="M-8 -6 v 6 h -8 M 8 -6 v 6 h 8" fill="none" stroke="#ff9f43" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="0" cy="-34" rx="34" ry="30" fill="#ffe066" stroke={O} strokeWidth="4" />
      <path d="M-30 -36 q -14 -4 -16 8 q 12 2 18 -2" fill="#ffd23f" stroke={O} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="6" cy="-70" r="22" fill="#ffe066" stroke={O} strokeWidth="4" />
      <path d="M0 -92 q 4 -12 10 -4 q 4 -8 8 2" fill="#ffe066" stroke={O} strokeWidth="3" strokeLinejoin="round" />
      {happy ? <path d="M6 -76 q 5 -6 10 0" fill="none" stroke={O} strokeWidth="3.5" strokeLinecap="round" /> : <circle cx="12" cy="-74" r="4" fill={O} />}
      <path d="M24 -70 l 14 4 -14 6 z" fill="#ff9f43" stroke={O} strokeWidth="2.5" strokeLinejoin="round" />
      <ellipse cx="10" cy="-62" rx="6" ry="4" fill="#ffb3a7" opacity="0.8" />
    </g>
  )
}

/** Кокошарник (декорация зад оградката). */
export function Coop() {
  return (
    <g>
      <path d="M-90 0 V -110 L 0 -180 L 90 -110 V 0 Z" fill="#ffcf9a" stroke={O} strokeWidth="5" strokeLinejoin="round" />
      <path d="M-110 -104 L 0 -196 L 110 -104" fill="none" stroke="#e8606a" strokeWidth="22" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M-110 -104 L 0 -196 L 110 -104" fill="none" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <path d="M-26 0 V -60 C -26 -84 26 -84 26 -60 V 0 Z" fill="#8a5a33" stroke={O} strokeWidth="4" />
      <circle cx="0" cy="-132" r="16" fill="#fff6d6" stroke={O} strokeWidth="4" />
    </g>
  )
}

/** Оградка (елипса): задна и предна част се рисуват поотделно, за да има „вътре“. */
export function Fence({ rx, ry, part }: { rx: number; ry: number; part: 'back' | 'front' | 'ground' }) {
  if (part === 'ground') return <ellipse cx="0" cy="0" rx={rx} ry={ry} fill="#d9f2b8" stroke="#9fcf7f" strokeWidth="4" />
  const n = 22
  const posts = Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2).filter((a) => (part === 'back' ? Math.sin(a) < 0 : Math.sin(a) >= 0))
  const railY = (a: number) => Math.sin(a) * ry
  const arc = (dy: number) =>
    part === 'back' ? `M${-rx} ${dy} A ${rx} ${ry} 0 0 1 ${rx} ${dy}` : `M${-rx} ${dy} A ${rx} ${ry} 0 0 0 ${rx} ${dy}`
  return (
    <g className={`mz-fence mz-fence--${part}`}>
      {[-58, -26].map((dy) => (
        <path key={dy} d={arc(dy)} fill="none" stroke={O} strokeWidth="14" strokeLinecap="round" />
      ))}
      {[-58, -26].map((dy) => (
        <path key={`i${dy}`} d={arc(dy)} fill="none" stroke="#e0a56c" strokeWidth="7" strokeLinecap="round" />
      ))}
      {posts.map((a, i) => {
        const x = Math.cos(a) * rx
        const y = railY(a)
        return <path key={i} d={`M${x - 9} ${y} V ${y - 70} l 9 -12 9 12 V ${y} Z`} fill="url(#mz-wood)" stroke={O} strokeWidth="3.5" strokeLinejoin="round" />
      })}
    </g>
  )
}

/** Поточе (лента): горен ляв ъгъл x, y. */
export function Stream({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="40" fill="url(#mz-water)" stroke={O} strokeWidth="4" />
      {Array.from({ length: Math.max(2, Math.round((w * h) / 60000)) }, (_, i) => {
        const cx = x + ((i * 0.37 + 0.13) % 1) * w
        const cy = y + ((i * 0.61 + 0.2) % 1) * h
        return <path key={i} d={`M${cx - 30} ${cy} q 15 -10 30 0 q 15 10 30 0`} fill="none" stroke="#e3f6ff" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      })}
    </g>
  )
}

/** Камъче в поточето (ширина ≈ 170). */
export function Stone({ lit = false }: { lit?: boolean }) {
  return (
    <g>
      {lit && <ellipse cx="0" cy="-10" rx="110" ry="50" fill="url(#mz-glow)" />}
      <ellipse cx="0" cy="6" rx="86" ry="22" fill="#5aa9d6" opacity="0.5" />
      <path d="M-82 0 C -86 -34 -40 -50 0 -50 C 44 -50 88 -34 82 0 C 50 14 -50 14 -82 0 Z" fill="url(#mz-stone)" stroke={O} strokeWidth="4.5" />
      <path d="M-50 -30 q 20 -10 44 -6" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
    </g>
  )
}

/** Жабка (височина ≈ 80). */
export function Frog({ happy = false }: { happy?: boolean }) {
  return (
    <g className="mz-frog">
      <ellipse cx="0" cy="-26" rx="42" ry="28" fill="#7ed957" stroke={O} strokeWidth="4" />
      <circle cx="-20" cy="-56" r="15" fill="#7ed957" stroke={O} strokeWidth="4" />
      <circle cx="20" cy="-56" r="15" fill="#7ed957" stroke={O} strokeWidth="4" />
      <circle cx="-20" cy="-58" r="7" fill="#fff" stroke={O} strokeWidth="2" />
      <circle cx="20" cy="-58" r="7" fill="#fff" stroke={O} strokeWidth="2" />
      <circle cx="-19" cy="-58" r="3.5" fill={O} />
      <circle cx="21" cy="-58" r="3.5" fill={O} />
      <path d={happy ? 'M-18 -28 Q 0 -10 18 -28' : 'M-16 -26 Q 0 -18 16 -26'} fill={happy ? '#ff8fa3' : 'none'} stroke={O} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M-40 -6 q -14 2 -20 6 M 40 -6 q 14 2 20 6" stroke={O} strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

/** Подаръци за вълшебната врата (около 80 × 80, центрирани). */
export function GiftArt({ id }: { id: Gift }) {
  if (id === 'star') return <path d="M0 -40 L 11 -13 L 40 -12 L 17 6 L 25 36 L 0 19 L -25 36 L -17 6 L -40 -12 L -11 -13 Z" fill="url(#mz-gold)" stroke={O} strokeWidth="4.5" strokeLinejoin="round" />
  if (id === 'heart') return <path d="M0 34 C -22 18 -36 6 -36 -12 C -36 -28 -22 -36 -12 -36 C -4 -36 0 -30 0 -24 C 0 -30 4 -36 12 -36 C 22 -36 36 -28 36 -12 C 36 6 22 18 0 34 Z" fill="#ff7a9a" stroke={O} strokeWidth="4.5" strokeLinejoin="round" />
  if (id === 'leaf')
    return (
      <g transform="rotate(-25)">
        <path d="M0 38 C -34 14 -34 -24 0 -40 C 34 -24 34 14 0 38 Z" fill="#7ed957" stroke={O} strokeWidth="4.5" strokeLinejoin="round" />
        <path d="M0 34 V -30 M 0 0 l -14 -10 M 0 14 l 14 -10" stroke="#3f9a4e" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    )
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={Math.cos(((a - 90) * Math.PI) / 180) * 20} cy={Math.sin(((a - 90) * Math.PI) / 180) * 20} rx="16" ry="16" fill="#b9a3ff" stroke={O} strokeWidth="3.5" />
      ))}
      <circle r="13" fill="#ffd25e" stroke={O} strokeWidth="3.5" />
    </g>
  )
}

/** Вълшебната врата в живия плет. Вратата е от y=-430 до 0, ширина 300. */
export function MagicDoor({ open = false, stars = 0 }: { open?: boolean; stars?: number }) {
  return (
    <g className={`mz-door ${open ? 'is-open' : ''}`}>
      {/* арка от цветя */}
      <path d="M-190 0 V -300 C -190 -500 190 -500 190 -300 V 0" fill="none" stroke={O} strokeWidth="64" strokeLinecap="round" />
      <path d="M-190 0 V -300 C -190 -500 190 -500 190 -300 V 0" fill="none" stroke="url(#mz-hedge)" strokeWidth="54" strokeLinecap="round" />
      {[-0.95, -0.7, -0.4, -0.12, 0.12, 0.4, 0.7, 0.95].map((t, i) => {
        const a = Math.PI * (1 - (t + 1) / 2)
        return <circle key={i} cx={Math.cos(a) * 190} cy={-300 - Math.sin(a) * 150} r="12" fill={['#ff9ec4', '#ffd25e', '#b9a3ff', '#fff'][i % 4]} stroke={O} strokeWidth="2.5" />
      })}
      {/* отворът — градината отвъд */}
      <path d="M-150 0 V -290 C -150 -450 150 -450 150 -290 V 0 Z" fill={open ? '#fff3c4' : '#6b4a8a'} stroke={O} strokeWidth="5" />
      {open && (
        <g>
          <path d="M-150 0 V -290 C -150 -450 150 -450 150 -290 V 0 Z" fill="url(#mz-glow)" />
          {[-80, 0, 80].map((x) => (
            <g key={x} transform={`translate(${x} -40)`}>
              <path d="M-12 0 L 0 50 L 12 0 Z" fill="#ff9f43" stroke={O} strokeWidth="3" />
              <path d="M0 0 q -14 -24 -4 -34 q 4 14 4 34 q 4 -20 14 -30 q 2 14 -14 30" fill="#7ed957" stroke={O} strokeWidth="2.5" />
            </g>
          ))}
        </g>
      )}
      {/* крилата на вратата */}
      <g className="mz-door__wing mz-door__wing--l">
        <path d="M-150 0 V -290 C -150 -370 -90 -440 0 -446 V 0 Z" fill="url(#mz-wood)" stroke={O} strokeWidth="5" strokeLinejoin="round" />
        {[-110, -60].map((x) => (
          <path key={x} d={`M${x} -20 V -300`} stroke="#a4632f" strokeWidth="6" strokeLinecap="round" />
        ))}
        <circle cx="-26" cy="-200" r="10" fill="url(#mz-gold)" stroke={O} strokeWidth="3" />
      </g>
      <g className="mz-door__wing mz-door__wing--r">
        <path d="M150 0 V -290 C 150 -370 90 -440 0 -446 V 0 Z" fill="url(#mz-wood)" stroke={O} strokeWidth="5" strokeLinejoin="round" />
        {[110, 60].map((x) => (
          <path key={x} d={`M${x} -20 V -300`} stroke="#a4632f" strokeWidth="6" strokeLinecap="round" />
        ))}
        <circle cx="26" cy="-200" r="10" fill="url(#mz-gold)" stroke={O} strokeWidth="3" />
      </g>
      {/* петте звездички от мисиите */}
      {Array.from({ length: 5 }, (_, i) => {
        const a = Math.PI * (0.15 + (i * 0.7) / 4)
        return (
          <g key={i} transform={`translate(${-Math.cos(a) * 110} ${-300 - Math.sin(a) * 92}) scale(0.42)`} opacity={i < stars ? 1 : 0.35}>
            {i < stars ? <GiftArt id="star" /> : <path d="M0 -40 L 11 -13 L 40 -12 L 17 6 L 25 36 L 0 19 L -25 36 L -17 6 L -40 -12 L -11 -13 Z" fill="#c9b6e6" stroke={O} strokeWidth="4.5" strokeLinejoin="round" />}
          </g>
        )
      })}
    </g>
  )
}

/** Гнездо за подарък на вратата (кръгло; r ≈ 70). */
export function Socket({ lit = false, children }: { lit?: boolean; children?: ReactNode }) {
  return (
    <g>
      {lit && <circle r="110" fill="url(#mz-glow)" />}
      <circle r="66" fill="#fffaf0" stroke={O} strokeWidth="6" />
      <circle r="52" fill="none" stroke="#e7d8f5" strokeWidth="6" strokeDasharray="10 12" />
      {children}
    </g>
  )
}

/** Морков (височина ≈ 120). */
export function Carrot({ s = 1 }: { s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <path d="M-22 -70 C -18 -30 -6 -6 0 0 C 6 -6 18 -30 22 -70 Z" fill="#ff9f43" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <path d="M-10 -52 h 8 M -6 -34 h 8 M 4 -60 h 8" stroke="#e07a1f" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M0 -70 C -20 -96 -14 -112 -6 -116 C 0 -100 0 -84 0 -70 C 4 -92 14 -108 24 -110 C 24 -94 12 -80 0 -70" fill="#7ed957" stroke={O} strokeWidth="3.5" strokeLinejoin="round" />
    </g>
  )
}

/** Златното морковче — значката-награда. */
export function GoldenCarrotBadge() {
  return (
    <g className="mz-badge">
      <circle r="120" fill="url(#mz-glow)" />
      <circle r="86" fill="#fff6d6" stroke={O} strokeWidth="6" />
      <circle r="70" fill="none" stroke="#f5b93a" strokeWidth="8" strokeDasharray="4 10" strokeLinecap="round" />
      <g transform="translate(0 52) scale(0.95)">
        <path d="M-26 -84 C -22 -36 -8 -8 0 0 C 8 -8 22 -36 26 -84 Z" fill="url(#mz-gold)" stroke={O} strokeWidth="5" strokeLinejoin="round" />
        <path d="M-12 -62 h 10 M -6 -40 h 10 M 4 -72 h 10" stroke="#d99a20" strokeWidth="4" strokeLinecap="round" />
        <path d="M0 -84 C -24 -112 -16 -130 -6 -136 C 0 -118 0 -100 0 -84 C 4 -110 16 -128 28 -130 C 28 -110 14 -96 0 -84" fill="#7ed957" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      </g>
      <path d="M-50 70 L -70 140 L -40 126 L -24 150 L -10 84 Z" fill="#ff7a9a" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <path d="M50 70 L 70 140 L 40 126 L 24 150 L 10 84 Z" fill="#8fd3ff" stroke={O} strokeWidth="4" strokeLinejoin="round" />
    </g>
  )
}

/** Морковена торта за празника. */
export function Cake() {
  return (
    <g>
      <ellipse cx="0" cy="0" rx="110" ry="16" fill={O} opacity="0.15" />
      <rect x="-90" y="-80" width="180" height="80" rx="20" fill="#ffd9a8" stroke={O} strokeWidth="5" />
      <path d="M-90 -60 C -60 -40 -50 -70 -20 -50 C 10 -30 20 -66 50 -48 C 70 -36 80 -60 90 -56 V -64 C 90 -76 80 -80 70 -80 H -70 C -80 -80 -90 -76 -90 -64 Z" fill="#fff" stroke={O} strokeWidth="4" strokeLinejoin="round" />
      <rect x="-60" y="-140" width="120" height="62" rx="16" fill="#ffb3c7" stroke={O} strokeWidth="5" />
      {[-30, 0, 30].map((x) => (
        <g key={x} transform={`translate(${x} -140)`}>
          <rect x="-5" y="-36" width="10" height="36" rx="4" fill="#8fd3ff" stroke={O} strokeWidth="3" />
          <path className="mz-flame" d="M0 -38 C -10 -50 -4 -62 0 -68 C 4 -62 10 -50 0 -38 Z" fill="#ffd25e" stroke="#f08a24" strokeWidth="2.5" />
        </g>
      ))}
      <g transform="translate(0 -84) scale(0.5) rotate(90)">
        <Carrot />
      </g>
    </g>
  )
}

/** Малка икона на мисията за панела със задачата (поле 100×100). */
export function MissionIcon({ id }: { id: 'fork' | 'hide' | 'chicks' | 'stones' | 'door' }) {
  return (
    <svg viewBox="-50 -95 100 100" className="mz-mission-icon" aria-hidden="true">
      <MazeDefs />
      {id === 'fork' && (
        <g>
          <path d="M-40 -40 H -6 C 10 -40 14 -76 40 -78 M -6 -40 C 10 -40 14 -6 40 -4" fill="none" stroke={O} strokeWidth="16" strokeLinecap="round" />
          <path d="M-40 -40 H -6 C 10 -40 14 -76 40 -78 M -6 -40 C 10 -40 14 -6 40 -4" fill="none" stroke="#f3d79e" strokeWidth="9" strokeLinecap="round" />
        </g>
      )}
      {id === 'hide' && (
        <g transform="translate(0 0) scale(0.3)">
          <BigMushroom />
        </g>
      )}
      {id === 'chicks' && (
        <g transform="translate(0 -6) scale(0.9)">
          <Chick />
        </g>
      )}
      {id === 'stones' && (
        <g>
          <rect x="-48" y="-80" width="96" height="70" rx="18" fill="url(#mz-water)" stroke={O} strokeWidth="4" />
          <g transform="translate(-16 -30) scale(0.24)">
            <Stone />
          </g>
          <g transform="translate(18 -58) scale(0.22)">
            <Stone />
          </g>
        </g>
      )}
      {id === 'door' && (
        <g transform="translate(0 -4) scale(0.19)">
          <MagicDoor />
        </g>
      )}
    </svg>
  )
}

/** Зайчето за картата на играта (самостоятелен SVG). */
export function BunnyCard({ size = 120 }: { size?: number }) {
  return (
    <svg viewBox="-80 -210 160 220" width={size} height={(size * 220) / 160} role="img" aria-label="Зайчето Скокльо">
      <MazeDefs />
      <Bunny mood="happy" />
    </svg>
  )
}

/** Домът на зайчето: хълмче с кръгла вратичка, прозорче и морковена табелка. Началото е на земята, в средата. */
export function BunnyHome({ lit = false }: { lit?: boolean }) {
  return (
    <g className={`mz-home ${lit ? 'is-lit' : ''}`}>
      <ellipse cx="0" cy="0" rx="170" ry="16" fill={O} opacity="0.16" />
      <path d="M-160 0 C -160 -150 -80 -210 0 -210 C 80 -210 160 -150 160 0 Z" fill="#8fd37f" stroke={O} strokeWidth="6" strokeLinejoin="round" />
      <path d="M-120 -120 C -96 -170 -50 -190 -10 -192" fill="none" stroke="#c4f0b6" strokeWidth="12" strokeLinecap="round" />
      {/* вратичка */}
      <path d="M-56 0 V -70 A 56 56 0 0 1 56 -70 V 0 Z" fill="#c9803f" stroke={O} strokeWidth="6" strokeLinejoin="round" />
      <path d="M-20 0 V -100 M 20 0 V -100" stroke="#a8652c" strokeWidth="5" />
      <circle cx="32" cy="-48" r="7" fill="#ffd25e" stroke={O} strokeWidth="3" />
      {/* прозорче */}
      <circle cx="-104" cy="-92" r="26" fill={lit ? '#fff3a8' : '#bfe8ff'} stroke={O} strokeWidth="5" />
      <path d="M-104 -118 V -66 M -130 -92 H -78" stroke={O} strokeWidth="4" />
      <circle cx="104" cy="-92" r="26" fill={lit ? '#fff3a8' : '#bfe8ff'} stroke={O} strokeWidth="5" />
      <path d="M104 -118 V -66 M 78 -92 H 130" stroke={O} strokeWidth="4" />
      {/* комин-морковче */}
      <g transform="translate(70 -176) rotate(14) scale(0.7)">
        <Carrot />
      </g>
      {/* цветенца пред вратата */}
      {[-140, -84, 84, 140].map((x, i) => (
        <g key={x} transform={`translate(${x} -4)`}>
          <Flower color={['#ff7aa8', '#ffd25e', '#9b8cff', '#ff9f43'][i]} />
        </g>
      ))}
    </g>
  )
}

/** Цветенце (за градината и пътечката); началото е в основата на стъблото. */
export function Flower({ color = '#ff7aa8', s = 1 }: { color?: string; s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <path d="M0 0 V -30" stroke="#3f9b4a" strokeWidth="5" strokeLinecap="round" />
      <path d="M0 -12 C 10 -22 18 -20 20 -14 C 12 -10 6 -10 0 -12 Z" fill="#7ed957" stroke={O} strokeWidth="2.5" />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-44" rx="8" ry="12" fill={color} stroke={O} strokeWidth="3" transform={`rotate(${a} 0 -34)`} />
      ))}
      <circle cx="0" cy="-34" r="7" fill="#fff3a8" stroke={O} strokeWidth="3" />
    </g>
  )
}
