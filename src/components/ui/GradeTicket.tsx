import type { Grade } from '../../games/magic-tokens/logic'

/** Малък ненатрапчив индикатор за избрания клас — „билет“ в горната лента. */
export function GradeTicket({ grade, onClick, title }: { grade: Grade; onClick?: () => void; title?: string }) {
  const body = (
    <>
      <svg className="grade-ticket__icon" width="30" height="22" viewBox="0 0 30 22" aria-hidden="true">
        <path
          d="M3 2h24a2 2 0 0 1 2 2v4a3 3 0 0 0 0 6v4a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-4a3 3 0 0 0 0-6V4a2 2 0 0 1 2-2z"
          fill="#ffd23f"
          stroke="#3b2a5a"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M20 4v14" stroke="#3b2a5a" strokeWidth="1.6" strokeDasharray="2 2" />
        <path d="M10 7.5l1.2 2.4 2.6.4-1.9 1.8.5 2.6L10 13.5l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" fill="#ff5fa2" />
      </svg>
      <span>{grade}. клас</span>
    </>
  )
  return onClick ? (
    <button type="button" className="grade-ticket is-button" onClick={onClick} title={title ?? 'Смени класа'} aria-label={`${grade}. клас — смени класа`}>
      {body}
    </button>
  ) : (
    <span className="grade-ticket" title={title ?? 'Избраният клас'} aria-label={`Избран клас: ${grade}.`}>
      {body}
    </span>
  )
}
