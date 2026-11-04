/** Малко колело на късмета за картата на режима. */
export function SpinModeArt() {
  const ink = '#3b2a5a'
  const colors = ['#ff5fa2', '#ffd23f', '#2ed1c4', '#9b5de5', '#ff9f43', '#6bd66b', '#4d8df0', '#ff8cc0', '#b67cff', '#3fc9a8']
  const r = 52
  return (
    <svg viewBox="0 0 160 130" width="170" height="138" aria-hidden="true">
      <path d="M80 66 L52 124 M80 66 L108 124" stroke={ink} strokeWidth="9" strokeLinecap="round" />
      <path d="M80 66 L52 124 M80 66 L108 124" stroke="#ff8cc0" strokeWidth="5" strokeLinecap="round" />
      <g transform="translate(80 64)">
        <circle r={r + 6} fill="#ff6fae" stroke={ink} strokeWidth="4" />
        {colors.map((c, i) => {
          const a0 = ((i - 0.5) * Math.PI) / 5 - Math.PI / 2
          const a1 = ((i + 0.5) * Math.PI) / 5 - Math.PI / 2
          return <path key={i} d={`M0 0 L${r * Math.cos(a0)} ${r * Math.sin(a0)} A${r} ${r} 0 0 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`} fill={c} stroke={ink} strokeWidth="2" />
        })}
        {[0, 3, 6].map((i) => {
          const a = (i * Math.PI) / 5 - Math.PI / 2
          return (
            <text key={i} x={r * 0.66 * Math.cos(a)} y={r * 0.66 * Math.sin(a) + 6} textAnchor="middle" className="art-text" fontSize="17" fill="#fff" stroke={ink} strokeWidth="3" paintOrder="stroke">
              {i + 1}
            </text>
          )
        })}
        <circle r="15" fill="#ffd23f" stroke={ink} strokeWidth="3" />
        <text y="6" textAnchor="middle" className="art-text" fontSize="15" fill={ink}>
          ×
        </text>
      </g>
      <path d="M70 0 H90 L80 16 Z" fill="#ffd23f" stroke={ink} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}
