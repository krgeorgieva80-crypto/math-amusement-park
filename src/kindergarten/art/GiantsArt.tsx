/**
 * „Големи и малки ботуши“ — оригинални SVG илюстрации: дружелюбният великан, малкото джудже,
 * ботуши, зимни ботушки, шапки и ръкавици в различни цветове, постелките пред героите.
 */
import type { ColorId, HeroId, ItemKind } from '../games/giant-boots/logic'

const INK = '#4a2f3a'

export type HeroMood = 'idle' | 'hopeful' | 'happy'

const SHADE: Record<ColorId, [string, string, string]> = {
  red: ['#ff9aa5', '#f2566b', '#b8324a'],
  blue: ['#9fd0ff', '#4f9eea', '#2c6fb8'],
  yellow: ['#fff1a0', '#ffcc3d', '#d99a12'],
  green: ['#b9f0a8', '#5fc46a', '#358a43'],
  purple: ['#dcc6ff', '#a77de8', '#6f48b0'],
  orange: ['#ffd0a0', '#ff9a4a', '#c9631c'],
}

export const COLOR_NAME: Record<ColorId, string> = { red: 'червен', blue: 'син', yellow: 'жълт', green: 'зелен', purple: 'лилав', orange: 'оранжев' }

/** Дружелюбният великан: застанал, бос (по чорапи) — чака ботушите си. Поле 300×420. */
export function Giant({ mood = 'idle', size = 300, className = '' }: { mood?: HeroMood; size?: number; className?: string }) {
  const happy = mood === 'happy'
  return (
    <svg
      viewBox="0 0 300 420"
      width={size}
      height={(size * 420) / 300}
      preserveAspectRatio="xMidYMax meet"
      className={`kg-hero kg-hero--giant is-${mood} ${className}`}
      role="img"
      aria-label="Великанът"
      overflow="visible"
    >
      <defs>
        <radialGradient id="kgg-skin" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffe2c4" />
          <stop offset="1" stopColor="#f2b78c" />
        </radialGradient>
        <linearGradient id="kgg-tunic" x1="0" x2="1">
          <stop offset="0" stopColor="#8fdca0" />
          <stop offset="0.6" stopColor="#5cbf74" />
          <stop offset="1" stopColor="#3e9a55" />
        </linearGradient>
        <linearGradient id="kgg-pants" x1="0" x2="1">
          <stop offset="0" stopColor="#a98c74" />
          <stop offset="1" stopColor="#7a5c46" />
        </linearGradient>
        <radialGradient id="kgg-beard" cx="0.45" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#d4925a" />
          <stop offset="1" stopColor="#a5622f" />
        </radialGradient>
        <pattern id="kgg-sock" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect width="16" height="16" fill="#fff6e8" />
          <rect width="16" height="6" fill="#ffb3c7" />
        </pattern>
      </defs>
      <ellipse cx="150" cy="412" rx="118" ry="9" fill={INK} opacity="0.16" />
      {/* крака и чорапи */}
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <path d={`M${150 + sd * 18} 290 L ${150 + sd * 22} 360 L ${150 + sd * 62} 360 L ${150 + sd * 64} 290 Z`} fill="url(#kgg-pants)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path
            d={`M${150 + sd * 22} 356 L ${150 + sd * 24} 392 C ${150 + sd * 24} 406 ${150 + sd * 92} 408 ${150 + sd * 92} 394 C ${150 + sd * 92} 380 ${150 + sd * 70} 378 ${150 + sd * 62} 372 L ${150 + sd * 62} 356 Z`}
            fill="url(#kgg-sock)"
            stroke={INK}
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </g>
      ))}
      {/* туника */}
      <path d="M150 150 C 214 150 246 200 244 262 C 242 302 214 312 150 312 C 86 312 58 302 56 262 C 54 200 86 150 150 150 Z" fill="url(#kgg-tunic)" stroke={INK} strokeWidth="4.5" />
      <rect x="60" y="262" width="180" height="22" rx="8" fill="#8a5a36" stroke={INK} strokeWidth="4" />
      <rect x="132" y="258" width="36" height="30" rx="7" fill="#ffd25e" stroke={INK} strokeWidth="4" />
      <rect x="142" y="266" width="16" height="14" rx="3" fill="#8a5a36" />
      {[110, 150, 190].map((x) => (
        <circle key={x} cx={x} cy="222" r="5" fill="#fff6c0" stroke={INK} strokeWidth="2" opacity="0.9" />
      ))}
      {/* ръце */}
      {happy ? (
        <g>
          <path d="M70 186 C 40 160 28 120 40 96 C 50 84 70 88 72 104 C 74 126 84 152 98 170 Z" fill="url(#kgg-tunic)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M230 186 C 260 160 272 120 260 96 C 250 84 230 88 228 104 C 226 126 216 152 202 170 Z" fill="url(#kgg-tunic)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <circle cx="50" cy="92" r="18" fill="url(#kgg-skin)" stroke={INK} strokeWidth="4" />
          <circle cx="250" cy="92" r="18" fill="url(#kgg-skin)" stroke={INK} strokeWidth="4" />
        </g>
      ) : (
        <g>
          <path d="M74 176 C 54 206 50 246 62 274 C 70 290 92 284 92 270 C 92 246 96 214 104 190 Z" fill="url(#kgg-tunic)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M226 176 C 246 206 250 246 238 274 C 230 290 208 284 208 270 C 208 246 204 214 196 190 Z" fill="url(#kgg-tunic)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <circle cx="76" cy="284" r="19" fill="url(#kgg-skin)" stroke={INK} strokeWidth="4" />
          <circle cx="224" cy="284" r="19" fill="url(#kgg-skin)" stroke={INK} strokeWidth="4" />
        </g>
      )}
      {/* глава */}
      <g className="kg-hero__head">
        <circle cx="72" cy="92" r="16" fill="url(#kgg-skin)" stroke={INK} strokeWidth="4" />
        <circle cx="228" cy="92" r="16" fill="url(#kgg-skin)" stroke={INK} strokeWidth="4" />
        <ellipse cx="150" cy="96" rx="78" ry="74" fill="url(#kgg-skin)" stroke={INK} strokeWidth="4.5" />
        {/* брада */}
        <path
          d="M80 104 C 78 150 104 186 150 190 C 196 186 222 150 220 104 C 210 132 188 144 150 144 C 112 144 90 132 80 104 Z"
          fill="url(#kgg-beard)"
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {[
          [104, 160],
          [130, 176],
          [170, 176],
          [196, 160],
          [150, 170],
        ].map(([x, y], i) => (
          <path key={i} d={`M${x - 8} ${y} q 8 8 16 0`} fill="none" stroke="#8a4f22" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        ))}
        {/* мустаци и уста */}
        <path
          d="M118 128 C 130 118 146 122 150 130 C 154 122 170 118 182 128 C 172 140 156 136 150 132 C 144 136 128 140 118 128 Z"
          fill="#b8703a"
          stroke={INK}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {happy ? (
          <path d="M134 140 Q 150 160 166 140 Z" fill="#c4455a" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        ) : (
          <path d="M136 142 q 14 10 28 0" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
        )}
        {/* нос */}
        <ellipse cx="150" cy="110" rx="17" ry="14" fill="#f39c86" stroke={INK} strokeWidth="3.5" />
        <ellipse cx="144" cy="105" rx="5" ry="3" fill="#fff" opacity="0.6" />
        {/* бузки */}
        <ellipse cx="102" cy="112" rx="14" ry="9" fill="#ff8fa3" opacity="0.55" />
        <ellipse cx="198" cy="112" rx="14" ry="9" fill="#ff8fa3" opacity="0.55" />
        {/* очи и вежди */}
        {happy ? (
          <g fill="none" stroke={INK} strokeWidth="5.5" strokeLinecap="round">
            <path d="M110 92 q 12 -14 24 0" />
            <path d="M166 92 q 12 -14 24 0" />
          </g>
        ) : (
          <g className="kg-hero__eyes" transform={mood === 'hopeful' ? 'translate(0 4)' : undefined}>
            {[122, 178].map((x) => (
              <g key={x}>
                <ellipse cx={x} cy="90" rx="10" ry="12" fill={INK} />
                <circle cx={x + 3.5} cy="85" r="4" fill="#fff" />
              </g>
            ))}
          </g>
        )}
        <path d="M104 70 q 18 -12 34 -2 M162 68 q 16 -10 34 2" fill="none" stroke="#8a4f22" strokeWidth="7" strokeLinecap="round" />
        {/* плетена шапка */}
        <path d="M76 66 C 74 24 112 6 150 6 C 188 6 226 24 224 66 Z" fill="#ff9e6b" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
        <rect x="70" y="58" width="160" height="22" rx="10" fill="#ffd25e" stroke={INK} strokeWidth="4" />
        {[96, 124, 152, 180, 208].map((x) => (
          <line key={x} x1={x} y1="62" x2={x} y2="76" stroke="#d99a12" strokeWidth="3" />
        ))}
        <circle cx="150" cy="8" r="13" fill="#fff6e8" stroke={INK} strokeWidth="4" />
        <path d="M100 30 q 20 -14 46 -16" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/** Малкото джудже с червена шапчица. Поле 200×300. */
export function Dwarf({ mood = 'idle', size = 200, className = '' }: { mood?: HeroMood; size?: number; className?: string }) {
  const happy = mood === 'happy'
  return (
    <svg
      viewBox="0 0 200 300"
      width={size}
      height={(size * 300) / 200}
      preserveAspectRatio="xMidYMax meet"
      className={`kg-hero kg-hero--dwarf is-${mood} ${className}`}
      role="img"
      aria-label="Джуджето"
      overflow="visible"
    >
      <defs>
        <radialGradient id="kgd-skin" cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#ffe6cc" />
          <stop offset="1" stopColor="#f4bc94" />
        </radialGradient>
        <linearGradient id="kgd-hat" x1="0" x2="1">
          <stop offset="0" stopColor="#ff8a96" />
          <stop offset="1" stopColor="#d93a52" />
        </linearGradient>
        <linearGradient id="kgd-tunic" x1="0" x2="1">
          <stop offset="0" stopColor="#9fd0ff" />
          <stop offset="1" stopColor="#4f8fd8" />
        </linearGradient>
        <pattern id="kgd-sock" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="12" height="12" fill="#fff6e8" />
          <rect width="12" height="5" fill="#7fd08f" />
        </pattern>
      </defs>
      <ellipse cx="100" cy="294" rx="70" ry="7" fill={INK} opacity="0.16" />
      {/* крачета и чорапки */}
      {[-1, 1].map((sd) => (
        <g key={sd}>
          <rect x={100 + sd * 26 - 12} y="236" width="24" height="26" rx="6" fill="#7a5c46" stroke={INK} strokeWidth="3.5" />
          <path
            d={`M${100 + sd * 14} 258 L ${100 + sd * 14} 278 C ${100 + sd * 14} 290 ${100 + sd * 58} 290 ${100 + sd * 58} 280 C ${100 + sd * 58} 270 ${100 + sd * 44} 268 ${100 + sd * 38} 264 L ${100 + sd * 38} 258 Z`}
            fill="url(#kgd-sock)"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </g>
      ))}
      {/* туника */}
      <path d="M100 150 C 146 150 164 192 160 226 C 158 246 138 250 100 250 C 62 250 42 246 40 226 C 36 192 54 150 100 150 Z" fill="url(#kgd-tunic)" stroke={INK} strokeWidth="4" />
      <rect x="42" y="222" width="116" height="16" rx="6" fill="#8a5a36" stroke={INK} strokeWidth="3.5" />
      <rect x="88" y="218" width="24" height="24" rx="5" fill="#ffd25e" stroke={INK} strokeWidth="3.5" />
      {/* ръце */}
      {happy ? (
        <g>
          <path d="M52 172 C 32 150 26 122 38 110 C 48 102 60 110 60 122 C 60 138 66 154 74 166 Z" fill="url(#kgd-tunic)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M148 172 C 168 150 174 122 162 110 C 152 102 140 110 140 122 C 140 138 134 154 126 166 Z" fill="url(#kgd-tunic)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <circle cx="42" cy="106" r="12" fill="url(#kgd-skin)" stroke={INK} strokeWidth="3.5" />
          <circle cx="158" cy="106" r="12" fill="url(#kgd-skin)" stroke={INK} strokeWidth="3.5" />
        </g>
      ) : (
        <g>
          <path d="M56 170 C 42 190 40 214 50 230 C 58 240 74 234 72 222 C 70 206 72 192 78 180 Z" fill="url(#kgd-tunic)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M144 170 C 158 190 160 214 150 230 C 142 240 126 234 128 222 C 130 206 128 192 122 180 Z" fill="url(#kgd-tunic)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
          <circle cx="60" cy="236" r="12" fill="url(#kgd-skin)" stroke={INK} strokeWidth="3.5" />
          <circle cx="140" cy="236" r="12" fill="url(#kgd-skin)" stroke={INK} strokeWidth="3.5" />
        </g>
      )}
      {/* глава */}
      <g className="kg-hero__head">
        <ellipse cx="100" cy="120" rx="50" ry="46" fill="url(#kgd-skin)" stroke={INK} strokeWidth="4" />
        {/* бяла брада */}
        <path d="M54 124 C 50 170 74 206 100 210 C 126 206 150 170 146 124 C 136 146 120 152 100 152 C 80 152 64 146 54 124 Z" fill="#fffaf2" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
        {[
          [76, 176],
          [100, 192],
          [124, 176],
          [88, 162],
          [112, 162],
        ].map(([x, y], i) => (
          <path key={i} d={`M${x - 6} ${y} q 6 6 12 0`} fill="none" stroke="#c9b8a8" strokeWidth="2.5" strokeLinecap="round" />
        ))}
        <path d="M76 140 C 86 132 96 134 100 140 C 104 134 114 132 124 140 C 116 150 104 146 100 142 C 96 146 84 150 76 140 Z" fill="#fffaf2" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        {happy ? <path d="M90 148 Q 100 160 110 148 Z" fill="#c4455a" stroke={INK} strokeWidth="2.6" /> : null}
        <ellipse cx="100" cy="126" rx="13" ry="11" fill="#f39c86" stroke={INK} strokeWidth="3" />
        <ellipse cx="96" cy="122" rx="4" ry="2.4" fill="#fff" opacity="0.6" />
        <ellipse cx="68" cy="128" rx="9" ry="6" fill="#ff8fa3" opacity="0.6" />
        <ellipse cx="132" cy="128" rx="9" ry="6" fill="#ff8fa3" opacity="0.6" />
        {happy ? (
          <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round">
            <path d="M74 110 q 9 -10 18 0" />
            <path d="M108 110 q 9 -10 18 0" />
          </g>
        ) : (
          <g className="kg-hero__eyes" transform={mood === 'hopeful' ? 'translate(0 3)' : undefined}>
            {[84, 116].map((x) => (
              <g key={x}>
                <ellipse cx={x} cy="108" rx="7" ry="9" fill={INK} />
                <circle cx={x + 2.5} cy="104" r="3" fill="#fff" />
              </g>
            ))}
          </g>
        )}
        {/* остра шапчица */}
        <path d="M46 98 C 52 52 78 18 132 4 C 120 30 150 60 154 98 Z" fill="url(#kgd-hat)" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <rect x="42" y="90" width="116" height="16" rx="8" fill="#fffaf2" stroke={INK} strokeWidth="3.5" />
        <circle cx="132" cy="6" r="8" fill="#ffd25e" stroke={INK} strokeWidth="3" />
        <path d="M70 70 q 14 -26 40 -46" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// ───────────── предмети (поле 100×100) ─────────────

function Boot({ c }: { c: [string, string, string] }) {
  return (
    <g>
      <ellipse cx="50" cy="94" rx="40" ry="5" fill={INK} opacity="0.16" />
      <path d="M30 8 H 64 V 58 C 78 60 92 66 92 80 V 86 H 18 V 74 C 18 66 26 62 30 60 Z" fill={c[1]} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M30 8 H 64 V 22 H 30 Z" fill={c[0]} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <rect x="16" y="84" width="78" height="10" rx="5" fill={c[2]} stroke={INK} strokeWidth="3.5" />
      <path d="M38 28 V 56" stroke="#fff" strokeOpacity="0.6" strokeWidth="6" strokeLinecap="round" />
      <circle cx="74" cy="74" r="4" fill="#fff" opacity="0.45" />
    </g>
  )
}

function WinterBoot({ c }: { c: [string, string, string] }) {
  return (
    <g>
      <ellipse cx="50" cy="94" rx="40" ry="5" fill={INK} opacity="0.16" />
      <path d="M28 18 H 66 V 56 C 80 58 92 66 92 80 V 86 H 16 V 72 C 16 64 24 60 28 58 Z" fill={c[1]} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="14" y="84" width="80" height="10" rx="5" fill="#8a5a36" stroke={INK} strokeWidth="3.5" />
      {/* пух */}
      <path
        d="M22 20 C 18 10 28 4 34 8 C 38 0 50 2 52 8 C 58 2 70 4 70 12 C 78 14 76 24 70 26 C 62 30 30 30 24 28 C 18 26 18 22 22 20 Z"
        fill="#fffaf2"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* връзки */}
      {[40, 50, 60].map((y) => (
        <path key={y} d={`M52 ${y} l 10 4 M52 ${y + 4} l 10 -4`} stroke="#fff6e8" strokeWidth="3" strokeLinecap="round" />
      ))}
      <path d="M36 34 V 56" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

function Hat({ c }: { c: [string, string, string] }) {
  return (
    <g>
      <ellipse cx="50" cy="92" rx="38" ry="5" fill={INK} opacity="0.16" />
      <path d="M14 76 C 12 40 30 18 50 18 C 70 18 88 40 86 76 Z" fill={c[1]} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      {[34, 50, 66].map((x) => (
        <path key={x} d={`M${x} 28 V 72`} stroke={c[2]} strokeWidth="3" opacity="0.6" />
      ))}
      <rect x="10" y="70" width="80" height="18" rx="8" fill={c[0]} stroke={INK} strokeWidth="3.5" />
      <circle cx="50" cy="14" r="11" fill="#fffaf2" stroke={INK} strokeWidth="3.5" />
      <path d="M26 46 q 8 -18 22 -22" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="5" strokeLinecap="round" />
    </g>
  )
}

function Mitten({ c }: { c: [string, string, string] }) {
  return (
    <g>
      <ellipse cx="50" cy="94" rx="30" ry="5" fill={INK} opacity="0.16" />
      <path d="M30 70 C 24 50 24 24 44 12 C 60 4 76 16 74 36 L 72 54 C 80 46 90 50 86 60 C 82 70 72 74 70 76 Z" fill={c[1]} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <rect x="26" y="70" width="48" height="20" rx="7" fill={c[0]} stroke={INK} strokeWidth="3.5" />
      {[34, 44, 54, 64].map((x) => (
        <line key={x} x1={x} y1="73" x2={x} y2="87" stroke={c[2]} strokeWidth="2.5" opacity="0.6" />
      ))}
      {/* снежинка */}
      <g stroke="#fffaf2" strokeWidth="2.6" strokeLinecap="round">
        <path d="M50 30 V 54 M39 36 L 61 48 M39 48 L 61 36" />
      </g>
    </g>
  )
}

const ITEM_ART: Record<ItemKind, (p: { c: [string, string, string] }) => React.ReactElement> = { boot: Boot, 'winter-boot': WinterBoot, hat: Hat, mitten: Mitten }

export function ItemArt({ kind, color, size = 100, className = '' }: { kind: ItemKind; color: ColorId; size?: number; className?: string }) {
  const A = ITEM_ART[kind]
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true" overflow="visible" preserveAspectRatio="xMidYMax meet">
      <A c={SHADE[color]} />
    </svg>
  )
}

export const ITEM_NAME: Record<ItemKind, [string, string]> = {
  boot: ['ботуш', 'ботуши'],
  'winter-boot': ['зимен ботуш', 'зимни ботуши'],
  hat: ['шапка', 'шапки'],
  mitten: ['ръкавица', 'ръкавици'],
}

/** Постелка пред героя: голяма плетена черга за великана, малко кръгло килимче за джуджето. */
export function HeroMat({ hero, className = '' }: { hero: HeroId; className?: string }) {
  const big = hero === 'giant'
  const [a, b] = big ? ['#ffd59a', '#ff9e6b'] : ['#bfe3ff', '#7fbcf0']
  return (
    <svg viewBox="0 0 300 80" className={className} aria-hidden="true" preserveAspectRatio="none">
      <ellipse cx="150" cy="46" rx="146" ry="30" fill={INK} opacity="0.12" />
      <ellipse cx="150" cy="40" rx="144" ry="32" fill={a} stroke={INK} strokeWidth="4" />
      <ellipse cx="150" cy="40" rx="118" ry="22" fill="none" stroke={b} strokeWidth="8" strokeDasharray={big ? '16 10' : '4 10'} strokeLinecap="round" />
      <ellipse cx="150" cy="40" rx="90" ry="14" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="4" />
      {big && Array.from({ length: 14 }, (_, i) => <line key={i} x1={20 + i * 20} y1="70" x2={18 + i * 20} y2="79" stroke={b} strokeWidth="3" strokeLinecap="round" />)}
    </svg>
  )
}
