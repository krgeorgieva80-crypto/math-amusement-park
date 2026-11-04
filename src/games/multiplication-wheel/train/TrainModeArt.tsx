/** Малко влакче за картата на режима: 3 вагончета по 2 деца → 2 + 2 + 2 = 2 · 3. */
export function TrainModeArt({ small = false }: { small?: boolean }) {
  const ink = '#3b2a5a'
  return (
    <svg viewBox="0 0 230 130" width={small ? 130 : 220} height={small ? 74 : 124} aria-hidden="true">
      <path d="M4 92 H226" stroke={ink} strokeWidth="5" strokeLinecap="round" />
      {/* локомотив */}
      <g>
        <circle cx="26" cy="22" r="8" fill="#fff" stroke="#d9d2ef" strokeWidth="2" />
        <rect x="20" y="32" width="12" height="22" fill={ink} />
        <rect x="8" y="50" width="52" height="30" rx="14" fill="#ff5fa2" stroke={ink} strokeWidth="3" />
        <rect x="42" y="36" width="24" height="44" rx="6" fill="#9b5de5" stroke={ink} strokeWidth="3" />
        <circle cx="14" cy="64" r="11" fill="#ffd23f" stroke={ink} strokeWidth="3" />
        {[20, 50].map((x) => (
          <circle key={x} cx={x} cy="86" r="7" fill={ink} />
        ))}
      </g>
      {[0, 1, 2].map((g) => (
        <g key={g} transform={`translate(${74 + g * 52} 40)`}>
          <path d="M-2 10 Q23 -2 48 10 Z" fill={['#ff5fa2', '#2ed1c4', '#ffd23f'][g]} stroke={ink} strokeWidth="3" />
          {[0, 1].map((k) => (
            <circle key={k} cx={13 + k * 20} cy={24} r="8" fill="#ffcf9e" stroke={ink} strokeWidth="2" />
          ))}
          <rect x="0" y="28" width="46" height="18" rx="6" fill={['#ff4f93', '#2ed1c4', '#ff9f43'][g]} stroke={ink} strokeWidth="3" />
          {[10, 36].map((x) => (
            <circle key={x} cx={x} cy="48" r="6" fill={ink} />
          ))}
        </g>
      ))}
      {!small && (
        <text x="115" y="124" textAnchor="middle" className="art-text" fontSize="22" fill="#5e2fb0">
          2 + 2 + 2 = 2 · 3
        </text>
      )}
    </svg>
  )
}
