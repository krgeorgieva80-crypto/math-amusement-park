/** Малко светещо табло с таблица за картата на режима. */
export function TableModeArt({ small = false }: { small?: boolean }) {
  const ink = '#3b2a5a'
  const v = (r: number, c: number) => (r === 0 && c === 0 ? '·' : r === 0 ? String(c) : c === 0 ? String(r + 1) : (r + 1) * c)
  const blank = new Set(['1-2', '2-3', '3-1'])
  return (
    <svg viewBox="0 0 170 130" width={small ? 112 : 176} height={small ? 86 : 134} aria-hidden="true">
      <rect x="4" y="4" width="162" height="122" rx="16" fill="#3b1f86" stroke={ink} strokeWidth="5" />
      {Array.from({ length: 14 }, (_, k) => (
        <circle key={k} cx={14 + k * 11.2} cy="10" r="3" fill="#fff6a8" />
      ))}
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) => {
          const head = r === 0 || c === 0
          const b = blank.has(`${r}-${c}`)
          return (
            <g key={`${r}-${c}`} transform={`translate(${14 + c * 30} ${20 + r * 25})`}>
              <rect width="27" height="22" rx="6" fill={head ? '#ffd23f' : b ? '#efe2ff' : '#fffaf0'} stroke={ink} strokeWidth="2" />
              <text x="13.5" y="16" textAnchor="middle" className="art-text" fontSize="13" fill={b ? '#9b5de5' : ink}>
                {b ? '?' : v(r, c)}
              </text>
            </g>
          )
        }),
      )}
    </svg>
  )
}
