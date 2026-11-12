/**
 * Трите приказни мечета — оригинални SVG илюстрации.
 * Голямо, средно и малко мече с различни цветни шалчета; настроения: в очакване, гладно, щастливо, хапва.
 * Поле 300×340; мечето седи, лапичките му са на коремчето.
 */
import type { BearId } from '../games/feed-bears/logic'

export type BearMood = 'idle' | 'hungry' | 'happy' | 'eating'

const INK = '#4a2f2a'

interface Palette {
  fur: [string, string, string]
  belly: string
  inner: string
  scarf: [string, string]
  stripe: string
}

const PAL: Record<BearId, Palette> = {
  big: { fur: ['#b8784a', '#8f5430', '#6e3d22'], belly: '#f0cfa3', inner: '#e89a8f', scarf: ['#ff7a8a', '#e04a63'], stripe: '#fff1e6' },
  mid: { fur: ['#d39a5e', '#b0733f', '#8a5528'], belly: '#f7dcb4', inner: '#f0a99c', scarf: ['#4fd1c5', '#21a397'], stripe: '#fffbe8' },
  small: { fur: ['#e8b77c', '#c98f53', '#a56c36'], belly: '#fbe6c4', inner: '#f6b3a6', scarf: ['#ffd25e', '#f0a52a'], stripe: '#ff8fae' },
}

export function Bear({ id, mood = 'idle', size = 300, className = '' }: { id: BearId; mood?: BearMood; size?: number; className?: string }) {
  const p = PAL[id]
  const g = `kgb-${id}`
  const happy = mood === 'happy'
  const eating = mood === 'eating'
  return (
    <svg
      viewBox="0 0 300 340"
      width={size}
      height={(size * 340) / 300}
      preserveAspectRatio="xMidYMax meet"
      className={`kg-bear kg-bear--${id} is-${mood} ${className}`}
      role="img"
      aria-label={id === 'big' ? 'Голямото мече' : id === 'mid' ? 'Средното мече' : 'Малкото мече'}
      overflow="visible"
    >
      <defs>
        <radialGradient id={`${g}-body`} cx="0.42" cy="0.35" r="0.75">
          <stop offset="0" stopColor={p.fur[0]} />
          <stop offset="0.65" stopColor={p.fur[1]} />
          <stop offset="1" stopColor={p.fur[2]} />
        </radialGradient>
        <radialGradient id={`${g}-head`} cx="0.4" cy="0.32" r="0.78">
          <stop offset="0" stopColor={p.fur[0]} />
          <stop offset="0.7" stopColor={p.fur[1]} />
          <stop offset="1" stopColor={p.fur[2]} />
        </radialGradient>
        <radialGradient id={`${g}-belly`} cx="0.45" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fff7ea" />
          <stop offset="1" stopColor={p.belly} />
        </radialGradient>
        <linearGradient id={`${g}-scarf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.scarf[0]} />
          <stop offset="1" stopColor={p.scarf[1]} />
        </linearGradient>
        <pattern id={`${g}-stripes`} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
          <rect width="22" height="22" fill={`url(#${g}-scarf)`} />
          <rect width="7" height="22" fill={p.stripe} opacity="0.85" />
        </pattern>
      </defs>

      {/* сянка */}
      <ellipse cx="150" cy="328" rx="112" ry="11" fill={INK} opacity="0.16" />

      <g className="kg-bear__body">
        {/* стъпала */}
        {[-1, 1].map((s) => (
          <g key={s} transform={`translate(${150 + s * 62} 300)`}>
            <ellipse cx="0" cy="0" rx="40" ry="28" fill={`url(#${g}-body)`} stroke={INK} strokeWidth="4" />
            <ellipse cx="0" cy="4" rx="22" ry="15" fill={p.inner} opacity="0.9" />
            {[-14, 0, 14].map((dx) => (
              <circle key={dx} cx={dx} cy="-15" r="5.5" fill={p.inner} opacity="0.9" />
            ))}
          </g>
        ))}

        {/* тяло */}
        <path d="M150 128 C 214 128 246 186 244 246 C 242 296 204 318 150 318 C 96 318 58 296 56 246 C 54 186 86 128 150 128 Z" fill={`url(#${g}-body)`} stroke={INK} strokeWidth="4.5" />
        <path d="M150 168 C 194 168 212 208 210 248 C 208 284 184 300 150 300 C 116 300 92 284 90 248 C 88 208 106 168 150 168 Z" fill={`url(#${g}-belly)`} />
        {/* козина по коремчето */}
        {[
          [120, 210],
          [176, 222],
          [140, 262],
          [168, 278],
        ].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} q 6 -6 12 0`} fill="none" stroke={p.fur[1]} strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
        ))}

        {/* ръце */}
        {happy ? (
          <g className="kg-bear__arms-up">
            <path d="M74 186 C 48 160 40 128 52 104 C 62 90 82 96 84 112 C 86 132 92 152 104 170 Z" fill={`url(#${g}-body)`} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <path d="M226 186 C 252 160 260 128 248 104 C 238 90 218 96 216 112 C 214 132 208 152 196 170 Z" fill={`url(#${g}-body)`} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <ellipse cx="62" cy="104" rx="13" ry="11" fill={p.inner} opacity="0.85" />
            <ellipse cx="238" cy="104" rx="13" ry="11" fill={p.inner} opacity="0.85" />
          </g>
        ) : (
          <g>
            <path d="M84 178 C 66 204 70 240 100 252 C 118 258 128 244 120 230 C 112 216 108 200 112 184 Z" fill={`url(#${g}-body)`} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <path d="M216 178 C 234 204 230 240 200 252 C 182 258 172 244 180 230 C 188 216 192 200 188 184 Z" fill={`url(#${g}-body)`} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            <ellipse cx="110" cy="242" rx="12" ry="9" fill={p.inner} opacity="0.75" />
            <ellipse cx="190" cy="242" rx="12" ry="9" fill={p.inner} opacity="0.75" />
          </g>
        )}

        {/* шалче */}
        <path
          d="M84 150 C 112 170 188 170 216 150 C 222 160 222 172 214 180 C 186 198 114 198 86 180 C 78 172 78 160 84 150 Z"
          fill={`url(#${g}-stripes)`}
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M188 176 C 196 196 194 222 184 240 L 206 246 C 216 226 218 198 210 178 Z"
          fill={`url(#${g}-stripes)`}
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
          className="kg-bear__scarf-end"
        />
        {[188, 196, 204].map((x) => (
          <line key={x} x1={x - 2} y1="244" x2={x - 6} y2="256" stroke={p.scarf[1]} strokeWidth="4" strokeLinecap="round" />
        ))}
        <ellipse cx="198" cy="176" rx="15" ry="12" fill={`url(#${g}-scarf)`} stroke={INK} strokeWidth="4" />
      </g>

      {/* глава */}
      <g className="kg-bear__head">
        {/* уши */}
        {[-1, 1].map((s) => (
          <g key={s}>
            <circle cx={150 + s * 66} cy="40" r="30" fill={`url(#${g}-head)`} stroke={INK} strokeWidth="4.5" />
            <circle cx={150 + s * 66} cy="42" r="17" fill={p.inner} />
            <path d={`M${150 + s * 56} ${34} q ${s * 8} -6 ${s * 16} 2`} fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round" />
          </g>
        ))}
        <ellipse cx="150" cy="88" rx="86" ry="76" fill={`url(#${g}-head)`} stroke={INK} strokeWidth="4.5" />
        {/* кичур козина */}
        <path d="M134 16 q 8 -12 16 0 q 8 -12 16 0" fill={`url(#${g}-head)`} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        {/* отблясък */}
        <path d="M96 52 C 108 34 132 26 150 26" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="7" strokeLinecap="round" />
        {/* бузки */}
        <ellipse cx="96" cy="112" rx="17" ry="11" fill="#ff8fa3" opacity={happy || eating ? 0.75 : 0.5} />
        <ellipse cx="204" cy="112" rx="17" ry="11" fill="#ff8fa3" opacity={happy || eating ? 0.75 : 0.5} />

        {/* очи */}
        {happy ? (
          <g fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round">
            <path d="M104 86 q 14 -16 28 0" />
            <path d="M168 86 q 14 -16 28 0" />
          </g>
        ) : (
          <g className="kg-bear__eyes">
            {[118, 182].map((x) => (
              <g key={x} transform={mood === 'hungry' ? 'translate(0 5)' : undefined}>
                <ellipse cx={x} cy="84" rx="11.5" ry="14" fill={INK} />
                <circle cx={x + 4} cy="78" r="4.6" fill="#fff" />
                <circle cx={x - 4} cy="90" r="2" fill="#fff" opacity="0.8" />
              </g>
            ))}
          </g>
        )}
        {/* вежди при глад — молба */}
        {mood === 'hungry' && (
          <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
            <path d="M104 62 q 12 -8 24 -2" />
            <path d="M196 62 q -12 -8 -24 -2" />
          </g>
        )}

        {/* муцунка */}
        <ellipse cx="150" cy="122" rx="40" ry="31" fill="#f6dcc0" stroke={INK} strokeWidth="3.5" />
        <path d="M134 106 C 134 98 166 98 166 106 C 166 116 156 122 150 122 C 144 122 134 116 134 106 Z" fill={INK} />
        <ellipse cx="144" cy="104" rx="6" ry="3.5" fill="#fff" opacity="0.6" />
        <line x1="150" y1="122" x2="150" y2="130" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        {happy ? (
          <path d="M128 130 Q 150 156 172 130 Q 150 140 128 130 Z" fill="#c4455a" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        ) : eating ? (
          <g className="kg-bear__chew">
            <ellipse cx="150" cy="137" rx="11" ry="8" fill="#c4455a" stroke={INK} strokeWidth="3.5" />
          </g>
        ) : (
          <path d="M132 131 q 9 9 18 0 q 9 9 18 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        )}
      </g>
    </svg>
  )
}

/** Дървена чинийка пред мечето. Поле 300×90. */
export function Plate({ id, className = '' }: { id: BearId; className?: string }) {
  const rim = PAL[id].scarf[0]
  return (
    <svg viewBox="0 0 300 90" className={`kg-plate ${className}`} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <radialGradient id={`kgp-${id}`} cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#fffdf7" />
          <stop offset="1" stopColor="#f1e3cc" />
        </radialGradient>
      </defs>
      <ellipse cx="150" cy="52" rx="146" ry="34" fill={INK} opacity="0.14" />
      <ellipse cx="150" cy="44" rx="144" ry="38" fill={`url(#kgp-${id})`} stroke={INK} strokeWidth="4" />
      <ellipse cx="150" cy="42" rx="118" ry="26" fill="none" stroke={rim} strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" />
      <ellipse cx="150" cy="44" rx="104" ry="20" fill="#fff" opacity="0.55" />
    </svg>
  )
}
