/** Картата на режима: лупа, шапка на фокусник и купа — трите етапа на приключението. */
export function ChallengeModeArt() {
  const ink = '#3b2a5a'
  return (
    <svg viewBox="0 0 200 130" width="210" height="136" aria-hidden="true">
      <path d="M20 112 Q60 96 100 112 T180 112" fill="none" stroke="#ffd23f" strokeWidth="5" strokeDasharray="8 8" />
      {/* лупа */}
      <g transform="translate(36 62)">
        <circle r="20" fill="rgba(191,239,255,0.6)" stroke={ink} strokeWidth="6" />
        <path d="M14 14 L30 30" stroke={ink} strokeWidth="9" strokeLinecap="round" />
        <text y="7" textAnchor="middle" className="art-text" fontSize="18" fill="#c2185b">?</text>
      </g>
      {/* шапка */}
      <g transform="translate(100 70)">
        <path d="M-22 -30 L-20 14 Q0 20 20 14 L22 -30 Z" fill={ink} stroke={ink} strokeWidth="3" />
        <rect x="-22" y="-14" width="44" height="9" fill="#ff5fa2" />
        <ellipse cx="0" cy="14" rx="34" ry="8" fill="#5a3f88" stroke={ink} strokeWidth="4" />
        <path d="M0 -50 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2z" fill="#ffd23f" stroke={ink} strokeWidth="2.5" />
      </g>
      {/* купа */}
      <g transform="translate(164 64)">
        <path d="M-22 -26 H22 Q20 8 0 14 Q-20 8 -22 -26 Z" fill="#ffc928" stroke={ink} strokeWidth="5" />
        <rect x="-6" y="12" width="12" height="12" fill="#e08a00" stroke={ink} strokeWidth="3" />
        <rect x="-18" y="22" width="36" height="9" rx="4" fill="#9b5de5" stroke={ink} strokeWidth="3" />
      </g>
    </svg>
  )
}
