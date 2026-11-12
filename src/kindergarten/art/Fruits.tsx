/**
 * Лакомствата за мечетата и кошничката — оригинални SVG илюстрации.
 * Плодовете са в поле 100×100 и се използват като големи интерактивни елементи.
 */
import type { FruitId } from '../games/feed-bears/logic'

const INK = '#4a2f2a'

export function Apple({ size = 100, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true" overflow="visible">
      <defs>
        <radialGradient id="kgf-apple" cx="0.36" cy="0.32" r="0.8">
          <stop offset="0" stopColor="#ff9a8c" />
          <stop offset="0.45" stopColor="#f2464f" />
          <stop offset="1" stopColor="#b8202f" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="93" rx="30" ry="5" fill={INK} opacity="0.18" />
      <path
        d="M50 28 C 40 18 16 20 12 44 C 8 66 24 92 40 92 C 45 92 47 89 50 89 C 53 89 55 92 60 92 C 76 92 92 66 88 44 C 84 20 60 18 50 28 Z"
        fill="url(#kgf-apple)"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M50 30 C 48 22 46 14 42 8" fill="none" stroke="#6b3d1f" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M50 22 C 58 6 78 8 82 14 C 72 24 58 26 50 22 Z" fill="#6fcf5a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M54 20 C 62 16 70 14 78 14" fill="none" stroke="#3c9a3a" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="30" cy="44" rx="7" ry="12" fill="#fff" opacity="0.55" transform="rotate(-20 30 44)" />
      <path d="M68 78 q 8 -6 10 -16" fill="none" stroke="#8c1424" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    </svg>
  )
}

export function Pear({ size = 100, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true" overflow="visible">
      <defs>
        <radialGradient id="kgf-pear" cx="0.38" cy="0.45" r="0.8">
          <stop offset="0" stopColor="#f6ff9e" />
          <stop offset="0.55" stopColor="#c9e04e" />
          <stop offset="1" stopColor="#8fb12b" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="94" rx="28" ry="5" fill={INK} opacity="0.18" />
      <path
        d="M50 16 C 40 16 36 26 36 36 C 36 46 22 54 20 70 C 18 86 34 94 50 94 C 66 94 82 86 80 70 C 78 54 64 46 64 36 C 64 26 60 16 50 16 Z"
        fill="url(#kgf-pear)"
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M50 18 C 50 12 52 6 56 2" fill="none" stroke="#6b3d1f" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M53 10 C 62 2 78 4 80 10 C 70 18 60 16 53 10 Z" fill="#6fcf5a" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="62" cy="74" rx="12" ry="8" fill="#ff8a6b" opacity="0.35" />
      <ellipse cx="34" cy="64" rx="6" ry="12" fill="#fff" opacity="0.55" transform="rotate(15 34 64)" />
      {[
        [44, 50],
        [60, 58],
        [48, 80],
        [66, 82],
        [30, 80],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill="#7a8f20" opacity="0.6" />
      ))}
    </svg>
  )
}

export function Strawberry({ size = 100, className = '' }: { size?: number; className?: string }) {
  const seeds: [number, number][] = [
    [36, 42],
    [50, 40],
    [64, 42],
    [30, 54],
    [44, 54],
    [58, 54],
    [72, 54],
    [38, 66],
    [52, 66],
    [66, 66],
    [44, 78],
    [58, 78],
  ]
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true" overflow="visible">
      <defs>
        <radialGradient id="kgf-straw" cx="0.38" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#ff8ea0" />
          <stop offset="0.5" stopColor="#f23b55" />
          <stop offset="1" stopColor="#b5183a" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="94" rx="22" ry="4.5" fill={INK} opacity="0.18" />
      <path d="M50 92 C 36 92 18 70 18 50 C 18 36 30 30 50 30 C 70 30 82 36 82 50 C 82 70 64 92 50 92 Z" fill="url(#kgf-straw)" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      {seeds.map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="2.2" ry="3.2" fill="#ffe27a" stroke="#c98a12" strokeWidth="0.8" />
      ))}
      <path d="M50 34 L 32 26 L 40 34 L 26 36 L 42 40 L 50 36 L 58 40 L 74 36 L 60 34 L 68 26 Z" fill="#5cc24f" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 34 C 50 24 52 18 56 14" fill="none" stroke="#3c9a3a" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="34" cy="52" rx="5" ry="10" fill="#fff" opacity="0.45" transform="rotate(-15 34 52)" />
    </svg>
  )
}

export const FRUIT_ART: Record<FruitId, typeof Apple> = { apple: Apple, pear: Pear, strawberry: Strawberry }

export function Fruit({ id, size = 100, className = '' }: { id: FruitId; size?: number; className?: string }) {
  const C = FRUIT_ART[id]
  return <C size={size} className={className} />
}

/** Плетена кошничка: задна част (вътрешността) и предна част, която закрива долната половина на плодовете. */
export function BasketBack({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 220" className={className} aria-hidden="true" preserveAspectRatio="none">
      <path d="M40 120 C 60 30 540 30 560 120" fill="none" stroke="#a8692f" strokeWidth="22" strokeLinecap="round" />
      <path d="M40 120 C 60 30 540 30 560 120" fill="none" stroke="#d4975a" strokeWidth="10" strokeLinecap="round" strokeDasharray="18 10" />
      <path d="M40 120 C 60 30 540 30 560 120" fill="none" stroke={INK} strokeWidth="4" strokeOpacity="0.35" />
      <ellipse cx="300" cy="128" rx="268" ry="40" fill="#6e3d1c" />
      {/* карирана кърпичка */}
      <path d="M70 126 C 120 98 220 110 300 104 C 380 110 480 98 530 126 L 520 150 L 80 150 Z" fill="#fff" stroke={INK} strokeWidth="3" strokeOpacity="0.4" />
      {[110, 170, 230, 290, 350, 410, 470].map((x) => (
        <rect key={x} x={x} y="108" width="26" height="40" fill="#ff8fa3" opacity="0.6" />
      ))}
    </svg>
  )
}

export function BasketFront({ className = '' }: { className?: string }) {
  const rows = [0, 1, 2, 3]
  return (
    <svg viewBox="0 0 600 170" className={className} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="kgf-wicker" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7ab68" />
          <stop offset="1" stopColor="#b8733a" />
        </linearGradient>
        <clipPath id="kgf-basket-clip">
          <path d="M28 20 L 572 20 C 562 90 540 150 470 162 L 130 162 C 60 150 38 90 28 20 Z" />
        </clipPath>
      </defs>
      <ellipse cx="300" cy="166" rx="250" ry="8" fill={INK} opacity="0.2" />
      <path d="M28 20 L 572 20 C 562 90 540 150 470 162 L 130 162 C 60 150 38 90 28 20 Z" fill="url(#kgf-wicker)" />
      <g clipPath="url(#kgf-basket-clip)">
        {rows.map((r) =>
          Array.from({ length: 16 }, (_, i) => (
            <rect
              key={`${r}-${i}`}
              x={i * 38 + (r % 2) * 19 - 10}
              y={34 + r * 32}
              width="32"
              height="22"
              rx="10"
              fill={r % 2 ? '#d38b49' : '#efb878'}
              stroke="#8a4f22"
              strokeWidth="2"
              strokeOpacity="0.6"
            />
          )),
        )}
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} x1={i * 38 + 6} y1="20" x2={i * 38 + 6} y2="170" stroke="#8a4f22" strokeWidth="3" strokeOpacity="0.35" />
        ))}
      </g>
      <path d="M28 20 L 572 20 C 562 90 540 150 470 162 L 130 162 C 60 150 38 90 28 20 Z" fill="none" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
      <rect x="16" y="8" width="568" height="28" rx="14" fill="#c98444" stroke={INK} strokeWidth="4.5" />
      <rect x="16" y="8" width="568" height="28" rx="14" fill="none" stroke="#f2c38a" strokeWidth="8" strokeDasharray="14 10" strokeOpacity="0.8" />
      <path d="M40 14 H 560" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}
